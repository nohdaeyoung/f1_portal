type Compound = "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET" | string;

interface CompoundBadgeProps {
  compound: Compound;
  size?: "sm" | "md";
  className?: string;
}

const compoundStyles: Record<string, { bg: string; border: string; text: string; label: string }> = {
  SOFT:         { bg: "#E8002D", border: "#E8002D", text: "#fff", label: "S" },
  MEDIUM:       { bg: "#FCD34D", border: "#FCD34D", text: "#000", label: "M" },
  HARD:         { bg: "#E5E7EB", border: "#E5E7EB", text: "#000", label: "H" },
  INTERMEDIATE: { bg: "#22C55E", border: "#22C55E", text: "#fff", label: "I" },
  WET:          { bg: "#3B82F6", border: "#3B82F6", text: "#fff", label: "W" },
};

const sizeStyles = {
  sm: "w-5 h-5 text-[9px]",
  md: "w-6 h-6 text-[10px]",
};

export function CompoundBadge({ compound, size = "md", className = "" }: CompoundBadgeProps) {
  const style = compoundStyles[compound?.toUpperCase()] ?? { bg: "#64748B", border: "#64748B", text: "#fff", label: "?" };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-black border-2 ${sizeStyles[size]} ${className}`}
      style={{ backgroundColor: style.bg, borderColor: style.border, color: style.text }}
      title={compound}
    >
      {style.label}
    </span>
  );
}
