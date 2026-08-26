"use client";

import type { FF1DriverTelemetry, FF1ReplayData, FF1ReplayFrame } from "@/lib/api/fastf1";

const COMPOUND_COLOR: Record<string, string> = {
  SOFT:   "#E8002D",
  MEDIUM: "#FFC906",
  HARD:   "#FFFFFF",
  INTER:  "#39B54A",
  WET:    "#0067FF",
};

interface DriverTelemetryPanelProps {
  driver: string;
  frameIndex: number;
  telemetry: FF1DriverTelemetry | null;
  loading: boolean;
  data: FF1ReplayData;
  frame: FF1ReplayFrame;
  onClose: () => void;
}

export default function DriverTelemetryPanel({
  driver,
  frameIndex,
  telemetry,
  loading,
  data,
  frame,
  onClose,
}: DriverTelemetryPanelProps) {
  const hex = data.colors[driver] ?? "64748B";
  const teamColor = hex.startsWith("#") ? hex : `#${hex}`;

  const speed    = telemetry?.speed?.[frameIndex] ?? null;
  const gear     = telemetry?.gear?.[frameIndex] ?? null;
  const throttle = telemetry?.throttle?.[frameIndex] ?? null;
  const braking  = (telemetry?.brake?.[frameIndex] ?? 0) === 1;
  const drsOn    = (telemetry?.drs?.[frameIndex] ?? 0) === 1;
  const tyreLife = telemetry?.tyre_life?.[frameIndex] ?? null;

  const lbRow = frame.leaderboard.find((r) => r.d === driver);
  const compound = lbRow?.compound ?? "UNKNOWN";
  const compoundColor = COMPOUND_COLOR[compound] ?? "#64748B";

  return (
    <div
      className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden"
      style={{ borderLeftColor: teamColor, borderLeftWidth: 3 }}
    >
      {loading ? (
        <div className="flex items-center gap-2 px-4 py-3">
          <span className="w-4 h-4 border-2 border-[#475569] border-t-[#E8002D] rounded-full animate-spin shrink-0" />
          <span className="text-xs text-[#64748B]">{driver} 텔레메트리 로딩 중...</span>
        </div>
      ) : (
        <div className="flex items-center gap-0 divide-x divide-[#2D2D3A] overflow-x-auto">

          {/* Driver */}
          <div className="flex items-center gap-2 px-4 py-3 shrink-0">
            <div className="w-1 h-6 rounded-full shrink-0" style={{ backgroundColor: teamColor }} />
            <span className="text-sm font-black text-white">{driver}</span>
          </div>

          {/* Speed */}
          <div className="flex flex-col items-center px-5 py-2 shrink-0">
            <span className="text-[9px] text-[#475569] uppercase tracking-widest">Speed</span>
            <span className="text-2xl font-black text-white leading-tight">
              {speed !== null ? speed : "—"}
            </span>
            <span className="text-[9px] text-[#475569]">km/h</span>
          </div>

          {/* Gear */}
          <div className="flex flex-col items-center px-5 py-2 shrink-0">
            <span className="text-[9px] text-[#475569] uppercase tracking-widest">Gear</span>
            <span className="text-2xl font-black text-white leading-tight">
              {gear !== null ? gear : "—"}
            </span>
            <span className="text-[9px] text-[#475569]">단</span>
          </div>

          {/* Throttle */}
          <div className="flex flex-col gap-1 px-5 py-3 min-w-[120px] shrink-0">
            <div className="flex justify-between">
              <span className="text-[9px] text-[#475569] uppercase tracking-widest">Throttle</span>
              <span className="text-[9px] text-[#64748B]">{throttle !== null ? `${throttle}%` : "—"}</span>
            </div>
            <div className="h-2 bg-[#0D0D14] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${throttle ?? 0}%`,
                  backgroundColor: throttle !== null && throttle > 0 ? "#22C55E" : "transparent",
                }}
              />
            </div>
          </div>

          {/* Brake */}
          <div className="flex flex-col items-center px-4 py-2 shrink-0">
            <span className="text-[9px] text-[#475569] uppercase tracking-widest">Brake</span>
            <span
              className={`text-sm font-black mt-0.5 transition-colors ${
                braking ? "text-[#E8002D]" : "text-[#2D2D3A]"
              }`}
            >
              {braking ? "ON" : "OFF"}
            </span>
          </div>

          {/* DRS */}
          <div className="flex flex-col items-center px-4 py-2 shrink-0">
            <span className="text-[9px] text-[#475569] uppercase tracking-widest">DRS</span>
            <span
              className={`text-sm font-black mt-0.5 transition-colors ${
                drsOn ? "text-[#22C55E]" : "text-[#2D2D3A]"
              }`}
            >
              {drsOn ? "ON" : "OFF"}
            </span>
          </div>

          {/* Tyre */}
          <div className="flex items-center gap-2 px-4 py-2 shrink-0">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: compoundColor }}
            />
            <span className="text-xs text-white font-bold">{compound}</span>
            {tyreLife !== null && tyreLife > 0 && (
              <span className="text-[10px] text-[#64748B]">{tyreLife}L</span>
            )}
          </div>

          {/* Close */}
          <div className="ml-auto px-3 py-2 shrink-0">
            <button
              onClick={onClose}
              className="text-[#475569] hover:text-white text-xs transition-colors w-6 h-6 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
