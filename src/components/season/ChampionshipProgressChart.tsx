import type { ChampionshipProgress } from "@/lib/data/live";

interface Props {
  data: ChampionshipProgress[];
  rounds: number[];   // completed round numbers
}

export function ChampionshipProgressChart({ data, rounds }: Props) {
  if (data.length === 0 || rounds.length === 0) return null;

  const W = 800, H = 220;
  const PAD = { t: 20, r: 140, b: 36, l: 52 };
  const w = W - PAD.l - PAD.r;
  const h = H - PAD.t - PAD.b;

  const maxPts = Math.max(...data.flatMap((d) => d.points.filter((p) => p != null) as number[]), 1);
  const minRound = rounds[0];
  const maxRound = rounds[rounds.length - 1];

  const xOf = (round: number) =>
    PAD.l + ((round - minRound) / Math.max(maxRound - minRound, 1)) * w;
  const yOf = (pts: number) => PAD.t + h - (pts / maxPts) * h;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((r) => Math.round(maxPts * r));

  return (
    <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-5">
      <p className="text-xs text-[#64748B] uppercase tracking-widest mb-4">챔피언십 포인트 추이 (Top 10)</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* Y grid */}
        {yTicks.map((v) => {
          const y = yOf(v);
          return (
            <g key={v}>
              <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#1E2030" strokeWidth={1} />
              <text x={PAD.l - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#64748B">{v}</text>
            </g>
          );
        })}

        {/* X axis labels */}
        {rounds.map((r) => (
          <text key={r} x={xOf(r)} y={H - PAD.b + 14} textAnchor="middle" fontSize={9} fill="#64748B">
            R{r}
          </text>
        ))}

        {/* Lines per driver */}
        {data.map((driver) => {
          const validPts = driver.points
            .map((p, i) => (p != null ? { x: xOf(rounds[i]), y: yOf(p), pts: p } : null))
            .filter(Boolean) as { x: number; y: number; pts: number }[];

          if (validPts.length === 0) return null;

          const polyline = validPts.map((pt) => `${pt.x},${pt.y}`).join(" ");
          const last = validPts[validPts.length - 1];

          return (
            <g key={driver.driverId}>
              <polyline
                points={polyline}
                fill="none"
                stroke={driver.teamColor}
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeOpacity={0.85}
              />
              {/* Last dot */}
              <circle cx={last.x} cy={last.y} r={3} fill={driver.teamColor} />
              {/* Driver label on right */}
              <text
                x={W - PAD.r + 6}
                y={last.y + 4}
                fontSize={9}
                fill={driver.teamColor}
              >
                {driver.driverName.split(" ").pop()}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="text-[10px] text-[#475569] mt-2">Jolpica(Ergast) 데이터 기준 · 라운드별 누적 포인트</p>
    </div>
  );
}
