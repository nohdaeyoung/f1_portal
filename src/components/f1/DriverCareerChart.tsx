"use client";

interface SeasonStat {
  season: string;
  team: string;
  position: number | null;
  wins: number;
  poles: number;
  points: number;
}

interface DriverCareerChartProps {
  stats: SeasonStat[];
  teamColor: string;
}

export function DriverCareerChart({ stats, teamColor }: DriverCareerChartProps) {
  if (stats.length < 2) return null;

  // Sort by year ascending
  const sorted = [...stats].sort((a, b) => parseInt(a.season) - parseInt(b.season));

  const W = 800, H = 200;
  const PAD = { t: 20, r: 20, b: 36, l: 52 };
  const w = W - PAD.l - PAD.r;
  const h = H - PAD.t - PAD.b;

  const points = sorted.map((s) => s.points);
  const maxPts = Math.max(...points, 1);
  const years = sorted.map((s) => parseInt(s.season));
  const minYear = years[0];
  const maxYear = years[years.length - 1];

  const xOf = (year: number) =>
    PAD.l + ((year - minYear) / Math.max(maxYear - minYear, 1)) * w;
  const yOf = (pts: number) =>
    PAD.t + h - (pts / maxPts) * h;

  // Y axis ticks: 0, 25%, 50%, 75%, 100% of max
  const yTickVals = [0, 0.25, 0.5, 0.75, 1].map((r) => Math.round(maxPts * r));

  const polyPoints = sorted.map((s) => `${xOf(parseInt(s.season))},${yOf(s.points)}`).join(" ");

  // Gradient fill area
  const areaPoints = [
    `${xOf(minYear)},${PAD.t + h}`,
    ...sorted.map((s) => `${xOf(parseInt(s.season))},${yOf(s.points)}`),
    `${xOf(maxYear)},${PAD.t + h}`,
  ].join(" ");

  return (
    <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-5">
      <p className="text-xs text-[#64748B] uppercase tracking-widest mb-4">시즌별 포인트 트렌드</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <defs>
          <linearGradient id={`grad-${teamColor.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={teamColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={teamColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Y axis grid */}
        {yTickVals.map((v) => {
          const y = yOf(v);
          return (
            <g key={v}>
              <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#1E2030" strokeWidth={1} />
              <text x={PAD.l - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#64748B">
                {v}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <polygon points={areaPoints} fill={`url(#grad-${teamColor.replace("#", "")})`} />

        {/* Line */}
        <polyline points={polyPoints} fill="none" stroke={teamColor} strokeWidth={2} strokeLinejoin="round" />

        {/* Data points */}
        {sorted.map((s) => {
          const x = xOf(parseInt(s.season));
          const y = yOf(s.points);
          const isChampion = s.position === 1;
          return (
            <g key={s.season}>
              {/* X axis label */}
              <text x={x} y={H - PAD.b + 14} textAnchor="middle" fontSize={9}
                fill={s.season === sorted[sorted.length - 1].season ? "white" : "#64748B"}
                fontWeight={s.season === sorted[sorted.length - 1].season ? "bold" : "normal"}
              >
                {s.season}
              </text>

              {/* Champion marker */}
              {isChampion && (
                <circle cx={x} cy={y} r={7} fill={teamColor} opacity={0.2} />
              )}
              <circle cx={x} cy={y} r={isChampion ? 4.5 : 3} fill={teamColor} opacity={0.9} />

              {/* Points label above dot */}
              {s.points > 0 && (
                <text x={x} y={y - 8} textAnchor="middle" fontSize={8} fill={teamColor} fontWeight="bold">
                  {s.points}
                </text>
              )}
            </g>
          );
        })}

        {/* Champion star legend */}
        {sorted.some((s) => s.position === 1) && (
          <text x={W - PAD.r} y={PAD.t + 8} textAnchor="end" fontSize={8} fill="#FCD34D">
            ● = 챔피언
          </text>
        )}
      </svg>
      <p className="text-[10px] text-[#475569] mt-2">
        Jolpica(Ergast) 데이터 기준 · 현재 진행 중인 시즌은 잠정 포인트
      </p>
    </div>
  );
}
