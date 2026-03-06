import Link from "next/link";
import {
  getDriver,
  getCircuit,
  getTeam,
  type Standing,
  type ConstructorStanding,
  type RaceCalendar,
  type SessionSchedule,
} from "@/data/f1-data";
import {
  fetchDriverStandings,
  fetchConstructorStandings,
  fetchCalendar,
} from "@/lib/data/live";
import { getAiDigest, type AiDigest } from "@/lib/api/ai-digest";
import { getF1News, type NewsArticle } from "@/lib/api/news";
import CountdownTimer from "@/components/live/CountdownTimer";
import LiveSessionDashboard from "@/components/live/LiveSessionDashboard";

// AI 다이제스트는 unstable_cache가 캐싱 담당, 페이지 자체는 동적 렌더링
export const dynamic = "force-dynamic";

// ─── Constants ────────────────────────────────────────────────

const SOURCE_COLORS: Record<string, string> = {
  "Autosport": "#E8002D",
  "Motorsport.com": "#FF6700",
  "The Race": "#00B4D8",
  "BBC Sport": "#FF6B35",
  "RaceFans": "#7C3AED",
  "Sky Sports F1": "#0EA5E9",
};

// ─── Utils ────────────────────────────────────────────────────

function formatKST(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
    hour12: false,
  });
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

function getSessionList(s: SessionSchedule): { key: string; name: string; time: string }[] {
  const list: { key: string; name: string; time: string }[] = [];
  if (s.fp1) list.push({ key: "fp1", name: "FP 1", time: s.fp1 });
  if (s.isSprint) {
    if (s.sq) list.push({ key: "sq", name: "스프린트 퀄리", time: s.sq });
    if (s.sprint) list.push({ key: "sprint", name: "스프린트", time: s.sprint });
  } else {
    if (s.fp2) list.push({ key: "fp2", name: "FP 2", time: s.fp2 });
    if (s.fp3) list.push({ key: "fp3", name: "FP 3", time: s.fp3 });
  }
  list.push({ key: "qualifying", name: "퀄리파잉", time: s.qualifying });
  list.push({ key: "race", name: "레이스", time: s.race });
  return list;
}

const SESSION_DURATIONS: Record<string, number> = {
  fp1: 100, fp2: 100, fp3: 100, sq: 95, sprint: 75, qualifying: 100, race: 180,
};

interface RaceWeekendInfo {
  isWeekend: boolean;
  nextSession: { key: string; name: string; time: string } | null;
  liveSession: { key: string; name: string; time: string } | null;
  currentRace: RaceCalendar | null;
}

function getRaceWeekendInfo(nextRace: RaceCalendar | undefined): RaceWeekendInfo {
  const empty: RaceWeekendInfo = { isWeekend: false, nextSession: null, liveSession: null, currentRace: null };
  if (!nextRace?.sessions) return empty;

  const now = Date.now();
  const s = nextRace.sessions;
  const sessions = getSessionList(s);
  const firstTime = new Date(sessions[0].time).getTime();
  const raceEndTime = new Date(s.race).getTime() + 6 * 3_600_000;

  if (now < firstTime || now > raceEndTime) return empty;

  const liveSession = sessions.find((sess) => {
    const start = new Date(sess.time).getTime();
    const dur = SESSION_DURATIONS[sess.key] ?? 120;
    return now >= start && now <= start + dur * 60_000;
  }) ?? null;

  const nextSession = sessions.find((sess) => new Date(sess.time).getTime() > now) ?? null;
  return { isWeekend: true, nextSession, liveSession, currentRace: nextRace };
}

// ─── Session Timetable (shared) ────────────────────────────────

function SessionTimetable({
  sessions,
  highlightKey,
  liveKey,
}: {
  sessions: { key: string; name: string; time: string }[];
  highlightKey?: string | null;
  liveKey?: string | null;
}) {
  const now = Date.now();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      {sessions.map((sess) => {
        const isPast = new Date(sess.time).getTime() < now;
        const isLive = sess.key === liveKey;
        const isHighlight = sess.key === highlightKey && !isLive;
        const isRace = sess.key === "race";
        return (
          <div
            key={sess.key}
            className={`rounded-xl px-3 py-3 border text-center ${
              isLive
                ? "bg-[#E8002D]/25 border-[#E8002D] ring-1 ring-[#E8002D]/50"
                : isHighlight
                ? "bg-[#E8002D]/20 border-[#E8002D]/50 ring-1 ring-[#E8002D]/30"
                : isRace && !isPast
                ? "bg-[#E8002D]/10 border-[#E8002D]/30"
                : isPast
                ? "bg-white/[0.02] border-white/[0.04] opacity-40"
                : "bg-white/[0.04] border-white/[0.08]"
            }`}
          >
            <span
              className={`block text-xs font-bold mb-1 ${
                isLive ? "text-[#E8002D]" : isHighlight ? "text-[#E8002D]" : "text-[#64748B]"
              }`}
            >
              {sess.name}
              {isLive && <span className="ml-1 animate-pulse">●</span>}
              {isHighlight && " ▶"}
            </span>
            <span className="block text-xs text-white font-mono leading-tight">
              {formatKST(sess.time)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Normal Hero ───────────────────────────────────────────────

function NextRaceHero({ race }: { race: RaceCalendar }) {
  const circuit = getCircuit(race.circuitId);
  const sessions = race.sessions ? getSessionList(race.sessions) : [];
  const now = Date.now();
  const msUntilRace = race.sessions ? new Date(race.sessions.race).getTime() - now : null;
  const daysUntil = msUntilRace != null ? Math.ceil(msUntilRace / 86_400_000) : null;
  // 다음 미래 세션 (FP1 포함)
  const nextSession = sessions.find((s) => new Date(s.time).getTime() > now);
  const msUntilNext = nextSession ? new Date(nextSession.time).getTime() - now : msUntilRace;
  const showCountdown = msUntilNext != null && msUntilNext < 86_400_000;

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#141420] to-[#1a1a2e] border border-[#2D2D3A]">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#E8002D]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="relative p-8 sm:p-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#E8002D] font-bold">
              Next Race · Round {race.round}
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-2 leading-tight">
              {race.koreanName}
            </h2>
            <p className="text-[#64748B] mt-1">
              {circuit?.koreanName} · {race.date}
            </p>
          </div>
          {showCountdown && nextSession ? (
            <CountdownTimer targetIso={nextSession.time} label={`${nextSession.name}까지`} />
          ) : showCountdown && msUntilRace != null ? (
            <CountdownTimer targetIso={race.sessions!.race} label="레이스까지" />
          ) : daysUntil !== null && daysUntil >= 0 ? (
            <div className="text-right shrink-0">
              <span className="text-5xl sm:text-6xl font-black text-[#E8002D]">D-{daysUntil}</span>
              <span className="block text-xs text-[#64748B] mt-1">레이스까지</span>
            </div>
          ) : null}
        </div>

        {/* Session timetable */}
        {sessions.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-[#64748B] uppercase tracking-widest mb-3">
              세션 일정 (KST)
            </p>
            <SessionTimetable sessions={sessions} />
          </div>
        )}

        {/* Circuit highlight */}
        {circuit?.highlights && circuit.highlights.length > 0 && (
          <div className="mb-6 px-4 py-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            <p className="text-xs text-[#64748B] mb-1">서킷 포인트</p>
            <p className="text-sm text-[#94A3B8]">{circuit.highlights[0]}</p>
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          <Link
            href={`/circuits/${race.circuitId}`}
            className="px-5 py-2.5 bg-[#E8002D] text-white text-sm font-bold rounded-lg hover:bg-[#cc0028] transition-colors"
          >
            서킷 정보
          </Link>
          <Link
            href="/season"
            className="px-5 py-2.5 bg-white/10 text-white text-sm font-bold rounded-lg hover:bg-white/20 transition-colors"
          >
            전체 일정
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Race Weekend Hero ──────────────────────────────────────────

function RaceWeekendHero({ info }: { info: RaceWeekendInfo }) {
  const { currentRace, nextSession, liveSession } = info;
  if (!currentRace) return null;
  const circuit = getCircuit(currentRace.circuitId);
  const sessions = currentRace.sessions ? getSessionList(currentRace.sessions) : [];

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2a0008] to-[#1a0005] border border-[#E8002D]/40">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=40 height=40 viewBox=0 0 40 40 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=%23E8002D fill-opacity=0.03%3E%3Cpath d=M0 20 L20 0 L40 20 L20 40 z/%3E%3C/g%3E%3C/svg%3E')]" />
      {/* Live session banner */}
      {liveSession && (
        <div className="relative flex items-center gap-3 bg-[#E8002D] px-8 sm:px-10 py-2.5">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span className="text-white text-sm font-black uppercase tracking-widest">
            LIVE — {liveSession.name} 진행 중
          </span>
        </div>
      )}
      <div className="relative p-8 sm:p-10">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              {liveSession ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E8002D] text-white text-xs font-black uppercase tracking-widest rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  LIVE NOW
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E8002D] text-white text-xs font-black uppercase tracking-widest rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  RACE WEEK
                </span>
              )}
              <span className="text-xs text-[#E8002D]/70 font-bold">Round {currentRace.round}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              {currentRace.koreanName}
            </h2>
            <p className="text-[#94A3B8] mt-1">
              {circuit?.koreanName} · {currentRace.date}
            </p>
          </div>

          {liveSession ? (
            <div className="bg-[#E8002D]/20 rounded-2xl px-5 py-4 text-right border border-[#E8002D]/40 shrink-0">
              <span className="block text-xs text-[#E8002D]/70 uppercase tracking-widest mb-1">
                현재 세션
              </span>
              <span className="block text-xl font-black text-white">{liveSession.name}</span>
              <span className="block text-sm text-[#E8002D] font-mono mt-0.5">
                {formatKST(liveSession.time)} ~
              </span>
            </div>
          ) : nextSession ? (
            <div className="bg-black/40 rounded-2xl px-5 py-4 text-right border border-white/10 shrink-0">
              <span className="block text-xs text-[#64748B] uppercase tracking-widest mb-1">
                다음 세션
              </span>
              <span className="block text-xl font-black text-white">{nextSession.name}</span>
              <span className="block text-sm text-[#E8002D] font-mono mt-0.5">
                {formatKST(nextSession.time)}
              </span>
            </div>
          ) : null}
        </div>

        {/* Session timetable */}
        {sessions.length > 0 && (
          <div className="mb-6">
            <SessionTimetable sessions={sessions} liveKey={liveSession?.key} highlightKey={nextSession?.key} />
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          <Link
            href={`/circuits/${currentRace.circuitId}`}
            className="px-5 py-2.5 bg-[#E8002D] text-white text-sm font-bold rounded-lg hover:bg-[#cc0028] transition-colors"
          >
            서킷 정보
          </Link>
          <Link
            href="/season"
            className="px-5 py-2.5 bg-white/10 text-white text-sm font-bold rounded-lg hover:bg-white/20 transition-colors"
          >
            전체 일정
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Championships ─────────────────────────────────────────────

function ChampionshipsSection({
  drivers,
  constructors,
}: {
  drivers: Standing[];
  constructors: ConstructorStanding[];
}) {
  const driverMax = Math.max(drivers[0]?.points ?? 0, 1);
  const constructorMax = Math.max(constructors[0]?.points ?? 0, 1);

  const medalClass = (pos: number) =>
    pos === 1
      ? "bg-[#FCD34D]/20 text-[#FCD34D]"
      : pos === 2
      ? "bg-[#C0C0C0]/20 text-[#C0C0C0]"
      : pos === 3
      ? "bg-[#CD7F32]/20 text-[#CD7F32]"
      : "bg-white/5 text-[#64748B]";

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">챔피언십 현황</h2>
        <Link href="/season" className="text-sm text-[#E8002D] hover:underline">
          전체 보기
        </Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Driver */}
        <div>
          <p className="text-xs text-[#64748B] uppercase tracking-widest mb-3">드라이버</p>
          <div className="space-y-2">
            {drivers.slice(0, 5).map((s) => {
              const d = getDriver(s.driverId);
              if (!d) return null;
              return (
                <Link
                  key={s.driverId}
                  href={`/drivers/${s.driverId}`}
                  className="flex items-center gap-3 bg-[#141420] border border-[#2D2D3A] rounded-xl px-4 py-3 hover:-translate-y-0.5 transition-all group"
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${medalClass(s.position)}`}
                  >
                    {s.position}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white group-hover:text-[#E8002D] transition-colors truncate">
                        {d.firstName[0]}. {d.lastName}
                      </span>
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: d.teamColor }}
                      />
                    </div>
                    <div className="mt-1.5 h-1 bg-[#2D2D3A] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(s.points / driverMax) * 100}%`,
                          backgroundColor: d.teamColor,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-base font-black text-white tabular-nums shrink-0">
                    {s.points}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Constructor */}
        <div>
          <p className="text-xs text-[#64748B] uppercase tracking-widest mb-3">컨스트럭터</p>
          <div className="space-y-2">
            {constructors.slice(0, 5).map((s) => {
              const team = getTeam(s.teamId);
              if (!team) return null;
              return (
                <Link
                  key={s.teamId}
                  href={`/teams/${s.teamId}`}
                  className="flex items-center gap-3 bg-[#141420] border border-[#2D2D3A] rounded-xl px-4 py-3 hover:-translate-y-0.5 transition-all group"
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${medalClass(s.position)}`}
                  >
                    {s.position}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white group-hover:text-[#E8002D] transition-colors truncate">
                        {team.name}
                      </span>
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: team.primaryColor }}
                      />
                    </div>
                    <div className="mt-1.5 h-1 bg-[#2D2D3A] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(s.points / constructorMax) * 100}%`,
                          backgroundColor: team.primaryColor,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-base font-black text-white tabular-nums shrink-0">
                    {s.points}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Recent Results ─────────────────────────────────────────────

function RecentResultsSection({ completed }: { completed: RaceCalendar[] }) {
  const recent = [...completed].reverse().slice(0, 3);
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">최근 레이스 결과</h2>
        <Link href="/season" className="text-sm text-[#E8002D] hover:underline">
          전체 보기
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {recent.map((race, idx) => {
          const circuit = getCircuit(race.circuitId);
          const isLatest = idx === 0;
          return (
            <div
              key={race.round}
              className={`bg-[#141420] border rounded-xl p-5 ${
                isLatest ? "border-[#E8002D]/30" : "border-[#2D2D3A]"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#64748B]">R{race.round}</span>
                {isLatest && (
                  <span className="text-xs bg-[#E8002D]/15 text-[#E8002D] px-2 py-0.5 rounded-full font-bold">
                    최근
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-white mb-0.5 leading-snug">
                {race.koreanName}
              </p>
              <p className="text-xs text-[#64748B] mb-4">{circuit?.koreanName}</p>
              <div className="flex items-center gap-2 pt-3 border-t border-[#2D2D3A]">
                <span className="text-base">🏆</span>
                <span className="text-sm font-bold text-[#FCD34D]">{race.winner ?? "—"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── AI Briefing Preview ────────────────────────────────────────

function AiDigestPreview({ digest }: { digest: AiDigest | null }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">오늘의 F1</h2>
        <Link href="/news" className="text-sm text-[#E8002D] hover:underline">
          AI 브리핑 전체 보기
        </Link>
      </div>
      {digest ? (
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#141420] border border-[#E8002D]/20 rounded-xl overflow-hidden">
          <div className="bg-[#E8002D]/10 border-b border-[#E8002D]/20 px-5 py-4">
            <p className="text-sm font-black text-white leading-snug">{digest.headline}</p>
          </div>
          <div className="px-5 py-4 space-y-4">
            <p className="text-sm text-[#94A3B8] leading-relaxed line-clamp-3">{digest.summary}</p>
            {/* Top 3 bullets */}
            {digest.bullets.slice(0, 3).length > 0 && (
              <ul className="space-y-2">
                {digest.bullets.slice(0, 3).map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="shrink-0 mt-0.5">{b.emoji}</span>
                    <span className="text-[#94A3B8]">
                      <span className="text-white font-semibold">{b.title} </span>
                      {b.text}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {digest.hotTopics.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1 border-t border-[#2D2D3A]">
                {digest.hotTopics.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-white/5 text-[#94A3B8] px-2.5 py-1 rounded-full border border-white/10"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6 text-sm text-[#64748B]">
          뉴스 브리핑을 준비 중입니다...
        </div>
      )}
    </section>
  );
}

// ─── News Feed ──────────────────────────────────────────────────

function NewsFeedSection({ articles }: { articles: NewsArticle[] }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">최신 뉴스</h2>
        <Link href="/news" className="text-sm text-[#E8002D] hover:underline">
          전체 보기
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {articles.map((a) => {
          const accent = SOURCE_COLORS[a.sourceName] ?? "#E8002D";
          return (
            <a
              key={a.id}
              href={a.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 bg-[#141420] border border-[#2D2D3A] rounded-xl p-4 hover:-translate-y-0.5 hover:border-[#E8002D]/30 transition-all group"
            >
              {a.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.image}
                  alt=""
                  loading="lazy"
                  className="shrink-0 w-20 h-14 rounded-lg object-cover bg-[#2D2D3A]"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white leading-snug group-hover:text-[#E8002D] transition-colors line-clamp-2">
                  {a.title}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-semibold" style={{ color: accent }}>
                    {a.sourceName}
                  </span>
                  <span className="text-[#2D2D3A] text-xs">·</span>
                  <span className="text-xs text-[#64748B]">{timeAgo(a.publishedAt)}</span>
                </div>
              </div>
              <span className="text-[#64748B] group-hover:text-[#E8002D] transition-colors shrink-0 self-center hidden sm:block text-sm">
                →
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}

// ─── Season Calendar ────────────────────────────────────────────

function SeasonCalendar({ calendar }: { calendar: RaceCalendar[] }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">2026 시즌 캘린더</h2>
        <Link href="/season" className="text-sm text-[#E8002D] hover:underline">
          상세 보기
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {calendar.map((race) => {
          const circuit = getCircuit(race.circuitId);
          const isNext = race.status === "next";
          const isCompleted = race.status === "completed";
          return (
            <Link
              key={race.round}
              href={`/season/race/${race.round}`}
              className={`rounded-xl px-3 py-3 border transition-all hover:-translate-y-0.5 ${
                isNext
                  ? "bg-[#E8002D]/10 border-[#E8002D]/30"
                  : isCompleted
                  ? "bg-white/[0.02] border-white/[0.05] opacity-50"
                  : "bg-[#141420] border-[#2D2D3A]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#64748B]">R{race.round}</span>
                {isNext && <span className="text-[#E8002D] text-xs font-black">▶</span>}
                {isCompleted && <span className="text-[#22C55E] text-xs">✓</span>}
              </div>
              <span className="text-2xl block mb-1">{circuit?.flag ?? "🏁"}</span>
              <p className="text-xs font-bold text-white leading-tight line-clamp-2">
                {race.koreanName.replace(" 그랑프리", "")}
              </p>
              <p className="text-xs text-[#64748B] mt-0.5">{race.date.slice(5)}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ─── Page ───────────────────────────────────────────────────────

export default async function HomePage() {
  const [driverStandings, constructorStandings, calendar, aiDigest, newsArticles] =
    await Promise.all([
      fetchDriverStandings(),
      fetchConstructorStandings(),
      fetchCalendar(),
      getAiDigest(),
      getF1News(8),
    ]);

  const nextRace = calendar.find((r) => r.status === "next");
  const completed = calendar.filter((r) => r.status === "completed");
  const weekendInfo = getRaceWeekendInfo(nextRace);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

      {/* ── Hero ──────────────────────────────────────── */}
      {weekendInfo.isWeekend ? (
        <RaceWeekendHero info={weekendInfo} />
      ) : (
        nextRace && <NextRaceHero race={nextRace} />
      )}

      {/* ── Live Session Dashboard ────────────────────── */}
      {weekendInfo.isWeekend && <LiveSessionDashboard />}

      {/* ── Championships ─────────────────────────────── */}
      <ChampionshipsSection
        drivers={driverStandings}
        constructors={constructorStandings}
      />

      {/* ── Recent Results (평소) ─────────────────────── */}
      {!weekendInfo.isWeekend && completed.length > 0 && (
        <RecentResultsSection completed={completed} />
      )}

      {/* ── AI Briefing ───────────────────────────────── */}
      <AiDigestPreview digest={aiDigest} />

      {/* ── News Feed ─────────────────────────────────── */}
      {newsArticles.length > 0 && (
        <NewsFeedSection
          articles={newsArticles.slice(0, weekendInfo.isWeekend ? 8 : 6)}
        />
      )}

      {/* ── Season Calendar (평소) ────────────────────── */}
      {!weekendInfo.isWeekend && (
        <SeasonCalendar calendar={calendar} />
      )}
    </div>
  );
}
