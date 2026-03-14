import { type ReactNode } from "react";

interface HudCardProps {
  children: ReactNode;
  className?: string;
  /** 카드 상단 레이블 (선택) */
  label?: string;
  /** 레이블 우측 보조 텍스트 (선택) */
  labelRight?: string;
  /** 상단 보더 컬러 (팀 컬러 등) */
  accentColor?: string;
  /** HUD 코너 브라켓 색상 override */
  bracketColor?: string;
}

export function HudCard({
  children,
  className = "",
  label,
  labelRight,
  accentColor,
  bracketColor,
}: HudCardProps) {
  const bracketStyle = bracketColor
    ? ({ "--hud-bracket": bracketColor } as React.CSSProperties)
    : undefined;

  return (
    <div
      className={`hud-card relative bg-bg-surface border border-border-default rounded-lg overflow-hidden ${className}`}
      style={{
        ...(accentColor ? { borderTopColor: accentColor, borderTopWidth: 2 } : {}),
        ...bracketStyle,
      }}
    >
      {label && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-text-muted">
            {label}
          </span>
          {labelRight && (
            <span className="font-mono text-xs text-text-disabled tabular-nums">
              {labelRight}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
