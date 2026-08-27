/**
 * Season progress API
 *
 * Fetches ALL race + sprint results with pagination (Jolpica caps at 100/page).
 * Computes cumulative points per driver per round locally.
 */

import { NextResponse } from "next/server";
import { batchedParallel, fetchWithRetry } from "@/lib/api/http";

const BASE = "https://api.jolpi.ca/ergast/f1";
const PAGE_SIZE = 100;

/** Jolpica 는 429 를 잘 뱉는다. 재시도하면 대개 성공하므로 공용 계층을 쓴다. */
const jolpica = (url: string) =>
  fetchWithRetry(url, {
    retryOn: [429],
    revalidate: 86400, // 지난 시즌 결과는 바뀌지 않는다
    label: "Jolpica API",
  });

const COLORS = [
  "#E8002D", "#0090D0", "#FF8000", "#00D2BE", "#DC0000",
  "#006F62", "#B6BABD", "#2293D1", "#C92D4B", "#005AFF",
];

interface JolpicaResult {
  position: string;
  points: string;
  Driver: { driverId: string; givenName: string; familyName: string };
  Constructor: { name: string };
}

interface JolpicaRace {
  round: string;
  raceName: string;
  Results?: JolpicaResult[];
  SprintResults?: JolpicaResult[];
}

/** Fetch all pages of a Jolpica list endpoint, return merged Races array */
async function fetchAllPages(path: string): Promise<JolpicaRace[]> {
  const res0 = await jolpica(`${BASE}${path}?limit=${PAGE_SIZE}&offset=0`);
  const data0 = await res0.json();

  const total = parseInt(data0.MRData.total);
  const firstRaces: JolpicaRace[] = data0.MRData.RaceTable.Races ?? [];
  if (total <= PAGE_SIZE) return firstRaces;

  // 남은 페이지 — 전량 동시 발사는 그 자체로 429 를 부르므로 동시성을 묶는다
  const pageCount = Math.ceil(total / PAGE_SIZE);
  const restPages = await batchedParallel(
    Array.from({ length: pageCount - 1 }, (_, i) => (i + 1) * PAGE_SIZE),
    (offset) =>
      jolpica(`${BASE}${path}?limit=${PAGE_SIZE}&offset=${offset}`)
        .then((r) => r.json())
        .then((d) => (d.MRData.RaceTable.Races ?? []) as JolpicaRace[])
        .catch(() => [] as JolpicaRace[])
  );

  return [...firstRaces, ...restPages.flat()];
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ year: string }> }
) {
  const { year } = await params;
  const yearNum = parseInt(year);
  // 상한을 하드코딩하지 말 것. 2025 로 박혀 있던 탓에 2026 시즌이 시작되자
  // 진행 중인 시즌 조회가 전부 400 으로 막혔다.
  const maxYear = new Date().getFullYear();
  if (isNaN(yearNum) || yearNum < 1950 || yearNum > maxYear) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  try {
    // Fetch race results + sprint results in parallel (both paginated)
    const [racePages, sprintPages, standingsRes] = await Promise.all([
      fetchAllPages(`/${year}/results`),
      fetchAllPages(`/${year}/sprint`).catch(() => [] as JolpicaRace[]),
      // 순위표는 없어도 계산된 랭킹으로 대체되므로 실패를 치명적으로 보지 않는다
      jolpica(`${BASE}/${year}/driverstandings.json`).catch(() => null),
    ]);

    if (!racePages.length) return NextResponse.json(null);

    // Build round → race name map (from main races)
    const roundNames = new Map<number, string>();
    for (const race of racePages) {
      roundNames.set(
        parseInt(race.round),
        race.raceName.replace(" Grand Prix", " GP")
      );
    }

    // Sprint results keyed by round
    const sprintByRound = new Map<number, JolpicaResult[]>();
    for (const race of sprintPages) {
      if (race.SprintResults?.length) {
        sprintByRound.set(parseInt(race.round), race.SprintResults);
      }
    }

    // All rounds sorted
    const rounds = [...roundNames.keys()].sort((a, b) => a - b);
    const raceNames = rounds.map((r) => roundNames.get(r)!);
    const totalRounds = rounds.length;

    // ── Build per-round points earned ──────────────────────────
    // roundPts[i] = Map<driverId, points earned in round i>
    const roundPts: Map<string, number>[] = rounds.map((round) => {
      const m = new Map<string, number>();

      // Race points
      const raceData = racePages.find((r) => parseInt(r.round) === round);
      for (const result of raceData?.Results ?? []) {
        const prev = m.get(result.Driver.driverId) ?? 0;
        m.set(result.Driver.driverId, prev + (parseFloat(result.points) || 0));
      }

      // Sprint points (same round number)
      for (const result of sprintByRound.get(round) ?? []) {
        const prev = m.get(result.Driver.driverId) ?? 0;
        m.set(result.Driver.driverId, prev + (parseFloat(result.points) || 0));
      }

      return m;
    });

    // ── Collect all driver metadata ────────────────────────────
    const driverMeta = new Map<
      string,
      { givenName: string; familyName: string; team: string }
    >();
    for (const race of [...racePages, ...sprintPages]) {
      for (const result of [
        ...(race.Results ?? []),
        ...(race.SprintResults ?? []),
      ]) {
        if (!driverMeta.has(result.Driver.driverId)) {
          driverMeta.set(result.Driver.driverId, {
            givenName: result.Driver.givenName,
            familyName: result.Driver.familyName,
            team: result.Constructor.name,
          });
        }
      }
    }

    // ── Cumulative points for every driver ─────────────────────
    const driverCumulative = new Map<string, number[]>();
    for (const [driverId] of driverMeta) {
      let cum = 0;
      const pts: number[] = [];
      for (let i = 0; i < totalRounds; i++) {
        cum += roundPts[i].get(driverId) ?? 0;
        pts.push(cum);
      }
      driverCumulative.set(driverId, pts);
    }

    // ── Top 10 by final standings (or computed ranking) ────────
    let top10Ids: string[];
    if (standingsRes?.ok) {
      const sd = await standingsRes.json();
      // 200 이라고 모양까지 보장되진 않는다. 여기서 터지면 라운드별 포인트 추이가
      // 다 계산돼 있는데도 500 이 나간다 — 아래 계산된 랭킹으로 이어가면 된다.
      const list =
        sd?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [];
      top10Ids = list
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .slice(0, 10).map((s: any) => s.Driver.driverId)
        .filter((id: string) => driverMeta.has(id));
    } else {
      top10Ids = [];
    }

    // Fallback: fill from computed ranking if standings short
    if (top10Ids.length < 10) {
      const ranked = [...driverCumulative.entries()].sort(
        (a, b) => (b[1][totalRounds - 1] ?? 0) - (a[1][totalRounds - 1] ?? 0)
      );
      for (const [id] of ranked) {
        if (top10Ids.length >= 10) break;
        if (!top10Ids.includes(id)) top10Ids.push(id);
      }
    }

    // ── Build response ─────────────────────────────────────────
    const dataset = top10Ids.map((driverId, idx) => {
      const meta = driverMeta.get(driverId)!;
      const pts = driverCumulative.get(driverId) ?? new Array(totalRounds).fill(0);
      return {
        driverId,
        driverName: `${meta.givenName} ${meta.familyName}`,
        team: meta.team,
        finalPosition: idx + 1,
        finalPoints: pts[totalRounds - 1] ?? 0,
        color: COLORS[idx] ?? "#64748B",
        points: pts,
      };
    });

    return NextResponse.json(
      { rounds: totalRounds, raceNames, dataset },
      {
        headers: {
          "Cache-Control":
            "public, max-age=86400, stale-while-revalidate=3600",
        },
      }
    );
  } catch (e) {
    console.error(`[api/season/${year}/progress]`, e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
