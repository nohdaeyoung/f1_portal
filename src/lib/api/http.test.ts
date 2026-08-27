import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchWithRetry, batchedParallel } from "./http";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function mockFetch(handler: (attempt: number) => Response) {
  let n = 0;
  const spy = vi.fn(async () => handler(n++));
  vi.stubGlobal("fetch", spy);
  return spy;
}

const ok = () => new Response("{}", { status: 200 });
const status = (s: number) => new Response("", { status: s });

describe("fetchWithRetry — upstream 별 재시도 정책", () => {
  it("retryOn 에 든 상태는 재시도한다", async () => {
    vi.useFakeTimers();
    const spy = mockFetch((n) => (n === 0 ? status(429) : ok()));

    const p = fetchWithRetry("https://x/y", { retryOn: [429] });
    await vi.advanceTimersByTimeAsync(30_000);
    await expect(p).resolves.toBeInstanceOf(Response);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("retryOn 에 없는 상태는 재시도하지 않는다 (OpenF1 403 페이월)", async () => {
    const spy = mockFetch(() => status(403));

    await expect(fetchWithRetry("https://x/y", { retryOn: [429], label: "OpenF1 API" }))
      .rejects.toThrow(/OpenF1 API error: 403/);
    // 403 은 기다려도 계속 403 이라 한 번만 시도해야 한다
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("retryOn 을 비우면 어떤 오류도 재시도하지 않는다", async () => {
    const spy = mockFetch(() => status(429));

    await expect(fetchWithRetry("https://x/y")).rejects.toThrow(/429/);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("maxRetries 를 넘기면 던진다", async () => {
    vi.useFakeTimers();
    const spy = mockFetch(() => status(503));

    const p = fetchWithRetry("https://x/y", { retryOn: [503], maxRetries: 2 });
    const assertion = expect(p).rejects.toThrow(/503/);
    await vi.advanceTimersByTimeAsync(60_000);
    await assertion;

    expect(spy).toHaveBeenCalledTimes(3); // 최초 1 + 재시도 2
  });

  it("202 는 실패가 아니라 통과시킨다 (FastF1 계산 중)", async () => {
    const spy = mockFetch(() => new Response("{}", { status: 202 }));

    const res = await fetchWithRetry("https://x/y", { retryOn: [502, 503] });
    expect(res.status).toBe(202);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("retry-after 헤더를 존중한다", async () => {
    vi.useFakeTimers();
    mockFetch((n) => (n === 0 ? new Response("", { status: 429, headers: { "retry-after": "2" } }) : ok()));

    const p = fetchWithRetry("https://x/y", { retryOn: [429] });
    // 2초 미만으로는 아직 재시도하지 않는다
    await vi.advanceTimersByTimeAsync(1_500);
    await vi.advanceTimersByTimeAsync(1_000);
    await expect(p).resolves.toBeInstanceOf(Response);
  });
});

describe("batchedParallel — 동시성 제한", () => {
  it("concurrency 를 넘겨 동시에 실행하지 않는다", async () => {
    let inFlight = 0;
    let peak = 0;
    const fn = async (n: number) => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 1));
      inFlight--;
      return n * 2;
    };

    const out = await batchedParallel([1, 2, 3, 4, 5, 6, 7], fn, 3);

    expect(out).toEqual([2, 4, 6, 8, 10, 12, 14]); // 순서 보존
    expect(peak).toBeLessThanOrEqual(3);
  });

  it("빈 입력은 빈 결과", async () => {
    expect(await batchedParallel([], async (x) => x, 3)).toEqual([]);
  });
});
