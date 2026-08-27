import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAllResults, getRaceResults } from "./jolpica";

/**
 * fetch 를 가로채 Jolpica 응답을 흉내낸다.
 * 실제 네트워크를 타지 않으므로 CI 에서도 안정적이다.
 */
function mockFetch(handler: (url: string, attempt: number) => Response) {
  let attempt = 0;
  const spy = vi.fn(async (url: string | URL) => handler(String(url), attempt++));
  vi.stubGlobal("fetch", spy);
  return spy;
}

const ok = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });

const raceTable = (total: number, races: unknown[]) =>
  ({ MRData: { total: String(total), RaceTable: { season: "2026", Races: races } } });

const race = (round: string, results: { position: string }[]) =>
  ({ round, raceName: `R${round}`, Results: results });

beforeEach(() => vi.useRealTimers());
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("getAllResults — 100행 캡 페이지네이션", () => {
  it("total 을 넘어설 때까지 offset 을 올려가며 모든 페이지를 가져온다", async () => {
    const spy = mockFetch((url) => {
      if (url.includes("offset=0"))   return ok(raceTable(150, [race("1", [{ position: "1" }])]));
      if (url.includes("offset=100")) return ok(raceTable(150, [race("2", [{ position: "1" }])]));
      throw new Error("예상치 못한 요청: " + url);
    });

    const races = await getAllResults(2026);

    expect(spy).toHaveBeenCalledTimes(2);
    expect(races.map((r) => r.round)).toEqual(["1", "2"]);
  });

  it("한 라운드가 페이지 경계에 걸치면 결과를 이어붙인다", async () => {
    // 라운드 2 가 offset=0 과 offset=100 양쪽에 나뉘어 온다.
    mockFetch((url) => {
      if (url.includes("offset=0"))
        return ok(raceTable(120, [race("1", [{ position: "1" }]), race("2", [{ position: "1" }])]));
      if (url.includes("offset=100"))
        return ok(raceTable(120, [race("2", [{ position: "2" }, { position: "3" }])]));
      throw new Error("예상치 못한 요청: " + url);
    });

    const races = await getAllResults(2026);

    expect(races).toHaveLength(2);
    const r2 = races.find((r) => r.round === "2")!;
    // 라운드가 중복 생성되지 않고 결과만 합쳐져야 한다
    expect(r2.Results).toHaveLength(3);
    expect(r2.Results!.map((x) => x.position)).toEqual(["1", "2", "3"]);
  });

  it("라운드를 번호순으로 정렬해 반환한다", async () => {
    mockFetch((url) => {
      if (url.includes("offset=0"))
        return ok(raceTable(2, [race("10", []), race("2", [])]));
      throw new Error("예상치 못한 요청: " + url);
    });

    const races = await getAllResults(2026);
    // 문자열 정렬이면 "10" 이 "2" 앞에 온다 — 숫자 정렬이어야 한다
    expect(races.map((r) => r.round)).toEqual(["2", "10"]);
  });

  it("빈 페이지를 받으면 멈춘다 (무한 루프 방지)", async () => {
    const spy = mockFetch((url) => {
      if (url.includes("offset=0")) return ok(raceTable(9999, []));
      throw new Error("멈추지 않고 계속 요청함: " + url);
    });

    await expect(getAllResults(2026)).resolves.toEqual([]);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("fetchJolpica — 429 재시도", () => {
  it("429 를 맞으면 재시도해서 성공한다", async () => {
    vi.useFakeTimers();
    const spy = mockFetch((_url, attempt) =>
      attempt === 0
        ? new Response("", { status: 429 })
        : ok(raceTable(1, [race("1", [])]))
    );

    const p = getRaceResults(1, 2026);
    // 백오프는 실제로 수 초라 가짜 타이머로 흘려보낸다
    await vi.advanceTimersByTimeAsync(30_000);
    const result = await p;

    expect(spy).toHaveBeenCalledTimes(2);
    expect(result.round).toBe("1");
  });

  it("429 가 계속되면 재시도를 소진하고 던진다", async () => {
    vi.useFakeTimers();
    const spy = mockFetch(() => new Response("", { status: 429 }));

    const p = getRaceResults(1, 2026);
    const assertion = expect(p).rejects.toThrow(/429/);
    await vi.advanceTimersByTimeAsync(60_000);
    await assertion;

    // 최초 1회 + MAX_429_RETRIES(4) = 5
    expect(spy).toHaveBeenCalledTimes(5);
  });

  it("429 가 아닌 오류는 재시도하지 않고 즉시 던진다", async () => {
    const spy = mockFetch(() => new Response("", { status: 500 }));

    await expect(getRaceResults(1, 2026)).rejects.toThrow(/500/);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
