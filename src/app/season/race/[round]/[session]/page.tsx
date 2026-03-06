import Link from "next/link";
import { notFound } from "next/navigation";
import { calendar as mockCalendar } from "@/data/f1-data";
import { fetchCalendar } from "@/lib/data/live";

export const revalidate = 300;

// ─── Session config ────────────────────────────────────────────

const SESSION_CONFIG: Record<string, { name: string; of1Names: string[] }> = {
  fp1:        { name: "FP1 프리 프랙티스",    of1Names: ["Practice 1"] },
  fp2:        { name: "FP2 프리 프랙티스",    of1Names: ["Practice 2"] },
  fp3:        { name: "FP3 프리 프랙티스",    of1Names: ["Practice 3"] },
  sq:         { name: "스프린트 퀄리파잉",     of1Names: ["Sprint Qualifying", "Sprint Shootout"] },
  sprint:     { name: "스프린트 레이스",       of1Names: ["Sprint"] },
  qualifying: { name: "퀄리파잉",             of1Names: ["Qualifying"] },
  race:       { name: "결승 레이스",           of1Names: ["Race"] },
};

// ─── OpenF1 types ─────────────────────────────────────────────

interface OF1Session  { session_key: number; meeting_key: number; session_name: string; date_start: string; date_end: string; }
interface OF1Driver   { driver_number: number; full_name: string; name_acronym: string; team_colour: string | null; team_name: string; }
interface OF1Result   { driver_number: number; position: number; gap_to_leader: number | null; duration: number | null; number_of_laps: number; dnf: boolean; dns: boolean; dsq: boolean; }
interface OF1Lap      { driver_number: number; lap_number: number; lap_duration: number | null; duration_sector_1: number | null; duration_sector_2: number | null; duration_sector_3: number | null; is_pit_out_lap: boolean; }
interface OF1Stint    { driver_number: number; compound: string; stint_number: number; tyre_age_at_start: number; lap_start: number; lap_end: number | null; }
interface OF1Pit      { driver_number: number; lap_number: number; pit_duration: number | null; }
interface OF1RC       { date: string; flag: string | null; message: string; category: string; lap_number: number | null; }
interface OF1Weather  { air_temperature: number; track_temperature: number; humidity: number; rainfall: number; wind_speed: number; }
interface OF1Grid     { driver_number: number; position: number; lap_duration: number | null; }

// ─── Helpers ──────────────────────────────────────────────────

const OF1 = "https://api.openf1.org/v1";

async function of1get<T>(path: string, params: Record<string, string | number> = {}): Promise<T[]> {
  const url = new URL(`${OF1}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  try {
    const r = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!r.ok) return [];
    const data = await r.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

async function findSessionKey(
  sessionType: string,
  sessionDateIso: string,
): Promise<{ sessionKey: number; meetingKey: number } | null> {
  const year = new Date(sessionDateIso).getFullYear();
  const sessions = await of1get<OF1Session>("/sessions", { year });
  const targetDate = sessionDateIso.slice(0, 10);
  const names = SESSION_CONFIG[sessionType]?.of1Names ?? [];
  const match = sessions.find(
    (s) => s.date_start.startsWith(targetDate) && names.includes(s.session_name),
  );
  return match ? { sessionKey: match.session_key, meetingKey: match.meeting_key } : null;
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

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit",
  });
}

const COMPOUND_COLOR: Record<string, string> = {
  SOFT: "#E8002D", MEDIUM: "#FCD34D", HARD: "#E5E7EB",
  INTERMEDIATE: "#22C55E", WET: "#3B82F6",
};

// ─── generateStaticParams ─────────────────────────────────────

export async function generateStaticParams() {
  const sessions = Object.keys(SESSION_CONFIG);
  return mockCalendar.flatMap((r) =>
    sessions.map((session) => ({ round: String(r.round), session })),
  );
}

export async function generateMetadata({
  params,
}: { params: Promise<{ round: string; session: string }> }) {
  const { round, session } = await params;
  const calendar = await fetchCalendar();
  const race = calendar.find((r) => r.round === parseInt(round));
  const cfg = SESSION_CONFIG[session];
  if (!race || !cfg) return { title: "세션 결과 | PitLane" };
  return { title: `${race.koreanName} ${cfg.name} | PitLane` };
}

// ─── Page ─────────────────────────────────────────────────────

export default async function SessionPage({
  params,
}: { params: Promise<{ round: string; session: string }> }) {
  const { round, session } = await params;
  const roundNum = parseInt(round);
  if (isNaN(roundNum)) notFound();

  const cfg = SESSION_CONFIG[session];
  if (!cfg) notFound();

  const calendar = await fetchCalendar();
  const race = calendar.find((r) => r.round === roundNum);
  if (!race) notFound();

  const sessions = race.sessions;
  const sessionDateIso = sessions?.[session as keyof typeof sessions] as string | undefined;

  // 세션 일정 없음 (스프린트 주말인데 fp2 등)
  if (!sessionDateIso) notFound();

  // 세션이 아직 진행 전이면 404
  const sessionStart = new Date(sessionDateIso).getTime();
  const now = Date.now();
  if (now < sessionStart) notFound();

  // OpenF1 session_key 조회
  const sessionInfo = await findSessionKey(session, sessionDateIso);

  // session_key 없으면 빈 데이터로 렌더링
  const sk = sessionInfo?.sessionKey;
  const isRaceType = session === "race" || session === "sprint";
  const isQualType = session === "qualifying" || session === "sq";
  const isFpType   = session === "fp1" || session === "fp2" || session === "fp3";

  const [results, drivers, laps, stints, pits, raceControl, weatherArr, grid] = sk
    ? await Promise.all([
        of1get<OF1Result>  ("/session_result", { session_key: sk }),
        of1get<OF1Driver>  ("/drivers",        { session_key: sk }),
        of1get<OF1Lap>     ("/laps",           { session_key: sk }),
        of1get<OF1Stint>   ("/stints",         { session_key: sk }),
        of1get<OF1Pit>     ("/pit",            { session_key: sk }),
        of1get<OF1RC>      ("/race_control",   { session_key: sk }),
        of1get<OF1Weather> ("/weather",        { session_key: sk }),
        of1get<OF1Grid>    ("/starting_grid",  { session_key: sk }),
      ])
    : [[], [], [], [], [], [], [], []];

  // Driver map
  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));

  // Fastest lap per driver
  const fastestLapMap = new Map<number, OF1Lap>();
  for (const lap of laps) {
    if (!lap.lap_duration || lap.is_pit_out_lap) continue;
    const prev = fastestLapMap.get(lap.driver_number);
    if (!prev?.lap_duration || lap.lap_duration < prev.lap_duration) {
      fastestLapMap.set(lap.driver_number, lap);
    }
  }

  // Overall fastest lap
  let overallFastest: { driverNumber: number; lap: OF1Lap } | null = null;
  for (const [dn, lap] of fastestLapMap) {
    if (!overallFastest || (lap.lap_duration && lap.lap_duration < (overallFastest.lap.lap_duration ?? Infinity))) {
      overallFastest = { driverNumber: dn, lap };
    }
  }

  // Pit map: driver → all pits
  const pitsByDriver = new Map<number, OF1Pit[]>();
  for (const p of pits) {
    const arr = pitsByDriver.get(p.driver_number) ?? [];
    arr.push(p);
    pitsByDriver.set(p.driver_number, arr);
  }

  // Current stint per driver
  const currentStint = new Map<number, OF1Stint>();
  for (const s of stints) {
    const prev = currentStint.get(s.driver_number);
    if (!prev || s.stint_number > prev.stint_number) currentStint.set(s.driver_number, s);
  }

  // Grid map
  const gridMap = new Map(grid.map((g) => [g.driver_number, g]));

  // Weather: last entry for display
  const wxLast = weatherArr[weatherArr.length - 1] ?? null;

  // Sorted results
  const sortedResults = [...results].sort((a, b) => a.position - b.position);

  const hasData = results.length > 0;

  // Positive func: color for pos
  const posColor = (pos: number) =>
    pos === 1 ? "text-[#FCD34D] bg-[#FCD34D]/10"
    : pos === 2 ? "text-[#C0C0C0] bg-[#C0C0C0]/10"
    : pos === 3 ? "text-[#CD7F32] bg-[#CD7F32]/10"
    : "text-[#64748B] bg-white/[0.03]";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── 뒤로가기 ── */}
      <Link
        href={`/season/race/${round}`}
        className="inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-white transition-colors mb-8"
      >
        ← {race.koreanName}
      </Link>

      {/* ── Header ── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#141420] to-[#1a1a2e] border border-[#2D2D3A] mb-10">
        <div className="relative p-8 sm:p-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#E8002D] font-bold">
                Round {race.round} · {cfg.name}
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-white mt-2 leading-tight">
                {race.koreanName}
              </h1>
              <p className="text-[#64748B] mt-1 text-sm">
                {new Date(sessionDateIso).toLocaleDateString("ko-KR", {
                  timeZone: "Asia/Seoul", month: "long", day: "numeric", weekday: "short",
                })}
                {" · "}
                {fmtTime(sessionDateIso)} KST
              </p>
            </div>

            {/* Weather summary */}
            {wxLast && (
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-4 shrink-0 text-sm">
                <p className="text-[10px] text-[#64748B] uppercase tracking-widest mb-2">날씨</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  <span className="text-[#64748B]">기온 <span className="text-white font-bold">{wxLast.air_temperature.toFixed(0)}°C</span></span>
                  <span className="text-[#64748B]">트랙 <span className="text-white font-bold">{wxLast.track_temperature.toFixed(0)}°C</span></span>
                  <span className="text-[#64748B]">습도 <span className="text-white font-bold">{wxLast.humidity}%</span></span>
                  <span className="text-[#64748B]">
                    {wxLast.rainfall > 0
                      ? <span className="text-[#3B82F6] font-bold">🌧 강우</span>
                      : <span className="text-white font-bold">맑음</span>
                    }
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Fastest lap highlight */}
          {overallFastest && (
            <div className="mt-6 inline-flex items-center gap-3 bg-[#A855F7]/10 border border-[#A855F7]/30 rounded-xl px-4 py-3">
              <span className="text-[10px] font-black text-[#A855F7] uppercase tracking-widest">패스티스트 랩</span>
              <span className="text-white font-black font-mono">{fmtLap(overallFastest.lap.lap_duration)}</span>
              <span className="text-[#64748B] text-sm">
                {driverMap.get(overallFastest.driverNumber)?.name_acronym ?? `#${overallFastest.driverNumber}`}
              </span>
            </div>
          )}
        </div>
      </section>

      {!hasData && !sk && (
        <div className="text-center py-16 bg-[#141420] border border-[#2D2D3A] rounded-2xl">
          <p className="text-5xl mb-4">📡</p>
          <p className="text-white font-bold text-lg mb-2">데이터 수집 중</p>
          <p className="text-[#64748B] text-sm">OpenF1 API에서 세션 데이터를 가져올 수 없습니다.</p>
        </div>
      )}

      {sk && !hasData && (
        <div className="text-center py-16 bg-[#141420] border border-[#2D2D3A] rounded-2xl">
          <p className="text-5xl mb-4">⏳</p>
          <p className="text-white font-bold text-lg mb-2">결과 집계 중</p>
          <p className="text-[#64748B] text-sm">세션이 방금 종료되었거나 데이터 처리 중입니다. 잠시 후 새로고침해 주세요.</p>
        </div>
      )}

      {hasData && (
        <div className="space-y-10">

          {/* ── 결과 순위 ── */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4">
              {isFpType ? "최종 순위 (베스트 랩 기준)" : isQualType ? "그리드 순위" : "레이스 결과"}
            </h2>
            <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2D2D3A]">
                      <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase w-10">#</th>
                      <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase">드라이버</th>
                      <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase hidden sm:table-cell">팀</th>
                      {(isRaceType || isQualType) && (
                        <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase hidden md:table-cell">그리드</th>
                      )}
                      <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase font-mono">
                        {isFpType ? "베스트 랩" : isQualType ? "베스트 랩" : "갭"}
                      </th>
                      {isRaceType && (
                        <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase hidden md:table-cell">랩수</th>
                      )}
                      {isFpType && (
                        <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase hidden lg:table-cell font-mono">S1</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedResults.map((r) => {
                      const d = driverMap.get(r.driver_number);
                      const teamColor = d?.team_colour
                        ? (d.team_colour.startsWith("#") ? d.team_colour : `#${d.team_colour}`)
                        : "#64748B";
                      const fastLap = fastestLapMap.get(r.driver_number);
                      const gridPos = gridMap.get(r.driver_number);
                      const isDNF = r.dnf || r.dsq || r.dns;
                      const isFastest = overallFastest?.driverNumber === r.driver_number;

                      return (
                        <tr
                          key={r.driver_number}
                          className="border-b border-[#2D2D3A]/50 hover:bg-white/[0.02] transition-colors last:border-0"
                        >
                          <td className="px-4 py-3">
                            <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-black ${posColor(r.position)}`}>
                              {isDNF ? (r.dsq ? "DSQ" : r.dns ? "DNS" : "DNF") : r.position}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="w-1 h-6 rounded-full shrink-0" style={{ backgroundColor: teamColor }} />
                              <span className="font-bold text-white">{d?.name_acronym ?? `#${r.driver_number}`}</span>
                              <span className="text-xs text-[#64748B] hidden sm:inline">{d?.full_name}</span>
                              {isFastest && (
                                <span className="text-[10px] font-black text-[#A855F7] bg-[#A855F7]/15 border border-[#A855F7]/30 px-1 py-0.5 rounded">FL</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[#64748B] text-xs hidden sm:table-cell">
                            {d?.team_name ?? "—"}
                          </td>
                          {(isRaceType || isQualType) && (
                            <td className="px-4 py-3 text-right text-[#64748B] font-mono text-xs hidden md:table-cell">
                              {gridPos?.position ?? "—"}
                            </td>
                          )}
                          <td className="px-4 py-3 text-right font-mono text-xs">
                            {isFpType || isQualType
                              ? <span className="text-white">{fmtLap(fastLap?.lap_duration ?? null)}</span>
                              : <span className="text-[#94A3B8]">{isDNF ? <span className="text-[#EF4444]">—</span> : fmtGap(r.gap_to_leader)}</span>
                            }
                          </td>
                          {isRaceType && (
                            <td className="px-4 py-3 text-right text-[#64748B] text-xs hidden md:table-cell">
                              {r.number_of_laps}
                            </td>
                          )}
                          {isFpType && (
                            <td className="px-4 py-3 text-right font-mono text-[10px] text-[#64748B] hidden lg:table-cell">
                              {fastLap?.duration_sector_1?.toFixed(3) ?? "—"}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ── 타이어 전략 (레이스/스프린트) ── */}
          {isRaceType && stints.length > 0 && (
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
                        const driverStints = stints
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
                                        color: COMPOUND_COLOR[s.compound] ?? "#94A3B8",
                                        borderColor: (COMPOUND_COLOR[s.compound] ?? "#94A3B8") + "40",
                                        backgroundColor: (COMPOUND_COLOR[s.compound] ?? "#94A3B8") + "10",
                                      }}
                                    >
                                      {s.compound[0]}
                                      <span className="text-[#64748B] font-normal">
                                        {s.lap_start}–{s.lap_end ?? "?"}L
                                      </span>
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

          {/* ── 레이스 컨트롤 ── */}
          {raceControl.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white mb-4">레이스 컨트롤 로그</h2>
              <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
                {[...raceControl].reverse().map((msg, i) => {
                  const flagColors: Record<string, string> = {
                    GREEN: "#22C55E", CLEAR: "#22C55E",
                    YELLOW: "#FCD34D", DOUBLE_YELLOW: "#F59E0B",
                    RED: "#E8002D", BLUE: "#3B82F6", CHEQUERED: "#FFFFFF",
                  };
                  const dotColor = msg.flag ? (flagColors[msg.flag] ?? "#64748B") : "#64748B";
                  return (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-[#2D2D3A]/40 last:border-0 hover:bg-white/[0.02]">
                      <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: dotColor }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#94a3b8] leading-snug">{msg.message}</p>
                        {msg.lap_number && (
                          <span className="text-[10px] text-[#64748B]">Lap {msg.lap_number}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#64748B] font-mono shrink-0">
                        {fmtTime(msg.date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── 세션 키 footnote ── */}
          <p className="text-[10px] text-[#2D2D3A] text-center">
            OpenF1 session_key: {sk} · 데이터 출처: openf1.org
          </p>
        </div>
      )}
    </div>
  );
}
