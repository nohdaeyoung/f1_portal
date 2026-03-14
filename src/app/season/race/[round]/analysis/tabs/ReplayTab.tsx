"use client";

import { useState, useEffect } from "react";
import type { FF1ReplayData } from "@/lib/api/fastf1";
import { useReplayPlayer } from "@/hooks/useReplayPlayer";
import { useDriverTelemetry } from "@/hooks/useDriverTelemetry";
import ReplayPlayer from "@/components/replay/ReplayPlayer";
import ReplayControls from "@/components/replay/ReplayControls";
import ReplayLeaderboard from "@/components/replay/ReplayLeaderboard";
import DriverTelemetryPanel from "@/components/replay/DriverTelemetryPanel";

interface ReplayTabProps {
  year: number;
  gp: string;
  session: string;
}

export default function ReplayTab({ year, gp, session }: ReplayTabProps) {
  const [data, setData] = useState<FF1ReplayData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  const player = useReplayPlayer(data?.total_frames ?? 1, data?.fps ?? 5);

  const { telemetry, loading: telLoading } = useDriverTelemetry(
    year, gp, session, selectedDriver, data?.fps ?? 5
  );

  const load = () => {
    if (loaded) return;
    setLoading(true);
    setError(null);
    fetch(`/api/fastf1/replay-frames?year=${year}&gp=${gp}&session=${session}&fps=5`)
      .then((r) => {
        if (r.status === 404 || r.status === 500)
          throw new Error("이 레이스의 데이터를 아직 사용할 수 없습니다.\n아직 진행되지 않았거나 FastF1 데이터가 준비되지 않은 라운드입니다.");
        if (!r.ok) throw new Error(`서버 오류 (${r.status})`);
        return r.json() as Promise<FF1ReplayData>;
      })
      .then((d) => { setData(d); setLoaded(true); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <span className="w-8 h-8 border-2 border-[#475569] border-t-[#E8002D] rounded-full animate-spin" />
        <p className="text-sm text-[#64748B]">리플레이 데이터 로딩 중...</p>
        <p className="text-xs text-[#475569]">처음 요청은 1~3분 소요될 수 있습니다</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#E8002D]/10 border border-[#E8002D]/30 rounded-xl px-5 py-8 text-center space-y-2">
        <p className="text-sm text-[#E8002D]">{error}</p>
        <p className="text-xs text-[#64748B]">FastF1 서버가 실행 중인지 확인하세요 (포트 8000)</p>
        <button
          onClick={() => { setLoaded(false); load(); }}
          className="mt-2 px-4 py-1.5 bg-white/10 rounded-lg text-xs text-white hover:bg-white/15 transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!data) return null;

  const currentFrame = data.frames[player.currentFrame] ?? data.frames[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Canvas + Telemetry */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-3">
            <ReplayPlayer
              data={data}
              frame={currentFrame}
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

      {/* Controls */}
      <ReplayControls
        player={player}
        totalFrames={data.total_frames}
        fps={data.fps}
        totalLaps={data.total_laps}
        currentLap={currentFrame.lap}
      />
    </div>
  );
}
