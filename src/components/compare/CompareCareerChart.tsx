"use client";

interface SeasonStat {
  season: string;
  team: string;
  position: number | null;
  wins: number;
  poles: number;
  points: number;
}

interface Props {
  statsA: SeasonStat[];
  statsB: SeasonStat[];
  colorA: string;
  colorB: string;
  nameA: string;
  nameB: string;
}

export function CompareCareerChart({ statsA, statsB, colorA, colorB, nameA, nameB }: Props) {
  if (statsA.length === 0 && statsB.length === 0) return null;

  const sortedA = [...statsA].sort((a, b) => parseInt(a.season) - parseInt(b.season));
  const sortedB = [...statsB].sort((a, b) => parseInt(a.season) - parseInt(b.season));

  const allYears = Array.from(
    new Set([...sortedA, ...sortedB].map((s) => parseInt(s.season)))
  ).sort((a, b) => a - b);

  if (allYears.length === 0) return null;

  const minYear = allYears[0];
  const maxYear = allYears[allYears.length - 1];
  const maxPts = Math.max(...[...sortedA, ...sortedB].map((s) => s.points), 1);

  const W = 800, H = 200;
  const PAD = { t: 20, r: 20, b: 36, l: 52 };
  const w = W - PAD.l - PAD.r;
  const h = H - PAD.t - PAD.b;

  const xOf = (year: number) =>
    PAD.l + ((year - minYear) / Math.max(maxYear - minYear, 1)) * w;
  const yOf = (pts: number) => PAD.t + h - (pts / maxPts) * h;

  const yTickVals = [0, 0.25, 0.5, 0.75, 1].map((r) => Math.round(maxPts * r));

  const polyA = sortedA.map((s) => `${xOf(parseInt(s.season))},${yOf(s.points)}`).join(" ");
  const polyB = sortedB.map((s) => `${xOf(parseInt(s.season))},${yOf(s.points)}`).join(" ");

  const areaA = [
    `${xOf(parseInt(sortedA[0]?.season ?? String(minYear)))},${PAD.t + h}`,
    ...sortedA.map((s) => `${xOf(parseInt(s.season))},${yOf(s.points)}`),
    `${xOf(parseInt(sortedA[sortedA.length - 1]?.season ?? String(maxYear)))},${PAD.t + h}`,
  ].join(" ");

  const areaB = [
    `${xOf(parseInt(sortedB[0]?.season ?? String(minYear)))},${PAD.t + h}`,
    ...sortedB.map((s) => `${xOf(parseInt(s.season))},${yOf(s.points)}`),
    `${xOf(parseInt(sortedB[sortedB.length - 1]?.season ?? String(maxYear)))},${PAD.t + h}`,
  ].join(" ");

  // shared seasons
  const seasonsA = new Set(sortedA.map((s) => s.season));
  const seasonsB = new Set(sortedB.map((s) => s.season));
  const sharedYears = allYears.filter((y) => seasonsA.has(String(y)) && seasonsB.has(String(y)));

  return (
    <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-[#64748B] uppercase tracking-widest">시즌별 포인트 트렌드</p>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded inline-block" style={{ backgroundColor: colorA }} />
            <span style={{ color: colorA }}>{nameA}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded inline-block" style={{ backgroundColor: colorB }} />
            <span style={{ color: colorB }}>{nameB}</span>
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <defs>
          <linearGradient id={`gradA-${colorA.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colorA} stopOpacity="0.2" />
            <stop offset="100%" stopColor={colorA} stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id={`gradB-${colorB.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colorB} stopOpacity="0.2" />
            <stop offset="100%" stopColor={colorB} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Shared season highlights */}
        {sharedYears.map((y) => {
          const x = xOf(y);
          const xStep = allYears.length > 1 ? w / Math.max(maxYear - minYear, 1) : w;
          return (
            <rect
              key={y}
              x={x - xStep * 0.4}
              y={PAD.t}
              width={xStep * 0.8}
              height={h}
              fill="white"
              fillOpacity={0.03}
            />
          );
        })}

        {/* Y axis grid */}
        {yTickVals.map((v) => {
          const y = yOf(v);
          return (
            <g key={v}>
              <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#1E2030" strokeWidth={1} />
              <text x={PAD.l - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#64748B">{v}</text>
            </g>
          );
        })}

        {/* X axis labels */}
        {allYears.map((y) => (
          <text
            key={y}
            x={xOf(y)}
            y={H - PAD.b + 14}
            textAnchor="middle"
            fontSize={9}
            fill="#64748B"
          >
            {y}
          </text>
        ))}

        {/* Area fills */}
        {sortedA.length > 0 && <polygon points={areaA} fill={`url(#gradA-${colorA.replace("#", "")})`} />}
        {sortedB.length > 0 && <polygon points={areaB} fill={`url(#gradB-${colorB.replace("#", "")})`} />}

        {/* Lines */}
        {sortedA.length > 1 && (
          <polyline points={polyA} fill="none" stroke={colorA} strokeWidth={2} strokeLinejoin="round" />
        )}
        {sortedB.length > 1 && (
          <polyline points={polyB} fill="none" stroke={colorB} strokeWidth={2} strokeLinejoin="round" />
        )}

        {/* Dots A */}
        {sortedA.map((s) => {
          const x = xOf(parseInt(s.season));
          const y = yOf(s.points);
          return (
            <g key={`a-${s.season}`}>
              {s.position === 1 && <circle cx={x} cy={y} r={7} fill={colorA} opacity={0.2} />}
              <circle cx={x} cy={y} r={s.position === 1 ? 4.5 : 3} fill={colorA} opacity={0.9} />
            </g>
          );
        })}

        {/* Dots B */}
        {sortedB.map((s) => {
          const x = xOf(parseInt(s.season));
          const y = yOf(s.points);
          return (
            <g key={`b-${s.season}`}>
              {s.position === 1 && <circle cx={x} cy={y} r={7} fill={colorB} opacity={0.2} />}
              <circle cx={x} cy={y} r={s.position === 1 ? 4.5 : 3} fill={colorB} opacity={0.9} />
            </g>
          );
        })}

        {/* Champion legend */}
        {([...sortedA, ...sortedB].some((s) => s.position === 1)) && (
          <text x={W - PAD.r} y={PAD.t + 8} textAnchor="end" fontSize={8} fill="#FCD34D">
            ● = 챔피언
          </text>
        )}
      </svg>
    </div>
  );
}
