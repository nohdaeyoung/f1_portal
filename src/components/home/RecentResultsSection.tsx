import { getCircuit, type RaceCalendar } from "@/data/f1-data";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function RecentResultsSection({ completed }: { completed: RaceCalendar[] }) {
  const recent = [...completed].reverse().slice(0, 3);
  return (
    <section>
      <SectionHeader title="최근 레이스 결과" href="/season" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {recent.map((race, idx) => {
          const circuit = getCircuit(race.circuitId);
          const isLatest = idx === 0;
          return (
            <div
              key={race.round}
              className={`bg-[#141420] border rounded-xl p-5 ${isLatest ? "border-[#E8002D]/30" : "border-[#2D2D3A]"}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#64748B]">R{race.round}</span>
                {isLatest && (
                  <span className="text-xs bg-[#E8002D]/15 text-[#E8002D] px-2 py-0.5 rounded-full font-bold">최근</span>
                )}
              </div>
              <p className="text-sm font-bold text-white mb-0.5 leading-snug">{race.koreanName}</p>
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
