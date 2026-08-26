"use client";

import { useEffect, useState } from "react";
import { getLeaderboard, type LeaderboardEntry } from "@/lib/community/predictions";

interface PredictionLeaderboardProps {
  round: number;
}

export function PredictionLeaderboard({ round }: PredictionLeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getLeaderboard(round)
      .then(setEntries)
      .catch((e) => {
        console.error(e);
        setError("리더보드를 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }, [round]);

  if (loading) {
    return (
      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6 space-y-3">
        <div className="h-4 bg-white/5 rounded w-1/4 animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6 text-center">
        <p className="text-[#E8002D] text-sm">{error}</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6 text-center">
        <p className="text-[#64748B] text-sm">
          아직 채점된 예측이 없습니다. 레이스 종료 후 점수가 공개됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#2D2D3A]">
        <h3 className="font-semibold text-white text-sm">
          라운드 {round} 예측 리더보드
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[#64748B] text-xs border-b border-[#2D2D3A]">
              <th className="px-4 py-2 text-left w-10">순위</th>
              <th className="px-4 py-2 text-left">닉네임</th>
              <th className="px-4 py-2 text-right">이번 라운드</th>
              <th className="px-4 py-2 text-right">시즌 누적</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => {
              const rank = idx + 1;
              const isTop3 = rank <= 3;
              const medalColors = ["text-yellow-400", "text-zinc-300", "text-amber-600"];
              const rankDisplay = isTop3 ? (
                <span className={`font-bold ${medalColors[rank - 1]}`}>
                  {rank === 1 ? "1" : rank === 2 ? "2" : "3"}
                </span>
              ) : (
                <span className="text-[#64748B]">{rank}</span>
              );

              return (
                <tr
                  key={entry.userId}
                  className="border-b border-[#2D2D3A] last:border-b-0 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3">{rankDisplay}</td>
                  <td className="px-4 py-3 text-white">
                    {entry.nickname}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-[#E8002D] font-semibold">
                      {entry.roundScore ?? "-"}
                    </span>
                    <span className="text-[#64748B] text-xs ml-0.5">점</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-white font-medium">
                      {entry.totalScore}
                    </span>
                    <span className="text-[#64748B] text-xs ml-0.5">점</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
