"use client";

import { useState, useEffect } from "react";

interface CornerData {
  num: number;
  distance: number;      // meters from lap start
  entry_speed: number;   // km/h
  apex_speed: number;    // km/h
  exit_speed: number;    // km/h
  brake_distance: number; // meters
}

function SpeedBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="tabular-nums text-white font-bold text-xs w-10 text-right">{value}</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function CornerInsightsTab({
  year, gp, session,
  driverA, driverB, colorA, colorB,
}: {
  year: number; gp: string; session: string;
  driverA: string; driverB: string; colorA: string; colorB: string;
}) {
  const [cornersA, setCornersA] = useState<CornerData[]>([]);
  const [cornersB, setCornersB] = useState<CornerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!driverA && !driverB) return;
    setLoading(true);
    setError(null);

    const base = "/api/fastf1";
    const fetches: Promise<void>[] = [];

    if (driverA) {
      fetches.push(
        fetch(`${base}/corner-insights?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}&driver=${driverA}`)
          .then((r) => (r.ok ? r.json() : []))
          .then(setCornersA)
          .catch(() => setCornersA([]))
      );
    }
    if (driverB) {
      fetches.push(
        fetch(`${base}/corner-insights?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}&driver=${driverB}`)
          .then((r) => (r.ok ? r.json() : []))
          .then(setCornersB)
          .catch(() => setCornersB([]))
      );
    }

    Promise.all(fetches)
      .catch(() => setError("데이터를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [year, gp, session, driverA, driverB]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#64748B]">
        <span className="w-3.5 h-3.5 border border-[#475569] border-t-white rounded-full animate-spin" />
        코너 데이터 분석 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-[#E8002D] bg-[#E8002D]/10 border border-[#E8002D]/30 rounded-xl px-4 py-3">
        {error}
      </div>
    );
  }

  const corners = cornersA.length > 0 ? cornersA : cornersB;
  if (corners.length === 0) {
    return (
      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl px-5 py-8 text-center text-sm text-[#64748B]">
        드라이버를 선택하면 코너 분석 데이터를 불러옵니다.
      </div>
    );
  }

  const maxEntry = Math.max(...corners.map((c) => c.entry_speed));
  const maxApex  = Math.max(...corners.map((c) => c.apex_speed));
  const maxExit  = Math.max(...corners.map((c) => c.exit_speed));
  const maxBrake = Math.max(...corners.map((c) => c.brake_distance), 1);

  // Speed trace SVG showing corner apex positions
  const W = 800, H = 140, PAD = { t: 10, r: 10, b: 30, l: 50 };
  const w = W - PAD.l - PAD.r, h = H - PAD.t - PAD.b;
  const maxDist = corners[corners.length - 1]?.distance ?? 1;
  const minApexSpeed = Math.min(...corners.map((c) => c.apex_speed));
  const maxSpeed = Math.max(...corners.map((c) => c.entry_speed));
  const speedRange = maxSpeed - minApexSpeed || 50;
  const xOf = (d: number) => PAD.l + (d / maxDist) * w;
  const yOf = (s: number) => PAD.t + h - ((s - (minApexSpeed - 20)) / (speedRange + 30)) * h;

  // Draw simplified speed trace from corner data
  const tracePoints = corners.flatMap((c) => [
    { x: xOf(Math.max(0, c.distance - 200)), y: yOf(c.entry_speed) },
    { x: xOf(c.distance), y: yOf(c.apex_speed) },
    { x: xOf(Math.min(maxDist, c.distance + 200)), y: yOf(c.exit_speed) },
  ]);
  const polyA = tracePoints.map((p) => `${p.x},${p.y}`).join(" ");

  const yTicks = [minApexSpeed - 10, minApexSpeed + (speedRange / 2), maxSpeed].map(Math.round);

  return (
    <div className="space-y-4">

      {/* Speed profile sketch */}
      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4 space-y-3">
        <p className="text-xs text-[#64748B] uppercase tracking-widest">코너별 속도 프로파일</p>
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
          {/* Sketch trace for driver A */}
          {cornersA.length > 0 && (
            <polyline points={polyA} fill="none" stroke={colorA} strokeWidth={1.5}
              strokeLinejoin="round" strokeOpacity={0.8} />
          )}
          {/* Apex markers */}
          {corners.map((c) => {
            const x = xOf(c.distance);
            const y = yOf(c.apex_speed);
            return (
              <g key={c.num}>
                <circle cx={x} cy={y} r={3} fill={colorA} opacity={0.9} />
                <text x={x} y={y - 7} textAnchor="middle" fontSize={8} fill="#94A3B8">T{c.num}</text>
              </g>
            );
          })}
          {/* Corner number x-axis */}
          {corners.map((c) => (
            <text key={c.num} x={xOf(c.distance)} y={H - PAD.b + 14}
              textAnchor="middle" fontSize={8} fill="#475569">
              {(c.distance / 1000).toFixed(1)}
            </text>
          ))}
        </svg>
        <p className="text-[10px] text-[#475569]">X축: 거리 km / Y축: 속도 km/h / T=터닝포인트(코너 최저속)</p>
      </div>

      {/* Per-corner table */}
      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#64748B] uppercase tracking-widest">코너 상세</p>
          <div className="flex gap-4 text-[10px] text-[#64748B]">
            {driverA && cornersA.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 rounded inline-block" style={{ backgroundColor: colorA }} />
                {driverA}
              </span>
            )}
            {driverB && cornersB.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 rounded inline-block" style={{ backgroundColor: colorB }} />
                {driverB}
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#64748B] uppercase tracking-wider text-[10px]">
                <th className="text-left py-2 pr-3 w-8">T</th>
                <th className="text-right py-2 px-3">거리</th>
                <th className="text-left py-2 px-3 min-w-[110px]">진입속도</th>
                <th className="text-left py-2 px-3 min-w-[110px]">최저속도</th>
                <th className="text-left py-2 px-3 min-w-[110px]">출구속도</th>
                <th className="text-right py-2 pl-3">제동거리</th>
                {cornersB.length > 0 && (
                  <>
                    <th className="text-left py-2 px-3 min-w-[110px]" style={{ color: colorB }}>최저 ({driverB})</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {corners.map((c, i) => {
                const cb = cornersB[i];
                const apexDiff = cb ? c.apex_speed - cb.apex_speed : null;
                return (
                  <tr key={c.num} className="border-t border-[#1E2030]">
                    <td className="py-2.5 pr-3 font-mono font-black text-[#E8002D]">T{c.num}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#64748B]">
                      {(c.distance / 1000).toFixed(2)} km
                    </td>
                    <td className="py-2.5 px-3">
                      <SpeedBar value={c.entry_speed} max={maxEntry} color={colorA} />
                    </td>
                    <td className="py-2.5 px-3">
                      <SpeedBar value={c.apex_speed} max={maxApex} color={colorA} />
                    </td>
                    <td className="py-2.5 px-3">
                      <SpeedBar value={c.exit_speed} max={maxExit} color={colorA} />
                    </td>
                    <td className="py-2.5 pl-3 text-right tabular-nums text-[#94A3B8]">
                      {c.brake_distance > 0 ? `${c.brake_distance}m` : "—"}
                    </td>
                    {cornersB.length > 0 && (
                      <td className="py-2.5 px-3">
                        {cb ? (
                          <div className="flex items-center gap-2">
                            <span className="tabular-nums font-bold text-xs w-10 text-right" style={{ color: colorB }}>{cb.apex_speed}</span>
                            {apexDiff !== null && (
                              <span className={`text-[10px] tabular-nums ${apexDiff > 0 ? "text-[#22C55E]" : apexDiff < 0 ? "text-[#E8002D]" : "text-[#64748B]"}`}>
                                {apexDiff > 0 ? "+" : ""}{apexDiff}
                              </span>
                            )}
                          </div>
                        ) : "—"}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-[#475569]">
          FastF1 패스티스트 랩 기준 · 제동거리: 브레이크 시작~최저속 구간 · 코너는 속도 최저점 기준 자동 탐지
        </p>
      </div>
    </div>
  );
}
