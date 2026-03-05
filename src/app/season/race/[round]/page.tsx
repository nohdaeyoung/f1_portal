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
  if (!race) return { title: "GP 정보 | PitLane" };
  return { title: `${race.koreanName} | PitLane` };
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
}: {
  sessions: NonNullable<Awaited<ReturnType<typeof fetchCalendar>>[0]["sessions"]>;
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
        return (
          <div
            key={key}
            className={`flex items-center justify-between px-5 py-4 ${
              i < rows.length - 1 ? "border-b border-[#2D2D3A]" : ""
            } ${past ? "opacity-40" : ""}`}
          >
            <div className="flex items-center gap-3">
              {isRace && (
                <span className="w-2 h-2 rounded-full bg-[#E8002D] shrink-0" />
              )}
              {isSprint && (
                <span className="w-2 h-2 rounded-full bg-[#FF6700] shrink-0" />
              )}
              <span
                className={`text-sm font-bold ${
                  isRace
                    ? "text-white"
                    : isSprint
                    ? "text-[#FF6700]"
                    : "text-[#94A3B8]"
                }`}
              >
                {ko}
              </span>
              {past && (
                <span className="text-[10px] text-[#64748B] font-medium bg-white/5 px-1.5 py-0.5 rounded">
                  완료
                </span>
              )}
            </div>
            <div className="text-right">
              <span
                className={`text-sm font-mono font-bold ${
                  isRace ? "text-[#E8002D]" : "text-white"
                }`}
              >
                {time} KST
              </span>
              <span className="block text-xs text-[#64748B] mt-0.5">{date}</span>
            </div>
          </div>
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
              <tr className="border-b border-[#2D2D3A]">
                <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase w-10">#</th>
                <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase">드라이버</th>
                <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase hidden sm:table-cell">팀</th>
                <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase w-10 hidden md:table-cell">그리드</th>
                <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase hidden lg:table-cell">기록 / 상태</th>
                <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase w-12">PTS</th>
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

// ─── Page ─────────────────────────────────────────────────────

export default async function GrandPrixPage({
  params,
}: {
  params: Promise<{ round: string }>;
}) {
  const { round } = await params;
  const roundNum = parseInt(round);
  if (isNaN(roundNum)) notFound();

  const calendar = await fetchCalendar();
  const race = calendar.find((r) => r.round === roundNum);
  if (!race) notFound();

  const circuit = getCircuit(race.circuitId);
  const isCompleted = race.status === "completed";
  const isUpcoming = race.status === "upcoming" || race.status === "next";

  // 완료된 레이스는 결과 데이터 병렬 로드
  const [raceResult, qualifyingResult, sprintResult] = isCompleted
    ? await Promise.all([
        fetchRaceResult(roundNum),
        fetchQualifyingResult(roundNum),
        race.sessions?.isSprint ? fetchSprintResult(roundNum) : Promise.resolve(null),
      ])
    : [null, [], null];

  // D-day 계산
  const daysUntil = isUpcoming && race.sessions
    ? Math.ceil((new Date(race.sessions.race).getTime() - Date.now()) / 86_400_000)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── 뒤로가기 ── */}
      <Link
        href="/season"
        className="inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-white transition-colors mb-8"
      >
        ← 시즌 트래커
      </Link>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#141420] to-[#1a1a2e] border border-[#2D2D3A] mb-10">
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
                {isCompleted && (
                  <span className="text-xs font-bold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/30 px-2 py-0.5 rounded-full">
                    완료
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
          </div>
        </div>
      </section>

      {/* ── 세션 일정 ── */}
      {race.sessions && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">세션 일정 (KST)</h2>
          <SessionTimetable sessions={race.sessions} />
        </section>
      )}

      {/* ── 결과 섹션 ── */}
      {isCompleted ? (
        <div className="space-y-10">
          {/* 퀄리파잉 */}
          {qualifyingResult.length > 0 && (
            <QualifyingTable results={qualifyingResult} />
          )}

          {/* 스프린트 결과 */}
          {sprintResult && sprintResult.length > 0 && (
            <RaceResultsTable results={sprintResult} title="스프린트 결과" />
          )}

          {/* 레이스 결과 */}
          {raceResult && raceResult.results.length > 0 && (
            <RaceResultsTable results={raceResult.results} />
          )}

          {/* 결과 없음 */}
          {!raceResult && qualifyingResult.length === 0 && (
            <div className="text-center py-12 text-[#64748B]">
              <p className="text-4xl mb-3">📊</p>
              <p>결과 데이터를 불러오는 중입니다...</p>
            </div>
          )}
        </div>
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
  );
}
