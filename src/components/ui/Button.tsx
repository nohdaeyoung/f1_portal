import Link from "next/link";

interface ButtonProps {
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  children: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  primary: "bg-[#E8002D] text-white hover:bg-[#CC0025]",
  ghost:   "bg-white/10 text-white hover:bg-white/20",
  outline: "border border-[#3D3D50] text-[#94A3B8] hover:text-white hover:border-[#64748B]",
  danger:  "bg-[#E8002D]/10 text-[#E8002D] hover:bg-[#E8002D]/20 border border-[#E8002D]/30",
};

const sizeStyles: Record<string, string> = {
  sm: "px-3 py-1.5 text-xs font-semibold rounded-md",
  md: "px-5 py-2.5 text-sm font-bold rounded-lg",
  lg: "px-6 py-3 text-base font-bold rounded-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  href,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center transition-colors";
  const styles = `${base} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }
  return (
    <button className={styles} {...props}>
      {children}
    </button>
  );
}
