"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface CornerData {
  name: string;
  lat: number;
  lng: number;
  anchor?: "above" | "below" | "left" | "right";
}

export interface Projection {
  x0: number;
  y1: number;
  s: number;
  ox: number;
  oy: number;
}

interface Props {
  path: string;
  W: number;
  H: number;
  proj: Projection;
  initialCorners: CornerData[];
}

// ─── Coordinate helpers ───────────────────────────────────────

function toSVG(proj: Projection, lng: number, lat: number): [number, number] {
  return [
    proj.ox + (lng - proj.x0) * proj.s,
    proj.oy + (proj.y1 - lat) * proj.s,
  ];
}

function toLatLng(proj: Projection, cx: number, cy: number) {
  return {
    lng: (cx - proj.ox) / proj.s + proj.x0,
    lat: proj.y1 - (cy - proj.oy) / proj.s,
  };
}

function labelOffset(anchor: CornerData["anchor"]): [number, number] {
  switch (anchor) {
    case "above": return [0, -14];
    case "below": return [0,  20];
    case "left":  return [-8,  4];
    case "right": return [ 8,  4];
    default:      return [0, -14];
  }
}

function labelAnchor(anchor: CornerData["anchor"]): "end" | "start" | "middle" {
  if (anchor === "left") return "end";
  if (anchor === "right") return "start";
  return "middle";
}

const ANCHORS: CornerData["anchor"][] = ["above", "right", "below", "left"];
const ANCHOR_ICONS: Record<string, string> = {
  above: "↑", right: "→", below: "↓", left: "←",
};

// ─── Component ────────────────────────────────────────────────

export function TrackMapClient({ path, W, H, proj, initialCorners }: Props) {
  const [editMode, setEditMode]   = useState(false);
  const [addMode, setAddMode]     = useState(false);
  const [corners, setCorners]     = useState<CornerData[]>(initialCorners);
  const [undoStack, setUndoStack] = useState<CornerData[][]>([]);
  const [selected, setSelected]   = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [dragging, setDragging]   = useState<string | null>(null);
  const [copied, setCopied]       = useState(false);
  const didDragRef                = useRef(false);
  const svgRef                    = useRef<SVGSVGElement>(null);
  const nameRef                   = useRef<HTMLInputElement>(null);

  // Save current state to undo stack
  const saveUndo = useCallback((current: CornerData[]) => {
    setUndoStack(s => [...s.slice(-24), current]);
  }, []);

  // Apply new corners with undo support
  const apply = useCallback((next: CornerData[], saveToUndo = true) => {
    if (saveToUndo) setUndoStack(s => [...s.slice(-24), corners]);
    setCorners(next);
  }, [corners]);

  const undo = useCallback(() => {
    setUndoStack(s => {
      if (!s.length) return s;
      setCorners(s[s.length - 1]);
      setSelected(null);
      return s.slice(0, -1);
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!editMode) return;
    const handler = (e: KeyboardEvent) => {
      const inInput = (e.target as HTMLElement).tagName === "INPUT";
      if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); undo(); }
      if (e.key === "Escape") { setSelected(null); setAddMode(false); }
      if ((e.key === "Delete" || e.key === "Backspace") && selected && !inInput) {
        apply(corners.filter(c => c.name !== selected));
        setSelected(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editMode, undo, selected, corners, apply]);

  // Focus name input when a corner is selected
  useEffect(() => {
    if (selected) {
      const c = corners.find(c => c.name === selected);
      setNameInput(c?.name ?? "");
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pointer helpers ──────────────────────────────────────────

  const clientToSVG = useCallback((cx: number, cy: number): [number, number] => {
    const svg = svgRef.current;
    if (!svg) return [0, 0];
    const r = svg.getBoundingClientRect();
    return [(cx - r.left) * (W / r.width), (cy - r.top) * (H / r.height)];
  }, [W, H]);

  // SVG background click → add corner
  const onSVGClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!addMode || !editMode) return;
    if ((e.target as Element).closest("[data-marker]")) return;
    if (didDragRef.current) return;
    const [cx, cy] = clientToSVG(e.clientX, e.clientY);
    const { lat, lng } = toLatLng(proj, cx, cy);
    const num = corners.length + 1;
    const name = `T${num}`;
    const newCorner: CornerData = { name, lat, lng, anchor: "above" };
    apply([...corners, newCorner]);
    setSelected(name);
    setAddMode(false);
  }, [addMode, editMode, clientToSVG, proj, corners, apply]);

  const onPointerDown = useCallback((name: string, e: React.PointerEvent) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    didDragRef.current = false;
    saveUndo(corners);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setDragging(name);
  }, [editMode, corners, saveUndo]);

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging) return;
    didDragRef.current = true;
    const [cx, cy] = clientToSVG(e.clientX, e.clientY);
    const { lat, lng } = toLatLng(proj, cx, cy);
    setCorners(prev => prev.map(c => c.name === dragging ? { ...c, lat, lng } : c));
  }, [dragging, clientToSVG, proj]);

  const onPointerUp = useCallback((_e: React.PointerEvent<SVGSVGElement>) => {
    if (dragging) {
      if (!didDragRef.current) {
        // It was a click, not a drag → select the marker
        setSelected(dragging === selected ? null : dragging);
        // Undo the saveUndo we did on pointerdown (since nothing changed)
        setUndoStack(s => s.slice(0, -1));
      }
      setDragging(null);
    }
  }, [dragging, selected]);

  // ── Panel actions ────────────────────────────────────────────

  const renameSelected = () => {
    const trimmed = nameInput.trim();
    if (!trimmed || !selected) return;
    if (trimmed === selected) return;
    if (corners.some(c => c.name === trimmed)) return; // duplicate
    apply(corners.map(c => c.name === selected ? { ...c, name: trimmed } : c));
    setSelected(trimmed);
  };

  const setAnchor = (anchor: CornerData["anchor"]) => {
    if (!selected) return;
    apply(corners.map(c => c.name === selected ? { ...c, anchor } : c));
  };

  const deleteSelected = () => {
    if (!selected) return;
    apply(corners.filter(c => c.name !== selected));
    setSelected(null);
  };

  const reset = () => {
    saveUndo(corners);
    setCorners(initialCorners);
    setSelected(null);
  };

  const copyJSON = () => {
    const out = corners.map(c => ({
      name: c.name,
      lat: +c.lat.toFixed(6),
      lng: +c.lng.toFixed(6),
      anchor: c.anchor,
    }));
    navigator.clipboard.writeText(JSON.stringify(out, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const selectedCorner = corners.find(c => c.name === selected);

  return (
    <div>
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 px-1 mb-3">
        <button
          onClick={() => { setEditMode(v => !v); setSelected(null); setAddMode(false); }}
          className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
            editMode ? "bg-[#E8002D] text-white" : "bg-white/5 text-[#64748B] hover:text-white"
          }`}
        >
          {editMode ? "편집 완료" : "코너 위치 편집"}
        </button>

        {editMode && (
          <>
            <button
              onClick={() => { setAddMode(v => !v); setSelected(null); }}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                addMode
                  ? "bg-[#FCD34D] text-black"
                  : "bg-white/5 text-[#64748B] hover:text-white"
              }`}
            >
              {addMode ? "클릭해서 배치…" : "+ 코너 추가"}
            </button>

            <button
              onClick={undo}
              disabled={!undoStack.length}
              className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-[#64748B] hover:text-white disabled:opacity-30 transition-all"
              title="실행 취소 (Cmd+Z)"
            >
              ↩ 실행취소
            </button>

            <button
              onClick={reset}
              className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-[#64748B] hover:text-white transition-all"
            >
              초기화
            </button>

            <button
              onClick={copyJSON}
              className="ml-auto text-xs font-bold px-3 py-1.5 rounded-full bg-white/5 text-[#64748B] hover:text-white transition-all"
            >
              {copied ? "✓ 복사됨" : "JSON 복사"}
            </button>
          </>
        )}
      </div>

      {/* ── SVG Map ─────────────────────────────────────────── */}
      <div className="bg-[#0a0a14] border border-[#2D2D3A] rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#2D2D3A] flex items-center gap-2">
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">트랙 레이아웃</span>
          {corners.length > 0 && (
            <span className="text-[10px] text-[#64748B]">· {corners.length}개 코너</span>
          )}
          <span className="ml-auto text-[9px] text-[#64748B]">
            {editMode
              ? addMode ? "맵을 클릭해서 코너 추가" : "마커 클릭=선택 · 드래그=이동"
              : ""}
          </span>
          {editMode && (
            <span className="text-[9px] font-black text-[#E8002D] tracking-widest animate-pulse">EDIT</span>
          )}
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto"
          style={{ cursor: dragging ? "grabbing" : addMode ? "crosshair" : "default" }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onClick={onSVGClick}
          aria-hidden
        >
          <defs>
            <filter id="track-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="label-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#0a0a14" floodOpacity="1" />
            </filter>
          </defs>

          <path d={path} fill="none" stroke="#2D2D3A" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
          <path d={path} fill="none" stroke="#3a3a4a" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          <path d={path} fill="none" stroke="#E8002D" strokeWidth="3"  strokeLinecap="round" strokeLinejoin="round" filter="url(#track-glow)" />

          {corners.map((corner) => {
            const [cx, cy]    = toSVG(proj, corner.lng, corner.lat);
            const [lx, ly]    = labelOffset(corner.anchor);
            const isSelected  = selected === corner.name;
            const isDragging  = dragging === corner.name;
            return (
              <g
                key={corner.name}
                data-marker="1"
                style={{ cursor: editMode ? (isDragging ? "grabbing" : "grab") : "default" }}
                onPointerDown={(e) => onPointerDown(corner.name, e)}
              >
                {/* Hit area */}
                <circle cx={cx} cy={cy} r={18} fill="transparent" />
                {/* Selection ring */}
                {isSelected && (
                  <circle cx={cx} cy={cy} r={12} fill="none"
                    stroke="#FCD34D" strokeWidth={2} opacity={0.9} />
                )}
                {/* Edit mode dashed ring */}
                {editMode && !isSelected && (
                  <circle cx={cx} cy={cy} r={10} fill="none"
                    stroke="#E8002D" strokeWidth={1} opacity={isDragging ? 0.8 : 0.3}
                    strokeDasharray={isDragging ? "0" : "3 2"} />
                )}
                {/* Marker */}
                <circle cx={cx} cy={cy} r={7}
                  fill="#0a0a14" stroke={isSelected ? "#FCD34D" : "#E8002D"}
                  strokeWidth={isSelected ? 2 : 1.5} opacity={0.9} />
                <circle cx={cx} cy={cy} r={3}
                  fill={isSelected ? "#FCD34D" : "#E8002D"} opacity={0.95} />
                {/* Label */}
                <text
                  x={cx + lx} y={cy + ly}
                  fontSize="10" fontWeight="600"
                  fill={isSelected ? "#FCD34D" : editMode ? "#f1f5f9" : "#cbd5e1"}
                  textAnchor={labelAnchor(corner.anchor)}
                  filter="url(#label-shadow)"
                >
                  {corner.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Selected corner edit panel ───────────────────────── */}
      {editMode && selectedCorner && (
        <div className="mt-2 bg-[#0d0d1a] border border-[#FCD34D]/30 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#2D2D3A] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FCD34D]" />
            <span className="text-[10px] font-bold text-[#FCD34D] uppercase tracking-wider">
              {selectedCorner.name} 편집
            </span>
            <span className="ml-auto text-[10px] text-[#64748B] font-mono">
              {selectedCorner.lat.toFixed(5)}, {selectedCorner.lng.toFixed(5)}
            </span>
          </div>

          <div className="px-4 py-3 flex flex-wrap items-center gap-4">
            {/* Name */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#64748B] uppercase">이름</span>
              <input
                ref={nameRef}
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && renameSelected()}
                onBlur={renameSelected}
                className="bg-white/5 border border-[#2D2D3A] rounded px-2 py-1 text-xs text-white font-mono w-36 focus:border-[#FCD34D] outline-none"
              />
            </div>

            {/* Anchor direction */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#64748B] uppercase">레이블</span>
              <div className="flex gap-1">
                {ANCHORS.map(a => (
                  <button
                    key={a}
                    onClick={() => setAnchor(a)}
                    className={`w-7 h-7 rounded text-sm font-bold transition-all ${
                      selectedCorner.anchor === a
                        ? "bg-[#FCD34D] text-black"
                        : "bg-white/5 text-[#64748B] hover:text-white"
                    }`}
                    title={a}
                  >
                    {ANCHOR_ICONS[a!]}
                  </button>
                ))}
              </div>
            </div>

            {/* Delete */}
            <button
              onClick={deleteSelected}
              className="ml-auto text-xs font-bold px-3 py-1.5 rounded-full bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-all"
            >
              삭제
            </button>
          </div>
        </div>
      )}

      {/* ── JSON output ──────────────────────────────────────── */}
      {editMode && !selectedCorner && (
        <div className="mt-2 bg-[#0a0a14] border border-[#2D2D3A] rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#2D2D3A] flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              좌표 JSON — TrackMap.tsx에 붙여넣기
            </span>
            <button onClick={copyJSON} className="text-[10px] font-bold text-[#E8002D] hover:opacity-80">
              {copied ? "✓ 복사됨" : "복사"}
            </button>
          </div>
          <pre className="px-4 py-3 text-[11px] text-[#64748B] font-mono overflow-x-auto leading-relaxed max-h-48">
            {JSON.stringify(
              corners.map(c => ({
                name: c.name,
                lat: +c.lat.toFixed(6),
                lng: +c.lng.toFixed(6),
                anchor: c.anchor,
              })),
              null, 2
            )}
          </pre>
        </div>
      )}

      {/* Keyboard hint */}
      {editMode && (
        <p className="mt-2 px-1 text-[10px] text-[#3a3a4a]">
          Delete = 삭제 · Cmd+Z = 실행취소 · Esc = 선택 해제
        </p>
      )}
    </div>
  );
}
