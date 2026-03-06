import Link from "next/link";

function formatKST(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "numeric", day: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "Asia/Seoul", hour12: false,
  });
}

interface SessionItem { key: string; name: string; time: string }

interface SessionTimetableProps {
  sessions: SessionItem[];
  highlightKey?: string | null;
  liveKey?: string | null;
  round?: number;
}

export function SessionTimetable({ sessions, highlightKey, liveKey, round }: SessionTimetableProps) {
  const now = Date.now();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      {sessions.map((sess) => {
        const isPast = new Date(sess.time).getTime() < now;
        const isLive = sess.key === liveKey;
        const isHighlight = sess.key === highlightKey && !isLive;
        const isRace = sess.key === "race";
        const hasResult = isPast && !isLive && round != null;
        const inner = (
          <>
            <span className={`block text-xs font-bold mb-1 ${isLive || isHighlight ? "text-[#E8002D]" : "text-[#64748B]"}`}>
              {sess.name}
              {isLive && <span className="ml-1 animate-pulse">●</span>}
              {isHighlight && " ▶"}
            </span>
            <span className="block text-xs text-white font-mono leading-tight">
              {formatKST(sess.time)}
            </span>
            {hasResult && (
              <span className="block text-[11px] text-white bg-[#E8002D] mt-1.5 font-black px-2 py-0.5 rounded-full inline-block">결과 보기 →</span>
            )}
          </>
        );
        const cls = `rounded-xl px-3 py-3 border text-center ${
          isLive     ? "bg-[#E8002D]/25 border-[#E8002D] ring-1 ring-[#E8002D]/50"
          : isHighlight ? "bg-[#E8002D]/20 border-[#E8002D]/50 ring-1 ring-[#E8002D]/30"
          : isRace && !isPast ? "bg-[#E8002D]/10 border-[#E8002D]/30"
          : isPast   ? "bg-white/[0.02] border-white/[0.04] opacity-40 hover:opacity-70 transition-opacity"
          : "bg-white/[0.04] border-white/[0.08]"
        }`;
        return hasResult ? (
          <Link key={sess.key} href={`/season/race/${round}/${sess.key}`} className={cls}>{inner}</Link>
        ) : (
          <div key={sess.key} className={cls}>{inner}</div>
        );
      })}
    </div>
  );
}
