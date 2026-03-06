"use client";

import { useState, useEffect } from "react";

interface SpeedPoint { X: number; Y: number; Speed: number | null }

function speedToColor(speed: number, minSpeed: number, maxSpeed: number): string {
  const t = Math.max(0, Math.min(1, (speed - minSpeed) / (maxSpeed - minSpeed)));
  // blue(240) → cyan(180) → green(120) → yellow(60) → red(0)
  const hue = Math.round(240 - t * 240);
  return `hsl(${hue},100%,55%)`;
}

export default function SpeedMapTab({
  year, gp, session, driverA, driverB, colorA, colorB,
}: {
  year: number; gp: string; session: string;
  driverA: string; driverB: string; colorA: string; colorB: string;
}) {
  const [dataA, setDataA] = useState<SpeedPoint[]>([]);
  const [dataB, setDataB] = useState<SpeedPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeMap, setActiveMap] = useState<"A" | "B">("A");

  useEffect(() => {
    const drv = activeMap === "A" ? driverA : driverB;
    if (!drv) return;
    setLoading(true);
    fetch(`/api/fastf1/speed-map?year=${year}&gp=${gp}&session=${session}&driver=${drv}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (activeMap === "A") setDataA(data);
        else setDataB(data);
      })
      .finally(() => setLoading(false));
  }, [year, gp, session, driverA, driverB, activeMap]);

  const data = activeMap === "A" ? dataA : dataB;
  const teamColor = activeMap === "A" ? colorA : colorB;
  const driverName = activeMap === "A" ? driverA : driverB;

  // Normalize coordinates for SVG
  const validPoints = data.filter(p => p.X != null && p.Y != null && p.Speed != null);
  const W = 500, H = 380, PAD = 24;

  let svgContent = null;
  if (validPoints.length > 1) {
    const xs = validPoints.map(p => p.X);
    const ys = validPoints.map(p => p.Y);
    const speeds = validPoints.map(p => p.Speed!);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const minSpeed = Math.min(...speeds), maxSpeed = Math.max(...speeds);
    const rangeX = maxX - minX || 1, rangeY = maxY - minY || 1;
    const scale = Math.min((W - PAD * 2) / rangeX, (H - PAD * 2) / rangeY);

    const toSVG = (p: SpeedPoint) => ({
      x: PAD + (p.X - minX) * scale,
      y: H - PAD - (p.Y - minY) * scale,
      speed: p.Speed!,
    });

    const mapped = validPoints.map(toSVG);

    // Draw short colored segments between consecutive points
    const segments = mapped.slice(0, -1).map((p, i) => {
      const next = mapped[i + 1];
      const color = speedToColor(p.speed, minSpeed, maxSpeed);
      return { x1: p.x, y1: p.y, x2: next.x, y2: next.y, color };
    });

    // Speed legend ticks
    const legendTicks = [minSpeed, minSpeed + (maxSpeed - minSpeed) * 0.25,
      minSpeed + (maxSpeed - minSpeed) * 0.5, minSpeed + (maxSpeed - minSpeed) * 0.75, maxSpeed];

    svgContent = (
      <svg viewBox={`0 0 ${W} ${H + 40}`} className="w-full h-auto">
        {segments.map((s, i) => (
          <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke={s.color} strokeWidth={2.5} strokeLinecap="round" />
        ))}
        {/* Start/finish marker */}
        <circle cx={mapped[0].x} cy={mapped[0].y} r={5} fill="white" opacity={0.8} />
        <text x={mapped[0].x + 8} y={mapped[0].y + 4} fontSize={9} fill="white" opacity={0.8}>S/F</text>

        {/* Speed legend */}
        {legendTicks.map((v, i) => {
          const lx = 20 + (i / (legendTicks.length - 1)) * (W - 40);
          const color = speedToColor(v, minSpeed, maxSpeed);
          return (
            <g key={i}>
              <rect x={lx - 12} y={H + 10} width={24} height={10} fill={color} rx={2} />
              <text x={lx} y={H + 34} textAnchor="middle" fontSize={9} fill="#64748B">{Math.round(v)}</text>
            </g>
          );
        })}
        <text x={W / 2} y={H + 44} textAnchor="middle" fontSize={9} fill="#475569">km/h</text>
      </svg>
    );
  }

  return (
    <div className="space-y-4">
      {/* Driver toggle */}
      <div className="flex gap-2">
        {[
          { key: "A" as const, drv: driverA, color: colorA },
          { key: "B" as const, drv: driverB, color: colorB },
        ].filter(d => d.drv).map(d => (
          <button key={d.key}
            onClick={() => setActiveMap(d.key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeMap === d.key ? "bg-white/10 text-white" : "bg-white/5 text-[#64748B] hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
            {d.drv}
          </button>
        ))}
      </div>

      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <p className="text-xs text-[#64748B] uppercase tracking-widest">속도 히트맵</p>
          {driverName && (
            <span className="text-xs font-bold" style={{ color: teamColor }}>{driverName} 패스티스트 랩</span>
          )}
        </div>

        {loading && (
          <div className="text-sm text-[#64748B] animate-pulse">
            속도 데이터 로딩 중... (첫 요청 시 시간이 걸릴 수 있습니다)
          </div>
        )}

        {!loading && validPoints.length > 0 && svgContent}

        {!loading && validPoints.length === 0 && (
          <div className="flex items-center justify-center h-48 text-sm text-[#64748B]">
            위치 데이터를 불러올 수 없습니다.
          </div>
        )}

        <p className="text-[10px] text-[#475569]">
          파랑 = 저속 구간 / 초록 = 중속 / 노랑 = 고속 / 빨강 = 최고속 · 흰 점 = 스타트/피니시
        </p>
      </div>

      {/* Side-by-side if both loaded */}
      {dataA.length > 0 && dataB.length > 0 && driverA && driverB && (
        <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4 space-y-3">
          <p className="text-xs text-[#64748B] uppercase tracking-widest">서킷 비교</p>
          <div className="grid grid-cols-2 gap-4">
            {[{ data: dataA, color: colorA, name: driverA }, { data: dataB, color: colorB, name: driverB }].map((d, idx) => {
              const vp = d.data.filter(p => p.X != null && p.Y != null && p.Speed != null);
              if (!vp.length) return null;
              const xs = vp.map(p => p.X), ys = vp.map(p => p.Y);
              const speeds = vp.map(p => p.Speed!);
              const minX = Math.min(...xs), maxX = Math.max(...xs);
              const minY = Math.min(...ys), maxY = Math.max(...ys);
              const minS = Math.min(...speeds), maxS = Math.max(...speeds);
              const rX = maxX - minX || 1, rY = maxY - minY || 1;
              const CW = 280, CH = 200, CP = 16;
              const sc = Math.min((CW - CP * 2) / rX, (CH - CP * 2) / rY);
              const pts = vp.map(p => `${CP + (p.X - minX) * sc},${CH - CP - (p.Y - minY) * sc}`).join(" ");
              return (
                <div key={idx} className="space-y-1">
                  <p className="text-xs font-bold" style={{ color: d.color }}>{d.name}</p>
                  <svg viewBox={`0 0 ${CW} ${CH}`} className="w-full h-auto">
                    {vp.slice(0, -1).map((p, i) => {
                      const next = vp[i + 1];
                      const x1 = CP + (p.X - minX) * sc, y1 = CH - CP - (p.Y - minY) * sc;
                      const x2 = CP + (next.X - minX) * sc, y2 = CH - CP - (next.Y - minY) * sc;
                      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke={speedToColor(p.Speed!, minS, maxS)} strokeWidth={2} strokeLinecap="round" />;
                    })}
                  </svg>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
