import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchCalendar,
  fetchRaceResult,
  fetchQualifyingResult,
  fetchSprintResult,
  type RaceResult,
  type QualifyingResult,
} from "@/lib/data/live";
import { getCircuit, getDriver, getTeam } from "@/data/f1-data";
import { calendar as mockCalendar } from "@/data/f1-data";
import { sportsEventSchema, breadcrumbSchema, jsonLdScript } from "@/lib/jsonld";

export const revalidate = 300;

export async function generateStaticParams() {
  return mockCalendar.map((r) => ({ round: String(r.round) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ round: string }>;
}) {
  const { round } = await params;
  const calendar = await fetchCalendar();
  const race = calendar.find((r) => r.round === parseInt(round));
  if (!race) return { title: "GP 정보" };
  const circuit = getCircuit(race.circuitId);
  const title = race.koreanName;
  const description = `2026 F1 Round ${race.round} ${race.koreanName}. ${circuit ? circuit.koreanName + ", " + circuit.country + ". " : ""}레이스 결과, 예선 순위, 세션 일정.`;
  return {
    title,
    description,
    openGraph: {
      title: `${title} | F1 by 324.ing`,
      description,
      url: `https://f1.324.ing/season/race/${round}`,
      images: [{ url: `https://f1.324.ing/api/og/race/${round}`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

// ─── OpenF1 Types ─────────────────────────────────────────────

interface OF1Session  { session_key: number; session_name: string; date_start: string; }
interface OF1Driver   { driver_number: number; full_name: string; name_acronym: string; team_colour: string | null; team_name: string; headshot_url: string | null; }
interface OF1Result   { driver_number: number; position: number; gap_to_leader: number | number[] | null; duration: number | number[] | null; number_of_laps: number; dnf: boolean; dns: boolean; dsq: boolean; }
interface OF1Lap      { driver_number: number; lap_number: number; lap_duration: number | null; duration_sector_1: number | null; duration_sector_2: number | null; duration_sector_3: number | null; is_pit_out_lap: boolean; i1_speed: number | null; i2_speed: number | null; st_speed: number | null; }
interface OF1Stint    { driver_number: number; compound: string | null; stint_number: number; lap_start: number; lap_end: number | null; }
interface OF1Pit      { driver_number: number; lap_number: number; pit_duration: number | null; }
interface OF1RC       { date: string; flag: string | null; message: string; lap_number: number | null; }
interface OF1Weather  { air_temperature: number | null; track_temperature: number | null; humidity: number | null; rainfall: number | null; }
interface OF1Grid     { driver_number: number; position: number; }

// ─── Session Config ────────────────────────────────────────────

const SESSION_CONFIG: Record<string, { name: string; of1Names: string[] }> = {
  fp1:        { name: "FP1 프리 프랙티스",    of1Names: ["Practice 1"] },
  fp2:        { name: "FP2 프리 프랙티스",    of1Names: ["Practice 2"] },
  fp3:        { name: "FP3 프리 프랙티스",    of1Names: ["Practice 3"] },
  sq:         { name: "스프린트 퀄리파잉",     of1Names: ["Sprint Qualifying", "Sprint Shootout"] },
  sprint:     { name: "스프린트 레이스",       of1Names: ["Sprint"] },
  qualifying: { name: "퀄리파잉",             of1Names: ["Qualifying"] },
  race:       { name: "결승 레이스",           of1Names: ["Race"] },
};

const OF1_BASE = "https://api.openf1.org/v1";

const COMPOUND_COLOR: Record<string, string> = {
  SOFT: "#E8002D", MEDIUM: "#FCD34D", HARD: "#E5E7EB",
  INTERMEDIATE: "#22C55E", WET: "#3B82F6",
};

// ─── OpenF1 Helpers ───────────────────────────────────────────

async function of1get<T>(path: string, params: Record<string, string | number> = {}, ttl = 300): Promise<T[]> {
  const url = new URL(`${OF1_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  try {
    const r = await fetch(url.toString(), { next: { revalidate: ttl } });
    if (!r.ok) return [];
    const data = await r.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

async function findSessionKey(sessionType: string, sessionDateIso: string): Promise<number | null> {
  const year = new Date(sessionDateIso).getFullYear();
  // 세션 목록은 짧게 캐시 (60초) — 세션 미발견 시 빈 캐시가 오래 남는 문제 방지
  const sessions = await of1get<OF1Session>("/sessions", { year }, 60);
  const targetDate = sessionDateIso.slice(0, 10);
  const names = SESSION_CONFIG[sessionType]?.of1Names ?? [];
  const match = sessions.find(
    (s) => s.date_start.startsWith(targetDate) && names.includes(s.session_name),
  );
  return match?.session_key ?? null;
}

function fmtLap(sec: number | null) {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(3).padStart(6, "0");
  return `${m}:${s}`;
}

function fmtGap(sec: number | null) {
  if (sec == null) return "—";
  if (sec === 0) return "리더";
  return `+${sec.toFixed(3)}`;
}

function fmtTimeKST(iso: string) {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit",
  });
}

// ─── Helpers ──────────────────────────────────────────────────

function fmtKST(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("ko-KR", {
      timeZone: "Asia/Seoul",
      month: "long",
      day: "numeric",
      weekday: "short",
    }),
    time: d.toLocaleTimeString("ko-KR", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    past: d.getTime() < Date.now(),
  };
}

function posStyle(pos: number) {
  if (pos === 1) return "text-[#FCD34D] bg-[#FCD34D]/10";
  if (pos === 2) return "text-[#C0C0C0] bg-[#C0C0C0]/10";
  if (pos === 3) return "text-[#CD7F32] bg-[#CD7F32]/10";
  return "text-[#64748B] bg-white/[0.03]";
}

const STATUS_DNF = ["Accident", "Collision", "Spun off", "Retired", "Disqualified", "Did not start"];

// ─── Session Tabs ─────────────────────────────────────────────

type SessionsData = NonNullable<Awaited<ReturnType<typeof fetchCalendar>>[0]["sessions"]>;

function SessionTabs({
  sessions,
  activeSession,
  round,
}: {
  sessions: SessionsData;
  activeSession: string | undefined;
  round: number;
}) {
  const tabs = [
    { key: "overview", ko: "개요" },
    { key: "fp1",        ko: "FP1",      date: sessions.fp1,        hide: !!sessions.isSprint },
    { key: "fp2",        ko: "FP2",      date: sessions.fp2,        hide: !!sessions.isSprint },
    { key: "fp3",        ko: "FP3",      date: sessions.fp3,        hide: !!sessions.isSprint },
    { key: "sq",         ko: "SQ",       date: sessions.sq,         hide: !sessions.isSprint },
    { key: "sprint",     ko: "스프린트", date: sessions.sprint,     hide: !sessions.isSprint },
    { key: "qualifying", ko: "Qualifying", date: sessions.qualifying },
    { key: "race",       ko: "Race",      date: sessions.race },
  ].filter((t) => !t.hide && (t.key === "overview" || !!t.date));

  return (
    <div
      className="flex gap-px bg-bg-raised border border-border-default rounded-xl p-1 mb-8 overflow-x-auto hud-card"
      role="navigation"
      aria-label="세션 탭"
    >
      {tabs.map(({ key, ko, date }) => {
        const isActive = key === "overview" ? !activeSession : activeSession === key;
        const isPast = date ? new Date(date as string).getTime() < Date.now() : key === "overview";
        const href = key === "overview"
          ? `/season/race/${round}`
          : `/season/race/${round}?session=${key}`;
        return (
          <Link
            key={key}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={[
              "flex-shrink-0 px-3.5 py-2 font-display text-xs font-bold rounded-lg tracking-widest uppercase transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-f1-red focus-visible:ring-offset-1 focus-visible:ring-offset-bg-raised",
              isActive
                ? "bg-f1-red text-white shadow-sm"
                : isPast
                ? "text-text-secondary hover:text-white hover:bg-white/[0.06]"
                : "text-text-disabled pointer-events-none",
            ].join(" ")}
          >
            {ko}
          </Link>
        );
      })}
    </div>
  );
}

// ─── Session Timetable ────────────────────────────────────────

type SessionKey = "fp1" | "fp2" | "fp3" | "sq" | "sprint" | "qualifying" | "race";

const ALL_SESSIONS: { key: SessionKey; ko: string; sprint?: boolean }[] = [
  { key: "fp1",        ko: "FP1 프리 프랙티스" },
  { key: "fp2",        ko: "FP2 프리 프랙티스", sprint: false },
  { key: "fp3",        ko: "FP3 프리 프랙티스", sprint: false },
  { key: "sq",         ko: "스프린트 퀄리파잉",  sprint: true },
  { key: "sprint",     ko: "스프린트 레이스",    sprint: true },
  { key: "qualifying", ko: "퀄리파잉" },
  { key: "race",       ko: "결승 레이스" },
];

function SessionTimetable({
  sessions,
  round,
}: {
  sessions: SessionsData;
  round: number;
}) {
  const rows = ALL_SESSIONS.filter(({ key, sprint }) => {
    const val = sessions[key] as string | undefined;
    if (!val) return false;
    if (sprint === true && !sessions.isSprint) return false;
    if (sprint === false && sessions.isSprint) return false;
    return true;
  });

  return (
    <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
      {rows.map(({ key, ko }, i) => {
        const iso = sessions[key] as string;
        const { date, time, past } = fmtKST(iso);
        const isRace = key === "race";
        const isSprint = key === "sprint";
        const inner = (
          <div
            className={`flex items-center justify-between px-5 py-4 ${
              i < rows.length - 1 ? "border-b border-[#2D2D3A]" : ""
            } ${past ? "" : "opacity-60"} ${past ? "hover:bg-white/[0.02]" : ""} transition-colors`}
          >
            <div className="flex items-center gap-3">
              {isRace && <span className="w-2 h-2 rounded-full bg-[#E8002D] shrink-0" />}
              {isSprint && <span className="w-2 h-2 rounded-full bg-[#FF6700] shrink-0" />}
              <span
                className={`text-sm font-bold ${
                  isRace ? "text-white" : isSprint ? "text-[#FF6700]" : "text-[#94A3B8]"
                }`}
              >
                {ko}
              </span>
              {past && (
                <span className="text-[10px] text-[#22C55E] font-medium bg-[#22C55E]/10 border border-[#22C55E]/20 px-1.5 py-0.5 rounded">
                  결과 보기 →
                </span>
              )}
            </div>
            <div className="text-right">
              <span className={`text-sm font-mono font-bold ${isRace ? "text-[#E8002D]" : "text-white"}`}>
                {time} KST
              </span>
              <span className="block text-xs text-[#64748B] mt-0.5">{date}</span>
            </div>
          </div>
        );
        return past ? (
          <Link key={key} href={`/season/race/${round}?session=${key}`}>{inner}</Link>
        ) : (
          <div key={key}>{inner}</div>
        );
      })}
    </div>
  );
}

// ─── Race Results Table ───────────────────────────────────────

function RaceResultsTable({ results, title = "결승 결과" }: { results: RaceResult[]; title?: string }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default bg-bg-overlay">
                <th className="text-left px-4 py-2.5 font-display text-[10px] tracking-widest text-text-disabled uppercase w-10">POS</th>
                <th className="text-left px-4 py-2.5 font-display text-[10px] tracking-widest text-text-disabled uppercase">DRIVER</th>
                <th className="text-left px-4 py-2.5 font-display text-[10px] tracking-widest text-text-disabled uppercase hidden sm:table-cell">TEAM</th>
                <th className="text-right px-4 py-2.5 font-display text-[10px] tracking-widest text-text-disabled uppercase w-10 hidden md:table-cell">GRID</th>
                <th className="text-right px-4 py-2.5 font-display text-[10px] tracking-widest text-text-disabled uppercase hidden lg:table-cell">TIME</th>
                <th className="text-right px-4 py-2.5 font-display text-[10px] tracking-widest text-text-disabled uppercase w-12">PTS</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => {
                const driver = getDriver(r.driverId);
                const team = getTeam(r.constructorId);
                const isDNF = STATUS_DNF.some((s) =>
                  r.status.toLowerCase().includes(s.toLowerCase())
                ) || r.positionText === "R";
                const hasFastestLap = r.fastestLapRank === 1;
                return (
                  <tr
                    key={r.number}
                    className="border-b border-[#2D2D3A]/50 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-black ${posStyle(r.position)}`}
                      >
                        {isDNF ? "DNF" : r.positionText}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-1 h-6 rounded-full shrink-0"
                          style={{ backgroundColor: driver?.teamColor ?? team?.primaryColor ?? "#64748B" }}
                        />
                        <Link
                          href={`/drivers/${r.driverId}`}
                          className="font-bold text-white hover:text-[#E8002D] transition-colors"
                        >
                          {r.driverName}
                        </Link>
                        {hasFastestLap && (
                          <span className="text-[10px] font-black text-[#A855F7] bg-[#A855F7]/15 border border-[#A855F7]/30 px-1 py-0.5 rounded">
                            FL
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#64748B] hidden sm:table-cell">
                      {team ? (
                        <Link href={`/teams/${r.constructorId}`} className="hover:text-white transition-colors">
                          {team.name}
                        </Link>
                      ) : (
                        r.constructorName
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-[#64748B] font-mono hidden md:table-cell">
                      {r.grid === 0 ? "PL" : r.grid}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#94A3B8] text-xs hidden lg:table-cell">
                      {isDNF ? (
                        <span className="text-[#EF4444]">{r.status}</span>
                      ) : r.time ? (
                        r.time
                      ) : (
                        r.status
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-white">
                      {r.points > 0 ? r.points : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ─── Qualifying Results Table ─────────────────────────────────

function QualifyingTable({ results }: { results: QualifyingResult[] }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-white mb-4">퀄리파잉 결과</h2>
      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2D2D3A]">
                <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase w-10">#</th>
                <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase">드라이버</th>
                <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase hidden sm:table-cell">팀</th>
                <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase font-mono">Q1</th>
                <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase font-mono hidden md:table-cell">Q2</th>
                <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase font-mono hidden lg:table-cell">Q3</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => {
                const driver = getDriver(r.driverId);
                const team = getTeam(r.constructorId);
                return (
                  <tr
                    key={r.number}
                    className="border-b border-[#2D2D3A]/50 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-black ${posStyle(r.position)}`}
                      >
                        {r.position}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-1 h-6 rounded-full shrink-0"
                          style={{ backgroundColor: driver?.teamColor ?? team?.primaryColor ?? "#64748B" }}
                        />
                        <Link
                          href={`/drivers/${r.driverId}`}
                          className="font-bold text-white hover:text-[#E8002D] transition-colors"
                        >
                          {r.driverName}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#64748B] hidden sm:table-cell">
                      {team ? (
                        <Link href={`/teams/${r.constructorId}`} className="hover:text-white transition-colors">
                          {team.name}
                        </Link>
                      ) : (
                        r.constructorName
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-[#94A3B8]">
                      {r.q1 ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-[#94A3B8] hidden md:table-cell">
                      {r.q2 ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs hidden lg:table-cell">
                      <span className={r.q3 ? "text-white font-bold" : "text-[#64748B]"}>
                        {r.q3 ?? "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ─── OpenF1 Session View ──────────────────────────────────────

async function SessionDataView({
  sessionDateIso,
  session,
}: {
  sessionDateIso: string;
  session: string;
}) {
  const sessionStart = new Date(sessionDateIso).getTime();
  const now = Date.now();
  const isUpcoming = now < sessionStart;
  const sessionEndMs = sessionStart + (session === "race" || session === "sprint" ? 3 : 2) * 3_600_000;
  const isCompleted = now > sessionEndMs;
  const ttl = isCompleted ? 86400 : 60;

  const sk = isUpcoming ? null : await findSessionKey(session, sessionDateIso);

  const isRaceType = session === "race" || session === "sprint";
  const isQualType = session === "qualifying" || session === "sq";
  const isFpType   = session === "fp1" || session === "fp2" || session === "fp3";

  // 1차: 결과 먼저 확인 (빈 응답이면 짧은 캐시로 재시도 방지)
  const resultsTtl = ttl;
  const initialResults = sk
    ? await of1get<OF1Result>("/session_result", { session_key: sk }, resultsTtl)
    : [];

  // 결과가 있을 때만 나머지 데이터를 긴 ttl로 가져옴, 없으면 짧은 ttl(60초) 사용
  const dataTtl = initialResults.length > 0 ? ttl : 60;

  const [results, drivers, laps, stints, pits, raceControl, weatherArr, grid] = sk
    ? await Promise.all([
        Promise.resolve(initialResults),
        of1get<OF1Driver>  ("/drivers",        { session_key: sk }, dataTtl),
        of1get<OF1Lap>     ("/laps",           { session_key: sk }, dataTtl),
        of1get<OF1Stint>   ("/stints",         { session_key: sk }, dataTtl),
        of1get<OF1Pit>     ("/pit",            { session_key: sk }, dataTtl),
        of1get<OF1RC>      ("/race_control",   { session_key: sk }, dataTtl),
        of1get<OF1Weather> ("/weather",        { session_key: sk }, dataTtl),
        of1get<OF1Grid>    ("/starting_grid",  { session_key: sk }, dataTtl),
      ])
    : [[], [], [], [], [], [], [], []];

  const driverMap = new Map((drivers as OF1Driver[]).map((d) => [d.driver_number, d]));

  const fastestLapMap = new Map<number, OF1Lap>();
  for (const lap of laps as OF1Lap[]) {
    if (!lap.lap_duration || lap.is_pit_out_lap) continue;
    const prev = fastestLapMap.get(lap.driver_number);
    if (!prev?.lap_duration || lap.lap_duration < prev.lap_duration) {
      fastestLapMap.set(lap.driver_number, lap);
    }
  }

  let overallFastest: { driverNumber: number; lap: OF1Lap } | null = null;
  for (const [dn, lap] of fastestLapMap) {
    if (!overallFastest || (lap.lap_duration && lap.lap_duration < (overallFastest.lap.lap_duration ?? Infinity))) {
      overallFastest = { driverNumber: dn, lap };
    }
  }

  const pitsByDriver = new Map<number, OF1Pit[]>();
  for (const p of pits as OF1Pit[]) {
    const arr = pitsByDriver.get(p.driver_number) ?? [];
    arr.push(p);
    pitsByDriver.set(p.driver_number, arr);
  }

  const gridMap = new Map((grid as OF1Grid[]).map((g) => [g.driver_number, g]));
  const wxLast = (weatherArr as OF1Weather[])[weatherArr.length - 1] ?? null;
  const sortedResults = [...(results as OF1Result[])].sort((a, b) => a.position - b.position);
  const hasData = results.length > 0;

  const bestLapCompound = new Map<number, string>();
  for (const [dn, lap] of fastestLapMap) {
    const lapNum = lap.lap_number;
    const driverStints = (stints as OF1Stint[])
      .filter((s) => s.driver_number === dn)
      .sort((a, b) => a.stint_number - b.stint_number);
    const stint = driverStints.find(
      (s) => s.lap_start <= lapNum && (s.lap_end == null || s.lap_end >= lapNum),
    );
    if (stint?.compound) bestLapCompound.set(dn, stint.compound);
  }

  const posColor = (pos: number) =>
    pos === 1 ? "text-[#FCD34D] bg-[#FCD34D]/10"
    : pos === 2 ? "text-[#C0C0C0] bg-[#C0C0C0]/10"
    : pos === 3 ? "text-[#CD7F32] bg-[#CD7F32]/10"
    : "text-[#64748B] bg-white/[0.03]";

  if (isUpcoming) {
    return (
      <div className="text-center py-16 bg-[#141420] border border-[#2D2D3A] rounded-2xl">
        <p className="text-5xl mb-4">🕐</p>
        <p className="text-white font-bold text-lg mb-2">세션 예정</p>
        <p className="text-[#64748B] text-sm">
          {new Date(sessionDateIso).toLocaleDateString("ko-KR", {
            timeZone: "Asia/Seoul", month: "long", day: "numeric", weekday: "short",
          })}{" "}
          {fmtTimeKST(sessionDateIso)} KST에 시작합니다
        </p>
      </div>
    );
  }

  if (!sk) {
    return (
      <div className="text-center py-16 bg-[#141420] border border-[#2D2D3A] rounded-2xl">
        <p className="text-5xl mb-4">📡</p>
        <p className="text-white font-bold text-lg mb-2">데이터 수집 중</p>
        <p className="text-[#64748B] text-sm">OpenF1 API에서 세션 데이터를 가져올 수 없습니다.</p>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="text-center py-16 bg-[#141420] border border-[#2D2D3A] rounded-2xl">
        <p className="text-5xl mb-4">⏳</p>
        <p className="text-white font-bold text-lg mb-2">결과 집계 중</p>
        <p className="text-[#64748B] text-sm">세션이 방금 종료되었거나 데이터 처리 중입니다. 잠시 후 새로고침해 주세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">

      {/* Session header: weather + fastest lap */}
      {(wxLast || overallFastest) && (
        <div className="flex flex-wrap gap-4">
          {wxLast && (
            <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl px-5 py-4 text-sm">
              <p className="text-[10px] text-[#64748B] uppercase tracking-widest mb-2">날씨</p>
              <div className="flex gap-6">
                <span className="text-[#64748B]">기온 <span className="text-white font-bold">{wxLast.air_temperature != null ? `${wxLast.air_temperature.toFixed(0)}°C` : "—"}</span></span>
                <span className="text-[#64748B]">트랙 <span className="text-white font-bold">{wxLast.track_temperature != null ? `${wxLast.track_temperature.toFixed(0)}°C` : "—"}</span></span>
                <span className="text-[#64748B]">습도 <span className="text-white font-bold">{wxLast.humidity != null ? `${wxLast.humidity}%` : "—"}</span></span>
                <span className="text-[#64748B]">
                  {wxLast.rainfall != null && wxLast.rainfall > 0
                    ? <span className="text-[#3B82F6] font-bold">🌧 강우</span>
                    : <span className="text-white font-bold">맑음</span>
                  }
                </span>
              </div>
            </div>
          )}
          {overallFastest && (
            <div className="inline-flex items-center gap-3 bg-[#A855F7]/10 border border-[#A855F7]/30 rounded-xl px-4 py-4">
              <span className="text-[10px] font-black text-[#A855F7] uppercase tracking-widest">패스티스트 랩</span>
              <span className="text-white font-black font-mono">{fmtLap(overallFastest.lap.lap_duration)}</span>
              <span className="text-[#64748B] text-sm">
                {driverMap.get(overallFastest.driverNumber)?.name_acronym ?? `#${overallFastest.driverNumber}`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* FP 결과 테이블 */}
      {isFpType && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">최종 순위 — 베스트 랩 기준</h2>
          <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 z-10 bg-[#141420]">
                  <tr className="border-b border-[#2D2D3A]">
                    <th className="sticky left-0 z-20 bg-[#141420] text-left px-3 py-2.5 text-xs text-[#64748B] uppercase w-12">#</th>
                    <th className="sticky left-12 z-20 bg-[#141420] text-left px-3 py-2.5 text-xs text-[#64748B] uppercase min-w-[140px]">드라이버</th>
                    <th className="text-left px-3 py-2.5 text-xs text-[#64748B] uppercase hidden sm:table-cell">팀</th>
                    <th className="text-center px-3 py-2.5 text-xs text-[#64748B] uppercase hidden md:table-cell">타이어</th>
                    <th className="text-right px-3 py-2.5 text-xs text-[#64748B] uppercase hidden sm:table-cell">랩수</th>
                    <th className="text-right px-3 py-2.5 text-xs text-[#64748B] uppercase font-mono">베스트 랩</th>
                    <th className="text-right px-3 py-2.5 text-xs text-[#64748B] uppercase font-mono hidden md:table-cell">갭</th>
                    <th className="text-right px-3 py-2.5 text-xs text-[#64748B] uppercase font-mono hidden lg:table-cell">S1</th>
                    <th className="text-right px-3 py-2.5 text-xs text-[#64748B] uppercase font-mono hidden lg:table-cell">S2</th>
                    <th className="text-right px-3 py-2.5 text-xs text-[#64748B] uppercase font-mono hidden lg:table-cell">S3</th>
                    <th className="text-right px-3 py-2.5 text-xs text-[#64748B] uppercase hidden xl:table-cell">IS1 <span className="normal-case text-[10px]">km/h</span></th>
                    <th className="text-right px-3 py-2.5 text-xs text-[#64748B] uppercase hidden xl:table-cell">IS2 <span className="normal-case text-[10px]">km/h</span></th>
                    <th className="text-right px-3 py-2.5 text-xs text-[#64748B] uppercase hidden xl:table-cell">탑스피드 <span className="normal-case text-[10px]">km/h</span></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map((r) => {
                    const d = driverMap.get(r.driver_number);
                    const teamColor = d?.team_colour
                      ? (d.team_colour.startsWith("#") ? d.team_colour : `#${d.team_colour}`)
                      : "#64748B";
                    const fastLap = fastestLapMap.get(r.driver_number);
                    const isFastest = overallFastest?.driverNumber === r.driver_number;
                    const compound = bestLapCompound.get(r.driver_number);
                    const compoundColor = COMPOUND_COLOR[compound ?? ""] ?? "#64748B";
                    const gap = r.gap_to_leader;
                    return (
                      <tr
                        key={r.driver_number}
                        className={`border-b border-[#1E1E2A] hover:bg-white/[0.04] transition-colors last:border-0 ${isFastest ? "bg-[#A855F7]/[0.04]" : ""}`}
                      >
                        <td className="sticky left-0 z-10 bg-[#141420] px-3 py-2.5">
                          <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-black ${posColor(r.position)}`}>
                            {r.position ?? "—"}
                          </span>
                        </td>
                        <td className="sticky left-12 z-10 bg-[#141420] px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            {d?.headshot_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={d.headshot_url} alt={d.name_acronym} className="w-7 h-7 rounded-full object-cover object-top bg-[#2D2D3A] shrink-0" />
                            ) : (
                              <span className="w-7 h-7 rounded-full bg-[#2D2D3A] flex items-center justify-center text-[10px] text-[#64748B] font-bold shrink-0">
                                {d?.name_acronym?.slice(0, 2) ?? "?"}
                              </span>
                            )}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white text-sm leading-none">{d?.name_acronym ?? `#${r.driver_number}`}</span>
                                {isFastest && (
                                  <span className="text-[10px] font-black text-[#A855F7] bg-[#A855F7]/15 border border-[#A855F7]/30 px-1 py-0.5 rounded leading-none">FL</span>
                                )}
                              </div>
                              <div className="text-xs text-[#64748B] mt-0.5 leading-none hidden sm:block">{d?.full_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 hidden sm:table-cell">
                          <span className="text-xs" style={{ color: teamColor }}>{d?.team_name ?? "—"}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center hidden md:table-cell">
                          {compound ? (
                            <span
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black border-2"
                              style={{ borderColor: compoundColor, color: compoundColor }}
                              title={compound}
                            >
                              {compound[0]}
                            </span>
                          ) : <span className="text-[#475569]">—</span>}
                        </td>
                        <td className="px-3 py-2.5 text-right text-[#64748B] text-xs hidden sm:table-cell">{r.number_of_laps != null ? `${r.number_of_laps}L` : "—"}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs">
                          <span className={isFastest ? "text-[#A855F7] font-bold" : "text-white"}>
                            {fmtLap(fastLap?.lap_duration ?? null)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-[#64748B] hidden md:table-cell">
                          {typeof gap === 'number'
                            ? gap === 0 ? <span className="text-[#E8002D] font-bold">리더</span> : `+${gap.toFixed(3)}`
                            : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-[#64748B] hidden lg:table-cell">
                          {fastLap?.duration_sector_1?.toFixed(3) ?? "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-[#64748B] hidden lg:table-cell">
                          {fastLap?.duration_sector_2?.toFixed(3) ?? "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-[#64748B] hidden lg:table-cell">
                          {fastLap?.duration_sector_3?.toFixed(3) ?? "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs text-[#64748B] hidden xl:table-cell">
                          {fastLap?.i1_speed != null ? `${fastLap.i1_speed}` : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs text-[#64748B] hidden xl:table-cell">
                          {fastLap?.i2_speed != null ? `${fastLap.i2_speed}` : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs text-[#64748B] hidden xl:table-cell">
                          {fastLap?.st_speed != null ? `${fastLap.st_speed}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 퀄리파잉 결과 테이블 */}
      {isQualType && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">퀄리파잉 결과</h2>
          <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 z-10 bg-[#141420]">
                  <tr className="border-b border-[#2D2D3A]">
                    <th className="sticky left-0 z-20 bg-[#141420] text-left px-4 py-2.5 text-xs text-[#64748B] uppercase w-12">#</th>
                    <th className="sticky left-12 z-20 bg-[#141420] text-left px-4 py-2.5 text-xs text-[#64748B] uppercase min-w-[160px]">드라이버</th>
                    <th className="text-left px-4 py-2.5 text-xs text-[#64748B] uppercase hidden sm:table-cell">팀</th>
                    <th className="text-right px-4 py-2.5 text-xs text-[#64748B] uppercase font-mono">Q1</th>
                    <th className="text-right px-4 py-2.5 text-xs text-[#64748B] uppercase font-mono hidden md:table-cell">Q2</th>
                    <th className="text-right px-4 py-2.5 text-xs text-[#64748B] uppercase font-mono hidden lg:table-cell">Q3</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map((r) => {
                    const d = driverMap.get(r.driver_number);
                    const teamColor = d?.team_colour
                      ? (d.team_colour.startsWith("#") ? d.team_colour : `#${d.team_colour}`)
                      : "#64748B";
                    const isPole = r.position === 1;
                    const durations = Array.isArray(r.duration) ? r.duration : (r.duration != null ? [r.duration] : []);
                    const q1 = durations[0] ?? null;
                    const q2 = durations[1] ?? null;
                    const q3 = durations[2] ?? null;
                    return (
                      <tr
                        key={r.driver_number}
                        className={`border-b border-[#1E1E2A] hover:bg-white/[0.04] transition-colors last:border-0 ${isPole ? "bg-[#A855F7]/[0.04]" : ""}`}
                      >
                        <td className="sticky left-0 z-10 bg-[#141420] px-4 py-2.5">
                          <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-black ${posColor(r.position)}`}>
                            {r.position ?? "—"}
                          </span>
                        </td>
                        <td className="sticky left-12 z-10 bg-[#141420] px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-1 h-6 rounded-full shrink-0" style={{ backgroundColor: teamColor }} />
                            <span className="font-bold text-white">{d?.name_acronym ?? `#${r.driver_number}`}</span>
                            <span className="text-xs text-[#64748B] hidden sm:inline">{d?.full_name}</span>
                            {isPole && (
                              <span className="text-[10px] font-black text-[#A855F7] bg-[#A855F7]/15 border border-[#A855F7]/30 px-1 py-0.5 rounded">PP</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-[#64748B] text-xs hidden sm:table-cell">
                          {d?.team_name ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-xs text-[#94A3B8]">
                          {fmtLap(q1)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-xs text-[#94A3B8] hidden md:table-cell">
                          {fmtLap(q2)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-xs hidden lg:table-cell">
                          <span className={q3 ? "text-white font-bold" : "text-[#64748B]"}>
                            {fmtLap(q3)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 레이스 결과 테이블 */}
      {isRaceType && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">레이스 결과</h2>
          <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 z-10 bg-[#141420]">
                  <tr className="border-b border-[#2D2D3A]">
                    <th className="sticky left-0 z-20 bg-[#141420] text-left px-4 py-2.5 text-xs text-[#64748B] uppercase w-12">#</th>
                    <th className="sticky left-12 z-20 bg-[#141420] text-left px-4 py-2.5 text-xs text-[#64748B] uppercase min-w-[160px]">드라이버</th>
                    <th className="text-left px-4 py-2.5 text-xs text-[#64748B] uppercase hidden sm:table-cell">팀</th>
                    <th className="text-right px-4 py-2.5 text-xs text-[#64748B] uppercase hidden md:table-cell">그리드</th>
                    <th className="text-right px-4 py-2.5 text-xs text-[#64748B] uppercase font-mono">갭</th>
                    <th className="text-right px-4 py-2.5 text-xs text-[#64748B] uppercase hidden md:table-cell">랩수</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map((r) => {
                    const d = driverMap.get(r.driver_number);
                    const teamColor = d?.team_colour
                      ? (d.team_colour.startsWith("#") ? d.team_colour : `#${d.team_colour}`)
                      : "#64748B";
                    const gridPos = gridMap.get(r.driver_number);
                    const isDNF = r.dnf || r.dsq || r.dns;
                    const isFastest = overallFastest?.driverNumber === r.driver_number;
                    const gap = typeof r.gap_to_leader === 'number' ? r.gap_to_leader : null;
                    return (
                      <tr
                        key={r.driver_number}
                        className={`border-b border-[#1E1E2A] hover:bg-white/[0.04] transition-colors last:border-0 ${isFastest ? "bg-[#A855F7]/[0.04]" : ""}`}
                      >
                        <td className="sticky left-0 z-10 bg-[#141420] px-4 py-2.5">
                          <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-black ${posColor(r.position)}`}>
                            {isDNF ? (r.dsq ? "DSQ" : r.dns ? "DNS" : "DNF") : (r.position ?? "—")}
                          </span>
                        </td>
                        <td className="sticky left-12 z-10 bg-[#141420] px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-1 h-6 rounded-full shrink-0" style={{ backgroundColor: teamColor }} />
                            <span className="font-bold text-white">{d?.name_acronym ?? `#${r.driver_number}`}</span>
                            <span className="text-xs text-[#64748B] hidden sm:inline">{d?.full_name}</span>
                            {isFastest && (
                              <span className="text-[10px] font-black text-[#A855F7] bg-[#A855F7]/15 border border-[#A855F7]/30 px-1 py-0.5 rounded">FL</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-[#64748B] text-xs hidden sm:table-cell">
                          {d?.team_name ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right text-[#64748B] font-mono text-xs hidden md:table-cell">
                          {gridPos?.position ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-xs">
                          <span className="text-[#94A3B8]">
                            {isDNF ? <span className="text-[#EF4444]">—</span> : fmtGap(gap)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-[#64748B] text-xs hidden md:table-cell">
                          {r.number_of_laps ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* FP / 퀄리파잉 타이어 사용 현황 */}
      {(isFpType || isQualType) && (stints as OF1Stint[]).length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">타이어 사용 현황</h2>
          <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2D2D3A]">
                    <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase">드라이버</th>
                    <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase">사용 컴파운드</th>
                    <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase hidden sm:table-cell">{isFpType ? "피트 횟수" : "런수"}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map((r) => {
                    const d = driverMap.get(r.driver_number);
                    const teamColor = d?.team_colour
                      ? (d.team_colour.startsWith("#") ? d.team_colour : `#${d.team_colour}`)
                      : "#64748B";
                    const driverStints = (stints as OF1Stint[])
                      .filter((s) => s.driver_number === r.driver_number)
                      .sort((a, b) => a.stint_number - b.stint_number);
                    const driverPits = pitsByDriver.get(r.driver_number) ?? [];
                    if (driverStints.length === 0) return null;
                    return (
                      <tr key={r.driver_number} className="border-b border-[#2D2D3A]/50 hover:bg-white/[0.02] last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-1 h-5 rounded-full shrink-0" style={{ backgroundColor: teamColor }} />
                            <span className="font-bold text-white text-sm">{d?.name_acronym ?? `#${r.driver_number}`}</span>
                            <span className="text-xs text-[#64748B] hidden sm:inline">{d?.full_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {driverStints.map((s, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <span
                                  className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border"
                                  style={{
                                    color: COMPOUND_COLOR[s.compound ?? ""] ?? "#94A3B8",
                                    borderColor: (COMPOUND_COLOR[s.compound ?? ""] ?? "#94A3B8") + "40",
                                    backgroundColor: (COMPOUND_COLOR[s.compound ?? ""] ?? "#94A3B8") + "10",
                                  }}
                                >
                                  {s.compound?.[0] ?? "?"}
                                  <span className="text-[#64748B] font-normal text-[10px]">{s.lap_start}–{s.lap_end ?? "?"}L</span>
                                </span>
                                {i < driverStints.length - 1 && <span className="text-[#64748B] text-xs">→</span>}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-white font-bold text-sm hidden sm:table-cell">
                          {isFpType ? `${driverPits.length}회` : `${driverStints.length}런`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 타이어 전략 (레이스/스프린트) */}
      {isRaceType && (stints as OF1Stint[]).length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">타이어 전략</h2>
          <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2D2D3A]">
                    <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase">드라이버</th>
                    <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase">스팅트</th>
                    <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase hidden sm:table-cell">피트 스톱</th>
                    <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase hidden md:table-cell">최소 피트 시간</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map((r) => {
                    const d = driverMap.get(r.driver_number);
                    const teamColor = d?.team_colour
                      ? (d.team_colour.startsWith("#") ? d.team_colour : `#${d.team_colour}`)
                      : "#64748B";
                    const driverStints = (stints as OF1Stint[])
                      .filter((s) => s.driver_number === r.driver_number)
                      .sort((a, b) => a.stint_number - b.stint_number);
                    const driverPits = pitsByDriver.get(r.driver_number) ?? [];
                    const minPit = driverPits.reduce<number | null>((min, p) => {
                      if (!p.pit_duration) return min;
                      return min === null ? p.pit_duration : Math.min(min, p.pit_duration);
                    }, null);
                    if (driverStints.length === 0) return null;
                    return (
                      <tr key={r.driver_number} className="border-b border-[#2D2D3A]/50 hover:bg-white/[0.02] last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-1 h-5 rounded-full shrink-0" style={{ backgroundColor: teamColor }} />
                            <span className="font-bold text-white text-sm">{d?.name_acronym ?? `#${r.driver_number}`}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {driverStints.map((s, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <span
                                  className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border"
                                  style={{
                                    color: COMPOUND_COLOR[s.compound ?? ""] ?? "#94A3B8",
                                    borderColor: (COMPOUND_COLOR[s.compound ?? ""] ?? "#94A3B8") + "40",
                                    backgroundColor: (COMPOUND_COLOR[s.compound ?? ""] ?? "#94A3B8") + "10",
                                  }}
                                >
                                  {s.compound?.[0] ?? "?"}
                                  <span className="text-[#64748B] font-normal">{s.lap_start}–{s.lap_end ?? "?"}L</span>
                                </span>
                                {i < driverStints.length - 1 && <span className="text-[#64748B] text-xs">→</span>}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-white font-bold text-sm hidden sm:table-cell">
                          {driverPits.length}회
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[#94A3B8] text-xs hidden md:table-cell">
                          {minPit ? `${minPit.toFixed(1)}s` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 레이스 컨트롤 */}
      {(raceControl as OF1RC[]).length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">레이스 컨트롤 로그</h2>
          <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
            {[...(raceControl as OF1RC[])].reverse().map((msg, i) => {
              const flagColors: Record<string, string> = {
                GREEN: "#22C55E", CLEAR: "#22C55E",
                YELLOW: "#FCD34D", DOUBLE_YELLOW: "#F59E0B",
                RED: "#E8002D", BLUE: "#3B82F6", CHEQUERED: "#FFFFFF",
              };
              const dotColor = msg.flag ? (flagColors[msg.flag] ?? "#64748B") : "#64748B";
              const rowBg = msg.flag === "RED" ? "bg-[#E8002D]/[0.04]"
                : msg.flag === "YELLOW" || msg.flag === "DOUBLE_YELLOW" ? "bg-[#FCD34D]/[0.03]"
                : msg.flag === "CHEQUERED" ? "bg-white/[0.03]"
                : "";
              return (
                <div key={i} className={`flex items-start gap-3 px-4 py-3 border-b border-[#1E1E2A] last:border-0 hover:bg-white/[0.04] transition-colors ${rowBg}`}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-1" style={{ backgroundColor: dotColor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#94A3B8] leading-snug">{msg.message}</p>
                    {msg.lap_number && (
                      <span className="text-xs text-[#64748B] mt-0.5 block">Lap {msg.lap_number}</span>
                    )}
                  </div>
                  <span className="text-xs text-[#64748B] font-mono shrink-0">{fmtTimeKST(msg.date)}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <p className="text-xs text-[#475569] text-center">
        OpenF1 session_key: {sk} · 데이터 출처: openf1.org
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default async function GrandPrixPage({
  params,
  searchParams,
}: {
  params: Promise<{ round: string }>;
  searchParams: Promise<{ session?: string }>;
}) {
  const { round } = await params;
  const { session: activeSession } = await searchParams;
  const roundNum = parseInt(round);
  if (isNaN(roundNum)) notFound();

  const calendar = await fetchCalendar();
  const race = calendar.find((r) => r.round === roundNum);
  if (!race) notFound();

  const circuit = getCircuit(race.circuitId);
  const isCancelled = race.status === "cancelled";
  const isCompleted = !isCancelled && (race.status === "completed" || new Date(race.date).getTime() < Date.now());
  const isUpcoming = race.status === "upcoming" || race.status === "next";

  // 완료된 레이스는 결과 데이터 병렬 로드 (개요 탭에서 사용)
  const [raceResult, qualifyingResult, sprintResult] = !activeSession && isCompleted
    ? await Promise.all([
        fetchRaceResult(roundNum),
        fetchQualifyingResult(roundNum),
        race.sessions?.isSprint ? fetchSprintResult(roundNum) : Promise.resolve(null),
      ])
    : [null, [], null];

  const daysUntil = isUpcoming && race.sessions
    ? Math.ceil((new Date(race.sessions.race).getTime() - Date.now()) / 86_400_000)
    : null;

  const ldEvent = sportsEventSchema({
    round: race.round,
    name: race.name,
    koreanName: race.koreanName,
    date: race.date,
    circuitName: circuit?.name,
    circuitCity: circuit?.city,
    circuitCountry: circuit?.country,
  });
  const ldBreadcrumb = breadcrumbSchema([
    { name: "홈", url: "https://f1.324.ing" },
    { name: "시즌", url: "https://f1.324.ing/season" },
    { name: race.koreanName, url: `https://f1.324.ing/season/race/${race.round}` },
  ]);

  // 활성 세션 날짜 조회
  const sessionDateIso = activeSession && race.sessions
    ? race.sessions[activeSession as keyof typeof race.sessions] as string | undefined
    : undefined;

  // 유효하지 않은 세션 키
  if (activeSession && (!SESSION_CONFIG[activeSession] || !sessionDateIso)) {
    notFound();
  }

  const sessionCfg = activeSession ? SESSION_CONFIG[activeSession] : null;

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(ldEvent) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(ldBreadcrumb) }} />
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── 뒤로가기 ── */}
      <Link
        href="/season"
        className="inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-white transition-colors mb-8"
      >
        ← 시즌 트래커
      </Link>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#141420] to-[#1a1a2e] border border-[#2D2D3A] mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E8002D]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative p-8 sm:p-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-xs uppercase tracking-widest text-[#E8002D] font-bold">
                  Round {race.round} · 2026
                </span>
                {race.sessions?.isSprint && (
                  <span className="text-xs font-bold text-[#FF6700] bg-[#FF6700]/10 border border-[#FF6700]/30 px-2 py-0.5 rounded-full">
                    스프린트 주말
                  </span>
                )}
                {isCancelled && (
                  <span className="text-xs font-bold text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/30 px-2 py-0.5 rounded-full">
                    취소됨
                  </span>
                )}
                {isCompleted && (
                  <span className="text-xs font-bold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/30 px-2 py-0.5 rounded-full">
                    완료
                  </span>
                )}
                {sessionCfg && (
                  <span className="text-xs font-bold text-white bg-white/10 border border-white/20 px-2 py-0.5 rounded-full">
                    {sessionCfg.name}
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                {race.koreanName}
              </h1>
              {circuit && (
                <p className="text-[#64748B] mt-2 text-sm">
                  {circuit.flag} {circuit.koreanName} · {circuit.city}, {circuit.country}
                </p>
              )}
              <p className="text-[#64748B] text-xs mt-1">{race.date}</p>
            </div>

            <div className="shrink-0 text-right">
              {isCompleted && race.winner ? (
                <div className="bg-[#FCD34D]/10 border border-[#FCD34D]/30 rounded-xl px-5 py-4">
                  <span className="block text-xs text-[#64748B] uppercase tracking-wider mb-1">우승</span>
                  <span className="block text-xl font-black text-[#FCD34D]">🏆 {race.winner}</span>
                </div>
              ) : daysUntil !== null && daysUntil >= 0 ? (
                <div>
                  <span className="block text-5xl font-black text-[#E8002D]">D-{daysUntil}</span>
                  <span className="block text-xs text-[#64748B] mt-1">레이스까지</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* 서킷 스펙 요약 */}
          {circuit && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { l: "트랙 길이", v: `${circuit.length} km` },
                { l: "코너", v: `${circuit.turns}개` },
                { l: "레이스 랩", v: `${circuit.laps}랩` },
                { l: "서킷 유형", v: circuit.type === "street" ? "시가지" : "상설" },
              ].map((s) => (
                <div
                  key={s.l}
                  className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-center"
                >
                  <span className="block text-lg font-black text-[#E8002D]">{s.v}</span>
                  <span className="block text-[10px] text-[#64748B] uppercase tracking-wider mt-1">{s.l}</span>
                </div>
              ))}
            </div>
          )}

          {/* 버튼 */}
          <div className="mt-6 flex gap-3 flex-wrap">
            {circuit && (
              <Link
                href={`/circuits/${race.circuitId}`}
                className="px-5 py-2.5 bg-white/10 text-white text-sm font-bold rounded-lg hover:bg-white/20 transition-colors"
              >
                서킷 상세 →
              </Link>
            )}
            <Link
              href={`/season/race/${race.round}/analysis`}
              className="px-5 py-2.5 bg-[#A855F7]/10 border border-[#A855F7]/30 text-[#A855F7] text-sm font-bold rounded-lg hover:bg-[#A855F7]/20 transition-colors"
            >
              텔레메트리 분석 →
            </Link>
            <Link
              href={`/season/race/${race.round}/replay`}
              className="px-5 py-2.5 bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 text-[#0EA5E9] text-sm font-bold rounded-lg hover:bg-[#0EA5E9]/20 transition-colors"
            >
              레이스 리플레이 →
            </Link>
            <Link
              href={`/community?round=${race.round}`}
              className="px-5 py-2.5 bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-sm font-bold rounded-lg hover:bg-[#22C55E]/20 transition-colors"
            >
              커뮤니티 토론 →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 세션 탭 ── */}
      {race.sessions && (
        <SessionTabs sessions={race.sessions} activeSession={activeSession} round={roundNum} />
      )}

      {/* ── 탭 컨텐츠 ── */}
      {activeSession && sessionDateIso ? (
        /* 세션 상세 뷰 */
        <SessionDataView
          sessionDateIso={sessionDateIso}
          session={activeSession}
        />
      ) : (
        /* 개요 탭 */
        <div className="space-y-10">
          {/* 세션 일정 */}
          {race.sessions && (
            <section>
              <h2 className="text-xl font-bold text-white mb-4">세션 일정 (KST)</h2>
              <SessionTimetable sessions={race.sessions} round={roundNum} />
            </section>
          )}

          {/* 결과 섹션 */}
          {isCompleted ? (
            <>
              {qualifyingResult.length > 0 && (
                <QualifyingTable results={qualifyingResult} />
              )}
              {sprintResult && sprintResult.length > 0 && (
                <RaceResultsTable results={sprintResult} title="스프린트 결과" />
              )}
              {raceResult && raceResult.results.length > 0 && (
                <RaceResultsTable results={raceResult.results} />
              )}
              {!raceResult && qualifyingResult.length === 0 && (
                <div className="text-center py-12 text-[#64748B]">
                  <p className="text-4xl mb-3">📊</p>
                  <p>결과 데이터를 불러오는 중입니다...</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-[#141420] border border-[#2D2D3A] rounded-2xl">
              <p className="text-5xl mb-4">🏁</p>
              <p className="text-white font-bold text-lg mb-2">아직 진행 전입니다</p>
              <p className="text-[#64748B] text-sm">
                레이스 종료 후 결과가 여기에 표시됩니다.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
