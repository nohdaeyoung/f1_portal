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
}

export function CompareCareerTable({ statsA, statsB, colorA, colorB }: Props) {
  const mapA = Object.fromEntries(statsA.map((s) => [s.season, s]));
  const mapB = Object.fromEntries(statsB.map((s) => [s.season, s]));

  const allSeasons = Array.from(
    new Set([...statsA, ...statsB].map((s) => s.season))
  ).sort((a, b) => parseInt(b) - parseInt(a)); // descending

  if (allSeasons.length === 0) return null;

  return (
    <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2D2D3A]">
              <th className="px-4 py-3 text-left text-xs text-[#64748B] uppercase tracking-widest w-16" style={{ color: colorA }}>팀</th>
              <th className="px-2 py-3 text-center text-xs text-[#64748B] uppercase tracking-widest">순위</th>
              <th className="px-2 py-3 text-center text-xs text-[#64748B] uppercase tracking-widest">승</th>
              <th className="px-2 py-3 text-center text-xs text-[#64748B] uppercase tracking-widest">폴</th>
              <th className="px-3 py-3 text-right text-xs uppercase tracking-widest font-bold" style={{ color: colorA }}>포인트</th>
              <th className="px-3 py-3 text-center text-xs text-[#64748B] uppercase tracking-widest">시즌</th>
              <th className="px-3 py-3 text-left text-xs uppercase tracking-widest font-bold" style={{ color: colorB }}>포인트</th>
              <th className="px-2 py-3 text-center text-xs text-[#64748B] uppercase tracking-widest">폴</th>
              <th className="px-2 py-3 text-center text-xs text-[#64748B] uppercase tracking-widest">승</th>
              <th className="px-2 py-3 text-center text-xs text-[#64748B] uppercase tracking-widest">순위</th>
              <th className="px-4 py-3 text-right text-xs text-[#64748B] uppercase tracking-widest" style={{ color: colorB }}>팀</th>
            </tr>
          </thead>
          <tbody>
            {allSeasons.map((season) => {
              const a = mapA[season];
              const b = mapB[season];
              const aWins = a && b && a.points > b.points;
              const bWins = a && b && b.points > a.points;

              return (
                <tr key={season} className="border-b border-[#1E2030] hover:bg-white/2 transition-colors">
                  {/* A side */}
                  <td className="px-4 py-2.5 text-left">
                    <span className="text-[#94A3B8] text-xs truncate max-w-[80px] block">{a?.team ?? "—"}</span>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    {a?.position ? (
                      <span className={`text-xs ${a.position === 1 ? "text-yellow-400 font-bold" : "text-[#94A3B8]"}`}>
                        {a.position === 1 ? "★ " : ""}{a.position}위
                      </span>
                    ) : <span className="text-[#475569] text-xs">—</span>}
                  </td>
                  <td className="px-2 py-2.5 text-center text-[#94A3B8] text-xs">{a?.wins ?? "—"}</td>
                  <td className="px-2 py-2.5 text-center text-[#94A3B8] text-xs">{a?.poles ?? "—"}</td>
                  <td
                    className="px-3 py-2.5 text-right font-bold text-sm"
                    style={{ color: a ? (aWins ? colorA : "#64748B") : "#475569" }}
                  >
                    {a?.points ?? "—"}
                  </td>

                  {/* Season */}
                  <td className="px-3 py-2.5 text-center text-white text-xs font-semibold">{season}</td>

                  {/* B side */}
                  <td
                    className="px-3 py-2.5 text-left font-bold text-sm"
                    style={{ color: b ? (bWins ? colorB : "#64748B") : "#475569" }}
                  >
                    {b?.points ?? "—"}
                  </td>
                  <td className="px-2 py-2.5 text-center text-[#94A3B8] text-xs">{b?.poles ?? "—"}</td>
                  <td className="px-2 py-2.5 text-center text-[#94A3B8] text-xs">{b?.wins ?? "—"}</td>
                  <td className="px-2 py-2.5 text-center">
                    {b?.position ? (
                      <span className={`text-xs ${b.position === 1 ? "text-yellow-400 font-bold" : "text-[#94A3B8]"}`}>
                        {b.position === 1 ? "★ " : ""}{b.position}위
                      </span>
                    ) : <span className="text-[#475569] text-xs">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="text-[#94A3B8] text-xs truncate max-w-[80px] block text-right">{b?.team ?? "—"}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-[#475569] px-4 py-2">Jolpica(Ergast) 데이터 기준 · ★ = 챔피언</p>
    </div>
  );
}
