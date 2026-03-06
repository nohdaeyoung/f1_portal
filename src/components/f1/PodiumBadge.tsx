interface PodiumBadgeProps {
  position: number | string;
  className?: string;
}

function positionColor(pos: number | string): string {
  const n = Number(pos);
  if (n === 1) return "bg-[#FCD34D]/20 text-[#FCD34D] border border-[#FCD34D]/30";
  if (n === 2) return "bg-[#C0C0C0]/20 text-[#C0C0C0] border border-[#C0C0C0]/30";
  if (n === 3) return "bg-[#CD7F32]/20 text-[#CD7F32] border border-[#CD7F32]/30";
  return "bg-white/8 text-[#94A3B8] border border-[#2D2D3A]";
}

export function PodiumBadge({ position, className = "" }: PodiumBadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${positionColor(position)} ${className}`}
    >
      {position}
    </span>
  );
}
