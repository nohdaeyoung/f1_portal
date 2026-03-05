// OpenF1 API Client
// https://openf1.org - Real-time F1 data

const BASE = "https://api.openf1.org/v1";

async function fetchOpenF1<T>(
  endpoint: string,
  params: Record<string, string | number> = {},
  revalidate = 60
): Promise<T[]> {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, String(value));
  }
  const url = `${BASE}${endpoint}?${searchParams.toString()}`;
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) throw new Error(`OpenF1 API error: ${res.status} ${endpoint}`);
  return res.json();
}

// ─── Types ────────────────────────────────────────────────────

export interface OF1Driver {
  broadcast_name: string;
  driver_number: number;
  first_name: string;
  full_name: string;
  headshot_url: string | null;
  last_name: string;
  meeting_key: number;
  name_acronym: string;
  session_key: number;
  team_colour: string | null;
  team_name: string;
}

export interface OF1Meeting {
  circuit_key: number;
  circuit_short_name: string;
  country_code: string;
  country_key: number;
  country_name: string;
  date_end: string;
  date_start: string;
  gmt_offset: string;
  location: string;
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  year: number;
}

export interface OF1Session {
  circuit_key: number;
  circuit_short_name: string;
  country_code: string;
  country_key: number;
  country_name: string;
  date_end: string;
  date_start: string;
  gmt_offset: string;
  location: string;
  meeting_key: number;
  session_key: number;
  session_name: string;
  session_type: string;
  year: number;
}

export interface OF1Position {
  date: string;
  driver_number: number;
  meeting_key: number;
  position: number;
  session_key: number;
}

export interface OF1Interval {
  date: string;
  driver_number: number;
  gap_to_leader: number | null;
  interval: number | null;
  meeting_key: number;
  session_key: number;
}

export interface OF1Lap {
  date_start: string;
  driver_number: number;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  i1_speed: number | null;
  i2_speed: number | null;
  is_pit_out_lap: boolean;
  lap_duration: number | null;
  lap_number: number;
  meeting_key: number;
  segments_sector_1: number[] | null;
  segments_sector_2: number[] | null;
  segments_sector_3: number[] | null;
  session_key: number;
  st_speed: number | null;
}

export interface OF1Pit {
  date: string;
  driver_number: number;
  lane_duration: number | null;
  lap_number: number;
  meeting_key: number;
  pit_duration: number | null;
  session_key: number;
  stop_duration: number | null;
}

export interface OF1Stint {
  compound: string;
  driver_number: number;
  lap_end: number | null;
  lap_start: number;
  meeting_key: number;
  session_key: number;
  stint_number: number;
  tyre_age_at_start: number;
}

export interface OF1Weather {
  air_temperature: number;
  date: string;
  humidity: number;
  meeting_key: number;
  pressure: number;
  rainfall: number;
  session_key: number;
  track_temperature: number;
  wind_direction: number;
  wind_speed: number;
}

export interface OF1RaceControl {
  category: string;
  date: string;
  driver_number: number | null;
  flag: string | null;
  lap_number: number | null;
  meeting_key: number;
  message: string;
  scope: string | null;
  sector: number | null;
  session_key: number;
}

export interface OF1TeamRadio {
  date: string;
  driver_number: number;
  meeting_key: number;
  recording_url: string;
  session_key: number;
}

export interface OF1CarData {
  brake: number;
  date: string;
  driver_number: number;
  drs: number;
  meeting_key: number;
  n_gear: number;
  rpm: number;
  session_key: number;
  speed: number;
  throttle: number;
}

export interface OF1Overtake {
  date: string;
  meeting_key: number;
  overtaken_driver_number: number;
  overtaking_driver_number: number;
  position: number;
  session_key: number;
}

export interface OF1SessionResult {
  dnf: boolean;
  dns: boolean;
  dsq: boolean;
  driver_number: number;
  duration: number | null;
  gap_to_leader: number | null;
  number_of_laps: number;
  meeting_key: number;
  position: number;
  session_key: number;
}

export interface OF1StartingGrid {
  position: number;
  driver_number: number;
  lap_duration: number | null;
  meeting_key: number;
  session_key: number;
}

export interface OF1ChampionshipDriver {
  driver_number: number;
  meeting_key: number;
  points_current: number;
  points_start: number;
  position_current: number;
  position_start: number;
  session_key: number;
}

export interface OF1ChampionshipTeam {
  meeting_key: number;
  points_current: number;
  points_start: number;
  position_current: number;
  position_start: number;
  session_key: number;
  team_name: string;
}

// ─── API Functions ────────────────────────────────────────────

/** Get current year's meetings (GPs) */
export async function getMeetings(year?: number) {
  return fetchOpenF1<OF1Meeting>("/meetings", {
    year: year ?? new Date().getFullYear(),
  }, 3600);
}

/** Get sessions for a meeting */
export async function getSessions(meetingKey: number) {
  return fetchOpenF1<OF1Session>("/sessions", { meeting_key: meetingKey }, 300);
}

/** Get latest session (most recent) */
export async function getLatestSession() {
  const sessions = await fetchOpenF1<OF1Session>(
    "/sessions",
    { year: new Date().getFullYear() },
    60
  );
  return sessions[sessions.length - 1];
}

/** Get drivers for a session */
export async function getDrivers(sessionKey: number) {
  return fetchOpenF1<OF1Driver>("/drivers", { session_key: sessionKey }, 300);
}

/** Get latest drivers (from most recent session) */
export async function getLatestDrivers() {
  const session = await getLatestSession();
  if (!session) return [];
  return getDrivers(session.session_key);
}

/** Real-time positions */
export async function getPositions(sessionKey: number) {
  return fetchOpenF1<OF1Position>("/position", { session_key: sessionKey }, 4);
}

/** Real-time intervals (gaps) */
export async function getIntervals(sessionKey: number) {
  return fetchOpenF1<OF1Interval>("/intervals", { session_key: sessionKey }, 4);
}

/** Lap data for a session */
export async function getLaps(
  sessionKey: number,
  driverNumber?: number
) {
  const params: Record<string, string | number> = { session_key: sessionKey };
  if (driverNumber) params.driver_number = driverNumber;
  return fetchOpenF1<OF1Lap>("/laps", params, 10);
}

/** Pit stops */
export async function getPitStops(sessionKey: number) {
  return fetchOpenF1<OF1Pit>("/pit", { session_key: sessionKey }, 10);
}

/** Stint / tyre data */
export async function getStints(sessionKey: number) {
  return fetchOpenF1<OF1Stint>("/stints", { session_key: sessionKey }, 10);
}

/** Weather data */
export async function getWeather(sessionKey: number) {
  return fetchOpenF1<OF1Weather>("/weather", { session_key: sessionKey }, 30);
}

/** Latest weather for a session */
export async function getLatestWeather(sessionKey: number) {
  const data = await getWeather(sessionKey);
  return data[data.length - 1] ?? null;
}

/** Race control messages (flags, safety car, etc.) */
export async function getRaceControl(sessionKey: number) {
  return fetchOpenF1<OF1RaceControl>("/race_control", {
    session_key: sessionKey,
  }, 4);
}

/** Team radio recordings */
export async function getTeamRadio(
  sessionKey: number,
  driverNumber?: number
) {
  const params: Record<string, string | number> = { session_key: sessionKey };
  if (driverNumber) params.driver_number = driverNumber;
  return fetchOpenF1<OF1TeamRadio>("/team_radio", params, 10);
}

/** Car telemetry data */
export async function getCarData(
  sessionKey: number,
  driverNumber: number
) {
  return fetchOpenF1<OF1CarData>("/car_data", {
    session_key: sessionKey,
    driver_number: driverNumber,
  }, 4);
}

/** Overtakes */
export async function getOvertakes(sessionKey: number) {
  return fetchOpenF1<OF1Overtake>("/overtakes", {
    session_key: sessionKey,
  }, 10);
}

/** Session results */
export async function getSessionResult(sessionKey: number) {
  return fetchOpenF1<OF1SessionResult>("/session_result", {
    session_key: sessionKey,
  }, 300);
}

/** Starting grid */
export async function getStartingGrid(sessionKey: number) {
  return fetchOpenF1<OF1StartingGrid>("/starting_grid", {
    session_key: sessionKey,
  }, 300);
}

/** Driver championship standings */
export async function getChampionshipDrivers(meetingKey: number) {
  return fetchOpenF1<OF1ChampionshipDriver>("/championship_drivers", {
    meeting_key: meetingKey,
  }, 300);
}

/** Team championship standings */
export async function getChampionshipTeams(meetingKey: number) {
  return fetchOpenF1<OF1ChampionshipTeam>("/championship_teams", {
    meeting_key: meetingKey,
  }, 300);
}
