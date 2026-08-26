"use client";

import { useEffect, useRef, useCallback } from "react";
import type { FF1ReplayData, FF1ReplayFrame } from "@/lib/api/fastf1";

const PAD = 24;
const DOT_RADIUS = 6;
const FONT = "bold 9px Inter, sans-serif";

interface ReplayPlayerProps {
  data: FF1ReplayData;
  frame: FF1ReplayFrame;
  width?: number;
  height?: number;
  selectedDriver?: string | null;
  onSelectDriver?: (driver: string | null) => void;
}

export default function ReplayPlayer({
  data,
  frame,
  width = 700,
  height = 520,
  selectedDriver = null,
  onSelectDriver,
}: ReplayPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Store latest frame positions for click hit-testing
  const positionsRef = useRef(frame.positions);
  positionsRef.current = frame.positions;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const drawW = W - PAD * 2;
    const drawH = H - PAD * 2;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0D0D14";
    ctx.fillRect(0, 0, W, H);

    const toCanvas = (nx: number, ny: number) => ({
      cx: PAD + nx * drawW,
      cy: PAD + ny * drawH,
    });

    // Track outline
    if (data.track.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = "#2D2D3A";
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const first = toCanvas(data.track[0].x, data.track[0].y);
      ctx.moveTo(first.cx, first.cy);
      for (let i = 1; i < data.track.length; i++) {
        const p = toCanvas(data.track[i].x, data.track[i].y);
        ctx.lineTo(p.cx, p.cy);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = "#3A3A4A";
      ctx.lineWidth = 2;
      ctx.moveTo(first.cx, first.cy);
      for (let i = 1; i < data.track.length; i++) {
        const p = toCanvas(data.track[i].x, data.track[i].y);
        ctx.lineTo(p.cx, p.cy);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Driver dots
    ctx.font = FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const hasSelection = selectedDriver !== null;

    for (const pos of frame.positions) {
      const { cx, cy } = toCanvas(pos.x, pos.y);
      const hex = data.colors[pos.d] ?? "64748B";
      const color = hex.startsWith("#") ? hex : `#${hex}`;
      const isOut = pos.status === "out";
      const isPit = pos.status === "pit";
      const isSelected = pos.d === selectedDriver;
      const isDimmed = hasSelection && !isSelected && !isOut;

      ctx.globalAlpha = isOut ? 0.2 : isDimmed ? 0.35 : 1;

      const radius = isSelected
        ? DOT_RADIUS * 1.5
        : isPit
        ? DOT_RADIUS * 0.7
        : DOT_RADIUS;

      // Glow ring for selected driver
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = isOut ? "#475569" : color;
      ctx.fill();

      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();

      if (!isOut) {
        ctx.globalAlpha = isDimmed ? 0.35 : 1;
        ctx.fillStyle = "#FFFFFF";
        ctx.font = isSelected ? "bold 10px Inter, sans-serif" : FONT;
        ctx.fillText(pos.d, cx, cy + radius + 8);
        ctx.font = FONT;
      }
    }

    ctx.globalAlpha = 1;
  }, [data, frame, selectedDriver]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onSelectDriver) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      // Scale from CSS pixels to canvas pixels
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      const W = canvas.width;
      const H = canvas.height;
      const drawW = W - PAD * 2;
      const drawH = H - PAD * 2;

      let hit: string | null = null;
      let minDist = Infinity;

      for (const pos of positionsRef.current) {
        if (pos.status === "out") continue;
        const cx = PAD + pos.x * drawW;
        const cy = PAD + pos.y * drawH;
        const dist = Math.hypot(mx - cx, my - cy);
        const hitRadius = (pos.d === selectedDriver ? DOT_RADIUS * 1.5 : DOT_RADIUS) + 6;
        if (dist < hitRadius && dist < minDist) {
          minDist = dist;
          hit = pos.d;
        }
      }

      onSelectDriver(hit === selectedDriver ? null : hit);
    },
    [onSelectDriver, selectedDriver]
  );

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-auto rounded-lg cursor-pointer"
      style={{ imageRendering: "auto" }}
      onClick={handleClick}
    />
  );
}
