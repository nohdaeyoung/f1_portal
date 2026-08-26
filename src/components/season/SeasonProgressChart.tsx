"use client";

import { useState } from "react";

interface DriverProgress {
  driverId: string;
  driverName: string;
  team: string;
  finalPosition: number;
  finalPoints: number;
  color: string;
  points: number[]; // always a number, length === totalRounds
}

interface Props {
  raceNames: string[];
  dataset: DriverProgress[];
}

export function SeasonProgressChart({ raceNames, dataset }: Props) {
  const [highlighted, setHighlighted] = useState<string | null>(null);

  const W = 900;
  const H = 320;
  const PAD = { t: 20, r: 24, b: 52, l: 52 };
  const w = W - PAD.l - PAD.r;
  const h = H - PAD.t - PAD.b;

  const totalRounds = raceNames.length;
  if (totalRounds === 0 || dataset.length === 0) return null;

  const maxPts = Math.max(...dataset.map((d) => d.finalPoints), 1);

  const xOf = (i: number) =>
    PAD.l + (i / Math.max(totalRounds - 1, 1)) * w;

  const yOf = (pts: number) =>
    PAD.t + h - (pts / maxPts) * h;

  // Y axis ticks
  const yTicks = Array.from({ length: 6 }, (_, i) =>
    Math.round((maxPts * i) / 5)
  );

  // X axis: label every N rounds
  const xLabelStep = totalRounds <= 16 ? 1 : totalRounds <= 22 ? 2 : 3;

  return (
    <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-5">
      <p className="text-xs text-[#64748B] uppercase tracking-widest mb-4">
        드라이버별 누적 포인트 추이 (Top 10)
      </p>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto"
          style={{ minWidth: 480 }}
        >
          {/* Y grid lines */}
          {yTicks.map((v) => {
            const y = yOf(v);
            return (
              <g key={v}>
                <line
                  x1={PAD.l}
                  y1={y}
                  x2={W - PAD.r}
                  y2={y}
                  stroke="#1E2030"
                  strokeWidth={1}
                />
                <text x={PAD.l - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#64748B">
                  {v}
                </text>
              </g>
            );
          })}

          {/* X axis round markers */}
          {raceNames.map((name, i) => {
            const isLast = i === totalRounds - 1;
            if (!isLast && i % xLabelStep !== 0) return null;
            const x = xOf(i);
            return (
              <g key={i}>
                <line
                  x1={x} y1={PAD.t}
                  x2={x} y2={PAD.t + h}
                  stroke="#1E2030"
                  strokeWidth={isLast ? 1.5 : 1}
                />
                <text
                  x={x}
                  y={H - PAD.b + 14}
                  textAnchor="middle"
                  fontSize={8}
                  fill={isLast ? "#94A3B8" : "#64748B"}
                  fontWeight={isLast ? "bold" : "normal"}
                >
                  R{i + 1}
                </text>
              </g>
            );
          })}

          {/* Driver lines — dim first, highlighted on top */}
          {[...dataset].reverse().map((driver) => {
            const isHighlighted =
              highlighted === null || highlighted === driver.driverId;
            const opacity = isHighlighted ? 1 : 0.1;
            const strokeWidth = isHighlighted ? (highlighted === driver.driverId ? 2.5 : 1.5) : 1;

            const polyPoints = driver.points
              .map((pts, i) => `${xOf(i)},${yOf(pts)}`)
              .join(" ");

            const lastX = xOf(totalRounds - 1);
            const lastY = yOf(driver.points[totalRounds - 1]);

            return (
              <g
                key={driver.driverId}
                style={{ opacity, cursor: "pointer", transition: "opacity 0.15s" }}
                onMouseEnter={() => setHighlighted(driver.driverId)}
                onMouseLeave={() => setHighlighted(null)}
              >
                <polyline
                  points={polyPoints}
                  fill="none"
                  stroke={driver.color}
                  strokeWidth={strokeWidth}
                  strokeLinejoin="round"
                />
                <circle cx={lastX} cy={lastY} r={isHighlighted && highlighted === driver.driverId ? 5 : 3} fill={driver.color} />
                {highlighted === driver.driverId && (
                  <text
                    x={lastX + 6}
                    y={lastY + 4}
                    fontSize={9}
                    fill={driver.color}
                    fontWeight="bold"
                  >
                    {driver.driverName.split(" ").slice(-1)[0]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {dataset.map((driver) => (
          <button
            key={driver.driverId}
            className="flex items-center gap-1.5 text-xs transition-opacity"
            style={{
              opacity:
                highlighted === null || highlighted === driver.driverId ? 1 : 0.35,
            }}
            onMouseEnter={() => setHighlighted(driver.driverId)}
            onMouseLeave={() => setHighlighted(null)}
            onClick={() =>
              setHighlighted((prev) =>
                prev === driver.driverId ? null : driver.driverId
              )
            }
          >
            <span
              className="w-5 h-1 rounded-full inline-block shrink-0"
              style={{ backgroundColor: driver.color }}
            />
            <span className="text-[#64748B] font-mono">{driver.finalPosition}위</span>
            <span className="text-[#94A3B8]">{driver.driverName}</span>
            <span className="text-[#64748B] font-mono">{driver.finalPoints}pt</span>
          </button>
        ))}
      </div>

      <p className="text-[10px] text-[#475569] mt-3">
        Jolpica(Ergast) 데이터 기준 · 범례 클릭/호버으로 드라이버 강조
      </p>
    </div>
  );
}
