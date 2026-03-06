"use client";

import { useEffect, useState } from "react";

function getRemaining(targetIso: string) {
  const diff = Math.max(0, new Date(targetIso).getTime() - Date.now());
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  return { h, m, s, total: diff };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

interface Props {
  targetIso: string;
  label?: string;
}

export default function CountdownTimer({ targetIso, label = "세션까지" }: Props) {
  const [rem, setRem] = useState(() => getRemaining(targetIso));

  useEffect(() => {
    const id = setInterval(() => setRem(getRemaining(targetIso)), 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  if (rem.total <= 0) return null;

  return (
    <div className="text-right shrink-0">
      <span className="block font-black text-[#E8002D] tabular-nums text-4xl sm:text-5xl leading-none">
        {pad(rem.h)}:{pad(rem.m)}:{pad(rem.s)}
      </span>
      <span className="block text-xs text-[#64748B] mt-1">{label}</span>
    </div>
  );
}
