interface TeamColorBarProps {
  color: string;
  className?: string;
}

export function TeamColorBar({ color, className = "" }: TeamColorBarProps) {
  return (
    <span
      className={`block w-0.5 h-5 rounded-full shrink-0 ${className}`}
      style={{ backgroundColor: color }}
    />
  );
}
