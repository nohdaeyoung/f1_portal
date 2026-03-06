interface BadgeProps {
  variant: "live" | "completed" | "upcoming" | "race-week" | "fl" | "dnf" | "dns" | "dsq" | "info";
  label: string;
  pulse?: boolean;
  className?: string;
}

const variantStyles: Record<string, string> = {
  live:       "bg-[#E8002D]/15 text-[#E8002D] border border-[#E8002D]/30",
  completed:  "bg-white/8 text-[#94A3B8] border border-[#3D3D50]",
  upcoming:   "bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30",
  "race-week":"bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30",
  fl:         "bg-[#A855F7]/15 text-[#A855F7] border border-[#A855F7]/30",
  dnf:        "bg-white/8 text-[#64748B] border border-[#3D3D50]",
  dns:        "bg-white/8 text-[#64748B] border border-[#3D3D50]",
  dsq:        "bg-[#E8002D]/10 text-[#E8002D] border border-[#E8002D]/20",
  info:       "bg-white/8 text-[#94A3B8] border border-[#3D3D50]",
};

export function Badge({ variant, label, pulse = false, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${variantStyles[variant]} ${className}`}
    >
      {pulse && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {label}
    </span>
  );
}
