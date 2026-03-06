"use client";

import { useState, useEffect } from "react";

const COMPOUND_COLOR: Record<string, string> = {
  SOFT: "#E8002D", MEDIUM: "#FCD34D", HARD: "#E5E7EB",
  INTERMEDIATE: "#22C55E", WET: "#3B82F6",
};

interface PositionData { driver: string; team_color: string; positions: { lap: number; pos: number }[] }
interface Stint { Driver: string; Stint: number; Compound: string; lap_start: number; lap_end: number }
interface PitData { driver: string; lap: number }
interface PitTimeline { stints: Stint[]; pits: PitData[]; driver_order: string[]; color_map: Record<string, string>; max_lap: number }

export default function StrategyTab({
  year, gp, session, driverA, driverB,
}: {
  year: number; gp: string; session: string;
  driverA: string; driverB: string;
}) {
  const [posHistory, setPosHistory] = useState<PositionData[]>([]);
  const [strategy, setStrategy] = useState<PitTimeline | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/fastf1/position-history?year=${year}&gp=${gp}&session=${session}`).then(r => r.ok ? r.json() : []),
      fetch(`/api/fastf1/pit-timeline?year=${year}&gp=${gp}&session=${session}`).then(r => r.ok ? r.json() : null),
    ]).then(([ph, st]) => { setPosHistory(ph); setStrategy(st); }).finally(() => setLoading(false));
  }, [year, gp, session]);

  if (loading) return <div className="text-sm text-[#64748B] animate-pulse">전략 데이터 로딩 중...</div>;

  const focusDrivers = [driverA, driverB].filter(Boolean);
  const maxLap = posHistory.length ? Math.max(...posHistory.flatMap(d => d.positions.map(p => p.lap))) : 1;
  const maxPos = posHistory.length ? Math.max(...posHistory.flatMap(d => d.positions.map(p => p.pos))) : 20;

  // ── Position History ──────────────────────────────────────
  const W = 800, H = 320, PAD = { t: 10, r: 90, b: 30, l: 30 };
  const w = W - PAD.l - PAD.r, h = H - PAD.t - PAD.b;
  const xOf = (lap: number) => PAD.l + ((lap - 1) / Math.max(maxLap - 1, 1)) * w;
  const yOf = (pos: number) => PAD.t + ((pos - 1) / Math.max(maxPos - 1, 1)) * h;

  const posYTicks = [1, 5, 10, 15, maxPos].filter((v, i, a) => a.indexOf(v) === i && v <= maxPos).sort((a, b) => a - b);

  // ── Tyre Strategy ─────────────────────────────────────────
  const drivers = strategy?.driver_order.filter(d => {
    const stints = strategy.stints.filter(s => s.Driver === d);
    return stints.length > 0;
  }) ?? [];

  const ROW_H = 28, S_PAD = { t: 10, r: 10, b: 24, l: 40 };
  const SW = 800;
  const SH = drivers.length * ROW_H + S_PAD.t + S_PAD.b;
  const sMaxLap = strategy?.max_lap ?? 1;
  const sxOf = (lap: number) => S_PAD.l + ((lap - 1) / Math.max(sMaxLap - 1, 1)) * (SW - S_PAD.l - S_PAD.r);

  return (
    <div className="space-y-6">

      {/* ── Position History ── */}
      {posHistory.length > 0 && (
        <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4 space-y-3">
          <p className="text-xs text-[#64748B] uppercase tracking-widest">랩별 포지션 변화</p>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
            {/* Grid */}
            {posYTicks.map(v => {
              const y = yOf(v);
              return (
                <g key={v}>
                  <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#1E2030" strokeWidth={1} />
                  <text x={PAD.l - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#64748B">P{v}</text>
                </g>
              );
            })}
            {/* Background drivers */}
            {posHistory.filter(d => !focusDrivers.includes(d.driver)).map((d, di) => {
              const tc = d.team_color.startsWith("#") ? d.team_color : `#${d.team_color}`;
              const pts = d.positions.map(p => `${xOf(p.lap)},${yOf(p.pos)}`).join(" ");
              return pts ? <polyline key={di} points={pts} fill="none" stroke={tc} strokeWidth={0.8} opacity={0.25} /> : null;
            })}
            {/* Focus drivers */}
            {posHistory.filter(d => focusDrivers.includes(d.driver)).map((d, di) => {
              const tc = d.team_color.startsWith("#") ? d.team_color : `#${d.team_color}`;
              const pts = d.positions.map(p => `${xOf(p.lap)},${yOf(p.pos)}`).join(" ");
              const lastPos = d.positions[d.positions.length - 1];
              return (
                <g key={di}>
                  {pts && <polyline points={pts} fill="none" stroke={tc} strokeWidth={2} />}
                  {lastPos && (
                    <>
                      <circle cx={xOf(lastPos.lap)} cy={yOf(lastPos.pos)} r={4} fill={tc} />
                      <text x={xOf(lastPos.lap) + 8} y={yOf(lastPos.pos) + 4} fontSize={10} fill={tc} fontWeight="bold">
                        {d.driver}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
            {/* X axis */}
            {Array.from({ length: Math.min(Math.floor(maxLap / 10), 10) }, (_, i) => (i + 1) * 10)
              .filter(v => v <= maxLap).map(v => (
                <text key={v} x={xOf(v)} y={H - PAD.b + 14} textAnchor="middle" fontSize={9} fill="#64748B">L{v}</text>
              ))}
          </svg>
          <p className="text-[10px] text-[#475569]">누적 랩타임 기준 계산 (피트인아웃 손실 포함) — 안전카, SC 구간에서 부정확할 수 있음</p>
        </div>
      )}

      {/* ── Tyre Strategy ── */}
      {strategy && drivers.length > 0 && (
        <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#64748B] uppercase tracking-widest">타이어 전략</p>
            <div className="flex gap-3 text-[10px]">
              {Object.entries(COMPOUND_COLOR).map(([k, c]) => (
                <span key={k} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c }} />
                  {k[0]}
                </span>
              ))}
            </div>
          </div>
          <svg viewBox={`0 0 ${SW} ${SH}`} className="w-full h-auto">
            {/* Lap grid lines */}
            {Array.from({ length: Math.min(Math.floor(sMaxLap / 10), 10) }, (_, i) => (i + 1) * 10)
              .filter(v => v <= sMaxLap).map(v => {
                const x = sxOf(v);
                return (
                  <g key={v}>
                    <line x1={x} y1={S_PAD.t} x2={x} y2={SH - S_PAD.b} stroke="#1E2030" strokeWidth={1} />
                    <text x={x} y={SH - S_PAD.b + 14} textAnchor="middle" fontSize={9} fill="#64748B">L{v}</text>
                  </g>
                );
              })}
            {/* Driver rows */}
            {drivers.map((drv, di) => {
              const y = S_PAD.t + di * ROW_H;
              const tc = (strategy.color_map[drv] ?? "64748B");
              const color = tc.startsWith("#") ? tc : `#${tc}`;
              const isFocus = focusDrivers.includes(drv);
              const driverStints = strategy.stints.filter(s => s.Driver === drv);
              const driverPits = strategy.pits.filter(p => p.driver === drv);

              return (
                <g key={drv}>
                  {/* Driver label */}
                  <text x={S_PAD.l - 4} y={y + ROW_H / 2 + 4} textAnchor="end"
                    fontSize={10} fill={isFocus ? "white" : "#64748B"} fontWeight={isFocus ? "bold" : "normal"}>
                    {drv}
                  </text>
                  {/* Team color bar */}
                  <rect x={S_PAD.l - 10} y={y + 6} width={3} height={ROW_H - 12} fill={color} rx={1} />
                  {/* Stint bars */}
                  {driverStints.map((s, si) => {
                    const x1 = sxOf(s.lap_start);
                    const x2 = sxOf(s.lap_end);
                    const compColor = COMPOUND_COLOR[s.Compound] ?? "#94A3B8";
                    return (
                      <g key={si}>
                        <rect x={x1} y={y + 4} width={Math.max(x2 - x1, 2)} height={ROW_H - 8}
                          fill={compColor} opacity={isFocus ? 0.85 : 0.4} rx={2} />
                        {(x2 - x1) > 16 && (
                          <text x={(x1 + x2) / 2} y={y + ROW_H / 2 + 4}
                            textAnchor="middle" fontSize={9} fill="#0D0D14" fontWeight="bold">
                            {s.Compound[0]}
                          </text>
                        )}
                      </g>
                    );
                  })}
                  {/* Pit markers */}
                  {driverPits.map((p, pi) => {
                    const x = sxOf(p.lap);
                    return (
                      <line key={pi} x1={x} y1={y + 2} x2={x} y2={y + ROW_H - 2}
                        stroke="white" strokeWidth={1.5} opacity={0.6} />
                    );
                  })}
                </g>
              );
            })}
          </svg>
          <p className="text-[10px] text-[#475569]">흰 선 = 피트스톱 / 색 = 컴파운드 (S=빨강, M=노랑, H=흰색, I=초록, W=파랑)</p>
        </div>
      )}

      {!posHistory.length && !strategy && (
        <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl px-5 py-8 text-center text-sm text-[#64748B]">
          전략 데이터를 불러올 수 없습니다.
        </div>
      )}
    </div>
  );
}
