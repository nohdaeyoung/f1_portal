/**
 * Live Data Layer
 *
 * Jolpica(Ergast 호환) + OpenF1 API를 호출하고,
 * 로컬 메타데이터(한국어명, 팀 컬러, 국기 등)와 병합해 반환.
 * API 실패 시 목업 데이터로 자동 폴백.
 */

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
  type JolpicaStanding,
  type JolpicaConstructorStanding,
  type JolpicaRace,
  type JolpicaResult,
} from "@/lib/api/jolpica";

import { getLatestDrivers } from "@/lib/api/openf1";

import {
  driverStandings as mockDriverStandings,
  constructorStandings as mockConstructorStandings,
  calendar as mockCalendar,
  sessionSchedules,
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
  isack_hadjar: "hadjar",
  // McLaren
  lando_norris: "norris",
  oscar_piastri: "piastri",
  // Ferrari
  lewis_hamilton: "hamilton",
  charles_leclerc: "leclerc",
  // Mercedes
  george_russell: "russell",
  andrea_kimi_antonelli: "antonelli",
  kimi_antonelli: "antonelli",
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
  lindblad:    "lindblad",
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

export async function fetchDriverStandings(): Promise<Standing[]> {
  try {
    const data = await jolpikaDriverStandings();
    if (!data.length) return mockDriverStandings;

    return data.map((s: JolpicaStanding) => ({
      position: parseInt(s.position),
      driverId:
        JOLPICA_TO_LOCAL_DRIVER[s.Driver.driverId] ??
        s.Driver.driverId, // 매핑 없으면 Jolpica 값 그대로
      points: parseFloat(s.points),
      wins: parseInt(s.wins),
    }));
  } catch (e) {
    console.warn("[live] driver standings API failed → mock 사용", e);
    return mockDriverStandings;
  }
}

// ─── 컨스트럭터 챔피언십 순위 ────────────────────────────────

export async function fetchConstructorStandings(): Promise<
  ConstructorStanding[]
> {
  try {
    const data = await jolpikaConstructorStandings();
    if (!data.length) return mockConstructorStandings;

    return data.map((s: JolpicaConstructorStanding) => ({
      position: parseInt(s.position),
      teamId:
        JOLPICA_TO_LOCAL_TEAM[s.Constructor.constructorId] ??
        s.Constructor.constructorId,
      points: parseFloat(s.points),
      wins: parseInt(s.wins),
    }));
  } catch (e) {
    console.warn("[live] constructor standings API failed → mock 사용", e);
    return mockConstructorStandings;
  }
}

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

export async function fetchCalendar(): Promise<RaceCalendar[]> {
  try {
    // 일정 + 결과를 병렬 호출
    const [schedule, results] = await Promise.all([
      getRaceSchedule(),
      getAllResults().catch(() => []), // 결과 없으면 빈 배열
    ]);

    if (!schedule.length) return mockCalendar;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 로컬 캘린더에서 한국어/영어 이름 & circuitId 조회 (round 기준)
    const localByRound = new Map(
      mockCalendar.map((r) => [r.round, r])
    );

    // 결과 맵: round → 우승자 이름
    const winnerByRound = new Map(
      results
        .filter((r: JolpicaRace) => r.Results && r.Results.length > 0)
        .map((r: JolpicaRace) => [
          parseInt(r.round),
          `${r.Results![0].Driver.givenName} ${r.Results![0].Driver.familyName}`,
        ])
    );

    let nextSet = false;

    return schedule.map((r: JolpicaRace) => {
      const round = parseInt(r.round);
      const local = localByRound.get(round);
      const raceDate = new Date(r.date);
      const winner = winnerByRound.get(round);

      let status: RaceCalendar["status"];
      if (winner || raceDate < today) {
        status = "completed";
      } else if (!nextSet) {
        status = "next";
        nextSet = true;
      } else {
        status = "upcoming";
      }

      // 세션 일정 — API 데이터 우선, 없으면 정적 폴백
      const sessions: SessionSchedule = sessionSchedules[round] ?? sessionSchedules[1];
      if (r.FirstPractice?.date) {
        sessions.fp1 = `${r.FirstPractice.date}T${r.FirstPractice.time}`;
      }
      if (r.SecondPractice?.date) {
        sessions.fp2 = `${r.SecondPractice.date}T${r.SecondPractice.time}`;
      }
      if (r.ThirdPractice?.date) {
        sessions.fp3 = `${r.ThirdPractice.date}T${r.ThirdPractice.time}`;
      }
      if (r.SprintQualifying?.date) {
        sessions.sq = `${r.SprintQualifying.date}T${r.SprintQualifying.time}`;
      }
      if (r.Sprint?.date) {
        sessions.sprint = `${r.Sprint.date}T${r.Sprint.time}`;
      }
      if (r.Qualifying?.date) {
        sessions.qualifying = `${r.Qualifying.date}T${r.Qualifying.time}`;
      }
      sessions.race = `${r.date}T${r.time ?? "00:00:00Z"}`;
      sessions.isSprint = !!r.Sprint;

      return {
        round,
        name: r.raceName,
        koreanName: local?.koreanName ?? r.raceName,
        circuitId: local?.circuitId ?? r.Circuit.circuitId,
        date: r.date,
        status,
        winner,
        sessions,
      };
    });
  } catch (e) {
    console.warn("[live] calendar API failed → mock 사용", e);
    // 정적 폴백에도 세션 데이터 포함
    return mockCalendar.map((r) => ({
      ...r,
      sessions: sessionSchedules[r.round],
    }));
  }
}

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
      results: race.Results.map(mapResult),
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
    }));
  } catch (e) {
    console.warn(`[live] fetchQualifyingResult(${round}) failed`, e);
    return [];
  }
}

export async function fetchSprintResult(round: number | string): Promise<RaceResult[] | null> {
  try {
    const race = await getSprintResults(round);
    if (!race?.Results?.length) return null;
    return race.Results.map(mapResult);
  } catch (e) {
    console.warn(`[live] fetchSprintResult(${round}) failed`, e);
    return null;
  }
}

// ─── 드라이버 헤드샷 URL ──────────────────────────────────────

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
