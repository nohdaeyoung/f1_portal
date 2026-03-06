"use client";

import { useState, useEffect, useRef } from "react";
import LapAnalysisTab from "./tabs/LapAnalysisTab";
import StrategyTab from "./tabs/StrategyTab";
import SpeedMapTab from "./tabs/SpeedMapTab";

const TABS = [
  { key: "telemetry", label: "텔레메트리" },
  { key: "laps",      label: "랩 분석" },
  { key: "strategy",  label: "레이스 전략" },
  { key: "speedmap",  label: "속도맵" },
];

const SESSIONS = [
  { key: "R",   label: "레이스" },
  { key: "Q",   label: "예선" },
  { key: "S",   label: "스프린트" },
  { key: "FP1", label: "FP1" },
  { key: "FP2", label: "FP2" },
  { key: "FP3", label: "FP3" },
];

// ─── Types ────────────────────────────────────────────────────

interface TelPoint { Distance: number; Speed: number | null; Throttle: number | null; Brake: boolean | null; nGear: number | null; DRS: number | null }
interface TrackPoint { X: number; Y: number }
interface Result { Abbreviation: string; TeamColor: string | null; Position: number | null; LapTime: number | null; Status: string }

// ─── Speed Trace SVG ─────────────────────────────────────────

function SpeedTrace({ data, color, maxDist, maxSpeed }: {
  data: TelPoint[]; color: string; maxDist: number; maxSpeed: number;
}) {
  const W = 800, H = 140, PAD = { t: 10, r: 10, b: 30, l: 40 };
  const w = W - PAD.l - PAD.r;
  const h = H - PAD.t - PAD.b;

  const pts = data
    .filter((d) => d.Speed != null)
    .map((d) => {
      const x = PAD.l + (d.Distance / maxDist) * w;
      const y = PAD.t + h - ((d.Speed ?? 0) / maxSpeed) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <polyline points={pts} fill="none" stroke={color}
      strokeWidth={1.5} strokeLinejoin="round" strokeOpacity={0.85} />
  );
}

// ─── Track Map SVG ───────────────────────────────────────────

function TrackMap({ points, color }: { points: TrackPoint[]; color: string }) {
  if (!points.length) return null;

  const xs = points.map((p) => p.X);
  const ys = points.map((p) => p.Y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const W = 300, H = 220, PAD = 16;
  const scale = Math.min((W - PAD * 2) / rangeX, (H - PAD * 2) / rangeY);

  const pts = points
    .map((p) => `${PAD + (p.X - minX) * scale},${H - PAD - (p.Y - minY) * scale}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <polyline points={pts} fill="none" stroke={color}
        strokeWidth={2} strokeLinejoin="round" strokeOpacity={0.9} />
    </svg>
  );
}

// ─── Main Component ──────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2018 }, (_, i) => CURRENT_YEAR - i);

export default function TelemetryClient({
  year: defaultYear,
  gp,
  raceName,
}: {
  year: number;
  gp: string;
  raceName?: string;
}) {
  const initYear = defaultYear >= CURRENT_YEAR ? CURRENT_YEAR - 1 : defaultYear;
  const [year, setYear] = useState(initYear);
  const [session, setSession] = useState("R");
  const [activeTab, setActiveTab] = useState("telemetry");

  const [results, setResults] = useState<Result[]>([]);
  const [driverA, setDriverA] = useState("");
  const [driverB, setDriverB] = useState("");
  const [telA, setTelA] = useState<TelPoint[]>([]);
  const [telB, setTelB] = useState<TelPoint[]>([]);
  const [trackA, setTrackA] = useState<TrackPoint[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [loadingTel, setLoadingTel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevSession = useRef(session);

  // Fetch results when year or session changes
  useEffect(() => {
    setResults([]);
    setDriverA("");
    setDriverB("");
    setTelA([]);
    setTelB([]);
    setTrackA([]);
    setError(null);
    setLoadingResults(true);

    fetch(`/api/fastf1/results?year=${year}&gp=${gp}&session=${session}`)
      .then((r) => {
        if (!r.ok) throw new Error(`서비스 오류 (${r.status})`);
        return r.json();
      })
      .then((data: Result[]) => {
        setResults(data);
        const sorted = [...data].sort((a, b) => (a.Position ?? 99) - (b.Position ?? 99));
        if (sorted[0]) setDriverA(sorted[0].Abbreviation);
        if (sorted[1]) setDriverB(sorted[1].Abbreviation);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingResults(false));

    prevSession.current = session;
  }, [year, gp, session]);

  // Fetch telemetry when drivers change
  useEffect(() => {
    if (!driverA && !driverB) return;
    setTelA([]);
    setTelB([]);
    setTrackA([]);
    setLoadingTel(true);

    const fetches: Promise<void>[] = [];

    if (driverA) {
      fetches.push(
        fetch(`/api/fastf1/fastest-lap?year=${year}&gp=${gp}&session=${session}&driver=${driverA}`)
          .then((r) => r.ok ? r.json() : []).then(setTelA)
      );
      fetches.push(
        fetch(`/api/fastf1/track-map?year=${year}&gp=${gp}&session=${session}&driver=${driverA}`)
          .then((r) => r.ok ? r.json() : []).then(setTrackA)
      );
    }
    if (driverB) {
      fetches.push(
        fetch(`/api/fastf1/fastest-lap?year=${year}&gp=${gp}&session=${session}&driver=${driverB}`)
          .then((r) => r.ok ? r.json() : []).then(setTelB)
      );
    }

    Promise.all(fetches).finally(() => setLoadingTel(false));
  }, [driverA, driverB, year, gp, session]);

  const colorA = results.find((r) => r.Abbreviation === driverA)?.TeamColor ?? "#E8002D";
  const colorB = results.find((r) => r.Abbreviation === driverB)?.TeamColor ?? "#3671C6";
  const teamColorA = colorA.startsWith("#") ? colorA : `#${colorA}`;
  const teamColorB = colorB.startsWith("#") ? colorB : `#${colorB}`;

  const allTel = [...telA, ...telB];
  const maxDist = allTel.length ? Math.max(...allTel.map((d) => d.Distance)) : 1;
  const maxSpeed = allTel.length
    ? Math.max(...allTel.filter((d) => d.Speed != null).map((d) => d.Speed!))
    : 350;
  const W = 800, H = 140, PAD = { t: 10, r: 10, b: 30, l: 40 };
  const w = W - PAD.l - PAD.r;
  const h = H - PAD.t - PAD.b;

  const yTicks = [0, 100, 200, 300, maxSpeed]
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => a - b);
  const xStep = Math.ceil(maxDist / 5000) * 1000;
  const xTicks = Array.from({ length: Math.floor(maxDist / xStep) + 1 }, (_, i) => i * xStep);

  const sortedResults = [...results].sort((a, b) => (a.Position ?? 99) - (b.Position ?? 99));

  return (
    <div className="space-y-5">

      {/* ── Filter Controls ── */}
      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4 space-y-4">

        {/* Row 1: Year + Session */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Year */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[#475569] uppercase tracking-widest shrink-0">연도</span>
            <div className="flex gap-1 flex-wrap">
              {YEARS.map((y) => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    year === y
                      ? "bg-white/15 text-white ring-1 ring-white/20"
                      : "bg-white/5 text-[#64748B] hover:text-white hover:bg-white/10"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px bg-[#2D2D3A] self-stretch" />

          {/* Session */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[#475569] uppercase tracking-widest shrink-0">세션</span>
            <div className="flex gap-1 flex-wrap">
              {SESSIONS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSession(s.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    session === s.key
                      ? "bg-[#E8002D] text-white"
                      : "bg-white/5 text-[#64748B] hover:text-white hover:bg-white/10"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Driver selectors */}
        {loadingResults ? (
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <span className="w-3 h-3 border border-[#475569] border-t-white rounded-full animate-spin" />
            드라이버 목록 로딩 중...
          </div>
        ) : results.length > 0 ? (
          <div className="flex gap-3 flex-wrap">
            {[
              { label: "드라이버 A", value: driverA, setter: setDriverA, color: teamColorA },
              { label: "드라이버 B", value: driverB, setter: setDriverB, color: teamColorB },
            ].map(({ label, value, setter, color }) => (
              <div key={label} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0 ring-2 ring-black/30"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[10px] text-[#475569] uppercase tracking-widest">{label}</span>
                <select
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="bg-[#0D0D14] border border-[#2D2D3A] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#E8002D] min-w-[120px]"
                >
                  <option value="">— 선택 —</option>
                  {sortedResults.map((r) => (
                    <option key={r.Abbreviation} value={r.Abbreviation}>
                      {r.Abbreviation}{r.Position ? ` · P${r.Position}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        ) : error ? null : (
          <div className="text-xs text-[#475569]">세션을 선택하면 드라이버 목록이 표시됩니다.</div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-[#E8002D]/10 border border-[#E8002D]/30 rounded-xl px-4 py-3 text-sm text-[#E8002D]">
          {error} — FastF1 서버가 실행 중인지 확인하세요.
        </div>
      )}

      {/* ── Tab navigation ── */}
      <div className="flex gap-0 border-b border-[#2D2D3A]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 -mb-px ${
              activeTab === t.key
                ? "border-[#E8002D] text-white"
                : "border-transparent text-[#64748B] hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}

      {activeTab === "laps" && driverA && (
        <LapAnalysisTab year={year} gp={gp} session={session}
          driverA={driverA} driverB={driverB} colorA={teamColorA} colorB={teamColorB} />
      )}

      {activeTab === "strategy" && (
        <StrategyTab year={year} gp={gp} session={session}
          driverA={driverA} driverB={driverB} />
      )}

      {activeTab === "speedmap" && (
        <SpeedMapTab year={year} gp={gp} session={session}
          driverA={driverA} driverB={driverB} colorA={teamColorA} colorB={teamColorB} />
      )}

      {/* ── 텔레메트리 탭 ── */}
      {activeTab === "telemetry" && (
        <div className="space-y-4">

          {/* Loading telemetry */}
          {loadingTel && (
            <div className="flex items-center gap-2 text-sm text-[#64748B]">
              <span className="w-3.5 h-3.5 border border-[#475569] border-t-white rounded-full animate-spin" />
              텔레메트리 데이터 로딩 중...
              <span className="text-xs text-[#475569]">(첫 요청은 30초~2분 소요될 수 있습니다)</span>
            </div>
          )}

          {/* Speed trace + track map */}
          {(telA.length > 0 || telB.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Speed trace */}
              <div className="lg:col-span-2 bg-[#141420] border border-[#2D2D3A] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#64748B] uppercase tracking-widest">속도 트레이스 (패스티스트 랩)</p>
                  <div className="flex gap-3 text-[10px]">
                    {driverA && telA.length > 0 && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-4 h-0.5 rounded inline-block" style={{ backgroundColor: teamColorA }} />
                        <span style={{ color: teamColorA }} className="font-bold">{driverA}</span>
                      </span>
                    )}
                    {driverB && telB.length > 0 && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-4 h-0.5 rounded inline-block" style={{ backgroundColor: teamColorB }} />
                        <span style={{ color: teamColorB }} className="font-bold">{driverB}</span>
                      </span>
                    )}
                  </div>
                </div>
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
                  {yTicks.map((v) => {
                    const y = PAD.t + h - (v / maxSpeed) * h;
                    return (
                      <g key={v}>
                        <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#1E2030" strokeWidth={1} />
                        <text x={PAD.l - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#64748B">{v}</text>
                      </g>
                    );
                  })}
                  {xTicks.map((v) => {
                    const x = PAD.l + (v / maxDist) * w;
                    return (
                      <g key={v}>
                        <line x1={x} y1={PAD.t} x2={x} y2={H - PAD.b} stroke="#1E2030" strokeWidth={1} />
                        <text x={x} y={H - PAD.b + 14} textAnchor="middle" fontSize={9} fill="#64748B">{(v / 1000).toFixed(0)}km</text>
                      </g>
                    );
                  })}
                  {telA.length > 0 && <SpeedTrace data={telA} color={teamColorA} maxDist={maxDist} maxSpeed={maxSpeed} />}
                  {telB.length > 0 && <SpeedTrace data={telB} color={teamColorB} maxDist={maxDist} maxSpeed={maxSpeed} />}
                </svg>

                {/* DRS indicator */}
                {(() => {
                  const src = telA.length > 0 ? telA : telB;
                  const drsZones = src.reduce<{ start: number; end: number }[]>((zones, d, i, arr) => {
                    if (d.DRS != null && d.DRS >= 10) {
                      if (!zones.length || arr[i - 1]?.DRS == null || (arr[i - 1].DRS ?? 0) < 10) {
                        zones.push({ start: d.Distance, end: d.Distance });
                      } else {
                        zones[zones.length - 1].end = d.Distance;
                      }
                    }
                    return zones;
                  }, []);
                  if (!drsZones.length) return null;
                  return (
                    <div className="flex items-center gap-1.5 text-[10px] text-[#22C55E]">
                      <span className="w-2 h-2 rounded-sm bg-[#22C55E]/20 border border-[#22C55E]/40" />
                      DRS 구간 {drsZones.length}개
                    </div>
                  );
                })()}
              </div>

              {/* Track map */}
              <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4 space-y-2">
                <p className="text-xs text-[#64748B] uppercase tracking-widest">서킷 맵</p>
                {trackA.length > 0 ? (
                  <TrackMap points={trackA} color={teamColorA} />
                ) : (
                  <div className="flex items-center justify-center h-32 text-xs text-[#475569]">
                    위치 데이터 없음
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Throttle / Brake / Gear */}
          {(telA.length > 0 || telB.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "스로틀 %", dataKey: "throttle" },
                { label: "브레이크", dataKey: "brake" },
                { label: "기어",     dataKey: "gear" },
              ].map(({ label, dataKey }) => (
                <div key={dataKey} className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4 space-y-2">
                  <p className="text-xs text-[#64748B] uppercase tracking-widest">{label}</p>
                  <svg viewBox={`0 0 ${W} 60`} className="w-full h-auto">
                    {[telA, telB].map((tel, idx) => {
                      const color = idx === 0 ? teamColorA : teamColorB;
                      const pts = tel
                        .filter((d) =>
                          dataKey === "throttle" ? d.Throttle != null :
                          dataKey === "brake" ? d.Brake != null : d.nGear != null
                        )
                        .map((d) => {
                          const x = PAD.l + (d.Distance / maxDist) * w;
                          const y =
                            dataKey === "throttle" ? 10 + 40 - ((d.Throttle ?? 0) / 100) * 40 :
                            dataKey === "brake" ? (d.Brake ? 10 : 50) :
                            10 + 40 - ((d.nGear ?? 0) / 8) * 40;
                          return `${x},${y}`;
                        })
                        .join(" ");
                      return pts ? (
                        <polyline key={idx} points={pts} fill="none" stroke={color}
                          strokeWidth={dataKey === "brake" ? 1.5 : 1} strokeOpacity={0.7} />
                      ) : null;
                    })}
                  </svg>
                </div>
              ))}
            </div>
          )}

          {/* No data */}
          {!loadingResults && !loadingTel && !error && results.length === 0 && (
            <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl px-5 py-10 text-center space-y-2">
              <p className="text-sm text-[#64748B]">데이터를 불러올 수 없습니다.</p>
              <p className="text-xs text-[#475569]">세션이 아직 진행되지 않았거나 FastF1 서버가 꺼져 있을 수 있습니다.</p>
            </div>
          )}

          {/* Prompt to select drivers when data loaded but no telemetry yet */}
          {!loadingResults && !loadingTel && !error && results.length > 0
            && telA.length === 0 && telB.length === 0 && (driverA || driverB) && (
            <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl px-5 py-8 text-center text-sm text-[#64748B]">
              드라이버를 선택하면 텔레메트리 데이터를 불러옵니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
