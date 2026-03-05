// Jolpica F1 API Client (Ergast replacement)
// https://api.jolpi.ca/ergast/

const BASE = "https://api.jolpi.ca/ergast/f1";

async function fetchJolpica<T>(path: string, revalidate = 300): Promise<JolpicaResponse<T>> {
  const [basePath, query] = path.split("?");
  const url = `${BASE}${basePath}.json${query ? `?${query}` : ""}`;
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) throw new Error(`Jolpica API error: ${res.status} ${path}`);
  return res.json();
}

/** Run async tasks with limited concurrency to avoid rate-limiting */
async function batchedParallel<T>(
  items: string[],
  fn: (item: string) => Promise<T>,
  concurrency = 3
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

// ─── Types ────────────────────────────────────────────────────

interface JolpicaResponse<T> {
  MRData: {
    xmlns: string;
    series: string;
    url: string;
    limit: string;
    offset: string;
    total: string;
  } & T;
}

export interface JolpicaDriver {
  driverId: string;
  permanentNumber?: string;
  code?: string;
  url: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
}

export interface JolpicaConstructor {
  constructorId: string;
  url: string;
  name: string;
  nationality: string;
}

export interface JolpicaCircuit {
  circuitId: string;
  url: string;
  circuitName: string;
  Location: {
    lat: string;
    long: string;
    locality: string;
    country: string;
  };
}

export interface JolpicaRace {
  season: string;
  round: string;
  url: string;
  raceName: string;
  Circuit: JolpicaCircuit;
  date: string;
  time?: string;
  FirstPractice?: { date: string; time: string };
  SecondPractice?: { date: string; time: string };
  ThirdPractice?: { date: string; time: string };
  Qualifying?: { date: string; time: string };
  SprintQualifying?: { date: string; time: string };
  Sprint?: { date: string; time: string };
  Results?: JolpicaResult[];
}

export interface JolpicaResult {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: JolpicaDriver;
  Constructor: JolpicaConstructor;
  grid: string;
  laps: string;
  status: string;
  Time?: { millis: string; time: string };
  FastestLap?: {
    rank: string;
    lap: string;
    Time: { time: string };
    AverageSpeed: { units: string; speed: string };
  };
}

export interface JolpicaStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Driver: JolpicaDriver;
  Constructors: JolpicaConstructor[];
}

export interface JolpicaConstructorStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Constructor: JolpicaConstructor;
}

export interface JolpicaQualifying {
  number: string;
  position: string;
  Driver: JolpicaDriver;
  Constructor: JolpicaConstructor;
  Q1?: string;
  Q2?: string;
  Q3?: string;
}

export interface JolpicaPitStop {
  driverId: string;
  lap: string;
  stop: string;
  time: string;
  duration: string;
}

export interface JolpicaLap {
  number: string;
  Timings: {
    driverId: string;
    position: string;
    time: string;
  }[];
}

// ─── API Functions ────────────────────────────────────────────

/** Current season drivers */
export async function getDrivers(season: string | number = "current") {
  const data = await fetchJolpica<{
    DriverTable: { season: string; Drivers: JolpicaDriver[] };
  }>(`/${season}/drivers`, 3600);
  return data.MRData.DriverTable.Drivers;
}

/** Current season constructors */
export async function getConstructors(season: string | number = "current") {
  const data = await fetchJolpica<{
    ConstructorTable: { season: string; Constructors: JolpicaConstructor[] };
  }>(`/${season}/constructors`, 3600);
  return data.MRData.ConstructorTable.Constructors;
}

/** Current season circuits */
export async function getCircuits(season: string | number = "current") {
  const data = await fetchJolpica<{
    CircuitTable: { season: string; Circuits: JolpicaCircuit[] };
  }>(`/${season}/circuits`, 86400);
  return data.MRData.CircuitTable.Circuits;
}

/** Race schedule */
export async function getRaceSchedule(season: string | number = "current") {
  const data = await fetchJolpica<{
    RaceTable: { season: string; Races: JolpicaRace[] };
  }>(`/${season}`, 3600);
  return data.MRData.RaceTable.Races;
}

/** Race results for a specific round */
export async function getRaceResults(
  round: number | string,
  season: string | number = "current"
) {
  const data = await fetchJolpica<{
    RaceTable: { season: string; round: string; Races: JolpicaRace[] };
  }>(`/${season}/${round}/results`, 300);
  return data.MRData.RaceTable.Races[0];
}

/** All race results for a season */
export async function getAllResults(season: string | number = "current") {
  const data = await fetchJolpica<{
    RaceTable: { season: string; Races: JolpicaRace[] };
  }>(`/${season}/results?limit=1000`, 300);
  return data.MRData.RaceTable.Races;
}

/** Driver standings */
export async function getDriverStandings(season: string | number = "current") {
  const data = await fetchJolpica<{
    StandingsTable: {
      season: string;
      StandingsLists: {
        season: string;
        round: string;
        DriverStandings: JolpicaStanding[];
      }[];
    };
  }>(`/${season}/driverstandings`, 300);
  return data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? [];
}

/** Constructor standings */
export async function getConstructorStandings(
  season: string | number = "current"
) {
  const data = await fetchJolpica<{
    StandingsTable: {
      season: string;
      StandingsLists: {
        season: string;
        round: string;
        ConstructorStandings: JolpicaConstructorStanding[];
      }[];
    };
  }>(`/${season}/constructorstandings`, 300);
  return (
    data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? []
  );
}

/** Qualifying results */
export async function getQualifying(
  round: number | string,
  season: string | number = "current"
) {
  const data = await fetchJolpica<{
    RaceTable: {
      Races: {
        QualifyingResults: JolpicaQualifying[];
      }[];
    };
  }>(`/${season}/${round}/qualifying`, 300);
  return data.MRData.RaceTable.Races[0]?.QualifyingResults ?? [];
}

/** Sprint results */
export async function getSprintResults(
  round: number | string,
  season: string | number = "current"
) {
  const data = await fetchJolpica<{
    RaceTable: { Races: JolpicaRace[] };
  }>(`/${season}/${round}/sprint`, 300);
  return data.MRData.RaceTable.Races[0];
}

/** Pit stops for a race */
export async function getPitStops(
  round: number | string,
  season: string | number = "current"
) {
  const data = await fetchJolpica<{
    RaceTable: {
      Races: { PitStops: JolpicaPitStop[] }[];
    };
  }>(`/${season}/${round}/pitstops?limit=100`, 300);
  return data.MRData.RaceTable.Races[0]?.PitStops ?? [];
}

/** Lap times for a race */
export async function getLaps(
  round: number | string,
  season: string | number = "current",
  limit = 2000
) {
  const data = await fetchJolpica<{
    RaceTable: {
      Races: { Laps: JolpicaLap[] }[];
    };
  }>(`/${season}/${round}/laps?limit=${limit}`, 300);
  return data.MRData.RaceTable.Races[0]?.Laps ?? [];
}

/** Driver info with career stats (all seasons) */
export async function getDriverInfo(driverId: string) {
  const data = await fetchJolpica<{
    DriverTable: { Drivers: JolpicaDriver[] };
  }>(`/drivers/${driverId}`, 86400);
  return data.MRData.DriverTable.Drivers[0];
}

/** Driver race results (career or season) */
export async function getDriverResults(
  driverId: string,
  season: string | number = "current"
) {
  const data = await fetchJolpica<{
    RaceTable: { Races: JolpicaRace[] };
  }>(`/${season}/drivers/${driverId}/results?limit=100`, 300);
  return data.MRData.RaceTable.Races;
}

/** Seasons list */
export async function getSeasons() {
  const data = await fetchJolpica<{
    SeasonTable: { Seasons: { season: string; url: string }[] };
  }>(`/seasons?limit=100`, 86400);
  return data.MRData.SeasonTable.Seasons;
}

/** Historical race winners at a specific circuit (position=1 only) */
export async function getCircuitHistory(jolpicaCircuitId: string, limit = 30) {
  const data = await fetchJolpica<{
    RaceTable: { Races: JolpicaRace[] };
  }>(`/circuits/${jolpicaCircuitId}/results/1?limit=${limit}`, 86400);
  return data.MRData.RaceTable.Races;
}

export interface DriverSeasonSummary {
  season: string;
  position: number | null;
  wins: number;
  points: number;
  team: string;
}

/**
 * Driver career stats by season.
 * 1) Race results (paginated, 1-5 requests) → wins, points, team
 * 2) Standings per season (batched 3 at a time) → championship position
 */
export async function getDriverHistory(jolpicaDriverId: string): Promise<DriverSeasonSummary[]> {
  // ── Step 1: race results ─────────────────────────────────────
  const first = await fetchJolpica<{
    RaceTable: { Races: JolpicaRace[] };
  }>(`/drivers/${jolpicaDriverId}/results?limit=100&offset=0`, 86400);

  const total = parseInt(first.MRData.total);
  let races = first.MRData.RaceTable.Races;

  if (total > 100) {
    const offsets = Array.from(
      { length: Math.min(Math.ceil((total - 100) / 100), 4) },
      (_, i) => (i + 1) * 100
    );
    const pages = await Promise.all(
      offsets.map((offset) =>
        fetchJolpica<{ RaceTable: { Races: JolpicaRace[] } }>(
          `/drivers/${jolpicaDriverId}/results?limit=100&offset=${offset}`,
          86400
        )
          .then((d) => d.MRData.RaceTable.Races)
          .catch(() => [] as JolpicaRace[])
      )
    );
    races = races.concat(...pages);
  }

  // Aggregate wins, points, team per season
  const byYear: Record<string, { wins: number; points: number; team: string }> = {};
  for (const race of races) {
    const result = race.Results?.[0];
    if (!result) continue;
    if (!byYear[race.season]) byYear[race.season] = { wins: 0, points: 0, team: "" };
    if (result.position === "1") byYear[race.season].wins++;
    byYear[race.season].points += parseFloat(result.points) || 0;
    byYear[race.season].team = result.Constructor.name;
  }

  const seasons = Object.keys(byYear);

  // ── Step 2: championship position (batched, 3 at a time) ─────
  const positions = await batchedParallel(
    seasons,
    (year) =>
      fetchJolpica<{
        StandingsTable: { StandingsLists: Array<{ DriverStandings: JolpicaStanding[] }> };
      }>(`/${year}/drivers/${jolpicaDriverId}/driverstandings`, 86400)
        .then((d) => {
          const list = d.MRData.StandingsTable.StandingsLists[0];
          return list ? parseInt(list.DriverStandings[0].position) : null;
        })
        .catch(() => null),
    3
  );

  const positionBySeason: Record<string, number | null> = {};
  seasons.forEach((year, i) => {
    positionBySeason[year] = positions[i];
  });

  return seasons
    .map((season) => ({
      season,
      position: positionBySeason[season],
      wins: byYear[season].wins,
      points: byYear[season].points,
      team: byYear[season].team,
    }))
    .sort((a, b) => b.season.localeCompare(a.season));
}

/** Driver career pole positions (qualifying position 1) */
export async function getDriverPoles(jolpicaDriverId: string) {
  const data = await fetchJolpica<{
    RaceTable: { Races: Array<{ season: string; round: string }> };
  }>(`/drivers/${jolpicaDriverId}/qualifying/1?limit=300`, 86400);
  return data.MRData.RaceTable.Races;
}

/** Constructor standings history across all seasons */
export async function getConstructorHistory(jolpicaConstructorId: string, limit = 20) {
  const data = await fetchJolpica<{
    StandingsTable: {
      StandingsLists: Array<{
        season: string;
        round: string;
        ConstructorStandings: JolpicaConstructorStanding[];
      }>;
    };
  }>(`/constructors/${jolpicaConstructorId}/constructorstandings?limit=${limit}`, 86400);
  return data.MRData.StandingsTable.StandingsLists;
}
