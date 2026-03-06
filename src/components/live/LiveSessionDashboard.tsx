"use client";

import { useEffect, useState, useCallback } from "react";

const BASE = "https://api.openf1.org/v1";

// driver_number → { id, lastName, abbr, teamColor }
const DRIVER_MAP: Record<number, { id: string; lastName: string; abbr: string; teamColor: string }> = {
  1:  { id: "norris",     lastName: "Norris",     abbr: "NOR", teamColor: "#FF8000" },
  3:  { id: "verstappen", lastName: "Verstappen", abbr: "VER", teamColor: "#3671C6" },
  5:  { id: "bortoleto",  lastName: "Bortoleto",  abbr: "BOR", teamColor: "#52E252" },
  6:  { id: "hadjar",     lastName: "Hadjar",     abbr: "HAD", teamColor: "#3671C6" },
  10: { id: "gasly",      lastName: "Gasly",      abbr: "GAS", teamColor: "#FF87BC" },
  11: { id: "perez",      lastName: "Pérez",      abbr: "PER", teamColor: "#C0A44D" },
  12: { id: "antonelli",  lastName: "Antonelli",  abbr: "ANT", teamColor: "#27F4D2" },
  14: { id: "alonso",     lastName: "Alonso",     abbr: "ALO", teamColor: "#229971" },
  16: { id: "leclerc",    lastName: "Leclerc",    abbr: "LEC", teamColor: "#E8002D" },
  18: { id: "stroll",     lastName: "Stroll",     abbr: "STR", teamColor: "#229971" },
  23: { id: "albon",      lastName: "Albon",      abbr: "ALB", teamColor: "#1868DB" },
  27: { id: "hulkenberg", lastName: "Hülkenberg", abbr: "HUL", teamColor: "#52E252" },
  30: { id: "lawson",     lastName: "Lawson",     abbr: "LAW", teamColor: "#6692FF" },
  31: { id: "ocon",       lastName: "Ocon",       abbr: "OCO", teamColor: "#B6BABD" },
  41: { id: "lindblad",   lastName: "Lindblad",   abbr: "LIN", teamColor: "#6692FF" },
  43: { id: "colapinto",  lastName: "Colapinto",  abbr: "COL", teamColor: "#FF87BC" },
  44: { id: "hamilton",   lastName: "Hamilton",   abbr: "HAM", teamColor: "#E8002D" },
  55: { id: "sainz",      lastName: "Sainz",      abbr: "SAI", teamColor: "#1868DB" },
  63: { id: "russell",    lastName: "Russell",    abbr: "RUS", teamColor: "#27F4D2" },
  77: { id: "bottas",     lastName: "Bottas",     abbr: "BOT", teamColor: "#C0A44D" },
  81: { id: "piastri",    lastName: "Piastri",    abbr: "PIA", teamColor: "#FF8000" },
  87: { id: "bearman",    lastName: "Bearman",    abbr: "BEA", teamColor: "#B6BABD" },
};

const COMPOUND_COLOR: Record<string, string> = {
  SOFT: "#E8002D",
  MEDIUM: "#FCD34D",
  HARD: "#E5E7EB",
  INTERMEDIATE: "#22C55E",
  WET: "#3B82F6",
};

const FLAG_COLOR: Record<string, string> = {
  GREEN: "#22C55E",
  YELLOW: "#FCD34D",
  DOUBLE_YELLOW: "#F59E0B",
  RED: "#E8002D",
  SAFETY_CAR: "#FCD34D",
  VIRTUAL_SAFETY_CAR: "#A78BFA",
  CHEQUERED: "#FFFFFF",
};

function fmtLap(sec: number | null) {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(3).padStart(6, "0");
  return `${m}:${s}`;
}

function fmtGap(sec: number | null) {
  if (sec == null) return "—";
  return sec === 0 ? "리더" : `+${sec.toFixed(3)}`;
}

// ─── Types ─────────────────────────────────────────────────────

interface Position  { driver_number: number; position: number }
interface Interval  { driver_number: number; gap_to_leader: number | null; interval: number | null }
interface RaceCtrl  { date: string; flag: string | null; message: string; category: string }
interface Lap       { driver_number: number; lap_number: number; lap_duration: number | null; duration_sector_1: number | null; duration_sector_2: number | null; duration_sector_3: number | null }
interface Pit       { driver_number: number; lap_number: number; pit_duration: number | null }
interface Stint     { driver_number: number; compound: string; stint_number: number; tyre_age_at_start: number; lap_start: number; lap_end: number | null }
interface Weather   { air_temperature: number; track_temperature: number; humidity: number; rainfall: number; wind_speed: number }
interface SessionInfo { session_key: number; session_type: string }

async function ofetch<T>(endpoint: string, params: Record<string, string | number>): Promise<T[]> {
  const q = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  const res = await fetch(`${BASE}${endpoint}?${q}`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

// Latest entry per driver
function latest<T extends { driver_number: number }>(arr: T[]): T[] {
  const map = new Map<number, T>();
  for (const item of arr) map.set(item.driver_number, item);
  return Array.from(map.values());
}

// ─── Sub-panels ────────────────────────────────────────────────

function StandingsPanel({
  positions,
  intervals,
}: {
  positions: Position[];
  intervals: Interval[];
}) {
  const sorted = [...positions].sort((a, b) => a.position - b.position);
  const gapMap = new Map(intervals.map((i) => [i.driver_number, i]));

  return (
    <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4">
      <p className="text-xs text-[#64748B] uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <span>🏁</span> 순위
        <span className="ml-auto text-[#E8002D] text-[10px] font-bold animate-pulse">LIVE</span>
      </p>
      <div className="space-y-1.5">
        {sorted.slice(0, 10).map((p) => {
          const d = DRIVER_MAP[p.driver_number];
          const gap = gapMap.get(p.driver_number);
          return (
            <div key={p.driver_number} className="flex items-center gap-2">
              <span className="w-5 text-xs font-black tabular-nums text-[#64748B]">{p.position}</span>
              <span
                className="w-1.5 h-4 rounded-full shrink-0"
                style={{ backgroundColor: d?.teamColor ?? "#64748B" }}
              />
              <span className="text-xs font-bold text-white w-8">{d?.abbr ?? `#${p.driver_number}`}</span>
              <span className="text-xs text-[#64748B] ml-auto tabular-nums">
                {fmtGap(gap?.gap_to_leader ?? null)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RaceControlPanel({ messages }: { messages: RaceCtrl[] }) {
  const recent = [...messages].reverse().slice(0, 6);
  return (
    <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4">
      <p className="text-xs text-[#64748B] uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <span>🚦</span> 레이스 컨트롤
        <span className="ml-auto text-[#E8002D] text-[10px] font-bold animate-pulse">LIVE</span>
      </p>
      <div className="space-y-2">
        {recent.length === 0 && (
          <p className="text-xs text-[#64748B]">메시지 없음</p>
        )}
        {recent.map((m, i) => {
          const color = FLAG_COLOR[m.flag ?? ""] ?? "#94A3B8";
          return (
            <div key={i} className="flex items-start gap-2">
              {m.flag && (
                <span
                  className="w-2 h-2 rounded-full shrink-0 mt-1"
                  style={{ backgroundColor: color }}
                />
              )}
              <p className="text-xs text-[#94A3B8] leading-snug">{m.message}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LapsPanel({ laps }: { laps: Lap[] }) {
  const sorted = [...laps].sort((a, b) => a.lap_duration! - b.lap_duration!);
  const fastest = sorted.find((l) => l.lap_duration);

  return (
    <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4">
      <p className="text-xs text-[#64748B] uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <span>⏱</span> 최근 랩타임
      </p>
      <div className="space-y-1.5">
        {fastest && (
          <div className="mb-2 px-3 py-2 bg-[#A855F7]/10 border border-[#A855F7]/30 rounded-lg">
            <p className="text-[10px] text-[#A855F7] font-bold mb-0.5">패스티스트 랩</p>
            <p className="text-sm font-black text-[#A855F7] tabular-nums">{fmtLap(fastest.lap_duration)}</p>
            <p className="text-xs text-[#64748B]">{DRIVER_MAP[fastest.driver_number]?.abbr ?? `#${fastest.driver_number}`} · L{fastest.lap_number}</p>
          </div>
        )}
        {laps.slice(0, 5).map((l, i) => {
          const d = DRIVER_MAP[l.driver_number];
          return (
            <div key={i} className="flex items-center gap-2">
              <span
                className="w-1.5 h-3 rounded-full shrink-0"
                style={{ backgroundColor: d?.teamColor ?? "#64748B" }}
              />
              <span className="text-xs font-bold text-white w-8">{d?.abbr ?? `#${l.driver_number}`}</span>
              <span className="text-xs text-[#64748B] tabular-nums">L{l.lap_number}</span>
              <span className="text-xs text-white tabular-nums ml-auto">{fmtLap(l.lap_duration)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TyrePanel({ stints, pits }: { stints: Stint[]; pits: Pit[] }) {
  const currentStints = new Map<number, Stint>();
  for (const s of stints) {
    const prev = currentStints.get(s.driver_number);
    if (!prev || s.stint_number > prev.stint_number) currentStints.set(s.driver_number, s);
  }
  const lastPitMap = new Map(pits.map((p) => [p.driver_number, p]));

  const entries = Array.from(currentStints.values()).slice(0, 10);

  return (
    <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4">
      <p className="text-xs text-[#64748B] uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <span>🛞</span> 타이어 현황
      </p>
      <div className="space-y-1.5">
        {entries.map((s) => {
          const d = DRIVER_MAP[s.driver_number];
          const color = COMPOUND_COLOR[s.compound] ?? "#94A3B8";
          const lastPit = lastPitMap.get(s.driver_number);
          return (
            <div key={s.driver_number} className="flex items-center gap-2">
              <span
                className="w-1.5 h-3 rounded-full shrink-0"
                style={{ backgroundColor: d?.teamColor ?? "#64748B" }}
              />
              <span className="text-xs font-bold text-white w-8">{d?.abbr ?? `#${s.driver_number}`}</span>
              <span className="text-xs font-bold" style={{ color }}>{s.compound[0]}</span>
              <span className="text-xs text-[#64748B]">+{s.tyre_age_at_start}랩</span>
              {lastPit?.pit_duration && (
                <span className="text-xs text-[#64748B] ml-auto">{lastPit.pit_duration.toFixed(1)}s</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeatherPanel({ weather }: { weather: Weather | null }) {
  if (!weather) return null;
  return (
    <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4">
      <p className="text-xs text-[#64748B] uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <span>🌤</span> 날씨
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-[#64748B]">기온</p>
          <p className="text-sm font-bold text-white">{weather.air_temperature.toFixed(1)}°C</p>
        </div>
        <div>
          <p className="text-[10px] text-[#64748B]">트랙온도</p>
          <p className="text-sm font-bold text-white">{weather.track_temperature.toFixed(1)}°C</p>
        </div>
        <div>
          <p className="text-[10px] text-[#64748B]">습도</p>
          <p className="text-sm font-bold text-white">{weather.humidity}%</p>
        </div>
        <div>
          <p className="text-[10px] text-[#64748B]">풍속</p>
          <p className="text-sm font-bold text-white">{weather.wind_speed.toFixed(1)} m/s</p>
        </div>
        {weather.rainfall > 0 && (
          <div className="col-span-2">
            <p className="text-xs text-[#3B82F6] font-bold">🌧 강우 중</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────

export default function LiveSessionDashboard() {
  const [sessionKey, setSessionKey] = useState<number | null>(null);
  const [sessionType, setSessionType] = useState<string>("");
  const [positions, setPositions] = useState<Position[]>([]);
  const [intervals, setIntervals] = useState<Interval[]>([]);
  const [raceControl, setRaceControl] = useState<RaceCtrl[]>([]);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [stints, setStints] = useState<Stint[]>([]);
  const [pits, setPits] = useState<Pit[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [ready, setReady] = useState(false);

  // 세션 키 조회
  useEffect(() => {
    fetch("/api/live/session")
      .then((r) => r.json())
      .then((data: SessionInfo | null) => {
        if (data?.session_key) {
          setSessionKey(data.session_key);
          setSessionType(data.session_type ?? "");
          setReady(true);
        }
      })
      .catch(() => {});
  }, []);

  // 실시간 데이터 (4초)
  const fetchRealtime = useCallback(async (sk: number) => {
    const [pos, inv, rc] = await Promise.allSettled([
      ofetch<Position>("/position", { session_key: sk }),
      ofetch<Interval>("/intervals", { session_key: sk }),
      ofetch<RaceCtrl>("/race_control", { session_key: sk }),
    ]);
    if (pos.status === "fulfilled") setPositions(latest(pos.value));
    if (inv.status === "fulfilled") setIntervals(latest(inv.value));
    if (rc.status === "fulfilled")  setRaceControl(rc.value);
  }, []);

  // 준실시간 데이터 (10~30초)
  const fetchNearRealtime = useCallback(async (sk: number) => {
    const [lapData, stintData, pitData, weatherData] = await Promise.allSettled([
      ofetch<Lap>("/laps", { session_key: sk }),
      ofetch<Stint>("/stints", { session_key: sk }),
      ofetch<Pit>("/pit", { session_key: sk }),
      ofetch<Weather>("/weather", { session_key: sk }),
    ]);
    if (lapData.status === "fulfilled")     setLaps(latest(lapData.value));
    if (stintData.status === "fulfilled")   setStints(stintData.value);
    if (pitData.status === "fulfilled")     setPits(latest(pitData.value));
    if (weatherData.status === "fulfilled") {
      const arr = weatherData.value;
      setWeather(arr[arr.length - 1] ?? null);
    }
  }, []);

  useEffect(() => {
    if (!sessionKey) return;

    // 초기 로드
    fetchRealtime(sessionKey);
    fetchNearRealtime(sessionKey);

    // 실시간 폴링 (4초)
    const realtimeId = setInterval(() => fetchRealtime(sessionKey), 4_000);
    // 준실시간 폴링 (15초)
    const nearId = setInterval(() => fetchNearRealtime(sessionKey), 15_000);

    return () => {
      clearInterval(realtimeId);
      clearInterval(nearId);
    };
  }, [sessionKey, fetchRealtime, fetchNearRealtime]);

  if (!ready) return null;

  const isRace = sessionType === "Race" || sessionType === "Sprint";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E8002D]/10 border border-[#E8002D]/30 rounded-full text-[10px] font-black text-[#E8002D] uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E8002D] animate-pulse" />
          라이브
        </span>
        <span className="text-xs text-[#64748B]">{sessionType} 진행 중</span>
      </div>

      {/* 실시간 패널 (4초) */}
      <div className={`grid gap-3 ${isRace ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
        {positions.length > 0 && (
          <StandingsPanel positions={positions} intervals={intervals} />
        )}
        <RaceControlPanel messages={raceControl} />
      </div>

      {/* 준실시간 패널 (15초) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {laps.length > 0 && <LapsPanel laps={laps} />}
        {stints.length > 0 && <TyrePanel stints={stints} pits={pits} />}
        <WeatherPanel weather={weather} />
      </div>
    </div>
  );
}
