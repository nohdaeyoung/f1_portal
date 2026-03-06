import Link from "next/link";
import { getCircuit, type RaceCalendar } from "@/data/f1-data";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function SeasonCalendar({ calendar }: { calendar: RaceCalendar[] }) {
  return (
    <section>
      <SectionHeader title="2026 시즌 캘린더" href="/season" linkLabel="상세 보기" />
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
                isNext      ? "bg-[#E8002D]/10 border-[#E8002D]/30"
                : isCompleted ? "bg-white/[0.02] border-white/[0.05] opacity-50"
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
