"use client";

import type { PlaybackRate, UseReplayPlayerReturn } from "@/hooks/useReplayPlayer";
import { PLAYBACK_RATES } from "@/hooks/useReplayPlayer";

interface ReplayControlsProps {
  player: UseReplayPlayerReturn;
  totalFrames: number;
  fps: number;
  totalLaps: number;
  currentLap: number;
}

export default function ReplayControls({
  player,
  totalFrames,
  fps,
  totalLaps,
  currentLap,
}: ReplayControlsProps) {
  const { isPlaying, currentFrame, playbackRate, play, pause, seek, setPlaybackRate, rewind } = player;
  const progress = totalFrames > 1 ? currentFrame / (totalFrames - 1) : 0;

  return (
    <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl px-4 py-3 space-y-3">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-[#64748B] shrink-0 w-16 text-right">
          Lap {currentLap} / {totalLaps}
        </span>
        <input
          type="range"
          min={0}
          max={totalFrames - 1}
          value={currentFrame}
          onChange={(e) => seek(Number(e.target.value))}
          className="flex-1 h-1.5 rounded-full accent-[#E8002D] cursor-pointer"
        />
        <span className="text-[10px] text-[#475569] shrink-0 w-12">
          {Math.round((currentFrame / (totalFrames || 1)) * 100)}%
        </span>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: rewind + play */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => rewind(fps * 10)}
            aria-label="10초 되감기"
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-[#64748B] hover:text-white transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-f1-red"
          >
            ◀◀
          </button>
          <button
            onClick={isPlaying ? pause : play}
            aria-label={isPlaying ? "일시정지" : "재생"}
            className="w-10 h-10 rounded-xl bg-[#E8002D] hover:bg-[#E8002D]/80 flex items-center justify-center text-white transition-colors text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-f1-red focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0F]"
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button
            onClick={() => seek(Math.min(currentFrame + fps * 10, totalFrames - 1))}
            aria-label="10초 앞으로"
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-[#64748B] hover:text-white transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-f1-red"
          >
            ▶▶
          </button>
        </div>

        {/* Right: speed */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#475569] mr-1">배속</span>
          {PLAYBACK_RATES.map((rate) => (
            <button
              key={rate}
              onClick={() => setPlaybackRate(rate as PlaybackRate)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                playbackRate === rate
                  ? "bg-[#E8002D] text-white"
                  : "bg-white/5 text-[#64748B] hover:text-white hover:bg-white/10"
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-[10px] text-[#2D2D3A] text-center">
        Space 재생/정지 · ← → 10초 이동 · 1~4 배속 변경
      </p>
    </div>
  );
}
