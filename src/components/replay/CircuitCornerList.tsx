import type { CornerInfo, CornerType } from "@/data/circuit-corners";

const TYPE_LABEL: Record<CornerType, string> = {
  fast:    "고속",
  medium:  "중속",
  slow:    "저속",
  hairpin: "헤어핀",
  chicane: "치카네",
};

const TYPE_COLOR: Record<CornerType, string> = {
  fast:    "bg-sky-500/15 text-sky-400 border-sky-500/30",
  medium:  "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  slow:    "bg-orange-500/15 text-orange-400 border-orange-500/30",
  hairpin: "bg-red-500/15 text-red-400 border-red-500/30",
  chicane: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

interface CircuitCornerListProps {
  corners: CornerInfo[];
}

export default function CircuitCornerList({ corners }: CircuitCornerListProps) {
  if (corners.length === 0) return null;

  return (
    <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4">
      <h3 className="text-[10px] text-[#64748B] uppercase tracking-widest mb-3 font-bold">
        서킷 주요 코너
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0">
        {corners.map((corner) => (
          <div
            key={corner.num}
            className="flex items-start gap-3 py-2.5 border-b border-[#2D2D3A]/40 last:border-0 sm:[&:nth-last-child(2)]:border-0"
          >
            <span className="shrink-0 w-14 text-center text-[10px] font-mono font-bold text-[#E8002D] bg-[#E8002D]/10 border border-[#E8002D]/20 rounded px-1.5 py-0.5 leading-5">
              {corner.num}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[13px] font-bold text-white leading-tight">
                  {corner.name}
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border leading-none ${TYPE_COLOR[corner.type]}`}
                >
                  {TYPE_LABEL[corner.type]}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
                {corner.note}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
