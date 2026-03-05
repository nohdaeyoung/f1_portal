"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SessionSchedule } from "@/data/f1-data";

// ─── OpenF1 types ─────────────────────────────────────────────

interface Of1Position  { driver_number: number; position: number; date: string; }
interface Of1Interval  { driver_number: number; gap_to_leader: number | null; interval: number | null; date: string; }
interface Of1Driver    { driver_number: number; full_name: string; name_acronym: string; team_colour: string | null; }
interface Of1RCMsg     { message: string; flag: string | null; category: string; date: string; }
interface Of1Weather   { air_temperature: number; track_temperature: number; rainfall: number; wind_speed: number; date: string; }
interface Of1Session   { session_key: number; session_name: string; session_type: string; date_start: string; date_end: string; year: number; }
interface Of1Location  { driver_number: number; x: number; y: number; z: number; date: string; }

interface LiveData {
  positions:  { driverNumber: number; position: number }[];
  intervals:  Map<number, number | null>;
  driverInfo: Map<number, { acronym: string; name: string; teamColor: string }>;
  raceControl: Of1RCMsg[];
  weather: { air: number; track: number; rainfall: number; wind: number } | null;
  locations:  Map<number, { x: number; y: number }>;
}

// ─── Session metadata ─────────────────────────────────────────

const SESSION_META: {
  key: keyof SessionSchedule;
  ko: string;
  durationMin: number;
  sprintOnly?: true;
  regularOnly?: true;
}[] = [
  { key: "fp1",        ko: "FP1",          durationMin: 65 },
  { key: "fp2",        ko: "FP2",          durationMin: 65, regularOnly: true },
  { key: "fp3",        ko: "FP3",          durationMin: 65, regularOnly: true },
  { key: "sq",         ko: "스프린트 퀄리", durationMin: 60, sprintOnly: true  },
  { key: "sprint",     ko: "스프린트",      durationMin: 40, sprintOnly: true  },
  { key: "qualifying", ko: "퀄리파잉",      durationMin: 65 },
  { key: "race",       ko: "레이스",        durationMin: 130 },
];

// ─── Helpers ──────────────────────────────────────────────────

function kstDateStr(utcIso: string) {
  return new Date(utcIso).toLocaleDateString("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric", month: "2-digit", day: "2-digit",
  });
}
function isKSTToday(utcIso: string) {
  return kstDateStr(utcIso) === kstDateStr(new Date().toISOString());
}

type SessionStatus = "upcoming" | "live" | "done";
function getStatus(startIso: string, durationMin: number): SessionStatus {
  const start = new Date(startIso).getTime();
  const end   = start + durationMin * 60_000;
  const now   = Date.now();
  if (now < start) return "upcoming";
  if (now < end)   return "live";
  return "done";
}

function fmtKST(iso: string) {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit",
  });
}

function fmtCountdown(ms: number) {
  if (ms <= 0) return "곧 시작";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}시간 ${String(m).padStart(2, "0")}분 후`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")} 후`;
}

// ─── OpenF1 fetch ─────────────────────────────────────────────

const OF1 = "https://api.openf1.org/v1";

async function of1<T>(path: string, params: Record<string, string | number> = {}): Promise<T[]> {
  const url = new URL(`${OF1}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  try {
    const r = await fetch(url.toString(), { cache: "no-store" });
    if (!r.ok) return [];
    return r.json();
  } catch { return []; }
}

async function resolveSessionKey(year = 2026): Promise<number | null> {
  const sessions = await of1<Of1Session>("/sessions", { year });
  if (!sessions.length) return null;
  const now = Date.now();
  // Prefer currently active session (with +90min buffer for post-session data)
  const active = sessions.find(s =>
    now >= new Date(s.date_start).getTime() &&
    now <= new Date(s.date_end).getTime() + 90 * 60_000
  );
  if (active) return active.session_key;
  // Fall back to most recent
  return sessions.slice().sort(
    (a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime()
  )[0]?.session_key ?? null;
}

async function fetchLiveData(sk: number): Promise<LiveData> {
  const cutoff = new Date(Date.now() - 15_000).toISOString().slice(0, 19);
  const [rawPos, rawInt, rawDrv, rawRC, rawWx, rawLoc] = await Promise.all([
    of1<Of1Position>("/position",     { session_key: sk }),
    of1<Of1Interval>("/intervals",    { session_key: sk }),
    of1<Of1Driver>  ("/drivers",      { session_key: sk }),
    of1<Of1RCMsg>   ("/race_control", { session_key: sk }),
    of1<Of1Weather> ("/weather",      { session_key: sk }),
    of1<Of1Location>("/location",     { session_key: sk, "date>": cutoff }),
  ]);

  // Latest position per driver
  const posMap = new Map<number, number>();
  for (const p of rawPos) posMap.set(p.driver_number, p.position);
  const positions = Array.from(posMap.entries())
    .map(([driverNumber, position]) => ({ driverNumber, position }))
    .sort((a, b) => a.position - b.position);

  // Latest interval per driver
  const intervals = new Map<number, number | null>();
  for (const i of rawInt) intervals.set(i.driver_number, i.gap_to_leader);

  // Driver info
  const driverInfo = new Map<number, { acronym: string; name: string; teamColor: string }>();
  for (const d of rawDrv) {
    const tc = d.team_colour ?? "888888";
    driverInfo.set(d.driver_number, {
      acronym: d.name_acronym,
      name: d.full_name,
      teamColor: tc.startsWith("#") ? tc : `#${tc}`,
    });
  }

  // Race control — last 5, newest first
  const raceControl = rawRC.slice(-5).reverse();

  // Weather — latest entry
  const wx = rawWx[rawWx.length - 1] ?? null;
  const weather = wx
    ? { air: wx.air_temperature, track: wx.track_temperature, rainfall: wx.rainfall, wind: wx.wind_speed }
    : null;

  // Latest location per driver
  const locations = new Map<number, { x: number; y: number }>();
  for (const l of rawLoc) locations.set(l.driver_number, { x: l.x, y: l.y });

  return { positions, intervals, driverInfo, raceControl, weather, locations };
}

// ─── Live mini-map ────────────────────────────────────────────

function LiveMap({
  locations,
  driverInfo,
  positions,
}: {
  locations: Map<number, { x: number; y: number }>;
  driverInfo: Map<number, { acronym: string; name: string; teamColor: string }>;
  positions: { driverNumber: number; position: number }[];
}) {
  const entries = Array.from(locations.entries());
  if (entries.length === 0) return null;

  const W = 700, H = 420, pad = 28;
  const xs = entries.map(([, p]) => p.x);
  const ys = entries.map(([, p]) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  const rx = x1 - x0 || 1, ry = y1 - y0 || 1;
  const s = Math.min((W - 2 * pad) / rx, (H - 2 * pad) / ry);
  const ox = pad + ((W - 2 * pad) - rx * s) / 2;
  const oy = pad + ((H - 2 * pad) - ry * s) / 2;

  const posMap = new Map(positions.map(p => [p.driverNumber, p.position]));

  return (
    <div className="bg-[#0a0a14] border border-[#2D2D3A] rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[#2D2D3A]">
        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
          실시간 포지션 맵
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-h-[260px]" aria-hidden>
        {entries.map(([driverNumber, { x, y }]) => {
          const info = driverInfo.get(driverNumber);
          const pos  = posMap.get(driverNumber);
          const cx = ox + (x - x0) * s;
          const cy = oy + (y1 - y) * s;
          const color = info?.teamColor ?? "#888888";
          return (
            <g key={driverNumber}>
              <circle cx={cx} cy={cy} r={7} fill={color} opacity={0.85} />
              {pos === 1 && (
                <circle cx={cx} cy={cy} r={10} fill="none" stroke={color} strokeWidth={1.5} opacity={0.4} />
              )}
              <text
                x={cx}
                y={cy - 10}
                fontSize="9"
                fontWeight="bold"
                fill="white"
                textAnchor="middle"
                opacity={0.8}
              >
                {info?.acronym ?? `#${driverNumber}`}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Flag icon ────────────────────────────────────────────────

function FlagDot({ flag }: { flag: string | null }) {
  const palette: Record<string, string> = {
    GREEN: "bg-green-500", CLEAR: "bg-green-500",
    YELLOW: "bg-yellow-400", DOUBLE_YELLOW: "bg-yellow-400",
    RED: "bg-red-500",
    BLUE: "bg-blue-500",
    BLACK: "bg-neutral-800",
    CHEQUERED: "bg-white",
  };
  const cls = flag ? (palette[flag] ?? "bg-[#64748B]") : "bg-[#64748B]";
  return <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${cls}`} />;
}

// ─── Props ────────────────────────────────────────────────────

interface Props {
  sessions: SessionSchedule;
  round: number;
  raceName: string;
  circuitCity?: string;
}

// ─── Component ────────────────────────────────────────────────

export function RaceWeekendLive({ sessions, round, raceName, circuitCity }: Props) {
  const [tick, setTick]           = useState(0);           // forces re-render every second
  const [liveData, setLiveData]   = useState<LiveData | null>(null);
  const [sessionKey, setSessionKey] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const skRef = useRef<number | null>(null);

  // Tick every second for countdowns / status recalculation
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Derive today's sessions (recalculated on every tick)
  const todaysSessions = SESSION_META.filter(meta => {
    if (meta.sprintOnly   && !sessions.isSprint) return false;
    if (meta.regularOnly  &&  sessions.isSprint) return false;
    const iso = sessions[meta.key] as string | undefined;
    return iso ? isKSTToday(iso) : false;
  });

  // Find live / next session
  const liveSession = todaysSessions.find(meta => {
    const iso = sessions[meta.key] as string;
    return getStatus(iso, meta.durationMin) === "live";
  });
  const nextSession = !liveSession
    ? todaysSessions.find(meta => {
        const iso = sessions[meta.key] as string;
        return getStatus(iso, meta.durationMin) === "upcoming";
      })
    : undefined;

  // Live data polling
  const poll = useCallback(async () => {
    if (!liveSession) return;
    setRefreshing(true);
    try {
      let sk = skRef.current;
      if (!sk) {
        sk = await resolveSessionKey();
        if (sk) { skRef.current = sk; setSessionKey(sk); }
      }
      if (sk) setLiveData(await fetchLiveData(sk));
    } finally {
      setRefreshing(false);
    }
  }, [liveSession?.key]); // only changes when active session changes

  useEffect(() => {
    if (!liveSession) {
      setLiveData(null);
      skRef.current = null;
      setSessionKey(null);
      return;
    }
    poll();
    const id = setInterval(poll, 5_000);
    return () => clearInterval(id);
  }, [liveSession?.key, poll]);

  if (todaysSessions.length === 0) return null;

  // suppress lint — tick is used to trigger re-renders
  void tick;

  return (
    <section className="mb-12">
      {/* ── Header ───────────────────────────────── */}
      <div className="flex items-center gap-3 mb-5">
        {liveSession ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-[#E8002D] px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping inline-block" />
            LIVE
          </span>
        ) : (
          <span className="text-xs font-bold text-[#64748B] bg-white/5 px-2.5 py-1 rounded-full uppercase tracking-wider">
            오늘의 일정
          </span>
        )}
        <h2 className="text-xl font-black text-white">
          R{round} {raceName}
          {circuitCity && (
            <span className="text-[#64748B] font-normal text-base ml-2">· {circuitCity}</span>
          )}
        </h2>
      </div>

      {/* ── Today's session cards ─────────────────── */}
      <div className={`grid gap-3 mb-6 ${todaysSessions.length <= 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
        {todaysSessions.map(meta => {
          const iso    = sessions[meta.key] as string;
          const status: SessionStatus = getStatus(iso, meta.durationMin);
          const msUntil = new Date(iso).getTime() - Date.now();
          const isLive  = status === "live";
          const isDone  = status === "done";
          const isNext  = !liveSession && nextSession?.key === meta.key;

          return (
            <div
              key={meta.key}
              className={`rounded-xl p-4 border transition-all ${
                isLive ? "bg-[#E8002D]/10 border-[#E8002D]/50"
                : isNext ? "bg-[#141420] border-[#E8002D]/20"
                : isDone ? "bg-[#141420] border-[#2D2D3A] opacity-45"
                : "bg-[#141420] border-[#2D2D3A]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
                  {meta.ko}
                </span>
                {isLive && (
                  <span className="text-[9px] font-black text-[#E8002D] tracking-widest animate-pulse">
                    LIVE
                  </span>
                )}
                {isDone && (
                  <span className="text-[9px] text-[#64748B]">완료</span>
                )}
              </div>
              <div className="text-xl font-black text-white font-mono tracking-tight">
                {fmtKST(iso)}
              </div>
              <div className="text-xs mt-1 font-medium">
                {isLive && <span className="text-[#E8002D]">진행 중</span>}
                {status === "upcoming" && msUntil > 0 && (
                  <span className="text-[#64748B]">{fmtCountdown(msUntil)}</span>
                )}
                {isDone && <span className="text-[#64748B]">—</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Next session info ─────────────────────── */}
      {!liveSession && nextSession && (
        <div className="mb-6 flex items-center gap-3 text-sm text-[#64748B]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E8002D]" />
          다음 세션:
          <span className="text-white font-bold">{nextSession.ko}</span>
          <span className="font-mono">{fmtKST(sessions[nextSession.key] as string)}</span>
        </div>
      )}

      {/* ── Live data block ───────────────────────── */}
      {liveSession && (
        <div className="space-y-3">

          {/* Weather */}
          {liveData?.weather && (
            <div className="flex flex-wrap gap-x-6 gap-y-2 bg-[#141420] border border-[#2D2D3A] rounded-xl px-5 py-3 text-sm items-center">
              <span className="text-[#64748B]">기온 <span className="text-white font-bold">{liveData.weather.air}°C</span></span>
              <span className="text-[#64748B]">트랙 <span className="text-white font-bold">{liveData.weather.track}°C</span></span>
              <span className="text-[#64748B]">
                강수 <span className="text-white font-bold">{liveData.weather.rainfall > 0 ? `${liveData.weather.rainfall}mm` : "없음"}</span>
              </span>
              <span className="text-[#64748B]">풍속 <span className="text-white font-bold">{liveData.weather.wind.toFixed(1)} m/s</span></span>
              {refreshing && (
                <span className="ml-auto text-[10px] text-[#64748B]">새로고침 중…</span>
              )}
            </div>
          )}

          {/* Live Position Map */}
          {liveData && liveData.locations.size > 0 && (
            <LiveMap
              locations={liveData.locations}
              driverInfo={liveData.driverInfo}
              positions={liveData.positions}
            />
          )}

          {/* Race Control */}
          {liveData && liveData.raceControl.length > 0 && (
            <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[#2D2D3A]">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">레이스 컨트롤</span>
              </div>
              {liveData.raceControl.slice(0, 4).map((msg, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-2.5 border-b border-[#2D2D3A]/40 last:border-0">
                  <FlagDot flag={msg.flag} />
                  <span className="text-sm text-[#94a3b8] flex-1 leading-snug">{msg.message}</span>
                  <span className="text-[10px] text-[#64748B] font-mono shrink-0 mt-0.5">
                    {new Date(msg.date).toLocaleTimeString("ko-KR", {
                      timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", second: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Live Leaderboard */}
          {liveData && liveData.positions.length > 0 && (
            <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[#2D2D3A] flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">실시간 순위</span>
                {sessionKey && (
                  <span className="text-[10px] text-[#64748B]">세션 #{sessionKey}</span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {liveData.positions.slice(0, 20).map(({ driverNumber, position }) => {
                      const info = liveData.driverInfo.get(driverNumber);
                      const gap  = liveData.intervals.get(driverNumber);
                      const isLeader = position === 1;
                      return (
                        <tr key={driverNumber} className="border-b border-[#2D2D3A]/40 last:border-0 hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-2.5 w-10">
                            <span className={`text-sm font-black ${
                              position === 1 ? "text-[#FCD34D]"
                              : position <= 3 ? "text-[#C0C0C0]"
                              : "text-[#64748B]"
                            }`}>
                              {position}
                            </span>
                          </td>
                          <td className="px-1 py-2.5 w-3">
                            <span
                              className="block w-1.5 h-5 rounded-full"
                              style={{ backgroundColor: info?.teamColor ?? "#888" }}
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="font-bold text-white">{info?.acronym ?? `#${driverNumber}`}</span>
                            <span className="text-xs text-[#64748B] ml-2 hidden sm:inline">{info?.name}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-sm">
                            {isLeader ? (
                              <span className="text-[#E8002D] font-bold text-xs">LEADER</span>
                            ) : gap !== undefined ? (
                              <span className="text-[#64748B]">{gap === null ? "—" : `+${gap.toFixed(3)}`}</span>
                            ) : (
                              <span className="text-[#64748B]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Loading placeholder */}
          {refreshing && !liveData && (
            <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-10 text-center text-[#64748B] text-sm">
              라이브 데이터 로딩 중…
            </div>
          )}
        </div>
      )}
    </section>
  );
}
