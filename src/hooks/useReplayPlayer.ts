"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export type PlaybackRate = 0.5 | 1 | 2 | 4;
export const PLAYBACK_RATES: PlaybackRate[] = [0.5, 1, 2, 4];

export interface UseReplayPlayerReturn {
  isPlaying: boolean;
  currentFrame: number;
  playbackRate: PlaybackRate;
  play: () => void;
  pause: () => void;
  seek: (frame: number) => void;
  setPlaybackRate: (rate: PlaybackRate) => void;
  rewind: (frames: number) => void;
}

export function useReplayPlayer(totalFrames: number, fps: number): UseReplayPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState<PlaybackRate>(1);

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const frameAccRef = useRef(0); // fractional frame accumulator
  const playbackRateRef = useRef<PlaybackRate>(1);
  const currentFrameRef = useRef(0);
  const isPlayingRef = useRef(false);

  const loop = useCallback((now: number) => {
    if (!isPlayingRef.current) return;
    if (lastTimeRef.current === null) {
      lastTimeRef.current = now;
    }

    const elapsed = (now - lastTimeRef.current) / 1000; // seconds
    lastTimeRef.current = now;

    frameAccRef.current += elapsed * fps * playbackRateRef.current;
    const framesToAdvance = Math.floor(frameAccRef.current);
    frameAccRef.current -= framesToAdvance;

    if (framesToAdvance > 0) {
      const next = Math.min(currentFrameRef.current + framesToAdvance, totalFrames - 1);
      currentFrameRef.current = next;
      setCurrentFrame(next);

      if (next >= totalFrames - 1) {
        isPlayingRef.current = false;
        setIsPlaying(false);
        return;
      }
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [fps, totalFrames]);

  const play = useCallback(() => {
    if (currentFrameRef.current >= totalFrames - 1) {
      currentFrameRef.current = 0;
      setCurrentFrame(0);
    }
    isPlayingRef.current = true;
    lastTimeRef.current = null;
    frameAccRef.current = 0;
    setIsPlaying(true);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop, totalFrames]);

  const pause = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const seek = useCallback((frame: number) => {
    const clamped = Math.max(0, Math.min(frame, totalFrames - 1));
    currentFrameRef.current = clamped;
    setCurrentFrame(clamped);
  }, [totalFrames]);

  const setPlaybackRate = useCallback((rate: PlaybackRate) => {
    playbackRateRef.current = rate;
    setPlaybackRateState(rate);
  }, []);

  const rewind = useCallback((frames: number) => {
    const next = Math.max(0, currentFrameRef.current - frames);
    currentFrameRef.current = next;
    setCurrentFrame(next);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.code === "Space") { e.preventDefault(); isPlayingRef.current ? pause() : play(); }
      if (e.code === "ArrowLeft") rewind(fps * 10);
      if (e.code === "ArrowRight") { const next = Math.min(currentFrameRef.current + fps * 10, totalFrames - 1); seek(next); }
      if (e.key === "1") setPlaybackRate(0.5);
      if (e.key === "2") setPlaybackRate(1);
      if (e.key === "3") setPlaybackRate(2);
      if (e.key === "4") setPlaybackRate(4);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [play, pause, rewind, seek, setPlaybackRate, fps, totalFrames]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { isPlaying, currentFrame, playbackRate, play, pause, seek, setPlaybackRate, rewind };
}
