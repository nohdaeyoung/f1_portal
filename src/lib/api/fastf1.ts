/**
 * FastF1 API Client
 * Proxies requests through /api/fastf1/* to the local Python service.
 */

const BASE = process.env.FASTF1_API_URL ?? "http://localhost:8000";

async function ff1Fetch<T>(
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const q = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  );
  const url = `${BASE}${endpoint}?${q}`;
  const res = await fetch(url, { next: { revalidate: 3600 } }); // cache 1hr — F1 data doesn't change
  if (!res.ok) throw new Error(`FastF1 API error: ${res.status} ${endpoint}`);
  return res.json();
}

// ─── Types ────────────────────────────────────────────────────

export interface FF1ScheduleEvent {
  RoundNumber: number;
  Country: string;
  Location: string;
  EventName: string;
  OfficialEventName: string;
  EventDate: string;
  EventFormat: string;
  Session1: string;
  Session1DateUtc: string;
  Session2: string;
  Session2DateUtc: string;
  Session3: string;
  Session3DateUtc: string;
  Session4: string;
  Session4DateUtc: string;
  Session5: string;
  Session5DateUtc: string;
}

export interface FF1Result {
  DriverNumber: string;
  BroadcastName: string;
  Abbreviation: string;
  TeamName: string;
  TeamColor: string | null;
  FirstName: string;
  LastName: string;
  Position: number | null;
  GridPosition: number | null;
  Q1: number | null;
  Q2: number | null;
  Q3: number | null;
  Time: number | null;
  Status: string;
  Points: number;
  FastestLapTime: number | null;
  FastestLapNumber: number | null;
}

export interface FF1Lap {
  Driver: string;
  DriverNumber: string;
  LapNumber: number;
  LapTime: number | null;
  Sector1Time: number | null;
  Sector2Time: number | null;
  Sector3Time: number | null;
  SpeedI1: number | null;
  SpeedI2: number | null;
  SpeedFL: number | null;
  SpeedST: number | null;
  Compound: string;
  TyreLife: number | null;
  FreshTyre: boolean;
  Stint: number;
  IsAccurate: boolean;
  IsPersonalBest: boolean;
}

export interface FF1TelemetryPoint {
  Distance: number;
  Speed: number | null;
  Throttle: number | null;
  Brake: boolean | null;
  nGear: number | null;
  DRS: number | null;
  RPM: number | null;
  Time: number | null;
}

export interface FF1TrackPoint {
  X: number;
  Y: number;
  Z: number | null;
  Time: number | null;
}

export interface FF1Stint {
  Driver: string;
  Stint: number;
  Compound: string;
  LapStart: number;
  LapEnd: number;
  TyreLife: number;
  FreshTyre: boolean;
}

export interface FF1Weather {
  Time: number | null;
  AirTemp: number;
  Humidity: number;
  Pressure: number;
  Rainfall: boolean;
  TrackTemp: number;
  WindDirection: number;
  WindSpeed: number;
}

// ─── API Functions ─────────────────────────────────────────────

export async function getFF1Schedule(year: number) {
  return ff1Fetch<FF1ScheduleEvent[]>("/schedule", { year });
}

export async function getFF1Results(year: number, gp: string, session = "R") {
  return ff1Fetch<FF1Result[]>("/results", { year, gp, session });
}

export async function getFF1Laps(year: number, gp: string, session = "R", driver?: string) {
  const params: Record<string, string | number> = { year, gp, session };
  if (driver) params.driver = driver;
  return ff1Fetch<FF1Lap[]>("/laps", params);
}

export async function getFF1FastestLap(year: number, gp: string, driver: string, session = "R") {
  return ff1Fetch<FF1TelemetryPoint[]>("/fastest-lap", { year, gp, session, driver });
}

export async function getFF1TrackMap(year: number, gp: string, driver: string, session = "R") {
  return ff1Fetch<FF1TrackPoint[]>("/track-map", { year, gp, session, driver });
}

export async function getFF1Stints(year: number, gp: string, session = "R") {
  return ff1Fetch<FF1Stint[]>("/stints", { year, gp, session });
}

export async function getFF1Weather(year: number, gp: string, session = "R") {
  return ff1Fetch<FF1Weather[]>("/weather", { year, gp, session });
}

export async function getFF1LapComparison(
  year: number,
  gp: string,
  drivers: string[],
  session = "R"
) {
  return ff1Fetch<Record<string, FF1TelemetryPoint[]>>("/lap-comparison", {
    year,
    gp,
    session,
    drivers: drivers.join(","),
  });
}
