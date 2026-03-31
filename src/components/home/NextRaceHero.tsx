import Link from "next/link";
import { getCircuit, type RaceCalendar, type SessionSchedule } from "@/data/f1-data";
import CountdownTimer from "@/components/live/CountdownTimer";
import { SessionTimetable } from "./SessionTimetable";

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

export function NextRaceHero({ race }: { race: RaceCalendar }) {
  const circuit = getCircuit(race.circuitId);
  const sessions = race.sessions ? getSessionList(race.sessions) : [];
  const now = Date.now();
  const msUntilRace = race.sessions ? new Date(race.sessions.race).getTime() - now : null;
  const daysUntil = msUntilRace != null ? Math.max(0, Math.ceil(msUntilRace / 86_400_000)) : null;
  const nextSession = sessions.find((s) => new Date(s.time).getTime() > now);

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-border-default hud-card"
      style={{ background: "linear-gradient(135deg, #111118 0%, #0f0f1a 60%, #14101a 100%)" }}
    >
      {/* 배경 accent glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-f1-red/8 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#00D2BE]/5 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      {/* 상단 상태 바 */}
      <div className="flex items-center gap-3 px-6 pt-5 pb-0">
        <span className="flex items-center gap-1.5 font-display text-[10px] font-bold tracking-widest uppercase text-f1-red">
          <span className="w-1.5 h-1.5 rounded-full bg-f1-red animate-pulse" aria-hidden="true" />
          NEXT RACE
        </span>
        <span className="text-border-strong text-xs">·</span>
        <span className="font-display text-[10px] font-bold tracking-widest uppercase text-text-disabled">
          ROUND {String(race.round).padStart(2, "0")} / 24
        </span>
        {race.sessions?.isSprint && (
          <>
            <span className="text-border-strong text-xs">·</span>
            <span className="font-display text-[10px] font-bold tracking-widest uppercase text-[#A855F7]">SPRINT WEEKEND</span>
          </>
        )}
      </div>

      <div className="relative px-6 pt-4 pb-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          {/* 레이스 제목 */}
          <div className="min-w-0">
            <h1 className="font-display text-4xl sm:text-6xl font-bold text-white leading-none tracking-wide uppercase text-wrap-balance">
              {race.koreanName}
            </h1>
            <p className="font-mono text-xs text-text-muted mt-2 tracking-wider">
              {circuit?.koreanName}
              <span className="mx-2 text-border-strong">·</span>
              {race.date}
            </p>
          </div>

          {/* D-DAY + 카운트다운 */}
          {((daysUntil !== null && daysUntil >= 0) || nextSession) && (
            <div className="flex flex-col items-end gap-3 shrink-0">
              {nextSession?.key === "race" ? (
                <CountdownTimer targetIso={nextSession.time} label="레이스까지" />
              ) : nextSession ? (
                <CountdownTimer targetIso={nextSession.time} label={nextSession.name} compact />
              ) : null}
              {daysUntil !== null && daysUntil >= 0 && (
                <div className="text-right">
                  <span className="font-display text-6xl sm:text-7xl font-bold text-f1-red leading-none tabular-nums">
                    D-{daysUntil}
                  </span>
                  <span className="block font-display text-[10px] tracking-widest uppercase text-text-disabled mt-1">
                    RACE DAY
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-border-subtle" />
          <span className="font-display text-[10px] tracking-widest uppercase text-text-disabled">SESSION SCHEDULE · KST</span>
          <div className="h-px flex-1 bg-border-subtle" />
        </div>

        {/* 세션 타임테이블 */}
        {sessions.length > 0 && (
          <div className="mb-5">
            <SessionTimetable sessions={sessions} round={race.round} />
          </div>
        )}

        {/* 서킷 포인트 */}
        {circuit?.highlights && circuit.highlights.length > 0 && (
          <div className="mb-5 px-4 py-3 bg-white/[0.03] rounded-lg border-l-2 border-[#00D2BE]/40">
            <p className="font-display text-[10px] tracking-widest uppercase text-[#00D2BE]/70 mb-1">CIRCUIT NOTE</p>
            <p className="text-sm text-text-secondary leading-relaxed">{circuit.highlights[0]}</p>
          </div>
        )}

        {/* CTA 버튼 */}
        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/season/race/${race.round}`}
            className="font-display px-5 py-3 bg-f1-red text-white text-sm font-bold rounded-lg hover:bg-f1-red-dim transition-colors tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-f1-red focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
          >
            ROUND PAGE →
          </Link>
          <Link
            href={`/circuits/${race.circuitId}`}
            className="font-display px-5 py-3 bg-white/8 text-white text-sm font-bold rounded-lg hover:bg-white/15 transition-colors border border-border-default tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-f1-red focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
          >
            CIRCUIT INFO
          </Link>
          <Link
            href="/season"
            className="font-display px-5 py-3 bg-white/8 text-white text-sm font-bold rounded-lg hover:bg-white/15 transition-colors border border-border-default tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-f1-red focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
          >
            FULL CALENDAR
          </Link>
        </div>
      </div>
    </section>
  );
}
