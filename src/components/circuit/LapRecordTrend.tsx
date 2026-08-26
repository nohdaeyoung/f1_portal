"use client";

import { useState, useEffect } from "react";

interface TrendPoint {
  year: number;
  driver: string;
  team_color: string;
  time: number;
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(3).padStart(6, "0");
  return `${m}:${s}`;
}

export default function LapRecordTrend({ gpName }: { gpName: string }) {
  const [data, setData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_FASTF1_API_URL ?? "/api/fastf1";
    fetch(`${base}/lap-record-trend?gp=${encodeURIComponent(gpName)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [gpName]);

  if (loading) {
    return (
      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6">
        <p className="text-xs text-[#64748B] uppercase tracking-widest mb-4">연도별 랩타임 트렌드</p>
        <div className="flex items-center gap-2 text-sm text-[#64748B]">
          <span className="w-4 h-4 border border-[#475569] border-t-[#E8002D] rounded-full animate-spin" />
          데이터 로딩 중...
        </div>
      </div>
    );
  }

  if (data.length === 0) return null;

  // SVG dimensions
  const W = 800, H = 220;
  const PAD = { t: 20, r: 20, b: 40, l: 60 };
  const w = W - PAD.l - PAD.r;
  const h = H - PAD.t - PAD.b;

  const years = data.map((d) => d.year);
  const times = data.map((d) => d.time);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const minT = Math.min(...times) - 0.5;
  const maxT = Math.max(...times) + 0.5;

  const xOf = (year: number) =>
    PAD.l + ((year - minYear) / Math.max(maxYear - minYear, 1)) * w;
  const yOf = (t: number) =>
    PAD.t + h - ((t - minT) / (maxT - minT)) * h;

  // Y-axis ticks (every ~1 sec)
  const range = maxT - minT;
  const tickStep = range > 5 ? 2 : 1;
  const yTickStart = Math.ceil(minT / tickStep) * tickStep;
  const yTicks: number[] = [];
  for (let v = yTickStart; v <= maxT; v += tickStep) yTicks.push(v);

  const polyPoints = data.map((d) => `${xOf(d.year)},${yOf(d.time)}`).join(" ");

  return (
    <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6">
      <p className="text-xs text-[#64748B] uppercase tracking-widest mb-4">
        연도별 패스티스트 랩 트렌드
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* Y grid + labels */}
        {yTicks.map((v) => {
          const y = yOf(v);
          return (
            <g key={v}>
              <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#1E2030" strokeWidth={1} />
              <text x={PAD.l - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#64748B">
                {fmtTime(v)}
              </text>
            </g>
          );
        })}

        {/* Trend line */}
        <polyline
          points={polyPoints}
          fill="none"
          stroke="#E8002D"
          strokeWidth={1.5}
          strokeOpacity={0.5}
          strokeDasharray="4,3"
        />

        {/* Data points + labels */}
        {data.map((d, i) => {
          const x = xOf(d.year);
          const y = yOf(d.time);
          const tc = d.team_color.startsWith("#") ? d.team_color : `#${d.team_color}`;
          const isFirst = i === 0;
          const isLast = i === data.length - 1;
          // Avoid label overlap: alternate above/below
          const labelY = i % 2 === 0 ? y - 14 : y + 20;

          return (
            <g key={d.year}>
              {/* Year label on x-axis */}
              <text
                x={x}
                y={H - PAD.b + 14}
                textAnchor="middle"
                fontSize={9}
                fill={isLast ? "white" : "#64748B"}
                fontWeight={isLast ? "bold" : "normal"}
              >
                {d.year}
              </text>

              {/* Dot */}
              <circle cx={x} cy={y} r={isLast ? 5 : 3.5} fill={tc} opacity={0.9} />
              {isLast && (
                <circle cx={x} cy={y} r={8} fill={tc} opacity={0.15} />
              )}

              {/* Driver + time label */}
              <text x={x} y={labelY} textAnchor="middle" fontSize={9} fill={tc} fontWeight="bold">
                {d.driver}
              </text>
              <text x={x} y={labelY + 11} textAnchor="middle" fontSize={8} fill="#94A3B8">
                {fmtTime(d.time)}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="text-[10px] text-[#475569] mt-2">
        레이스 최고 랩타임 기준 · FastF1 데이터 (2018~) · 처음 로딩 시 수 분 소요될 수 있음
      </p>
    </div>
  );
}
