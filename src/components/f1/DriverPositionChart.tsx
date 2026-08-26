"use client";

interface SeasonStat {
  season: string;
  position: number | null;
}

interface Props {
  stats: SeasonStat[];
  teamColor: string;
}

export function DriverPositionChart({ stats, teamColor }: Props) {
  const sorted = [...stats]
    .sort((a, b) => parseInt(a.season) - parseInt(b.season))
    .filter((s) => s.position !== null);

  if (sorted.length < 2) return null;

  const W = 800;
  const H = 160;
  const PAD = { t: 20, r: 20, b: 36, l: 42 };
  const w = W - PAD.l - PAD.r;
  const h = H - PAD.t - PAD.b;

  const positions = sorted.map((s) => s.position as number);
  const maxPos = Math.max(...positions, 5); // at least 5 for Y scale
  const years = sorted.map((s) => parseInt(s.season));
  const minYear = years[0];
  const maxYear = years[years.length - 1];

  // x position for a year
  const xOf = (year: number) =>
    PAD.l + ((year - minYear) / Math.max(maxYear - minYear, 1)) * w;

  // y position — inverted: 1st = top
  const yOf = (pos: number) =>
    PAD.t + ((pos - 1) / Math.max(maxPos - 1, 1)) * h;

  const polyPoints = sorted
    .map((s) => `${xOf(parseInt(s.season))},${yOf(s.position!)}`)
    .join(" ");

  // Y axis ticks
  const yTicks = [1, 3, 5, 10, 15, 20].filter((v) => v <= maxPos + 2);

  return (
    <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-5">
      <p className="text-xs text-[#64748B] uppercase tracking-widest mb-4">
        시즌별 챔피언십 순위 추이
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* Y grid */}
        {yTicks.map((pos) => {
          const y = yOf(pos);
          if (y < PAD.t - 4 || y > PAD.t + h + 4) return null;
          return (
            <g key={pos}>
              <line
                x1={PAD.l}
                y1={y}
                x2={W - PAD.r}
                y2={y}
                stroke="#1E2030"
                strokeWidth={1}
              />
              <text
                x={PAD.l - 6}
                y={y + 4}
                textAnchor="end"
                fontSize={9}
                fill="#64748B"
              >
                {pos}위
              </text>
            </g>
          );
        })}

        {/* Line */}
        <polyline
          points={polyPoints}
          fill="none"
          stroke={teamColor}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Data points */}
        {sorted.map((s) => {
          const x = xOf(parseInt(s.season));
          const y = yOf(s.position!);
          const isChampion = s.position === 1;
          const isLast = s.season === sorted[sorted.length - 1].season;
          return (
            <g key={s.season}>
              <text
                x={x}
                y={H - PAD.b + 14}
                textAnchor="middle"
                fontSize={9}
                fill={isLast ? "white" : "#64748B"}
                fontWeight={isLast ? "bold" : "normal"}
              >
                {s.season}
              </text>
              {isChampion && (
                <circle cx={x} cy={y} r={8} fill={teamColor} opacity={0.2} />
              )}
              <circle
                cx={x}
                cy={y}
                r={isChampion ? 4.5 : 3}
                fill={teamColor}
                opacity={0.9}
              />
              <text
                x={x}
                y={y - 8}
                textAnchor="middle"
                fontSize={8}
                fill={teamColor}
                fontWeight="bold"
              >
                {s.position}
              </text>
            </g>
          );
        })}

        {/* Champion legend */}
        {sorted.some((s) => s.position === 1) && (
          <text
            x={W - PAD.r}
            y={PAD.t + 8}
            textAnchor="end"
            fontSize={8}
            fill="#FCD34D"
          >
            ● = 챔피언
          </text>
        )}
      </svg>
      <p className="text-[10px] text-[#475569] mt-2">
        낮은 숫자일수록 높은 순위 · Jolpica 데이터 기준
      </p>
    </div>
  );
}
