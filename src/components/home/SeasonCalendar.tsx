import Link from "next/link";
import { getCircuit, type RaceCalendar } from "@/data/f1-data";
import { SectionHeader } from "@/components/ui/SectionHeader";

/** FP1 ISO(UTC) ~ 레이스 날짜 범위를 "MM.DD~DD" 형식으로 반환 */
function fmtDateRange(raceDate: string, fp1Iso?: string): string {
  const raceMM = raceDate.slice(5, 7);
  const raceDD = raceDate.slice(8, 10);
  const raceStr = `${raceMM}.${raceDD}`;
  if (!fp1Iso) return raceStr;

  const fp1 = new Date(fp1Iso);
  const fp1MM = String(fp1.getUTCMonth() + 1).padStart(2, "0");
  const fp1DD = String(fp1.getUTCDate()).padStart(2, "0");
  if (fp1DD === raceDD) return raceStr;

  return fp1MM === raceMM
    ? `${fp1MM}.${fp1DD}~${raceDD}`
    : `${fp1MM}.${fp1DD}~${raceMM}.${raceDD}`;
}

export function SeasonCalendar({ calendar }: { calendar: RaceCalendar[] }) {
  return (
    <section>
      <SectionHeader title="2026 시즌 캘린더" href="/season" linkLabel="상세 보기" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {calendar.map((race) => {
          const circuit = getCircuit(race.circuitId);
          const isNext = race.status === "next";
          const isCompleted = race.status === "completed";
          const isCancelled = race.status === "cancelled";
          return (
            <Link
              key={race.round}
              href={`/season/race/${race.round}`}
              className={`rounded-xl px-3 py-3 border transition-all hover:-translate-y-0.5 ${
                isCancelled ? "bg-white/[0.01] border-white/[0.04] opacity-40"
                : isNext      ? "bg-[#E8002D]/10 border-[#E8002D]/30"
                : isCompleted ? "bg-white/[0.02] border-white/[0.05] opacity-50"
                : "bg-[#141420] border-[#2D2D3A]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs text-[#64748B] ${isCancelled ? "line-through" : ""}`}>R{race.round}</span>
                {isCancelled && <span className="text-[#EF4444] text-[10px] font-bold">취소</span>}
                {isNext && <span className="text-[#E8002D] text-xs font-black">▶</span>}
                {isCompleted && <span className="text-[#22C55E] text-xs">✓</span>}
              </div>
              <span className={`text-2xl block mb-1 ${isCancelled ? "grayscale" : ""}`}>{circuit?.flag ?? "🏁"}</span>
              <p className={`text-xs font-bold leading-tight line-clamp-2 ${isCancelled ? "line-through text-[#64748B]" : "text-white"}`}>
                {race.koreanName.replace(" 그랑프리", "")}
              </p>
              <p className={`text-xs mt-0.5 ${isCancelled ? "line-through text-[#64748B]/60" : "text-[#64748B]"}`}>{fmtDateRange(race.date, race.sessions?.fp1)}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
