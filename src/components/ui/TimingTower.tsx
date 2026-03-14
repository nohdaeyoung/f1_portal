"use client";

import { useEffect, useRef, useState } from "react";

export interface TimingRow {
  position: number;
  driverCode: string;
  driverName?: string;
  teamName?: string;
  teamColor?: string;
  time?: string;
  gap?: string;
  /** 포지션 변화 방향 */
  delta?: "up" | "down" | "same";
  /** 패스티스트 랩 여부 */
  fastest?: boolean;
  /** DNF/DNS/DSQ 등 상태 */
  status?: string;
  /** 추가 우측 컬럼 (타이어, 포인트 등) */
  extra?: string;
  extraColor?: string;
}

interface TimingTowerProps {
  rows: TimingRow[];
  /** 헤더 컬럼 라벨 (우측부터) */
  headers?: { time?: string; gap?: string; extra?: string };
  /** 최대 노출 행 수 (기본 전체) */
  maxRows?: number;
  className?: string;
  /** 포지션 변화 애니메이션 사용 */
  animated?: boolean;
}

function DeltaIcon({ delta }: { delta: TimingRow["delta"] }) {
  if (delta === "up")
    return <span className="text-[10px] text-status-active leading-none" aria-label="순위 상승">▲</span>;
  if (delta === "down")
    return <span className="text-[10px] text-f1-red leading-none" aria-label="순위 하락">▼</span>;
  return <span className="text-[10px] text-border-strong leading-none">—</span>;
}

export function TimingTower({
  rows,
  headers,
  maxRows,
  className = "",
  animated = false,
}: TimingTowerProps) {
  const displayRows = maxRows ? rows.slice(0, maxRows) : rows;
  const prevPositions = useRef<Map<string, number>>(new Map());
  const [deltas, setDeltas] = useState<Map<string, "up" | "down" | "same">>(new Map());

  useEffect(() => {
    if (!animated) return;
    const newDeltas = new Map<string, "up" | "down" | "same">();
    rows.forEach((r) => {
      const prev = prevPositions.current.get(r.driverCode);
      if (prev === undefined) {
        newDeltas.set(r.driverCode, "same");
      } else if (r.position < prev) {
        newDeltas.set(r.driverCode, "up");
      } else if (r.position > prev) {
        newDeltas.set(r.driverCode, "down");
      } else {
        newDeltas.set(r.driverCode, "same");
      }
    });
    setDeltas(newDeltas);
    prevPositions.current = new Map(rows.map((r) => [r.driverCode, r.position]));
  }, [rows, animated]);

  const isDNF = (row: TimingRow) =>
    row.status && !["1", "Finished"].includes(row.status);

  return (
    <div className={`w-full overflow-x-auto ${className}`} role="table" aria-label="타이밍 타워">
      {/* Header */}
      <div
        role="row"
        className="flex items-center gap-2 px-3 py-1.5 border-b border-border-subtle"
      >
        <span role="columnheader" className="w-7 shrink-0 font-display text-[10px] font-bold tracking-widest uppercase text-text-disabled">
          POS
        </span>
        <span role="columnheader" className="w-8 shrink-0 font-display text-[10px] font-bold tracking-widest uppercase text-text-disabled">
          DRV
        </span>
        <span role="columnheader" className="flex-1 font-display text-[10px] font-bold tracking-widest uppercase text-text-disabled">
          {headers?.time ?? "TIME"}
        </span>
        {headers?.gap !== undefined && (
          <span role="columnheader" className="w-20 text-right font-display text-[10px] font-bold tracking-widest uppercase text-text-disabled">
            {headers.gap || "GAP"}
          </span>
        )}
        {headers?.extra !== undefined && (
          <span role="columnheader" className="w-14 text-right font-display text-[10px] font-bold tracking-widest uppercase text-text-disabled">
            {headers.extra}
          </span>
        )}
      </div>

      {/* Rows */}
      {displayRows.map((row, idx) => {
        const delta = animated ? deltas.get(row.driverCode) : row.delta;
        const dnf = isDNF(row);
        const isP1 = row.position === 1;

        return (
          <div
            key={row.driverCode}
            role="row"
            className={[
              "flex items-center gap-2 px-3 py-2 border-b border-border-subtle/50",
              "transition-colors duration-200",
              isP1 ? "bg-[#00D2BE]/5" : idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.015]",
              dnf ? "opacity-50" : "",
              animated ? "animate-scan-sweep" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={animated ? { animationDelay: `${idx * 30}ms` } : undefined}
          >
            {/* Position */}
            <span
              role="cell"
              className={`w-7 shrink-0 font-mono text-sm font-bold tabular-nums ${
                isP1 ? "text-data-teal" : "text-text-secondary"
              }`}
            >
              {String(row.position).padStart(2, "0")}
            </span>

            {/* Driver code + delta */}
            <span role="cell" className="w-8 shrink-0 flex flex-col items-start gap-0.5">
              <span
                className="font-display text-sm font-bold tracking-wide uppercase leading-none"
                style={row.teamColor ? { color: row.teamColor } : undefined}
              >
                {row.driverCode}
              </span>
              {animated && <DeltaIcon delta={delta} />}
            </span>

            {/* Team + time */}
            <span role="cell" className="flex-1 min-w-0">
              {row.teamName && (
                <span className="block text-[10px] text-text-disabled uppercase tracking-wider truncate leading-none mb-0.5">
                  {row.teamName}
                </span>
              )}
              <span className={`font-mono text-sm tabular-nums ${isP1 ? "text-white font-bold" : "text-text-primary"}`}>
                {row.status && row.status !== "Finished" && row.status !== "1"
                  ? row.status
                  : (row.time ?? "—")}
              </span>
              {row.fastest && (
                <span className="ml-2 text-[10px] font-bold text-status-purple" aria-label="패스티스트 랩">⬛</span>
              )}
            </span>

            {/* Gap */}
            {headers?.gap !== undefined && (
              <span
                role="cell"
                className="w-20 text-right font-mono text-sm tabular-nums text-text-muted"
              >
                {row.gap ?? (isP1 ? "—" : "")}
              </span>
            )}

            {/* Extra */}
            {headers?.extra !== undefined && (
              <span
                role="cell"
                className="w-14 text-right font-mono text-sm tabular-nums"
                style={row.extraColor ? { color: row.extraColor } : undefined}
              >
                {row.extra ?? ""}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
