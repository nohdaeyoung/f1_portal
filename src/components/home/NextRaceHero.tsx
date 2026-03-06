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
  const daysUntil = msUntilRace != null ? Math.ceil(msUntilRace / 86_400_000) : null;
  const nextSession = sessions.find((s) => new Date(s.time).getTime() > now);
  const msUntilNext = nextSession ? new Date(nextSession.time).getTime() - now : msUntilRace;
  const showCountdown = msUntilNext != null && msUntilNext < 86_400_000;

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#141420] to-[#1a1a2e] border border-[#2D2D3A]">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#E8002D]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="relative p-8 sm:p-10">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#E8002D] font-bold">
              Next Race · Round {race.round}
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-2 leading-tight">
              {race.koreanName}
            </h2>
            <p className="text-[#64748B] mt-1">{circuit?.koreanName} · {race.date}</p>
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

        {sessions.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-[#64748B] uppercase tracking-widest mb-3">세션 일정 (KST)</p>
            <SessionTimetable sessions={sessions} round={race.round} />
          </div>
        )}

        {circuit?.highlights && circuit.highlights.length > 0 && (
          <div className="mb-6 px-4 py-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            <p className="text-xs text-[#64748B] mb-1">서킷 포인트</p>
            <p className="text-sm text-[#94A3B8]">{circuit.highlights[0]}</p>
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          <Link href={`/season/race/${race.round}`} className="px-5 py-2.5 bg-white/10 text-white text-sm font-bold rounded-lg hover:bg-white/20 transition-colors">
            라운드 페이지 →
          </Link>
          <Link href={`/circuits/${race.circuitId}`} className="px-5 py-2.5 bg-[#E8002D] text-white text-sm font-bold rounded-lg hover:bg-[#CC0025] transition-colors">
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
