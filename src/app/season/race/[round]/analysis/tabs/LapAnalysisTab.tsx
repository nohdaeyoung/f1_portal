"use client";

import { useState, useEffect } from "react";

const COMPOUND_COLOR: Record<string, string> = {
  SOFT: "#E8002D", MEDIUM: "#FCD34D", HARD: "#E5E7EB",
  INTERMEDIATE: "#22C55E", WET: "#3B82F6",
};

function fmtSec(s: number | null) {
  if (s == null) return "—";
  const m = Math.floor(s / 60);
  const rem = (s % 60).toFixed(3).padStart(6, "0");
  return `${m}:${rem}`;
}

interface LapRow {
  Driver: string; LapNumber: number; LapTime: number | null;
  Sector1Time: number | null; Sector2Time: number | null; Sector3Time: number | null;
  Compound: string; TyreLife: number | null; Stint: number;
  IsAccurate: boolean; IsPersonalBest: boolean;
  PitInTime: number | null; team_color: string;
}

interface SectorRow {
  driver: string; team_color: string;
  s1_best: number | null; s2_best: number | null; s3_best: number | null;
  fastest_lap: number | null; theoretical: number | null;
}

export default function LapAnalysisTab({
  year, gp, session, driverA, driverB, colorA, colorB,
}: {
  year: number; gp: string; session: string;
  driverA: string; driverB: string; colorA: string; colorB: string;
}) {
  const [laps, setLaps] = useState<LapRow[]>([]);
  const [sectors, setSectors] = useState<SectorRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driverA && !driverB) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/fastf1/lap-times-all?year=${year}&gp=${gp}&session=${session}`).then(r => r.ok ? r.json() : []),
      fetch(`/api/fastf1/sector-best?year=${year}&gp=${gp}&session=${session}`).then(r => r.ok ? r.json() : []),
    ]).then(([l, s]) => { setLaps(l); setSectors(s); }).finally(() => setLoading(false));
  }, [year, gp, session, driverA, driverB]);

  if (loading) return <div className="text-sm text-[#64748B] animate-pulse">랩 분석 데이터 로딩 중...</div>;

  const focusDrivers = [driverA, driverB].filter(Boolean);

  // ── Lap time scatter ──────────────────────────────────────
  const validLaps = laps.filter(l => l.LapTime != null && l.IsAccurate);
  const maxLap = validLaps.length ? Math.max(...validLaps.map(l => l.LapNumber)) : 1;
  const lapTimes = validLaps.map(l => l.LapTime!);
  const minT = lapTimes.length ? Math.min(...lapTimes) : 80;
  const maxT = lapTimes.length ? Math.max(...lapTimes) : 120;
  const padT = (maxT - minT) * 0.05 || 1;
  const W = 800, H = 180, PAD = { t: 10, r: 10, b: 30, l: 52 };
  const w = W - PAD.l - PAD.r, h = H - PAD.t - PAD.b;
  const xOf = (lap: number) => PAD.l + ((lap - 1) / Math.max(maxLap - 1, 1)) * w;
  const yOf = (t: number) => PAD.t + h - ((t - (minT - padT)) / ((maxT + padT) - (minT - padT))) * h;

  // Y axis ticks
  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount }, (_, i) => minT - padT + ((maxT + padT - (minT - padT)) / (tickCount - 1)) * i);

  // ── Tyre degradation (per-stint lap times, selected drivers only) ──
  interface StintGroup { driver: string; stint: number; compound: string; color: string; laps: { x: number; y: number }[] }
  const stintMap: Record<string, Record<number, StintGroup>> = {};
  for (const l of validLaps) {
    if (!focusDrivers.includes(l.Driver)) continue;
    if (!stintMap[l.Driver]) stintMap[l.Driver] = {};
    if (!stintMap[l.Driver][l.Stint]) {
      stintMap[l.Driver][l.Stint] = {
        driver: l.Driver, stint: l.Stint, compound: l.Compound,
        color: COMPOUND_COLOR[l.Compound] ?? "#94A3B8", laps: [],
      };
    }
    stintMap[l.Driver][l.Stint].laps.push({ x: l.TyreLife ?? 0, y: l.LapTime! });
  }
  const stintGroups = Object.values(stintMap).flatMap(d => Object.values(d));
  const maxTL = stintGroups.length ? Math.max(...stintGroups.flatMap(g => g.laps.map(l => l.x))) : 1;
  const degTimes = stintGroups.flatMap(g => g.laps.map(l => l.y));
  const degMin = degTimes.length ? Math.min(...degTimes) : 80;
  const degMax = degTimes.length ? Math.max(...degTimes) : 120;
  const degPad = (degMax - degMin) * 0.08 || 1;
  const DW = 800, DH = 160, DP = { t: 10, r: 10, b: 30, l: 52 };
  const dw = DW - DP.l - DP.r, dh = DH - DP.t - DP.b;
  const dxOf = (x: number) => DP.l + (x / Math.max(maxTL, 1)) * dw;
  const dyOf = (y: number) => DP.t + dh - ((y - (degMin - degPad)) / ((degMax + degPad) - (degMin - degPad))) * dh;

  return (
    <div className="space-y-6">

      {/* ── Lap Time Scatter ── */}
      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#64748B] uppercase tracking-widest">랩타임 분포</p>
          <div className="flex gap-3 text-[10px]">
            {Object.entries(COMPOUND_COLOR).map(([k, c]) => (
              <span key={k} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                {k[0]}
              </span>
            ))}
          </div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          {yTicks.map((v) => {
            const y = yOf(v);
            return (
              <g key={v}>
                <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#1E2030" strokeWidth={1} />
                <text x={PAD.l - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#64748B">{fmtSec(v)}</text>
              </g>
            );
          })}
          {/* Background drivers (grey) */}
          {validLaps.filter(l => !focusDrivers.includes(l.Driver)).map((l, i) => (
            <circle key={i} cx={xOf(l.LapNumber)} cy={yOf(l.LapTime!)}
              r={2} fill={COMPOUND_COLOR[l.Compound] ?? "#94A3B8"} opacity={0.2} />
          ))}
          {/* Focus drivers */}
          {validLaps.filter(l => focusDrivers.includes(l.Driver)).map((l, i) => (
            <circle key={i} cx={xOf(l.LapNumber)} cy={yOf(l.LapTime!)}
              r={l.IsPersonalBest ? 4 : 3}
              fill={COMPOUND_COLOR[l.Compound] ?? "#94A3B8"}
              stroke={l.Driver === driverA ? colorA : colorB}
              strokeWidth={l.IsPersonalBest ? 1.5 : 0.5}
              opacity={0.85}
            />
          ))}
          {/* Pit markers */}
          {validLaps.filter(l => focusDrivers.includes(l.Driver) && l.PitInTime != null).map((l, i) => (
            <line key={`pit-${i}`} x1={xOf(l.LapNumber)} y1={PAD.t} x2={xOf(l.LapNumber)} y2={H - PAD.b}
              stroke="#475569" strokeWidth={1} strokeDasharray="3,3" />
          ))}
          {/* X axis labels */}
          {Array.from({ length: Math.min(Math.floor(maxLap / 10), 10) }, (_, i) => (i + 1) * 10).filter(v => v <= maxLap).map(v => (
            <text key={v} x={xOf(v)} y={H - PAD.b + 14} textAnchor="middle" fontSize={9} fill="#64748B">L{v}</text>
          ))}
        </svg>
        <p className="text-[10px] text-[#475569]">테두리 색: 드라이버 팀컬러 / 큰 원: 퍼스널 베스트 / 점선: 피트스톱</p>
      </div>

      {/* ── Sector Best Table ── */}
      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4 space-y-3">
        <p className="text-xs text-[#64748B] uppercase tracking-widest">섹터별 최고 기록</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#64748B] uppercase tracking-wider">
                <th className="text-left py-2 pr-4">드라이버</th>
                <th className="text-right py-2 px-3">S1</th>
                <th className="text-right py-2 px-3">S2</th>
                <th className="text-right py-2 px-3">S3</th>
                <th className="text-right py-2 px-3">패스티스트</th>
                <th className="text-right py-2 pl-3">이론값</th>
              </tr>
            </thead>
            <tbody>
              {sectors.map((s, i) => {
                const isFocus = focusDrivers.includes(s.driver);
                const tc = s.team_color.startsWith("#") ? s.team_color : `#${s.team_color}`;
                return (
                  <tr key={i} className={`border-t border-[#1E2030] ${isFocus ? "bg-white/[0.02]" : ""}`}>
                    <td className="py-2 pr-4 flex items-center gap-2">
                      <span className="w-1.5 h-4 rounded-full" style={{ backgroundColor: tc }} />
                      <span className={`font-bold ${isFocus ? "text-white" : "text-[#64748B]"}`}>{s.driver}</span>
                    </td>
                    <td className="text-right py-2 px-3 tabular-nums text-[#94A3B8]">{fmtSec(s.s1_best)}</td>
                    <td className="text-right py-2 px-3 tabular-nums text-[#94A3B8]">{fmtSec(s.s2_best)}</td>
                    <td className="text-right py-2 px-3 tabular-nums text-[#94A3B8]">{fmtSec(s.s3_best)}</td>
                    <td className="text-right py-2 px-3 tabular-nums text-white font-bold">{fmtSec(s.fastest_lap)}</td>
                    <td className="text-right py-2 pl-3 tabular-nums text-[#A855F7]">{fmtSec(s.theoretical)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-[#475569]">이론값 = S1 + S2 + S3 베스트의 합 (실현 가능한 최고 랩타임)</p>
      </div>

      {/* ── Tyre Degradation ── */}
      {stintGroups.length > 0 && (
        <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#64748B] uppercase tracking-widest">타이어 열화 곡선</p>
            <div className="flex gap-3 text-[10px] text-[#64748B]">
              {stintGroups.map((g, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="w-2 h-0.5 rounded" style={{ backgroundColor: g.color, display: "inline-block" }} />
                  {g.driver} S{g.stint} ({g.compound[0]})
                </span>
              ))}
            </div>
          </div>
          <svg viewBox={`0 0 ${DW} ${DH}`} className="w-full h-auto">
            {Array.from({ length: 5 }, (_, i) => {
              const v = degMin - degPad + ((degMax + degPad - (degMin - degPad)) / 4) * i;
              const y = dyOf(v);
              return (
                <g key={i}>
                  <line x1={DP.l} y1={y} x2={DW - DP.r} y2={y} stroke="#1E2030" strokeWidth={1} />
                  <text x={DP.l - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#64748B">{fmtSec(v)}</text>
                </g>
              );
            })}
            {stintGroups.map((g, gi) => {
              const sorted = [...g.laps].sort((a, b) => a.x - b.x);
              const pts = sorted.map(l => `${dxOf(l.x)},${dyOf(l.y)}`).join(" ");
              const driverColor = g.driver === driverA ? colorA : colorB;
              return (
                <g key={gi}>
                  <polyline points={pts} fill="none" stroke={g.color} strokeWidth={1.5}
                    strokeOpacity={0.5} strokeDasharray={g.driver === driverB ? "4,2" : undefined} />
                  {sorted.map((l, pi) => (
                    <circle key={pi} cx={dxOf(l.x)} cy={dyOf(l.y)} r={2.5}
                      fill={g.color} stroke={driverColor} strokeWidth={0.8} opacity={0.8} />
                  ))}
                </g>
              );
            })}
            {Array.from({ length: Math.min(Math.floor(maxTL / 5), 8) }, (_, i) => (i + 1) * 5).filter(v => v <= maxTL).map(v => (
              <text key={v} x={dxOf(v)} y={DH - DP.b + 14} textAnchor="middle" fontSize={9} fill="#64748B">+{v}랩</text>
            ))}
          </svg>
          <p className="text-[10px] text-[#475569]">실선 = 드라이버A / 점선 = 드라이버B / 점 색상 = 컴파운드</p>
        </div>
      )}
    </div>
  );
}
