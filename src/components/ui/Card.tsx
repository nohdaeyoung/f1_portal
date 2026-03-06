interface CardProps {
  variant?: "default" | "elevated" | "accent";
  padding?: "sm" | "md" | "lg" | "none";
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  default:  "bg-[#141420] border border-[#2D2D3A]",
  elevated: "bg-[#1A1A2A] border border-[#3D3D50]",
  accent:   "bg-[#141420] border border-[#E8002D]/20",
};

const paddingStyles: Record<string, string> = {
  none: "",
  sm:   "p-4",
  md:   "p-5",
  lg:   "p-6 sm:p-8",
};

export function Card({
  variant = "default",
  padding = "md",
  className = "",
  children,
}: CardProps) {
  return (
    <div className={`rounded-xl ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}>
      {children}
    </div>
  );
}
