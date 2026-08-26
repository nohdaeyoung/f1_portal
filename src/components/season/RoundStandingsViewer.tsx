"use client";

import { useState } from "react";

interface RoundOption {
  display: number; // 화면 표시용 로컬 라운드 번호
  api: number;     // Jolpica 조회용 API 라운드 번호
}

interface Props {
  rounds: RoundOption[];
  season: number;
}

interface RaceResultRow {
  positionText: string; // "1"~"20", "R"(리타이어), "D"(실격) 등
  position: number;     // 메달 색상용 (숫자 순위)
  driverName: string;
  constructorName: string;
  points: number;
  record: string;       // 완주: 기록/격차, 미완주: 상태(예: "Accident", "+1 Lap")
}

export function RoundStandingsViewer({ rounds, season }: Props) {
  const [selected, setSelected] = useState<RoundOption | null>(null);
  const [results, setResults] = useState<RaceResultRow[]>([]);
  const [loading, setLoading] = useState(false);

  if (rounds.length === 0) return null;

  async function fetchRound(opt: RoundOption) {
    if (selected?.display === opt.display) return;
    setSelected(opt);
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch(
        `https://api.jolpi.ca/ergast/f1/${season}/${opt.api}/results.json?limit=100`
      );
      const data = await res.json();
      const race = data.MRData.RaceTable.Races[0];
      if (!race?.Results) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setResults(
        race.Results.map((r: any) => ({
          positionText: r.positionText,
          position: parseInt(r.position) || 99,
          driverName: `${r.Driver.givenName} ${r.Driver.familyName}`,
          constructorName: r.Constructor.name,
          points: parseFloat(r.points),
          record: r.Time?.time ?? r.status,
        }))
      );
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4 h-9">
        <h2 className="text-xl font-bold text-white">라운드별 순위</h2>
        <select
          value={selected?.display ?? ""}
          onChange={(e) => {
            const opt = rounds.find((r) => r.display === Number(e.target.value));
            if (opt) fetchRound(opt);
          }}
          className="bg-[#141420] border border-[#2D2D3A] text-white rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-[#E8002D] cursor-pointer"
        >
          <option value="">라운드 선택</option>
          {rounds.map((r) => (
            <option key={r.display} value={r.display}>R{r.display}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {!selected && (
        <div className="text-center py-10 text-[#64748B] text-sm bg-[#141420] border border-[#2D2D3A] rounded-xl">
          라운드를 선택해주세요
        </div>
      )}

      {loading && (
        <div className="text-center py-10 text-[#64748B] text-sm bg-[#141420] border border-[#2D2D3A] rounded-xl">
          불러오는 중...
        </div>
      )}

      {!loading && selected && results.length > 0 && (
        <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#2D2D3A]">
            <span className="text-sm text-[#64748B]">
              Round {selected.display} 레이스 결과
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2D2D3A]">
                  <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase w-10">
                    #
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase">
                    드라이버
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase hidden sm:table-cell">
                    팀
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase hidden sm:table-cell">
                    기록
                  </th>
                  <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase w-16">
                    포인트
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr
                    key={`${r.positionText}-${i}`}
                    className="border-b border-[#2D2D3A]/50 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`font-black text-sm ${
                          r.position === 1
                            ? "text-[#FCD34D]"
                            : r.position === 2
                              ? "text-[#C0C0C0]"
                              : r.position === 3
                                ? "text-[#CD7F32]"
                                : "text-[#64748B]"
                        }`}
                      >
                        {r.positionText}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-white">
                      {r.driverName}
                    </td>
                    <td className="px-4 py-3 text-[#64748B] hidden sm:table-cell">
                      {r.constructorName}
                    </td>
                    <td className="px-4 py-3 text-[#64748B] font-mono text-xs hidden sm:table-cell">
                      {r.record}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-white">
                      {r.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && selected && results.length === 0 && (
        <div className="text-center py-10 text-[#64748B] text-sm bg-[#141420] border border-[#2D2D3A] rounded-xl">
          데이터를 불러올 수 없습니다.
        </div>
      )}
    </section>
  );
}
