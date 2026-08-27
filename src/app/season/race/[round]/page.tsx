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
import { getCircuit, getDriver, getTeam, type SessionSchedule } from "@/data/f1-data";
import { calendar as mockCalendar } from "@/data/f1-data";
import { getRoundReviews, type ReviewKey, type Post } from "@/lib/community/posts";
import { SessionTabs } from "@/components/season/SessionTabs";
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
  round,
}: {
  sessions: SessionSchedule;
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
          <Link key={key} href={`/season/race/${round}/${key}`}>{inner}</Link>
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

// ─── Page ─────────────────────────────────────────────────────

// ─── 리뷰 링크 ─────────────────────────────────────────────────

const REVIEW_LABEL: Record<ReviewKey, string> = {
  fp1: "FP1 리뷰",
  fp2: "FP2 리뷰",
  fp3: "FP3 리뷰",
  sq: "스프린트 퀄리파잉 리뷰",
  sprint: "스프린트 리뷰",
  qualifying: "퀄리파잉 리뷰",
  race: "레이스 리뷰",
  round: "라운드 종합 리뷰",
};

const REVIEW_ORDER: ReviewKey[] = ["fp1", "fp2", "fp3", "sq", "sprint", "qualifying", "race", "round"];

function reviewHref(post: Post): string {
  return `/community/${post.seo?.slug ?? post.id}`;
}

function ReviewLinksSection({ reviews }: { reviews: Partial<Record<ReviewKey, Post>> }) {
  const keys = REVIEW_ORDER.filter((k) => reviews[k]);
  if (keys.length === 0) return null;
  return (
    <section>
      <h2 className="text-xl font-bold text-white mb-4">세션 리뷰</h2>
      <div className="flex gap-3 flex-wrap">
        {keys.map((k) => (
          <Link
            key={k}
            href={reviewHref(reviews[k]!)}
            className={
              k === "round"
                ? "px-5 py-2.5 bg-[#E8002D]/10 border border-[#E8002D]/40 text-[#E8002D] text-sm font-bold rounded-lg hover:bg-[#E8002D]/20 transition-colors"
                : "px-5 py-2.5 bg-white/[0.06] border border-white/10 text-white text-sm font-bold rounded-lg hover:bg-white/[0.12] transition-colors"
            }
          >
            📝 {REVIEW_LABEL[k]} →
          </Link>
        ))}
      </div>
    </section>
  );
}

// searchParams 를 읽지 말 것. 서버 컴포넌트에서 읽는 순간 이 라우트가 전면 동적이
// 되어 revalidate 와 generateStaticParams 가 무시된다(프리렌더 0건이 됐던 원인).
// 세션별 화면은 /season/race/[round]/[session] 경로 라우트가 담당한다.
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
  const isCancelled = race.status === "cancelled";
  const isCompleted = !isCancelled && (race.status === "completed" || new Date(race.date).getTime() < Date.now());
  const isUpcoming = race.status === "upcoming" || race.status === "next";

  // 완료된 레이스는 결과 데이터 병렬 로드 (개요 탭에서 사용)
  const [raceResult, qualifyingResult, sprintResult] = isCompleted
    ? await Promise.all([
        fetchRaceResult(roundNum),
        fetchQualifyingResult(roundNum),
        race.sessions?.isSprint ? fetchSprintResult(roundNum) : Promise.resolve(null),
      ])
    : [null, [], null];

  const daysUntil = isUpcoming && race.sessions
    ? Math.ceil((new Date(race.sessions.race).getTime() - Date.now()) / 86_400_000)
    : null;

  // 공식 리뷰 글 (Firestore 미설정/장애 시 조용히 빈 목록)
  const reviews = await getRoundReviews(roundNum).catch(
    () => ({} as Partial<Record<ReviewKey, Post>>)
  );

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
        <SessionTabs sessions={race.sessions} round={roundNum} />
      )}

      {/* ── 개요 ── */}
      <div className="space-y-10">
          {/* 세션 일정 */}
          {race.sessions && (
            <section>
              <h2 className="text-xl font-bold text-white mb-4">세션 일정 (KST)</h2>
              <SessionTimetable sessions={race.sessions} round={roundNum} />
            </section>
          )}

          {/* 세션·라운드 리뷰 */}
          <ReviewLinksSection reviews={reviews} />

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
    </div>
    </>
  );
}
