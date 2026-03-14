"use client";

import type { FF1ReplayData, FF1ReplayFrame } from "@/lib/api/fastf1";

const COMPOUND_COLOR: Record<string, string> = {
  SOFT:   "#E8002D",
  MEDIUM: "#FFC906",
  HARD:   "#FFFFFF",
  INTER:  "#39B54A",
  WET:    "#0067FF",
};

function CompoundDot({ compound }: { compound: string }) {
  const color = COMPOUND_COLOR[compound] ?? "#64748B";
  return (
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ backgroundColor: color }}
      title={compound}
    />
  );
}

interface ReplayLeaderboardProps {
  data: FF1ReplayData;
  frame: FF1ReplayFrame;
  selectedDriver?: string | null;
  onSelectDriver?: (driver: string | null) => void;
}

export default function ReplayLeaderboard({
  data,
  frame,
  selectedDriver = null,
  onSelectDriver,
}: ReplayLeaderboardProps) {
  const posMap = new Map(frame.positions.map((p) => [p.d, p]));

  return (
    <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[#2D2D3A]">
        <p className="text-[10px] text-[#64748B] uppercase tracking-widest">
          Lap {frame.lap} 리더보드
        </p>
        {onSelectDriver && (
          <p className="text-[9px] text-[#2D2D3A] mt-0.5">드라이버 클릭 → 텔레메트리</p>
        )}
      </div>

      <div className="divide-y divide-[#2D2D3A]/50">
        {frame.leaderboard.map((row) => {
          const pos = posMap.get(row.d);
          const isOut = pos?.status === "out";
          const isPit = pos?.status === "pit";
          const hex = data.colors[row.d] ?? "64748B";
          const teamColor = hex.startsWith("#") ? hex : `#${hex}`;
          const isSelected = row.d === selectedDriver;

          const Tag = onSelectDriver ? "button" : "div";
          return (
            <Tag
              key={row.d}
              onClick={onSelectDriver ? () => onSelectDriver(isSelected ? null : row.d) : undefined}
              aria-pressed={onSelectDriver ? isSelected : undefined}
              aria-label={onSelectDriver ? `${row.d} 텔레메트리 ${isSelected ? "해제" : "보기"}` : undefined}
              className={`flex items-center gap-2 px-3 py-2 transition-colors w-full text-left ${
                isOut ? "opacity-30" : ""
              } ${
                onSelectDriver ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-f1-red" : ""
              } ${
                isSelected
                  ? "bg-white/10"
                  : onSelectDriver
                  ? "hover:bg-white/5"
                  : ""
              }`}
            >
              {/* Team color bar */}
              <div
                className="w-0.5 h-6 rounded-full shrink-0"
                style={{ backgroundColor: teamColor }}
              />

              {/* Position */}
              <span className={`text-xs font-black w-5 shrink-0 ${
                row.pos === 1 ? "text-[#F59E0B]" :
                row.pos <= 3 ? "text-white" : "text-[#64748B]"
              }`}>
                {row.pos}
              </span>

              {/* Driver */}
              <span className={`text-xs font-bold flex-1 ${isSelected ? "text-white" : "text-white"}`}>
                {row.d}
              </span>

              {/* Compound */}
              <CompoundDot compound={row.compound ?? pos?.compound ?? "UNKNOWN"} />

              {/* Status */}
              {isPit && (
                <span className="text-[9px] text-[#F59E0B] font-bold">PIT</span>
              )}
              {isOut && (
                <span className="text-[9px] text-[#E8002D] font-bold">OUT</span>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#E8002D] shrink-0" aria-hidden="true" />
              )}
            </Tag>
          );
        })}
      </div>
    </div>
  );
}
