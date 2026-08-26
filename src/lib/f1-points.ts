// F1 Standard Points System

const RACE_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1];
const FL_BONUS = 1;

export interface RaceResultEntry {
  position: number;
  driverId: string;
  status: "Finished" | "DNF" | "DSQ" | "DNS";
}

export type DriverPoints = Record<string, number>;

export interface PointPreview {
  driverId: string;
  driverName: string;
  points: number;
  teamId: string;
}

export function calcRacePoints(
  results: RaceResultEntry[],
  fastestLapDriverId: string,
  isSprint: boolean
): DriverPoints {
  const table = isSprint ? SPRINT_POINTS : RACE_POINTS;
  const pts: DriverPoints = {};

  for (const r of results) {
    if (!r.driverId) continue;
    if (r.status === "DSQ" || r.status === "DNS") {
      pts[r.driverId] = 0;
    } else {
      // Finished or DNF: position-based points
      pts[r.driverId] = table[r.position - 1] ?? 0;
    }
  }

  // Fastest Lap: +1pt if top-10 finisher (race only, not sprint)
  if (!isSprint && fastestLapDriverId) {
    const flResult = results.find((r) => r.driverId === fastestLapDriverId);
    if (
      flResult &&
      flResult.status === "Finished" &&
      flResult.position <= 10
    ) {
      pts[fastestLapDriverId] = (pts[fastestLapDriverId] ?? 0) + FL_BONUS;
    }
  }

  return pts;
}

export function calcTeamPoints(
  driverPoints: DriverPoints,
  drivers: { id: string; teamId: string }[]
): Record<string, number> {
  const teamPts: Record<string, number> = {};
  for (const d of drivers) {
    if (!d.id) continue;
    teamPts[d.teamId] = (teamPts[d.teamId] ?? 0) + (driverPoints[d.id] ?? 0);
  }
  return teamPts;
}
