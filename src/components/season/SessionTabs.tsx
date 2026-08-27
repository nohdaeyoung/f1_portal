import Link from "next/link";
import type { SessionSchedule } from "@/data/f1-data";

/**
 * GP 주말 세션 탭.
 *
 *   /season/race/3            → 개요 (activeSession = undefined)
 *   /season/race/3/qualifying → 퀄리파잉 (activeSession = "qualifying")
 *
 * 쿼리 파라미터(?session=)가 아니라 경로 세그먼트를 쓴다. 서버 컴포넌트에서
 * searchParams 를 읽으면 그 라우트 전체가 동적(SSR)이 되어 프리렌더가 사라지기
 * 때문이다. 경로로 두면 라운드 페이지와 세션 페이지 모두 정적 생성된다.
 */
export function SessionTabs({
  sessions,
  activeSession,
  round,
}: {
  sessions: SessionSchedule;
  activeSession?: string;
  round: number;
}) {
  const tabs = [
    { key: "overview",   ko: "개요" },
    { key: "fp1",        ko: "FP1",        date: sessions.fp1,        hide: !!sessions.isSprint },
    { key: "fp2",        ko: "FP2",        date: sessions.fp2,        hide: !!sessions.isSprint },
    { key: "fp3",        ko: "FP3",        date: sessions.fp3,        hide: !!sessions.isSprint },
    { key: "sq",         ko: "SQ",         date: sessions.sq,         hide: !sessions.isSprint },
    { key: "sprint",     ko: "스프린트",   date: sessions.sprint,     hide: !sessions.isSprint },
    { key: "qualifying", ko: "Qualifying", date: sessions.qualifying },
    { key: "race",       ko: "Race",       date: sessions.race },
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
        const href =
          key === "overview"
            ? `/season/race/${round}`
            : `/season/race/${round}/${key}`;
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
