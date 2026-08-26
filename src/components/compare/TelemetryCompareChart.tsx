"use client";

import { useState } from "react";

interface TelPoint {
  Distance: number;
  Speed: number | null;
  Throttle: number | null;
  Brake: boolean | null;
}

interface Props {
  telA: TelPoint[];
  telB: TelPoint[];
  colorA: string;
  colorB: string;
  nameA: string;
  nameB: string;
}

function SpeedOverlay({
  telA, telB, colorA, colorB,
}: { telA: TelPoint[]; telB: TelPoint[]; colorA: string; colorB: string }) {
  const W = 800, H = 140;
  const PAD = { t: 10, r: 10, b: 30, l: 44 };
  const w = W - PAD.l - PAD.r;
  const h = H - PAD.t - PAD.b;

  const maxDist = Math.max(
    ...telA.map((d) => d.Distance),
    ...telB.map((d) => d.Distance),
    1,
  );
  const maxSpeed = Math.max(
    ...telA.filter((d) => d.Speed != null).map((d) => d.Speed as number),
    ...telB.filter((d) => d.Speed != null).map((d) => d.Speed as number),
    1,
  );

  const xOf = (dist: number) => PAD.l + (dist / maxDist) * w;
  const yOf = (spd: number) => PAD.t + h - (spd / maxSpeed) * h;

  const ptsA = telA
    .filter((d) => d.Speed != null)
    .map((d) => `${xOf(d.Distance)},${yOf(d.Speed as number)}`)
    .join(" ");
  const ptsB = telB
    .filter((d) => d.Speed != null)
    .map((d) => `${xOf(d.Distance)},${yOf(d.Speed as number)}`)
    .join(" ");

  const yTicks = [0, 100, 200, 300].filter((v) => v <= maxSpeed + 20);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {yTicks.map((v) => {
        const y = yOf(v);
        return (
          <g key={v}>
            <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#1E2030" strokeWidth={1} />
            <text x={PAD.l - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#64748B">{v}</text>
          </g>
        );
      })}
      {ptsA && <polyline points={ptsA} fill="none" stroke={colorA} strokeWidth={1.5} strokeLinejoin="round" strokeOpacity={0.85} />}
      {ptsB && <polyline points={ptsB} fill="none" stroke={colorB} strokeWidth={1.5} strokeLinejoin="round" strokeOpacity={0.85} />}
      <text x={PAD.l} y={H - 4} fontSize={8} fill="#64748B">0</text>
      <text x={W - PAD.r} y={H - 4} textAnchor="end" fontSize={8} fill="#64748B">{Math.round(maxDist)}m</text>
    </svg>
  );
}

function ThrottleOverlay({
  telA, telB, colorA, colorB,
}: { telA: TelPoint[]; telB: TelPoint[]; colorA: string; colorB: string }) {
  const W = 800, H = 60;
  const PAD = { t: 5, r: 10, b: 10, l: 44 };
  const w = W - PAD.l - PAD.r;
  const h = H - PAD.t - PAD.b;

  const maxDist = Math.max(...telA.map((d) => d.Distance), ...telB.map((d) => d.Distance), 1);

  const ptsA = telA
    .filter((d) => d.Throttle != null)
    .map((d) => `${PAD.l + (d.Distance / maxDist) * w},${PAD.t + h - ((d.Throttle as number) / 100) * h}`)
    .join(" ");
  const ptsB = telB
    .filter((d) => d.Throttle != null)
    .map((d) => `${PAD.l + (d.Distance / maxDist) * w},${PAD.t + h - ((d.Throttle as number) / 100) * h}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <text x={PAD.l - 4} y={PAD.t + h / 2 + 4} textAnchor="end" fontSize={8} fill="#64748B">스로틀</text>
      {ptsA && <polyline points={ptsA} fill="none" stroke={colorA} strokeWidth={1} strokeLinejoin="round" strokeOpacity={0.8} />}
      {ptsB && <polyline points={ptsB} fill="none" stroke={colorB} strokeWidth={1} strokeLinejoin="round" strokeOpacity={0.8} />}
    </svg>
  );
}

function BrakeOverlay({
  telA, telB, colorA, colorB,
}: { telA: TelPoint[]; telB: TelPoint[]; colorA: string; colorB: string }) {
  const W = 800, H = 40;
  const PAD = { t: 5, r: 10, b: 5, l: 44 };
  const w = W - PAD.l - PAD.r;
  const maxDist = Math.max(...telA.map((d) => d.Distance), ...telB.map((d) => d.Distance), 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <text x={PAD.l - 4} y={H / 2 + 4} textAnchor="end" fontSize={8} fill="#64748B">브레이크</text>
      {telA.filter((d) => d.Brake).map((d, i) => (
        <rect
          key={`a-${i}`}
          x={PAD.l + (d.Distance / maxDist) * w - 1}
          y={PAD.t}
          width={3}
          height={H - PAD.t - PAD.b}
          fill={colorA}
          opacity={0.6}
        />
      ))}
      {telB.filter((d) => d.Brake).map((d, i) => (
        <rect
          key={`b-${i}`}
          x={PAD.l + (d.Distance / maxDist) * w - 1}
          y={PAD.t + (H - PAD.t - PAD.b) / 2}
          width={3}
          height={(H - PAD.t - PAD.b) / 2}
          fill={colorB}
          opacity={0.6}
        />
      ))}
    </svg>
  );
}

export function TelemetryCompareChart({ telA, telB, colorA, colorB, nameA, nameB }: Props) {
  const [showThrottle, setShowThrottle] = useState(true);
  const [showBrake, setShowBrake] = useState(true);

  if (telA.length === 0 || telB.length === 0) return null;

  return (
    <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-5 space-y-1">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-[#64748B] uppercase tracking-widest">패스티스트랩 텔레메트리</p>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: colorA }} />
            <span style={{ color: colorA }}>{nameA}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: colorB }} />
            <span style={{ color: colorB }}>{nameB}</span>
          </span>
          <div className="flex items-center gap-2 ml-2 border-l border-[#2D2D3A] pl-2">
            <button
              onClick={() => setShowThrottle((v) => !v)}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${showThrottle ? "bg-white/10 text-white" : "text-[#475569]"}`}
            >
              스로틀
            </button>
            <button
              onClick={() => setShowBrake((v) => !v)}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${showBrake ? "bg-white/10 text-white" : "text-[#475569]"}`}
            >
              브레이크
            </button>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[10px] text-[#475569] mb-1">속도 (km/h)</p>
        <SpeedOverlay telA={telA} telB={telB} colorA={colorA} colorB={colorB} />
      </div>

      {showThrottle && (
        <ThrottleOverlay telA={telA} telB={telB} colorA={colorA} colorB={colorB} />
      )}

      {showBrake && (
        <BrakeOverlay telA={telA} telB={telB} colorA={colorA} colorB={colorB} />
      )}
    </div>
  );
}
