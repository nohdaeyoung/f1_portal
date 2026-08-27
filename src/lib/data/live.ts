/**
 * Live Data Layer
 *
 * Jolpica(Ergast 호환) + OpenF1 API를 호출하고,
 * 로컬 메타데이터(한국어명, 팀 컬러, 국기 등)와 병합해 반환.
 *
 * 실패 처리는 데이터 종류마다 다르다:
 *  - 순위표: null 반환. 지난 스냅샷을 현재처럼 보여주지 않는다.
 *  - 캘린더: 정적 일정으로 폴백. 손으로 관리하는 실제 데이터라 정당하다.
 *  - 그 외 : 빈 배열 또는 null.
 */

import { unstable_cache } from "next/cache";

import {
  getDriverStandings as jolpikaDriverStandings,
  getConstructorStandings as jolpikaConstructorStandings,
  getAllResults,
  getRaceSchedule,
  getRaceResults,
  getQualifying,
  getSprintResults,
  getCircuitHistory,
  getConstructorHistory,
  getDriverHistory,
  getDriverPoles,
  getDriverResults,
  getDriverStandingsAtRound,
  type JolpicaStanding,
  type JolpicaConstructorStanding,
  type JolpicaRace,
  type JolpicaResult,
} from "@/lib/api/jolpica";

import { getLatestDrivers } from "@/lib/api/openf1";
import { batchedParallel } from "@/lib/api/http";

import {
  // driverStandings / constructorStandings 는 의도적으로 import 하지 않는다.
  // R1 직후 스냅샷이라 폴백으로 쓰면 몇 달 지난 순위를 현재처럼 보여주게 된다.
  // 캘린더는 손으로 관리하는 실제 일정이라 폴백으로 정당하다.
  calendar as mockCalendar,
  sessionSchedules,
  getDriver,
  type Standing,
  type ConstructorStanding,
  type RaceCalendar,
  type SessionSchedule,
} from "@/data/f1-data";

// ─── ID 매핑 테이블 ───────────────────────────────────────────
// Jolpica driverId → 로컬 driverId

const JOLPICA_TO_LOCAL_DRIVER: Record<string, string> = {
  // Red Bull
  max_verstappen: "verstappen",
  isack_hadjar: "hadjar",   // 구 ID (호환성 유지)
  hadjar: "hadjar",
  // McLaren
  lando_norris: "norris",
  oscar_piastri: "piastri",
  // Ferrari
  lewis_hamilton: "hamilton",
  charles_leclerc: "leclerc",
  // Mercedes
  george_russell: "russell",
  andrea_kimi_antonelli: "antonelli", // 구 ID (호환성 유지)
  kimi_antonelli: "antonelli",        // 구 ID (호환성 유지)
  antonelli: "antonelli",
  // Aston Martin
  fernando_alonso: "alonso",
  lance_stroll: "stroll",
  // Alpine
  pierre_gasly: "gasly",
  franco_colapinto: "colapinto",
  jack_doohan: "colapinto", // 구 매핑 유지 (혹시 API가 아직 doohan 반환 시)
  // Williams
  carlos_sainz: "sainz",
  alexander_albon: "albon",
  // Racing Bulls
  liam_lawson: "lawson",
  arvid_lindblad: "lindblad",
  yuki_tsunoda: "lawson",   // 구 매핑
  // Haas
  esteban_ocon: "ocon",
  oliver_bearman: "bearman",
  // Sauber / Audi
  nico_hulkenberg: "hulkenberg",
  gabriel_bortoleto: "bortoleto",
  // Cadillac
  valtteri_bottas: "bottas",
  sergio_perez: "perez",
  theo_pourchaire: "bottas",   // 구 매핑
  felipe_drugovich: "perez",   // 구 매핑
};

// 로컬 driverId → Jolpica driverId
const LOCAL_TO_JOLPICA_DRIVER: Record<string, string> = {
  verstappen:  "max_verstappen",
  hadjar:      "hadjar",
  norris:      "norris",
  piastri:     "piastri",
  hamilton:    "hamilton",
  leclerc:     "leclerc",
  russell:     "russell",
  antonelli:   "antonelli",
  alonso:      "alonso",
  stroll:      "stroll",
  gasly:       "gasly",
  colapinto:   "colapinto",
  sainz:       "sainz",
  albon:       "albon",
  lawson:      "lawson",
  lindblad:    "arvid_lindblad",
  ocon:        "ocon",
  bearman:     "bearman",
  hulkenberg:  "hulkenberg",
  bortoleto:   "bortoleto",
  bottas:      "bottas",
  perez:       "perez",
};

// 로컬 circuitId → Jolpica circuitId
const LOCAL_TO_JOLPICA_CIRCUIT: Record<string, string> = {
  "albert-park": "albert_park",
  "suzuka": "suzuka",
  "bahrain": "bahrain",
  "jeddah": "jeddah",
  "shanghai": "shanghai",
  "miami": "miami",
  "montreal": "villeneuve",
  "monaco": "monaco",
  "barcelona": "catalunya",
  "spielberg": "red_bull_ring",
  "silverstone": "silverstone",
  "spa": "spa",
  "hungaroring": "hungaroring",
  "zandvoort": "zandvoort",
  "monza": "monza",
  "baku": "baku",
  "singapore": "marina_bay",
  "cota": "americas",
  "mexico-city": "rodriguez",
  "interlagos": "interlagos",
  "las-vegas": "las_vegas",
  "lusail": "losail",
  "yas-marina": "yas_marina",
  // madrid: 2026 신규, Jolpica 데이터 없음
};

// 로컬 teamId → Jolpica constructorId
const LOCAL_TO_JOLPICA_TEAM: Record<string, string> = {
  "red-bull": "red_bull",
  "mclaren": "mclaren",
  "ferrari": "ferrari",
  "mercedes": "mercedes",
  "aston-martin": "aston_martin",
  "alpine": "alpine",
  "williams": "williams",
  "rb": "rb",
  "haas": "haas",
  "sauber": "sauber",
  // cadillac: 2026 신규, Jolpica 데이터 없음
};

// Jolpica constructorId → 로컬 teamId
const JOLPICA_TO_LOCAL_TEAM: Record<string, string> = {
  red_bull: "red-bull",
  mclaren: "mclaren",
  ferrari: "ferrari",
  mercedes: "mercedes",
  aston_martin: "aston-martin",
  alpine: "alpine",
  williams: "williams",
  rb: "rb",
  racing_bulls: "rb",
  haas: "haas",
  sauber: "sauber",
  kick_sauber: "sauber",
  audi: "sauber",
  cadillac: "cadillac",
};

// ─── 드라이버 챔피언십 순위 ───────────────────────────────────

/**
 * 순위표는 실패 시 정적 데이터로 폴백하지 않는다.
 *
 * f1-data.ts 의 driverStandings 는 R1 직후 스냅샷(러셀 25점)이라 시즌이 진행되면
 * 실제 순위와 크게 어긋난다. 그걸 조용히 내보내면 사용자는 몇 달 지난 순위표를
 * 현재 순위로 읽게 된다. 순위표 서비스에서 틀린 숫자는 빈 화면보다 나쁘다.
 *
 *   null → 조회 실패 (호출부가 "불러오지 못했습니다" 를 표시해야 함)
 *   []   → 조회 성공, 아직 데이터 없음 (시즌 개막 전 등)
 */
async function _fetchDriverStandings(): Promise<Standing[] | null> {
  try {
    const data = await jolpikaDriverStandings();

    return data.map((s: JolpicaStanding) => ({
      position: parseInt(s.position),
      driverId:
        JOLPICA_TO_LOCAL_DRIVER[s.Driver.driverId] ??
        s.Driver.driverId,
      points: parseFloat(s.points),
      wins: parseInt(s.wins),
    }));
  } catch (e) {
    console.warn("[live] driver standings 조회 실패 → null 반환", e);
    return null;
  }
}

export const fetchDriverStandings = unstable_cache(
  _fetchDriverStandings,
  ["driver-standings"],
  { revalidate: 300, tags: ["standings", "driver-standings"] }
);

// ─── 컨스트럭터 챔피언십 순위 ────────────────────────────────

/** 드라이버 순위와 동일한 계약: null = 실패, [] = 데이터 없음. */
async function _fetchConstructorStandings(): Promise<ConstructorStanding[] | null> {
  try {
    const data = await jolpikaConstructorStandings();

    return data.map((s: JolpicaConstructorStanding) => ({
      position: parseInt(s.position),
      teamId:
        JOLPICA_TO_LOCAL_TEAM[s.Constructor.constructorId] ??
        s.Constructor.constructorId,
      points: parseFloat(s.points),
      wins: parseInt(s.wins),
    }));
  } catch (e) {
    console.warn("[live] constructor standings 조회 실패 → null 반환", e);
    return null;
  }
}

export const fetchConstructorStandings = unstable_cache(
  _fetchConstructorStandings,
  ["constructor-standings"],
  { revalidate: 300, tags: ["standings", "constructor-standings"] }
);

// ─── 서킷 역대 우승자 ─────────────────────────────────────────

export interface CircuitWinner {
  season: string;
  raceName: string;
  winner: string;
  constructor: string;
  time?: string;
}

export async function fetchCircuitWinners(localCircuitId: string): Promise<CircuitWinner[]> {
  const jolpicaId = LOCAL_TO_JOLPICA_CIRCUIT[localCircuitId];
  if (!jolpicaId) return []; // madrid 등 신규 서킷

  try {
    const races = await getCircuitHistory(jolpicaId, 30);
    return races
      .filter((r) => r.Results && r.Results.length > 0)
      .map((r) => ({
        season: r.season,
        raceName: r.raceName,
        winner: `${r.Results![0].Driver.givenName} ${r.Results![0].Driver.familyName}`,
        constructor: r.Results![0].Constructor.name,
        time: r.Results![0].Time?.time,
      }))
      .reverse(); // 최신순
  } catch (e) {
    console.warn(`[live] circuit history failed (${localCircuitId})`, e);
    return [];
  }
}

// ─── 팀 연도별 순위 히스토리 ──────────────────────────────────

export interface TeamSeasonStanding {
  season: string;
  position: number;
  points: number;
  wins: number;
}

export async function fetchTeamHistory(localTeamId: string): Promise<TeamSeasonStanding[]> {
  const jolpicaId = LOCAL_TO_JOLPICA_TEAM[localTeamId];
  if (!jolpicaId) return []; // cadillac 등 신규 팀

  try {
    const lists = await getConstructorHistory(jolpicaId, 30);
    return lists
      .filter((l) => l.ConstructorStandings && l.ConstructorStandings.length > 0)
      .map((l) => ({
        season: l.season,
        position: parseInt(l.ConstructorStandings[0].position),
        points: parseFloat(l.ConstructorStandings[0].points),
        wins: parseInt(l.ConstructorStandings[0].wins),
      }))
      .reverse(); // 최신순
  } catch (e) {
    console.warn(`[live] team history failed (${localTeamId})`, e);
    return [];
  }
}

// ─── 레이스 캘린더 ────────────────────────────────────────────

async function _fetchCalendar(): Promise<RaceCalendar[]> {
  try {
    // 일정 + 결과를 병렬 호출
    const [schedule, results] = await Promise.all([
      getRaceSchedule(),
      getAllResults().catch(() => []), // 결과 없으면 빈 배열
    ]);

    if (!schedule.length) return mockCalendar;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Jolpica circuitId → 로컬 circuitId 매핑
    const jolpicaToLocal: Record<string, string> = {
      albert_park: "albert-park",
      shanghai: "shanghai",
      suzuka: "suzuka",
      bahrain: "bahrain",
      jeddah: "jeddah",
      miami: "miami",
      villeneuve: "montreal",
      monaco: "monaco",
      catalunya: "barcelona",
      red_bull_ring: "spielberg",
      silverstone: "silverstone",
      spa: "spa",
      hungaroring: "hungaroring",
      zandvoort: "zandvoort",
      monza: "monza",
      madrid: "madrid",
      baku: "baku",
      marina_bay: "singapore",
      americas: "cota",
      rodriguez: "mexico-city",
      interlagos: "interlagos",
      las_vegas: "las-vegas",
      vegas: "las-vegas",
      madring: "madrid",
      losail: "lusail",
      yas_marina: "yas-marina",
    };

    // 결과 맵: API round → 우승자 이름
    const winnerByApiRound = new Map(
      results
        .filter((r: JolpicaRace) => r.Results && r.Results.length > 0)
        .map((r: JolpicaRace) => [
          parseInt(r.round),
          `${r.Results![0].Driver.givenName} ${r.Results![0].Driver.familyName}`,
        ])
    );

    // 로컬 캘린더가 뼈대다. API 는 circuitId 로 찾아 살만 붙인다.
    //
    // API 의 round 번호를 정체성으로 쓰면 안 된다. Jolpica 는 취소된 라운드를
    // 빼고 재번호를 매기는데다, 매핑표에 없는 서킷은 API round 를 그대로 들고
    // 들어와 엉뚱한 로컬 라운드와 충돌한다. 실제로 그렇게 R14·R21 이 두 줄씩
    // 생기고 R22(라스베이거스)는 아예 사라져 404 가 났다.
    const apiByCircuit = new Map<string, JolpicaRace>(
      schedule.map((r: JolpicaRace) => [
        jolpicaToLocal[r.Circuit.circuitId] ?? r.Circuit.circuitId,
        r,
      ])
    );

    let nextSet = false;
    const merged: RaceCalendar[] = mockCalendar.map((local) => {
      const api = apiByCircuit.get(local.circuitId);
      const date = api?.date ?? local.date;
      // 결과 조회(getAllResults)가 429 로 죽어도 이미 아는 우승자는 지우지 않는다.
      // 나머지 로컬 필드와 같은 규칙이다 — API 는 덮어쓰는 게 아니라 채운다.
      const winner =
        (api ? winnerByApiRound.get(parseInt(api.round)) : undefined) ?? local.winner;

      let status: RaceCalendar["status"];
      if (local.status === "cancelled") {
        status = "cancelled";
      } else if (winner || new Date(date) < today) {
        status = "completed";
      } else if (!nextSet) {
        status = "next";
        nextSet = true;
      } else {
        status = "upcoming";
      }

      // 세션 일정 — API 데이터 우선, 없으면 정적 폴백
      const sessions: SessionSchedule = { ...(sessionSchedules[local.round] ?? sessionSchedules[1]) };
      if (api) {
        if (api.FirstPractice?.date) {
          sessions.fp1 = `${api.FirstPractice.date}T${api.FirstPractice.time}`;
        }
        if (api.SecondPractice?.date) {
          sessions.fp2 = `${api.SecondPractice.date}T${api.SecondPractice.time}`;
        }
        if (api.ThirdPractice?.date) {
          sessions.fp3 = `${api.ThirdPractice.date}T${api.ThirdPractice.time}`;
        }
        if (api.SprintQualifying?.date) {
          sessions.sq = `${api.SprintQualifying.date}T${api.SprintQualifying.time}`;
        }
        if (api.Sprint?.date) {
          sessions.sprint = `${api.Sprint.date}T${api.Sprint.time}`;
        }
        if (api.Qualifying?.date) {
          sessions.qualifying = `${api.Qualifying.date}T${api.Qualifying.time}`;
        }
        sessions.race = `${api.date}T${api.time ?? "00:00:00Z"}`;
        sessions.isSprint = !!api.Sprint;
      }

      return {
        ...local,
        date,
        status,
        winner,
        sessions,
      };
    });

    // 로컬에 없는 API 항목은 버린다. 라운드 번호를 새로 지어 붙이면 실제 일정에
    // 없는 줄이 캘린더에 뜬다(예: Jolpica 의 잠정 항목). 조용히 버리지 않도록 남긴다.
    const unmatched = [...apiByCircuit.keys()].filter(
      (id) => !mockCalendar.some((r) => r.circuitId === id)
    );
    if (unmatched.length) {
      console.warn(`[live] 로컬 캘린더에 없는 API 서킷 무시: ${unmatched.join(", ")}`);
    }

    return merged;
  } catch (e) {
    console.warn("[live] calendar API failed → mock 사용", e);
    // 정적 폴백 — 날짜 기반으로 status 동적 계산
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let nextSet = false;
    return mockCalendar.map((r) => {
      let status = r.status;
      if (status !== "cancelled") {
        if (r.winner || new Date(r.date) < today) {
          status = "completed";
        } else if (!nextSet) {
          status = "next";
          nextSet = true;
        } else {
          status = "upcoming";
        }
      }
      return { ...r, status, sessions: sessionSchedules[r.round] };
    });
  }
}

export const fetchCalendar = unstable_cache(
  _fetchCalendar,
  ["calendar"],
  { revalidate: 300, tags: ["calendar"] }
);

// ─── 특정 라운드 세션 일정 ────────────────────────────────────

export async function fetchRoundSchedule(round: number): Promise<SessionSchedule> {
  try {
    const schedule = await getRaceSchedule();
    const r = schedule.find((s: JolpicaRace) => parseInt(s.round) === round);
    if (!r) throw new Error(`round ${round} not found`);

    const isSprint = !!r.Sprint;
    return {
      fp1:        r.FirstPractice     ? `${r.FirstPractice.date}T${r.FirstPractice.time}`         : undefined,
      fp2:        r.SecondPractice    ? `${r.SecondPractice.date}T${r.SecondPractice.time}`       : undefined,
      fp3:        r.ThirdPractice     ? `${r.ThirdPractice.date}T${r.ThirdPractice.time}`         : undefined,
      sq:         r.SprintQualifying  ? `${r.SprintQualifying.date}T${r.SprintQualifying.time}`   : undefined,
      sprint:     r.Sprint            ? `${r.Sprint.date}T${r.Sprint.time}`                       : undefined,
      qualifying: r.Qualifying        ? `${r.Qualifying.date}T${r.Qualifying.time}`               : `${r.date}T00:00:00Z`,
      race:       `${r.date}T${r.time ?? "00:00:00Z"}`,
      isSprint,
    };
  } catch (e) {
    console.warn(`[live] fetchRoundSchedule(${round}) → static fallback`, e);
    return sessionSchedules[round] ?? sessionSchedules[1];
  }
}

// ─── 드라이버 시즌 결과 ────────────────────────────────────────

export interface DriverRaceResult {
  round: string;
  raceName: string;
  date: string;
  grid: number;
  position: number | null; // null = 미완주/DSQ
  positionText: string;    // "1"~"20", "R", "D", "W" 등
  points: number;
  laps: number;
  status: string;
  fastestLap?: string;     // 패스티스트랩 기록
}

export async function fetchDriverSeasonResults(localDriverId: string): Promise<DriverRaceResult[]> {
  const jolpicaId = LOCAL_TO_JOLPICA_DRIVER[localDriverId];
  if (!jolpicaId) return [];

  try {
    const races = await getDriverResults(jolpicaId, "current");
    return races
      .filter((r) => r.Results && r.Results.length > 0)
      .map((r) => {
        const res = r.Results![0];
        const pos = parseInt(res.position);
        return {
          round: r.round,
          raceName: r.raceName,
          date: r.date,
          grid: parseInt(res.grid),
          position: isNaN(pos) ? null : pos,
          positionText: res.positionText,
          points: parseFloat(res.points),
          laps: parseInt(res.laps),
          status: res.status,
          fastestLap: res.FastestLap?.Time.time,
        };
      });
  } catch (e) {
    console.warn(`[live] driver season results failed (${localDriverId})`, e);
    return [];
  }
}

// ─── 드라이버 커리어 연도별 통계 ─────────────────────────────

export interface DriverSeasonStat {
  season: string;
  position: number | null;
  team: string;
  points: number;
  wins: number;
  poles: number;
}

export async function fetchDriverCareerStats(localDriverId: string): Promise<DriverSeasonStat[]> {
  const jolpicaId = LOCAL_TO_JOLPICA_DRIVER[localDriverId];
  if (!jolpicaId) return [];

  try {
    const [seasons, poles] = await Promise.all([
      getDriverHistory(jolpicaId),
      getDriverPoles(jolpicaId).catch(() => [] as { season: string }[]),
    ]);

    // count poles per season
    const polesBySeason: Record<string, number> = {};
    for (const r of poles) {
      polesBySeason[r.season] = (polesBySeason[r.season] ?? 0) + 1;
    }

    return seasons.map((s) => ({
      season: s.season,
      position: s.position,
      team: s.team,
      points: s.points,
      wins: s.wins,
      poles: polesBySeason[s.season] ?? 0,
    }));
  } catch (e) {
    console.warn(`[live] driver career stats failed (${localDriverId})`, e);
    return [];
  }
}

// ─── GP 레이스 결과 ───────────────────────────────────────────

export interface RaceResult {
  position: number;
  positionText: string;
  number: string;
  driverId: string;
  driverName: string;
  constructorId: string;
  constructorName: string;
  grid: number;
  laps: number;
  status: string;
  time?: string;
  points: number;
  fastestLap?: string;
  fastestLapRank?: number;
}

export interface QualifyingResult {
  position: number;
  number: string;
  driverId: string;
  driverName: string;
  constructorId: string;
  constructorName: string;
  q1?: string;
  q2?: string;
  q3?: string;
}

/** 완주자 먼저(position 오름차순), 미완주자(DNF/DNS/DSQ) 뒤로 */
function sortResults(a: RaceResult, b: RaceResult): number {
  const aFinished = !isNaN(parseInt(a.positionText));
  const bFinished = !isNaN(parseInt(b.positionText));
  if (aFinished !== bFinished) return aFinished ? -1 : 1;
  return a.position - b.position;
}

function mapResult(r: JolpicaResult): RaceResult {
  const pos = parseInt(r.position);
  return {
    position: isNaN(pos) ? 99 : pos,
    positionText: r.positionText,
    number: r.number,
    driverId: JOLPICA_TO_LOCAL_DRIVER[r.Driver.driverId] ?? r.Driver.driverId,
    driverName: `${r.Driver.givenName} ${r.Driver.familyName}`,
    constructorId: JOLPICA_TO_LOCAL_TEAM[r.Constructor.constructorId] ?? r.Constructor.constructorId,
    constructorName: r.Constructor.name,
    grid: parseInt(r.grid),
    laps: parseInt(r.laps),
    status: r.status,
    time: r.Time?.time,
    points: parseFloat(r.points),
    fastestLap: r.FastestLap?.Time.time,
    fastestLapRank: r.FastestLap ? parseInt(r.FastestLap.rank) : undefined,
  };
}

export async function fetchRaceResult(round: number | string): Promise<{
  results: RaceResult[];
  raceName: string;
  date: string;
} | null> {
  try {
    const race = await getRaceResults(round);
    if (!race?.Results?.length) return null;
    return {
      raceName: race.raceName,
      date: race.date,
      results: race.Results.map(mapResult).sort(sortResults),
    };
  } catch (e) {
    console.warn(`[live] fetchRaceResult(${round}) failed`, e);
    return null;
  }
}

export async function fetchQualifyingResult(round: number | string): Promise<QualifyingResult[]> {
  try {
    const results = await getQualifying(round);
    return results.map((r) => ({
      position: parseInt(r.position),
      number: r.number,
      driverId: JOLPICA_TO_LOCAL_DRIVER[r.Driver.driverId] ?? r.Driver.driverId,
      driverName: `${r.Driver.givenName} ${r.Driver.familyName}`,
      constructorId: JOLPICA_TO_LOCAL_TEAM[r.Constructor.constructorId] ?? r.Constructor.constructorId,
      constructorName: r.Constructor.name,
      q1: r.Q1,
      q2: r.Q2,
      q3: r.Q3,
    })).sort((a, b) => a.position - b.position);
  } catch (e) {
    console.warn(`[live] fetchQualifyingResult(${round}) failed`, e);
    return [];
  }
}

export async function fetchSprintResult(round: number | string): Promise<RaceResult[] | null> {
  try {
    const race = await getSprintResults(round);
    if (!race?.Results?.length) return null;
    return race.Results.map(mapResult).sort(sortResults);
  } catch (e) {
    console.warn(`[live] fetchSprintResult(${round}) failed`, e);
    return null;
  }
}

// ─── 최근 레이스 포디움 ───────────────────────────────────────

export interface PodiumEntry {
  position: 1 | 2 | 3;
  driverId: string;
  driverName: string;
  team: string;
  teamColor: string;
  gap: string; // pos1: 전체 레이스 타임, pos2+: 갭 (e.g. "+12.345")
  headshotUrl?: string;
}

export interface LastRacePodium {
  raceName: string;
  koreanName: string;
  round: number;
  date: string;
  podium: PodiumEntry[];
}

const _fetchPodiumForRound = unstable_cache(
  async (round: number, koreanName: string): Promise<LastRacePodium | null> => {
    try {
      const race = await getRaceResults(round);
      if (!race?.Results || race.Results.length < 3) return null;

      const top3 = race.Results
        .filter((r) => ["1", "2", "3"].includes(r.positionText))
        .sort((a, b) => parseInt(a.position) - parseInt(b.position))
        .slice(0, 3);

      if (top3.length < 3) return null;

      // 헤드샷 URL 취득 (드라이버 번호 기준, 실패 시 undefined)
      const of1Drivers = await getLatestDrivers().catch(() => []);
      const headshotByNumber = new Map(
        of1Drivers
          .filter((d) => d.headshot_url && !d.headshot_url.includes("d_driver_fallback_image"))
          .map((d) => [d.driver_number, d.headshot_url!])
      );

      const podium: PodiumEntry[] = top3.map((r) => {
        const localId = JOLPICA_TO_LOCAL_DRIVER[r.Driver.driverId] ?? r.Driver.driverId;
        const driver = getDriver(localId);
        return {
          position: parseInt(r.position) as 1 | 2 | 3,
          driverId: localId,
          driverName: `${r.Driver.givenName} ${r.Driver.familyName}`,
          team: r.Constructor.name,
          teamColor: driver?.teamColor ?? "#888888",
          gap: r.Time?.time ?? "",
          headshotUrl: driver ? headshotByNumber.get(driver.number) : undefined,
        };
      });

      return { raceName: race.raceName, koreanName, round, date: race.date, podium };
    } catch (e) {
      console.warn(`[live] podium fetch failed (round=${round})`, e);
      return null;
    }
  },
  ["last-race-podium"],
  { revalidate: 300 }
);

export function fetchLastRacePodium(round: number, koreanName: string) {
  return _fetchPodiumForRound(round, koreanName);
}

// ─── 드라이버 헤드샷 URL ──────────────────────────────────────

// ─── 챔피언십 포인트 추이 ─────────────────────────────────────

export interface ChampionshipProgress {
  driverId: string;
  driverName: string;
  teamColor: string;
  // index = round-1, value = cumulative points after that round
  points: (number | null)[];
}

export async function fetchChampionshipProgress(
  season: number,
  completedRounds: number[]
): Promise<ChampionshipProgress[]> {
  if (completedRounds.length === 0) return [];

  try {
    // 라운드 수만큼 호출한다. Promise.all 로 전량 동시 발사하면 시즌 말엔
    // 23개가 한꺼번에 나가 Jolpica 가 429 로 막는다. 3개씩 나눠 보낸다.
    // (주석은 원래 "batched, 3 at a time" 이었는데 코드는 배칭하지 않았다.)
    const allRoundStandings = await batchedParallel(
      completedRounds,
      (r) => getDriverStandingsAtRound(season, r),
      3
    );

    // build map: driverId → points per round
    const map = new Map<string, { name: string; color: string; pts: (number | null)[] }>();

    // collect top 10 drivers from last round
    const lastRound = allRoundStandings[allRoundStandings.length - 1];
    const topDriverIds = lastRound.slice(0, 10).map((d) => d.Driver.driverId);

    for (const driverId of topDriverIds) {
      map.set(driverId, { name: "", color: "#ffffff", pts: [] });
    }

    for (const standings of allRoundStandings) {
      for (const driverId of topDriverIds) {
        const entry = standings.find((d) => d.Driver.driverId === driverId);
        map.get(driverId)!.pts.push(entry ? Number(entry.points) : null);
        if (entry) {
          const info = map.get(driverId)!;
          info.name = `${entry.Driver.givenName} ${entry.Driver.familyName}`;
        }
      }
    }

    // match team colors from local drivers data
    const { drivers: localDrivers } = await import("@/data/f1-data");
    const jolpicaToLocal: Record<string, string> = {};
    for (const d of localDrivers) {
      const jolpicaId = LOCAL_TO_JOLPICA_DRIVER[d.id];
      if (jolpicaId) jolpicaToLocal[jolpicaId] = d.teamColor;
    }

    return topDriverIds.map((driverId) => {
      const info = map.get(driverId)!;
      return {
        driverId,
        driverName: info.name,
        teamColor: jolpicaToLocal[driverId] ?? "#64748B",
        points: info.pts,
      };
    });
  } catch (e) {
    console.warn("[live] championship progress failed", e);
    return [];
  }
}

export async function fetchDriverHeadshot(driverNumber: number): Promise<string | null> {
  try {
    const drivers = await getLatestDrivers();
    const found = drivers.find((d) => d.driver_number === driverNumber);
    const url = found?.headshot_url ?? null;
    // F1 returns a fallback silhouette when actual photo isn't available yet
    if (!url || url.includes("d_driver_fallback_image")) return null;
    return url;
  } catch (e) {
    console.warn(`[live] driver headshot failed (#${driverNumber})`, e);
    return null;
  }
}
