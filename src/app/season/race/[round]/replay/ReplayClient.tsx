"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { FF1ReplayData } from "@/lib/api/fastf1";
import { useReplayPlayer } from "@/hooks/useReplayPlayer";
import { useDriverTelemetry } from "@/hooks/useDriverTelemetry";
import ReplayPlayer from "@/components/replay/ReplayPlayer";
import ReplayControls from "@/components/replay/ReplayControls";
import ReplayLeaderboard from "@/components/replay/ReplayLeaderboard";
import DriverTelemetryPanel from "@/components/replay/DriverTelemetryPanel";
import CircuitCornerList from "@/components/replay/CircuitCornerList";
import { getCircuitCorners } from "@/data/circuit-corners";

// FastF1 텔레메트리 데이터 시작 연도 (2018~)
const CURRENT_YEAR = new Date().getFullYear();
const REPLAY_YEARS = Array.from({ length: CURRENT_YEAR - 2018 + 1 }, (_, i) => 2018 + i);

interface ReplayClientProps {
  year: number;       // 현재 시즌 연도
  gpName: string;     // e.g. "Australian Grand Prix"
  round: number;
  raceName: string;
}

export default function ReplayClient({ year, gpName, round, raceName }: ReplayClientProps) {
  const [data, setData] = useState<FF1ReplayData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  // Year selector: show past years + current year (if it's a completed race)
  const availableYears = REPLAY_YEARS.includes(year)
    ? REPLAY_YEARS
    : [...REPLAY_YEARS, year].sort((a, b) => a - b);
  const [selectedYear, setSelectedYear] = useState<number>(
    REPLAY_YEARS.includes(year) ? year : REPLAY_YEARS[REPLAY_YEARS.length - 1]
  );

  const player = useReplayPlayer(data?.total_frames ?? 1, data?.fps ?? 5);

  const { telemetry, loading: telLoading } = useDriverTelemetry(
    selectedYear, gpName, "R", selectedDriver, data?.fps ?? 5
  );

  const loadData = (yr: number) => {
    setLoading(true);
    setError(null);
    setData(null);
    setSelectedDriver(null);

    const base = process.env.NEXT_PUBLIC_FASTF1_API_URL ?? "/api/fastf1";
    const url = `${base}/replay-frames?year=${yr}&gp=${encodeURIComponent(gpName)}&session=R&fps=5`;

    const poll = () => {
      fetch(url)
        .then((r) => {
          if (r.status === 202) {
            // Still processing — poll again in 5s
            setTimeout(poll, 5000);
            return null;
          }
          if (r.status === 404 || r.status === 500)
            throw new Error(
              "이 레이스의 데이터를 아직 사용할 수 없습니다.\n아직 진행되지 않았거나 FastF1 데이터가 준비되지 않은 라운드입니다."
            );
          if (!r.ok) throw new Error(`서버 오류 (${r.status})`);
          return r.json() as Promise<FF1ReplayData>;
        })
        .then((d) => {
          if (d) {
            setData(d);
            setLoading(false);
          }
        })
        .catch((e: Error) => {
          setError(e.message);
          setLoading(false);
        });
    };

    poll();
  };

  useEffect(() => { loadData(selectedYear); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleYearChange = (yr: number) => {
    if (yr === selectedYear) return;
    setSelectedYear(yr);
    loadData(yr);
  };

  const currentFrame = data ? (data.frames[player.currentFrame] ?? data.frames[0]) : null;
  const corners = getCircuitCorners(gpName);

  return (
    <div className="min-h-screen bg-[#0D0D14] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-[#2D2D3A] px-4 py-3 flex items-center gap-4">
        <Link
          href={`/season/race/${round}`}
          className="text-xs text-[#64748B] hover:text-white transition-colors flex items-center gap-1"
        >
          ← 레이스
        </Link>
        <div className="w-px h-4 bg-[#2D2D3A]" />
        <Link
          href={`/season/race/${round}/analysis`}
          className="text-xs text-[#64748B] hover:text-white transition-colors"
        >
          분석
        </Link>
        <div className="w-px h-4 bg-[#2D2D3A]" />
        <span className="text-xs text-[#E8002D] font-bold uppercase tracking-widest">리플레이</span>

        <div className="ml-auto flex items-center gap-3">
          {/* Year selector */}
          <div className="flex items-center gap-0.5 flex-wrap justify-end max-w-xs">
            {availableYears.map((yr) => (
              <button
                key={yr}
                onClick={() => handleYearChange(yr)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                  selectedYear === yr
                    ? "bg-[#E8002D] text-white"
                    : "bg-white/5 text-[#64748B] hover:text-white hover:bg-white/10"
                }`}
              >
                {yr}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-[#2D2D3A]" />
          <div>
            <p className="text-sm font-black text-white">{raceName}</p>
            <p className="text-[10px] text-[#64748B]">Race Replay · {selectedYear}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 max-w-7xl mx-auto w-full">
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <span className="w-10 h-10 border-2 border-[#475569] border-t-[#E8002D] rounded-full animate-spin" />
            <p className="text-sm text-[#64748B]">리플레이 데이터 생성 중...</p>
            <p className="text-xs text-[#475569]">
              FastF1이 데이터를 처리합니다. 처음 요청은 1~3분 소요됩니다.
            </p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="bg-[#E8002D]/10 border border-[#E8002D]/30 rounded-xl px-6 py-8 text-center max-w-md space-y-3">
              <p className="text-sm text-[#E8002D] font-bold">데이터를 불러올 수 없습니다</p>
              <p className="text-xs text-[#64748B] whitespace-pre-line">{error}</p>
              <p className="text-[10px] text-[#475569]">다른 시즌을 선택해보세요 →</p>
            </div>
          </div>
        )}

        {data && currentFrame && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Canvas + Telemetry */}
              <div className="lg:col-span-3 flex flex-col gap-3">
                <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-3">
                  <ReplayPlayer
                    data={data}
                    frame={currentFrame}
                    width={900}
                    height={660}
                    selectedDriver={selectedDriver}
                    onSelectDriver={setSelectedDriver}
                  />
                </div>
                {selectedDriver && (
                  <DriverTelemetryPanel
                    driver={selectedDriver}
                    frameIndex={player.currentFrame}
                    telemetry={telemetry}
                    loading={telLoading}
                    data={data}
                    frame={currentFrame}
                    onClose={() => setSelectedDriver(null)}
                  />
                )}
                <CircuitCornerList corners={corners} />
              </div>

              {/* Leaderboard */}
              <div className="lg:col-span-1">
                <ReplayLeaderboard
                  data={data}
                  frame={currentFrame}
                  selectedDriver={selectedDriver}
                  onSelectDriver={setSelectedDriver}
                />
              </div>
            </div>

            <ReplayControls
              player={player}
              totalFrames={data.total_frames}
              fps={data.fps}
              totalLaps={data.total_laps}
              currentLap={currentFrame.lap}
            />
          </>
        )}
      </div>
    </div>
  );
}
