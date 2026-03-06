"use client";

import { useEffect, useState, useCallback, useRef } from "react";

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
interface SessionInfo { session_key: number; session_type: string; session_name: string; date_end: string; is_active: boolean }

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
          const t = new Date(m.date);
          const timeStr = !isNaN(t.getTime())
            ? t.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
            : null;
          return (
            <div key={i} className="flex items-start gap-2">
              {m.flag && (
                <span
                  className="w-2 h-2 rounded-full shrink-0 mt-1"
                  style={{ backgroundColor: color }}
                />
              )}
              <div className="min-w-0">
                {timeStr && (
                  <span className="text-[10px] font-mono text-[#475569] mr-1.5">{timeStr}</span>
                )}
                <span className="text-xs text-[#94A3B8] leading-snug">{m.message}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LapsPanel({ laps }: { laps: Lap[] }) {
  // 패스티스트 랩: lap_duration 오름차순 (null 제외)
  const withTime = laps.filter((l) => l.lap_duration != null);
  const fastest = withTime.length > 0
    ? withTime.reduce((a, b) => a.lap_duration! < b.lap_duration! ? a : b)
    : null;
  // 최근 랩 5개: lap_number 내림차순
  const recent = [...laps]
    .sort((a, b) => b.lap_number - a.lap_number)
    .slice(0, 5);

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
        {recent.map((l, i) => {
          const d = DRIVER_MAP[l.driver_number];
          return (
            <div key={i} className="flex items-center gap-2">
              <span
                className="w-1.5 h-3 rounded-full shrink-0"
                style={{ backgroundColor: d?.teamColor ?? "#64748B" }}
              />
              <span className="text-xs font-bold text-white w-8">{d?.abbr ?? `#${l.driver_number}`}</span>
              <span className="text-xs text-[#64748B] tabular-nums">L{l.lap_number}</span>
              <span className="text-xs text-white tabular-nums ml-auto">
                {l.lap_duration != null ? fmtLap(l.lap_duration) : <span className="text-[#475569]">기록 중</span>}
              </span>
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
                <span className="text-xs text-[#64748B] ml-auto" title="마지막 피트스톱 소요시간">핏 {lastPit.pit_duration.toFixed(1)}s</span>
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

function useSessionCountdown(dateEnd: string | null, isActive: boolean) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!isActive || !dateEnd) { setRemaining(null); return; }
    const endMs = new Date(dateEnd).getTime();
    const tick = () => {
      const diff = endMs - Date.now();
      setRemaining(diff > 0 ? diff : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dateEnd, isActive]);

  return remaining;
}

function fmtRemaining(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function LiveSessionDashboard() {
  const [sessionKey, setSessionKey] = useState<number | null>(null);
  const [sessionType, setSessionType] = useState<string>("");
  const [sessionName, setSessionName] = useState<string>("");
  const [sessionDateEnd, setSessionDateEnd] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [intervals, setIntervals] = useState<Interval[]>([]);
  const [raceControl, setRaceControl] = useState<RaceCtrl[]>([]);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [stints, setStints] = useState<Stint[]>([]);
  const [pits, setPits] = useState<Pit[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const prevHasDataRef = useRef(false);
  const notifPermRef = useRef<NotificationPermission>("default");

  // 알림 권한 요청 (마운트 시 한 번)
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().then((p) => { notifPermRef.current = p; });
    } else if (typeof Notification !== "undefined") {
      notifPermRef.current = Notification.permission;
    }
  }, []);

  // 세션 키 조회
  useEffect(() => {
    fetch("/api/live/session")
      .then((r) => r.json())
      .then((data: SessionInfo | null) => {
        if (data?.session_key) {
          setSessionKey(data.session_key);
          setSessionType(data.session_type ?? "");
          setSessionName(data.session_name ?? "");
          setSessionDateEnd(data.date_end ?? null);
          setIsActive(data.is_active ?? false);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // 실시간 데이터 (4초)
  const fetchRealtime = useCallback(async (sk: number) => {
    const [pos, inv, rc] = await Promise.allSettled([
      ofetch<Position>("/position", { session_key: sk }),
      ofetch<Interval>("/intervals", { session_key: sk }),
      ofetch<RaceCtrl>("/race_control", { session_key: sk }),
    ]);
    // 빈 배열로 덮어쓰지 않음 — 마지막 유효 데이터 유지
    if (pos.status === "fulfilled" && pos.value.length > 0) setPositions(latest(pos.value));
    if (inv.status === "fulfilled" && inv.value.length > 0) setIntervals(latest(inv.value));
    if (rc.status === "fulfilled"  && rc.value.length > 0)  setRaceControl(rc.value);
  }, []);

  // 준실시간 데이터 (10~30초)
  const fetchNearRealtime = useCallback(async (sk: number) => {
    const [lapData, stintData, pitData, weatherData] = await Promise.allSettled([
      ofetch<Lap>("/laps", { session_key: sk }),
      ofetch<Stint>("/stints", { session_key: sk }),
      ofetch<Pit>("/pit", { session_key: sk }),
      ofetch<Weather>("/weather", { session_key: sk }),
    ]);
    if (lapData.status === "fulfilled"   && lapData.value.length > 0)   setLaps(latest(lapData.value));
    if (stintData.status === "fulfilled" && stintData.value.length > 0) setStints(stintData.value);
    if (pitData.status === "fulfilled"   && pitData.value.length > 0)   setPits(latest(pitData.value));
    if (weatherData.status === "fulfilled" && weatherData.value.length > 0) {
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

  const remaining = useSessionCountdown(sessionDateEnd, isActive);

  if (loading) return null;
  if (!sessionKey) return null;

  const isRace = sessionType === "Race" || sessionType === "Sprint";
  const displayName = sessionName || sessionType;
  const hasData = positions.length > 0 || raceControl.length > 0 || laps.length > 0 || stints.length > 0 || weather !== null;

  // 데이터가 처음 수집됐을 때 알림
  if (!prevHasDataRef.current && hasData) {
    prevHasDataRef.current = true;
    const msg = `${displayName} 세션 데이터가 수집되었습니다.`;
    setToast(msg);
    setTimeout(() => setToast(null), 6000);
    if (typeof Notification !== "undefined" && notifPermRef.current === "granted") {
      new Notification("PitLane F1 — 데이터 수집 완료", {
        body: msg,
        icon: "/favicon.ico",
      });
    }
  }

  return (
    <div className="space-y-3">

      {/* 데이터 수집 완료 토스트 */}
      {toast && (
        <div className="flex items-center gap-3 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-xl px-4 py-3 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="w-2 h-2 rounded-full bg-[#22C55E] shrink-0" />
          <span className="text-[#22C55E] font-bold">{toast}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-auto text-[#64748B] hover:text-white transition-colors text-xs"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        {isActive ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E8002D]/10 border border-[#E8002D]/30 rounded-full text-[10px] font-black text-[#E8002D] uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8002D] animate-pulse" />
            라이브
          </span>
        ) : hasData ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
            세션 종료
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
            세션 대기
          </span>
        )}
        <span className="text-xs text-[#64748B]">
          {displayName}
          {isActive ? " 진행 중" : hasData ? " 결과" : ""}
        </span>
        {isActive && remaining != null && remaining > 0 && (
          <span className="ml-auto text-xs font-mono tabular-nums text-[#94A3B8]">
            종료까지 <span className="text-white font-bold">{fmtRemaining(remaining)}</span>
          </span>
        )}
      </div>

      {/* 실시간 패널 (4초 / 세션 후 전체 공개) */}
      <div className={`grid gap-3 ${isRace ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
        {positions.length > 0 && (
          <StandingsPanel positions={positions} intervals={intervals} />
        )}
        {(isActive || raceControl.length > 0) && (
          <RaceControlPanel messages={raceControl} />
        )}
      </div>

      {/* 준실시간 패널 (15초 / 세션 후 전체 공개) */}
      {(laps.length > 0 || stints.length > 0 || weather !== null) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {laps.length > 0 && <LapsPanel laps={laps} />}
          {stints.length > 0 && <TyrePanel stints={stints} pits={pits} />}
          <WeatherPanel weather={weather} />
        </div>
      )}

      {/* 세션 종료 후 데이터 없을 때 */}
      {!isActive && !hasData && (
        <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl px-5 py-4 text-sm text-[#64748B]">
          세션 데이터를 불러오는 중입니다...
        </div>
      )}
    </div>
  );
}
