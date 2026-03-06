import Link from "next/link";
import { getCircuit, type RaceCalendar, type SessionSchedule } from "@/data/f1-data";
import CountdownTimer from "@/components/live/CountdownTimer";
import { SessionTimetable } from "./SessionTimetable";

function formatKST(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "numeric", day: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "Asia/Seoul", hour12: false,
  });
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

export interface RaceWeekendInfo {
  isWeekend: boolean;
  nextSession: { key: string; name: string; time: string } | null;
  liveSession: { key: string; name: string; time: string } | null;
  currentRace: RaceCalendar | null;
}

export function RaceWeekendHero({ info }: { info: RaceWeekendInfo }) {
  const { currentRace, nextSession, liveSession } = info;
  if (!currentRace) return null;
  const circuit = getCircuit(currentRace.circuitId);
  const sessions = currentRace.sessions ? getSessionList(currentRace.sessions) : [];

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2a0008] to-[#1a0005] border border-[#E8002D]/40">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=40 height=40 viewBox=0 0 40 40 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=%23E8002D fill-opacity=0.03%3E%3Cpath d=M0 20 L20 0 L40 20 L20 40 z/%3E%3C/g%3E%3C/svg%3E')]" />
      {liveSession && (
        <div className="relative flex items-center gap-3 bg-[#E8002D] px-8 sm:px-10 py-2.5">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span className="text-white text-sm font-black uppercase tracking-widest">
            LIVE — {liveSession.name} 진행 중
          </span>
        </div>
      )}
      <div className="relative p-8 sm:p-10">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              {liveSession ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E8002D] text-white text-xs font-black uppercase tracking-widest rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />LIVE NOW
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E8002D] text-white text-xs font-black uppercase tracking-widest rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />RACE WEEK
                </span>
              )}
              <span className="text-xs text-[#E8002D]/70 font-bold">Round {currentRace.round}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">{currentRace.koreanName}</h2>
            <p className="text-[#94A3B8] mt-1">{circuit?.koreanName} · {currentRace.date}</p>
          </div>

          {liveSession ? (
            <div className="bg-[#E8002D]/20 rounded-2xl px-5 py-4 text-right border border-[#E8002D]/40 shrink-0">
              <span className="block text-xs text-[#E8002D]/70 uppercase tracking-widest mb-1">현재 세션</span>
              <span className="block text-xl font-black text-white">{liveSession.name}</span>
              <span className="block text-sm text-[#E8002D] font-mono mt-0.5">{formatKST(liveSession.time)} ~</span>
            </div>
          ) : nextSession ? (
            (() => {
              const msUntil = new Date(nextSession.time).getTime() - Date.now();
              return msUntil < 86_400_000 ? (
                <CountdownTimer targetIso={nextSession.time} label={`${nextSession.name}까지`} />
              ) : (
                <div className="bg-black/40 rounded-2xl px-5 py-4 text-right border border-white/10 shrink-0">
                  <span className="block text-xs text-[#64748B] uppercase tracking-widest mb-1">다음 세션</span>
                  <span className="block text-xl font-black text-white">{nextSession.name}</span>
                  <span className="block text-sm text-[#E8002D] font-mono mt-0.5">{formatKST(nextSession.time)}</span>
                </div>
              );
            })()
          ) : null}
        </div>

        {sessions.length > 0 && (
          <div className="mb-6">
            <SessionTimetable sessions={sessions} liveKey={liveSession?.key} highlightKey={nextSession?.key} round={currentRace.round} />
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          <Link href={`/season/race/${currentRace.round}`} className="px-5 py-2.5 bg-white/10 text-white text-sm font-bold rounded-lg hover:bg-white/20 transition-colors">
            라운드 페이지 →
          </Link>
          <Link href={`/circuits/${currentRace.circuitId}`} className="px-5 py-2.5 bg-[#E8002D] text-white text-sm font-bold rounded-lg hover:bg-[#CC0025] transition-colors">
            서킷 정보
          </Link>
          <Link href="/season" className="px-5 py-2.5 bg-white/10 text-white text-sm font-bold rounded-lg hover:bg-white/20 transition-colors">
            전체 일정
          </Link>
        </div>
      </div>
    </section>
  );
}
