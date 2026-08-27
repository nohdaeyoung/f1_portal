import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Regression: ISSUE-003 — 시즌 진행 API 가 Jolpica 429 에 재시도 없이 500 을 냈다.
 * Found by /qa on 2026-08-27
 * Report: .gstack/qa-reports/qa-report-f1-324-ing-2026-08-27.md
 *
 * 이 라우트만 공용 fetch 계층(lib/api/http)을 안 거치고 raw fetch 를 썼다.
 * Jolpica 는 연속 조회에 429 를 잘 뱉으므로, 아카이브에서 지난 시즌을 몇 개
 * 넘기면 그래프가 "Failed" 로 죽었다. 1976 은 재현이 100% 였다.
 */

const { GET } = await import("./[year]/progress/route");

const raceTable = (races: unknown[]) => ({
  MRData: { total: String(races.length), RaceTable: { Races: races } },
});

const race = (round: number, name: string, driverId: string, points: string) => ({
  round: String(round),
  raceName: `${name} Grand Prix`,
  Results: [
    {
      position: "1",
      points,
      Driver: { driverId, givenName: "Niki", familyName: "Lauda" },
      Constructor: { name: "Ferrari" },
    },
  ],
});

const ok = (body: unknown) =>
  ({ ok: true, status: 200, json: async () => body }) as unknown as Response;
const tooMany = () =>
  ({ ok: false, status: 429, headers: { get: () => null } }) as unknown as Response;

const call = (year: string) =>
  GET(new Request(`http://x/api/season/${year}/progress`), {
    params: Promise.resolve({ year }),
  });

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("GET /api/season/[year]/progress — 429 재시도", () => {
  it("첫 응답이 429 여도 재시도해서 200 을 돌려준다", async () => {
    const results = raceTable([race(1, "Brazilian", "lauda", "9")]);
    let resultsHits = 0;
    vi.stubGlobal("fetch", async (url: string) => {
      if (url.includes("/results")) {
        // 첫 /results 만 429 — 재시도가 없으면 여기서 500 으로 끝난다
        return ++resultsHits === 1 ? tooMany() : ok(results);
      }
      return ok(raceTable([]));
    });

    const promise = call("1976");
    await vi.advanceTimersByTimeAsync(60_000);
    const res = await promise;

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.rounds).toBe(1);
    expect(body.dataset[0].driverName).toBe("Niki Lauda");
  });

  it("재시도를 다 써도 안 되면 500 을 낸다", async () => {
    vi.stubGlobal("fetch", async () => tooMany());

    const promise = call("1976");
    await vi.advanceTimersByTimeAsync(60_000);
    const res = await promise;

    expect(res.status).toBe(500);
  });

  it("순위표가 죽어도 계산된 랭킹으로 응답한다", async () => {
    const results = raceTable([race(1, "Brazilian", "lauda", "9")]);
    vi.stubGlobal("fetch", async (url: string) => {
      if (url.includes("driverstandings")) return tooMany();
      if (url.includes("/results")) return ok(results);
      return ok(raceTable([]));
    });

    const promise = call("1976");
    await vi.advanceTimersByTimeAsync(60_000);
    const res = await promise;

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dataset[0].driverId).toBe("lauda");
  });

  it("범위 밖 연도는 400 이다", async () => {
    const res = await call("1949");
    expect(res.status).toBe(400);
  });

  it("올해는 허용된다 (2025 로 박혀 있던 상한 회귀 방지)", async () => {
    vi.stubGlobal("fetch", async () => ok(raceTable([])));

    const res = await call(String(new Date().getFullYear()));

    expect(res.status).not.toBe(400);
  });
});

describe("GET /api/season/[year]/progress — 순위표 응답 모양", () => {
  it("200 인데 StandingsTable 이 없어도 500 을 내지 않는다", async () => {
    const results = raceTable([race(1, "Brazilian", "lauda", "9")]);
    vi.stubGlobal("fetch", async (url: string) => {
      if (url.includes("/results")) return ok(results);
      return ok({ MRData: {} }); // 순위표 없음 — 예전엔 여기서 TypeError 로 500
    });

    const res = await call("1976");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dataset[0].driverId).toBe("lauda");
  });
});
