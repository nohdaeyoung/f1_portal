"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";

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

// S1=빨강, S2=파랑, S3=노랑
const SECTOR_COLORS: [string, string, string] = ["#E8002D", "#3B82F6", "#FACC15"];
const SECTOR_LABELS = ["S1", "S2", "S3"] as const;

interface Props {
  path: string;
  W: number;
  H: number;
  proj: Projection;
  circuitId?: string;
  initialCorners: CornerData[];
  rawCoords?: [number, number][];
  initialSplits?: [number, number] | [number, number, number]; // legacy format
  initialSectors?: [[number, number], [number, number], [number, number]]; // new independent-start/end format
  initialSfPosition?: number; // 0–1 fraction
  initialDirReversed?: boolean;
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

// Project raw coord to SVG space
function projCoord(proj: Projection, [lng, lat]: [number, number]): [number, number] {
  return [
    proj.ox + (lng - proj.x0) * proj.s,
    proj.oy + (proj.y1 - lat) * proj.s,
  ];
}

// Build cumulative arc-length table for a coord array (in projected SVG units)
function buildArcLengths(coords: [number, number][], proj: Projection): number[] {
  const cum: number[] = [0];
  for (let i = 1; i < coords.length; i++) {
    const [x0, y0] = projCoord(proj, coords[i - 1]);
    const [x1, y1] = projCoord(proj, coords[i]);
    const d = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
    cum.push(cum[i - 1] + d);
  }
  return cum;
}

// Find coordinate index corresponding to a distance fraction (0–1) using arc lengths
function arcFracToIndex(cum: number[], frac: number): number {
  const target = cum[cum.length - 1] * frac;
  let lo = 0, hi = cum.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] < target) lo = mid + 1; else hi = mid;
  }
  return lo;
}

// Build 3 sector SVG paths — each sector has independent [start, end] arc-length fractions
// Allows gaps between sectors (uncolored gap = S/F zone or pit straight)
function buildSectorPaths(
  coords: [number, number][],
  sectors: [[number, number], [number, number], [number, number]], // [[s1s,s1e],[s2s,s2e],[s3s,s3e]] 0–1
  proj: Projection,
): [string, string, string] {
  const cum = buildArcLengths(coords, proj);
  const wrapSeg = ([lng, lat]: [number, number]) => {
    const [cx, cy] = projCoord(proj, [lng, lat]);
    return `L ${cx.toFixed(1)} ${cy.toFixed(1)}`;
  };
  const toPath = (pts: [number, number][]): string =>
    pts.map(([lng, lat], i) => {
      const [cx, cy] = projCoord(proj, [lng, lat]);
      return `${i ? "L" : "M"} ${cx.toFixed(1)} ${cy.toFixed(1)}`;
    }).join(" ");
  return sectors.map(([s, e]) => {
    if (s < 0) {
      // 음수 시작: 트랙 끝 부분(1+s ~ 1)과 앞 부분(0 ~ e)을 연결
      const iS = arcFracToIndex(cum, 1 + s);
      const iE = arcFracToIndex(cum, Math.max(0, e));
      const seg1 = toPath(coords.slice(iS));
      const seg2pts = coords.slice(0, iE + 1);
      if (!seg2pts.length) return seg1;
      return seg1 + " " + seg2pts.map(wrapSeg).join(" ");
    }
    if (e < s && e >= 0) {
      // forward wrap: s → track end → track start → e
      const iS = arcFracToIndex(cum, s);
      const iE = arcFracToIndex(cum, e);
      const part1 = toPath(coords.slice(iS));
      if (iE <= 0) return part1;
      return part1 + " " + coords.slice(0, iE + 1).map(wrapSeg).join(" ");
    }
    const iS = arcFracToIndex(cum, Math.min(s, e));
    const iE = arcFracToIndex(cum, Math.max(s, e));
    return toPath(coords.slice(iS, iE + 1));
  }) as [string, string, string];
}

// Compute direction arrows — evenly spaced by arc length
function buildArrows(
  coords: [number, number][],
  proj: Projection,
  reversed: boolean,
): { cx: number; cy: number; dx: number; dy: number }[] {
  const cum = buildArcLengths(coords, proj);
  return [0.1, 0.3, 0.5, 0.7, 0.9].map(frac => {
    const i  = arcFracToIndex(cum, frac);
    const i0 = Math.max(0, i - 6);
    const i1 = Math.min(coords.length - 1, i + 6);
    const [cx, cy] = projCoord(proj, coords[i]);
    const [ax, ay] = projCoord(proj, coords[i0]);
    const [bx, by] = projCoord(proj, coords[i1]);
    let dx = bx - ax, dy = by - ay;
    if (reversed) { dx = -dx; dy = -dy; }
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { cx, cy, dx: dx / len, dy: dy / len };
  });
}

// Compute S/F line info (position + perpendicular direction) — arc-length based
function buildSFPoint(
  coords: [number, number][],
  proj: Projection,
  frac: number,
): { cx: number; cy: number; nx: number; ny: number } | null {
  if (!coords.length) return null;
  const cum = buildArcLengths(coords, proj);
  const i  = arcFracToIndex(cum, frac % 1);
  const i0 = Math.max(0, i - 4);
  const i1 = Math.min(coords.length - 1, i + 4);
  const [cx, cy] = projCoord(proj, coords[i]);
  const [ax, ay] = projCoord(proj, coords[i0]);
  const [bx, by] = projCoord(proj, coords[i1]);
  const dx = bx - ax, dy = by - ay;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  // Perpendicular = rotate 90°
  return { cx, cy, nx: -dy / len, ny: dx / len };
}

const ANCHORS: CornerData["anchor"][] = ["above", "right", "below", "left"];
const ANCHOR_ICONS: Record<string, string> = {
  above: "↑", right: "→", below: "↓", left: "←",
};

// ─── Component ────────────────────────────────────────────────

export function TrackMapClient({
  path, W, H, proj, circuitId, initialCorners,
  rawCoords, initialSplits, initialSectors, initialSfPosition = 0, initialDirReversed = false,
}: Props) {
  // Admin: read cookie client-side so server component stays cacheable
  const isAdmin = typeof document !== "undefined"
    ? document.cookie.split(";").some((c) => c.trim() === "pitlane_admin=authenticated")
    : false;
  // Corner edit state
  const [editMode, setEditMode]       = useState(false);
  const [addMode, setAddMode]         = useState(false);
  const [corners, setCorners]         = useState<CornerData[]>(initialCorners);
  const [undoStack, setUndoStack]     = useState<CornerData[][]>([]);
  const [selected, setSelected]       = useState<string | null>(null);
  const [nameInput, setNameInput]     = useState("");
  const [dragging, setDragging]       = useState<string | null>(null);
  const [copied, setCopied]           = useState(false);

  // Save state per panel
  const [saveState, setSaveState] = useState<Record<string, "saving" | "ok" | "err">>({});

  const saveCircuit = async (patch: Record<string, unknown>, key: string) => {
    if (!circuitId) return;
    setSaveState(s => ({ ...s, [key]: "saving" }));
    try {
      const res = await fetch(`/api/admin/circuit/${circuitId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      setSaveState(s => ({ ...s, [key]: json.ok ? "ok" : "err" }));
    } catch {
      setSaveState(s => ({ ...s, [key]: "err" }));
    } finally {
      setTimeout(() => setSaveState(s => { const n = { ...s }; delete n[key]; return n; }), 2500);
    }
  };

  const saveLabel = (key: string) => {
    if (saveState[key] === "saving") return "저장 중…";
    if (saveState[key] === "ok") return "✓ 저장됨";
    if (saveState[key] === "err") return "✗ 실패";
    return "저장";
  };

  // Sector edit state
  const [sectorEditMode, setSectorEditMode]     = useState(false);
  const [sectorCopied, setSectorCopied]         = useState(false);
  const [draggingSector, setDraggingSector]     = useState<null | 0 | 1 | 2>(null);
  const sfPct = +(initialSfPosition * 100).toFixed(2);
  // Each sector: [start, end] as percentage (0–100)
  // initialSectors takes precedence; fall back to legacy initialSplits
  const [s1s, setS1s] = useState(() => initialSectors ? +(initialSectors[0][0] * 100).toFixed(2) : sfPct);
  const [s1e_, setS1e] = useState(() => initialSectors ? +(initialSectors[0][1] * 100).toFixed(2) : (initialSplits ? +(initialSplits[0] * 100).toFixed(2) : 33));
  const [s2s, setS2s] = useState(() => initialSectors ? +(initialSectors[1][0] * 100).toFixed(2) : (initialSplits ? +(initialSplits[0] * 100).toFixed(2) : 33));
  const [s2e_, setS2e] = useState(() => initialSectors ? +(initialSectors[1][1] * 100).toFixed(2) : (initialSplits ? +(initialSplits[1] * 100).toFixed(2) : 66));
  const [s3s, setS3s] = useState(() => initialSectors ? +(initialSectors[2][0] * 100).toFixed(2) : (initialSplits ? +(initialSplits[1] * 100).toFixed(2) : 66));
  const [s3e_, setS3e] = useState(() => initialSectors ? +(initialSectors[2][1] * 100).toFixed(2) : (initialSplits?.[2] != null ? +(initialSplits[2] * 100).toFixed(2) : 100));

  // Direction & S/F state
  const [sfEditMode, setSfEditMode]         = useState(false);
  const [showDirection, setShowDirection]   = useState(initialDirReversed);
  const [dirReversed, setDirReversed]       = useState(initialDirReversed);
  const [showSF, setShowSF]                 = useState(initialSfPosition > 0);
  const [sfPos, setSfPos]                   = useState(+(initialSfPosition * 100).toFixed(2));
  const [sfCopied, setSfCopied]             = useState(false);

  const didDragRef = useRef(false);
  const svgRef     = useRef<SVGSVGElement>(null);
  const nameRef    = useRef<HTMLInputElement>(null);

  // ── Computed SVG data ─────────────────────────────────────────

  // Cached arc-length table (used for sector marker snapping)
  const arcLengths = useMemo(() => {
    if (!rawCoords?.length) return null;
    return buildArcLengths(rawCoords, proj);
  }, [rawCoords, proj]);

  // SVG positions for 3 sector boundary markers:
  //   pt[0] = S1 start (s1s)     — red
  //   pt[1] = S1/S2 boundary (s1e_ = s2s) — blue
  //   pt[2] = S2/S3 boundary (s2e_ = s3s) — yellow
  const sectorMarkerPts = useMemo(() => {
    if (!rawCoords?.length || !arcLengths) return null;
    return [s1s / 100, s1e_ / 100, s2e_ / 100].map(f => {
      const i = arcFracToIndex(arcLengths, ((f % 1) + 1) % 1);
      const [cx, cy] = projCoord(proj, rawCoords[i]);
      return { cx, cy };
    });
  }, [rawCoords, arcLengths, proj, s1s, s1e_, s2e_]);

  const sectorPaths = useMemo(() => {
    if (!rawCoords?.length) return null;
    return buildSectorPaths(rawCoords, [
      [s1s / 100, s1e_ / 100],
      [s2s / 100, s2e_ / 100],
      [s3s / 100, s3e_ / 100],
    ], proj);
  }, [rawCoords, s1s, s1e_, s2s, s2e_, s3s, s3e_, proj]);

  const arrows = useMemo(() => {
    if (!rawCoords?.length || !showDirection) return [];
    return buildArrows(rawCoords, proj, dirReversed);
  }, [rawCoords, proj, showDirection, dirReversed]);

  const sfPoint = useMemo(() => {
    if (!rawCoords?.length || !showSF) return null;
    return buildSFPoint(rawCoords, proj, sfPos / 100);
  }, [rawCoords, proj, sfPos, showSF]);

  // ── Undo / apply ─────────────────────────────────────────────

  const saveUndo = useCallback((current: CornerData[]) => {
    setUndoStack(s => [...s.slice(-24), current]);
  }, []);

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

  // ── Keyboard shortcuts ────────────────────────────────────────

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

  useEffect(() => {
    if (selected) {
      const c = corners.find(c => c.name === selected);
      setNameInput(c?.name ?? "");
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pointer helpers ───────────────────────────────────────────

  const clientToSVG = useCallback((cx: number, cy: number): [number, number] => {
    const svg = svgRef.current;
    if (!svg) return [0, 0];
    const r = svg.getBoundingClientRect();
    return [(cx - r.left) * (W / r.width), (cy - r.top) * (H / r.height)];
  }, [W, H]);

  const onSVGClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!addMode || !editMode) return;
    if ((e.target as Element).closest("[data-marker]")) return;
    if (didDragRef.current) return;
    const [cx, cy] = clientToSVG(e.clientX, e.clientY);
    const { lat, lng } = toLatLng(proj, cx, cy);
    const name = `T${corners.length + 1}`;
    apply([...corners, { name, lat, lng, anchor: "above" }]);
    setSelected(name);
    setAddMode(false);
  }, [addMode, editMode, clientToSVG, proj, corners, apply]);

  const onPointerDown = useCallback((name: string, e: React.PointerEvent) => {
    if (!editMode) return;
    e.preventDefault(); e.stopPropagation();
    didDragRef.current = false;
    saveUndo(corners);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setDragging(name);
  }, [editMode, corners, saveUndo]);

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (dragging) {
      didDragRef.current = true;
      const [cx, cy] = clientToSVG(e.clientX, e.clientY);
      const { lat, lng } = toLatLng(proj, cx, cy);
      setCorners(prev => prev.map(c => c.name === dragging ? { ...c, lat, lng } : c));
    } else if (draggingSector !== null && rawCoords && arcLengths) {
      const [svgX, svgY] = clientToSVG(e.clientX, e.clientY);
      let minDist = Infinity, nearestI = 0;
      for (let i = 0; i < rawCoords.length; i++) {
        const [cx, cy] = projCoord(proj, rawCoords[i]);
        const d = (cx - svgX) ** 2 + (cy - svgY) ** 2;
        if (d < minDist) { minDist = d; nearestI = i; }
      }
      const f = +(arcLengths[nearestI] / arcLengths[arcLengths.length - 1] * 100).toFixed(2);
      if (draggingSector === 0) {
        setS1s(f);
      } else if (draggingSector === 1) {
        setS1e(f); setS2s(f);
      } else {
        setS2e(f); setS3s(f);
      }
    }
  }, [dragging, draggingSector, clientToSVG, proj, rawCoords, arcLengths]);

  const onPointerUp = useCallback((_e: React.PointerEvent<SVGSVGElement>) => {
    if (dragging) {
      if (!didDragRef.current) {
        setSelected(dragging === selected ? null : dragging);
        setUndoStack(s => s.slice(0, -1));
      }
      setDragging(null);
    } else if (draggingSector !== null) {
      setDraggingSector(null);
    }
  }, [dragging, draggingSector, selected]);

  // ── Panel actions ─────────────────────────────────────────────

  const renameSelected = () => {
    const trimmed = nameInput.trim();
    if (!trimmed || !selected) return;
    if (trimmed === selected || corners.some(c => c.name === trimmed)) return;
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

  const reset = () => { saveUndo(corners); setCorners(initialCorners); setSelected(null); };

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(
      corners.map(c => ({ name: c.name, lat: +c.lat.toFixed(6), lng: +c.lng.toFixed(6), anchor: c.anchor })),
      null, 2
    ));
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const copySectorSplits = () => {
    const fmt = (v: number) => (v / 100).toFixed(4);
    // Output: [[s1s,s1e],[s2s,s2e],[s3s,s3e]] as array-of-pairs
    const val = `[[${fmt(s1s)},${fmt(s1e_)}],[${fmt(s2s)},${fmt(s2e_)}],[${fmt(s3s)},${fmt(s3e_)}]]`;
    navigator.clipboard.writeText(val);
    setSectorCopied(true);
    setTimeout(() => setSectorCopied(false), 2200);
  };

  const copySFPos = () => {
    navigator.clipboard.writeText((sfPos / 100).toFixed(6));
    setSfCopied(true);
    setTimeout(() => setSfCopied(false), 2200);
  };

  const selectedCorner = corners.find(c => c.name === selected);

  // ── Render ────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Toolbar (admin only) ─────────────────────────────── */}
      {isAdmin && (
      <div className="flex flex-wrap items-center gap-2 px-1 mb-3">
        <button
          onClick={() => { setEditMode(v => !v); setSelected(null); setAddMode(false); setSectorEditMode(false); setSfEditMode(false); }}
          className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
            editMode ? "bg-[#E8002D] text-white" : "bg-white/5 text-[#64748B] hover:text-white"
          }`}
        >
          {editMode ? "편집 완료" : "코너 위치 편집"}
        </button>

        {rawCoords && (
          <button
            onClick={() => { setSectorEditMode(v => !v); setEditMode(false); setSelected(null); setAddMode(false); setSfEditMode(false); }}
            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
              sectorEditMode ? "bg-[#3B82F6] text-white" : "bg-white/5 text-[#64748B] hover:text-white"
            }`}
          >
            {sectorEditMode ? "섹터 편집 완료" : "섹터 구간 편집"}
          </button>
        )}

        {rawCoords && (
          <button
            onClick={() => { setSfEditMode(v => !v); setEditMode(false); setSelected(null); setAddMode(false); setSectorEditMode(false); }}
            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
              sfEditMode ? "bg-[#A855F7] text-white" : "bg-white/5 text-[#64748B] hover:text-white"
            }`}
          >
            {sfEditMode ? "방향/S·F 편집 완료" : "주행방향 / S·F 편집"}
          </button>
        )}

        {editMode && (
          <>
            <button
              onClick={() => { setAddMode(v => !v); setSelected(null); }}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                addMode ? "bg-[#FCD34D] text-black" : "bg-white/5 text-[#64748B] hover:text-white"
              }`}
            >
              {addMode ? "클릭해서 배치…" : "+ 코너 추가"}
            </button>
            <button onClick={undo} disabled={!undoStack.length}
              className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-[#64748B] hover:text-white disabled:opacity-30 transition-all"
              title="실행 취소 (Cmd+Z)">↩ 실행취소</button>
            <button onClick={reset}
              className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-[#64748B] hover:text-white transition-all">초기화</button>
            <button onClick={copyJSON}
              className="ml-auto text-xs font-bold px-3 py-1.5 rounded-full bg-white/5 text-[#64748B] hover:text-white transition-all">
              {copied ? "✓ 복사됨" : "JSON 복사"}
            </button>
            {circuitId && (
              <button
                onClick={() => saveCircuit({ corners: corners.map(c => ({ name: c.name, lat: +c.lat.toFixed(6), lng: +c.lng.toFixed(6), anchor: c.anchor })) }, "corners")}
                disabled={saveState["corners"] === "saving"}
                className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#E8002D]/20 text-[#E8002D] hover:bg-[#E8002D]/30 disabled:opacity-50 transition-all">
                {saveLabel("corners")}
              </button>
            )}
          </>
        )}
      </div>
      )}

      {/* ── Sector edit panel ────────────────────────────────── */}
      {sectorEditMode && (
        <div className="mb-3 bg-[#0d0d1a] border border-[#3B82F6]/30 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#2D2D3A] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
            <span className="text-[10px] font-bold text-[#3B82F6] uppercase tracking-wider">섹터 구간 설정</span>
            <span className="ml-auto flex items-center gap-2 text-[10px] text-[#64748B]">
              {SECTOR_COLORS.map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: c }} />
                  S{i+1} 드래그
                </span>
              ))}
            </span>
          </div>
          <div className="px-4 py-4 space-y-3">
            {/* S1 */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold" style={{ color: SECTOR_COLORS[0] }}>S1</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-[#64748B] w-6">시작</span>
                <input type="range" min={-25} max={Math.max(-25, s1e_ - 0.0001)} step={0.0001} value={s1s}
                  onChange={e => setS1s(+e.target.value)}
                  className="flex-1 accent-[#E8002D] h-1.5" />
                <span className="text-[10px] font-mono text-white w-16 text-right">{s1s.toFixed(4)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-[#64748B] w-6">끝</span>
                <input type="range" min={Math.min(100, s1s + 0.0001)} max={100} step={0.0001} value={s1e_}
                  onChange={e => setS1e(+e.target.value)}
                  className="flex-1 accent-[#E8002D] h-1.5" />
                <span className="text-[10px] font-mono text-white w-16 text-right">{s1e_.toFixed(4)}%</span>
              </div>
            </div>
            {/* S2 */}
            <div className="space-y-1.5 pt-2 border-t border-[#2D2D3A]">
              <span className="text-[10px] font-bold" style={{ color: SECTOR_COLORS[1] }}>S2</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-[#64748B] w-6">시작</span>
                <input type="range" min={-25} max={Math.max(-25, s2e_ - 0.0001)} step={0.0001} value={s2s}
                  onChange={e => setS2s(+e.target.value)}
                  className="flex-1 accent-[#3B82F6] h-1.5" />
                <span className="text-[10px] font-mono text-white w-16 text-right">{s2s.toFixed(4)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-[#64748B] w-6">끝</span>
                <input type="range" min={Math.min(100, s2s + 0.0001)} max={100} step={0.0001} value={s2e_}
                  onChange={e => setS2e(+e.target.value)}
                  className="flex-1 accent-[#3B82F6] h-1.5" />
                <span className="text-[10px] font-mono text-white w-16 text-right">{s2e_.toFixed(4)}%</span>
              </div>
            </div>
            {/* S3 */}
            <div className="space-y-1.5 pt-2 border-t border-[#2D2D3A]">
              <span className="text-[10px] font-bold" style={{ color: SECTOR_COLORS[2] }}>S3</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-[#64748B] w-6">시작</span>
                <input type="range" min={-25} max={Math.max(-25, s3e_ - 0.0001)} step={0.0001} value={s3s}
                  onChange={e => setS3s(+e.target.value)}
                  className="flex-1 accent-[#FACC15] h-1.5" />
                <span className="text-[10px] font-mono text-white w-16 text-right">{s3s.toFixed(4)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-[#64748B] w-6">끝</span>
                <input type="range" min={Math.min(100, s3s + 0.0001)} max={100} step={0.0001} value={s3e_}
                  onChange={e => setS3e(+e.target.value)}
                  className="flex-1 accent-[#FACC15] h-1.5" />
                <span className="text-[10px] font-mono text-white w-16 text-right">{s3e_.toFixed(4)}%</span>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-[#2D2D3A]">
              <span className="text-[10px] text-[#64748B]">
                S1 {s1s.toFixed(4)}–{s1e_.toFixed(4)}% · S2 {s2s.toFixed(4)}–{s2e_.toFixed(4)}% · S3 {s3s.toFixed(4)}–{s3e_.toFixed(4)}%
              </span>
              <button onClick={copySectorSplits}
                className="ml-auto text-[10px] font-bold px-3 py-1 rounded-full bg-white/5 text-[#3B82F6] hover:opacity-80 transition-all font-mono">
                {sectorCopied ? "✓ 복사됨" : "복사"}
              </button>
              {circuitId && (
                <button
                  onClick={() => saveCircuit({ sectors: [{s:s1s/100,e:s1e_/100},{s:s2s/100,e:s2e_/100},{s:s3s/100,e:s3e_/100}] }, "sectors")}
                  disabled={saveState["sectors"] === "saving"}
                  className="text-[10px] font-bold px-3 py-1 rounded-full bg-[#3B82F6]/20 text-[#3B82F6] hover:bg-[#3B82F6]/30 disabled:opacity-50 transition-all">
                  {saveLabel("sectors")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Direction / S·F edit panel ───────────────────────── */}
      {sfEditMode && (
        <div className="mb-3 bg-[#0d0d1a] border border-[#A855F7]/30 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#2D2D3A] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#A855F7]" />
            <span className="text-[10px] font-bold text-[#A855F7] uppercase tracking-wider">주행방향 / S·F 라인</span>
          </div>
          <div className="px-4 py-4 space-y-4">
            {/* Direction toggle */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-white w-20">주행방향</span>
              <button
                onClick={() => setShowDirection(v => !v)}
                className={`text-xs px-3 py-1 rounded-full font-bold transition-all ${
                  showDirection ? "bg-[#A855F7] text-white" : "bg-white/5 text-[#64748B] hover:text-white"
                }`}
              >
                {showDirection ? "표시 중" : "숨김"}
              </button>
              {showDirection && (
                <button
                  onClick={() => setDirReversed(v => !v)}
                  className={`text-xs px-3 py-1 rounded-full transition-all ${
                    dirReversed ? "bg-orange-500/20 text-orange-400" : "bg-white/5 text-[#64748B] hover:text-white"
                  }`}
                >
                  {dirReversed ? "↺ 방향 반전됨" : "방향 반전"}
                </button>
              )}
            </div>

            {/* S/F toggle + slider */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-white w-20">S/F 라인</span>
                <button
                  onClick={() => setShowSF(v => !v)}
                  className={`text-xs px-3 py-1 rounded-full font-bold transition-all ${
                    showSF ? "bg-[#A855F7] text-white" : "bg-white/5 text-[#64748B] hover:text-white"
                  }`}
                >
                  {showSF ? "표시 중" : "숨김"}
                </button>
              </div>
              {showSF && (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[#64748B] w-20">위치</span>
                  <input type="range" min={0} max={99.9999} step={0.0001} value={sfPos}
                    onChange={e => setSfPos(+e.target.value)}
                    className="flex-1 accent-[#A855F7] h-1.5" />
                  <span className="text-[10px] font-mono text-white w-16 text-right">{sfPos.toFixed(4)}%</span>
                  <button onClick={copySFPos}
                    className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/5 text-[#A855F7] hover:opacity-80 transition-all font-mono">
                    {sfCopied ? "✓" : `${(sfPos/100).toFixed(6)} 복사`}
                  </button>
                </div>
              )}
            </div>

            {circuitId && (
              <div className="flex items-center gap-3 pt-1 border-t border-[#2D2D3A]">
                <span className="text-[10px] text-[#64748B]">S/F 위치 {(sfPos/100).toFixed(6)}</span>
                <button
                  onClick={() => saveCircuit({ sfPosition: sfPos / 100, dirReversed }, "sf")}
                  disabled={saveState["sf"] === "saving"}
                  className="ml-auto text-[10px] font-bold px-3 py-1 rounded-full bg-[#A855F7]/20 text-[#A855F7] hover:bg-[#A855F7]/30 disabled:opacity-50 transition-all">
                  {saveLabel("sf")}
                </button>
              </div>
            )}
            <p className="text-[10px] text-[#3a3a4a] pt-1 border-t border-[#2D2D3A]">
              저장 시 즉시 반영됨 (페이지 새로고침 필요)
            </p>
          </div>
        </div>
      )}

      {/* ── SVG Map ─────────────────────────────────────────── */}
      <div className="bg-[#0a0a14] border border-[#2D2D3A] rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#2D2D3A] flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">트랙 레이아웃</span>
          {corners.length > 0 && (
            <span className="text-[10px] text-[#64748B]">· {corners.length}개 코너</span>
          )}
          {sectorPaths && !editMode && (
            <div className="flex items-center gap-2 ml-2">
              {SECTOR_LABELS.map((s, i) => (
                <span key={s} className="flex items-center gap-1 text-[10px] font-bold" style={{ color: SECTOR_COLORS[i] }}>
                  <span className="w-4 h-0.5 rounded-full inline-block" style={{ backgroundColor: SECTOR_COLORS[i] }} />
                  {s}
                </span>
              ))}
            </div>
          )}
          <span className="ml-auto text-[9px] text-[#64748B]">
            {editMode ? (addMode ? "맵을 클릭해서 코너 추가" : "마커 클릭=선택 · 드래그=이동")
              : sectorEditMode ? "S1/S2/S3 마커 드래그로 섹터 경계 조정"
              : sfEditMode ? "슬라이더로 S/F 위치 조정"
              : ""}
          </span>
          {editMode && <span className="text-[9px] font-black text-[#E8002D] tracking-widest animate-pulse">EDIT</span>}
          {sectorEditMode && <span className="text-[9px] font-black text-[#3B82F6] tracking-widest animate-pulse">SECTOR</span>}
          {sfEditMode && <span className="text-[9px] font-black text-[#A855F7] tracking-widest animate-pulse">S·F</span>}
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto"
          style={{ cursor: (dragging || draggingSector !== null) ? "grabbing" : addMode ? "crosshair" : "default" }}
          onPointerDown={(e) => {
            // Reset drag flag when clicking empty space (not a marker)
            if (!(e.target as Element).closest("[data-marker]")) {
              didDragRef.current = false;
            }
          }}
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
            <filter id="sf-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* ── Track paths (pointer-events:none — decorative only) ── */}
          <path d={path} fill="none" stroke="#2D2D3A" strokeWidth="16" strokeLinecap="round" strokeLinejoin="bevel" pointerEvents="none" />
          <path d={path} fill="none" stroke="#3a3a4a" strokeWidth="10" strokeLinecap="round" strokeLinejoin="bevel" pointerEvents="none" />
          {sectorPaths ? (
            sectorPaths.map((sp, i) => (
              <path key={i} d={sp} fill="none" stroke={SECTOR_COLORS[i]} strokeWidth="3"
                strokeLinecap="round" strokeLinejoin="round" filter="url(#track-glow)" pointerEvents="none" />
            ))
          ) : (
            <path d={path} fill="none" stroke="#E8002D" strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round" filter="url(#track-glow)" pointerEvents="none" />
          )}

          {/* ── Direction arrows ──────────────────────────── */}
          {arrows.map(({ cx, cy, dx, dy }, i) => {
            const size = 14;
            const nx = -dy, ny = dx;
            const tipX = cx + dx * size, tipY = cy + dy * size;
            const lx = cx + nx * size * 0.45, ly = cy + ny * size * 0.45;
            const rx = cx - nx * size * 0.45, ry = cy - ny * size * 0.45;
            return (
              <polygon
                key={i}
                points={`${tipX},${tipY} ${lx},${ly} ${rx},${ry}`}
                fill="white" opacity={0.75}
                filter="url(#label-shadow)"
              />
            );
          })}

          {/* ── S/F line + checkered flag ─────────────────── */}
          {sfPoint && (() => {
            const { cx, cy, nx, ny } = sfPoint;
            const lineLen = 22;
            // Checkered flag: 3×2 grid of 5×5 squares, centered above line
            const flagW = 15, flagH = 10, sq = 5;
            // Position flag perpendicular offset from the track
            const offX = nx * (lineLen + 6), offY = ny * (lineLen + 6);
            const startX = cx + offX - flagW / 2;
            const startY = cy + offY - flagH / 2;
            return (
              <g filter="url(#sf-glow)">
                {/* Line across the track */}
                <line
                  x1={cx + nx * lineLen} y1={cy + ny * lineLen}
                  x2={cx - nx * lineLen} y2={cy - ny * lineLen}
                  stroke="white" strokeWidth="3.5" strokeLinecap="round"
                />
                {/* Checkered flag 3×2 */}
                {[0,1,2].map(col => [0,1].map(row => {
                  const isBlack = (col + row) % 2 === 0;
                  return (
                    <rect
                      key={`${col}-${row}`}
                      x={startX + col * sq} y={startY + row * sq}
                      width={sq} height={sq}
                      fill={isBlack ? "#111" : "white"}
                      stroke="#555" strokeWidth="0.3"
                    />
                  );
                }))}
                {/* S/F label */}
                <text
                  x={cx + offX}
                  y={cy + offY + flagH / 2 + 10}
                  fontSize="9" fontWeight="800"
                  fill="white" textAnchor="middle"
                  filter="url(#label-shadow)"
                >
                  S/F
                </text>
              </g>
            );
          })()}

          {/* ── Sector boundary markers (draggable) ──────── */}
          {sectorEditMode && sectorMarkerPts && sectorMarkerPts.map(({ cx, cy }, i) => (
            <g key={`sb${i}`} data-marker="1"
              style={{ cursor: draggingSector === i ? "grabbing" : "grab" }}
              onPointerDown={(e) => {
                e.preventDefault(); e.stopPropagation();
                (e.currentTarget as Element).setPointerCapture(e.pointerId);
                setDraggingSector(i as 0 | 1 | 2);
              }}
            >
              <circle cx={cx} cy={cy} r={18} fill="transparent" />
              <circle cx={cx} cy={cy} r={9} fill="#0a0a14" stroke={SECTOR_COLORS[i]} strokeWidth={2.5} opacity={0.97} />
              <circle cx={cx} cy={cy} r={4} fill={SECTOR_COLORS[i]} opacity={0.97} />
              <text x={cx} y={cy - 14} fontSize="9" fontWeight="800"
                fill={SECTOR_COLORS[i]} textAnchor="middle" filter="url(#label-shadow)">
                S{i + 1}
              </text>
            </g>
          ))}

          {/* ── Corner markers ────────────────────────────── */}
          {corners.map((corner) => {
            const [cx, cy]   = toSVG(proj, corner.lng, corner.lat);
            const [lx, ly]   = labelOffset(corner.anchor);
            const isSelected = selected === corner.name;
            const isDragging = dragging === corner.name;
            return (
              <g key={corner.name} data-marker="1"
                style={{ cursor: editMode ? (isDragging ? "grabbing" : "grab") : "default" }}
                onPointerDown={(e) => onPointerDown(corner.name, e)}
              >
                <circle cx={cx} cy={cy} r={18} fill="transparent" />
                {isSelected && <circle cx={cx} cy={cy} r={12} fill="none" stroke="#FCD34D" strokeWidth={2} opacity={0.9} />}
                {editMode && !isSelected && (
                  <circle cx={cx} cy={cy} r={10} fill="none" stroke="#E8002D" strokeWidth={1}
                    opacity={isDragging ? 0.8 : 0.3} strokeDasharray={isDragging ? "0" : "3 2"} />
                )}
                <circle cx={cx} cy={cy} r={7} fill="#0a0a14"
                  stroke={isSelected ? "#FCD34D" : "#E8002D"} strokeWidth={isSelected ? 2 : 1.5} opacity={0.9} />
                <circle cx={cx} cy={cy} r={3} fill={isSelected ? "#FCD34D" : "#E8002D"} opacity={0.95} />
                <text x={cx + lx} y={cy + ly} fontSize="10" fontWeight="600"
                  fill={isSelected ? "#FCD34D" : editMode ? "#f1f5f9" : "#cbd5e1"}
                  textAnchor={labelAnchor(corner.anchor)} filter="url(#label-shadow)">
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
            <span className="text-[10px] font-bold text-[#FCD34D] uppercase tracking-wider">{selectedCorner.name} 편집</span>
            <span className="ml-auto text-[10px] text-[#64748B] font-mono">
              {selectedCorner.lat.toFixed(5)}, {selectedCorner.lng.toFixed(5)}
            </span>
          </div>
          <div className="px-4 py-3 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#64748B] uppercase">이름</span>
              <input ref={nameRef} value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && renameSelected()}
                onBlur={renameSelected}
                className="bg-white/5 border border-[#2D2D3A] rounded px-2 py-1 text-xs text-white font-mono w-36 focus:border-[#FCD34D] outline-none" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#64748B] uppercase">레이블</span>
              <div className="flex gap-1">
                {ANCHORS.map(a => (
                  <button key={a} onClick={() => setAnchor(a)}
                    className={`w-7 h-7 rounded text-sm font-bold transition-all ${
                      selectedCorner.anchor === a ? "bg-[#FCD34D] text-black" : "bg-white/5 text-[#64748B] hover:text-white"
                    }`} title={a}>{ANCHOR_ICONS[a!]}</button>
                ))}
              </div>
            </div>
            <button onClick={deleteSelected}
              className="ml-auto text-xs font-bold px-3 py-1.5 rounded-full bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-all">
              삭제
            </button>
          </div>
        </div>
      )}

      {/* ── JSON output ──────────────────────────────────────── */}
      {editMode && !selectedCorner && (
        <div className="mt-2 bg-[#0a0a14] border border-[#2D2D3A] rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#2D2D3A] flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">좌표 JSON — TrackMap.tsx에 붙여넣기</span>
            <button onClick={copyJSON} className="text-[10px] font-bold text-[#E8002D] hover:opacity-80">
              {copied ? "✓ 복사됨" : "복사"}
            </button>
          </div>
          <pre className="px-4 py-3 text-[11px] text-[#64748B] font-mono overflow-x-auto leading-relaxed max-h-48">
            {JSON.stringify(
              corners.map(c => ({ name: c.name, lat: +c.lat.toFixed(6), lng: +c.lng.toFixed(6), anchor: c.anchor })),
              null, 2
            )}
          </pre>
        </div>
      )}

      {editMode && (
        <p className="mt-2 px-1 text-[10px] text-[#3a3a4a]">
          Delete = 삭제 · Cmd+Z = 실행취소 · Esc = 선택 해제
        </p>
      )}
    </div>
  );
}
