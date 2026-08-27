import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * live.ts 순위표의 실패 계약.
 *
 *   null → 조회 실패. 호출부가 "불러오지 못했습니다" 를 표시해야 한다.
 *   []   → 조회 성공, 아직 데이터 없음 (시즌 개막 전 등).
 *
 * 예전에는 실패 시 f1-data.ts 의 정적 순위표로 폴백했는데, 그건 R1 직후
 * 스냅샷이라 시즌 중반엔 몇 달 지난 순위를 현재처럼 보여주게 된다.
 * 순위표에서 틀린 숫자는 빈 화면보다 나쁘므로 폴백을 없앴다.
 * 캘린더는 손으로 관리하는 실제 일정이라 폴백을 유지한다.
 */

// unstable_cache 는 테스트에서 통과시킨다 (캐시가 아니라 폴백 로직을 검증하므로)
vi.mock("next/cache", () => ({
  unstable_cache: <T,>(fn: T) => fn,
}));

const jolpica = vi.hoisted(() => ({
  getDriverStandings: vi.fn(),
  getConstructorStandings: vi.fn(),
}));

vi.mock("@/lib/api/jolpica", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, ...jolpica };
});

const { fetchDriverStandings, fetchConstructorStandings } = await import("./live");
const staticData = await import("@/data/f1-data");

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("fetchDriverStandings — 실패 계약", () => {
  it("API 가 던지면 null 을 반환한다", async () => {
    jolpica.getDriverStandings.mockRejectedValue(new Error("Jolpica API error: 429"));

    const result = await fetchDriverStandings();

    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalled();
  });

  it("실패해도 정적 순위표로 폴백하지 않는다", async () => {
    jolpica.getDriverStandings.mockRejectedValue(new Error("boom"));

    const result = await fetchDriverStandings();

    // R1 스냅샷(러셀 25점)이 현재 순위인 것처럼 새어나가면 안 된다
    expect(result).not.toEqual(staticData.driverStandings);
  });

  it("빈 결과는 실패가 아니라 빈 배열로 구분된다", async () => {
    jolpica.getDriverStandings.mockResolvedValue([]);

    const result = await fetchDriverStandings();

    expect(result).toEqual([]);
    expect(result).not.toBeNull();
  });

  it("정상 응답은 로컬 드라이버 ID 로 매핑해 반환한다", async () => {
    jolpica.getDriverStandings.mockResolvedValue([
      { position: "1", points: "25", wins: "1", Driver: { driverId: "max_verstappen" } },
    ]);

    const result = await fetchDriverStandings();

    expect(result).not.toBeNull();
    expect(result!).toHaveLength(1);
    expect(result![0]).toMatchObject({ position: 1, points: 25, wins: 1 });
    // Jolpica ID 를 그대로 노출하지 않는다
    expect(result![0].driverId).not.toBe("max_verstappen");
  });
});

describe("fetchConstructorStandings — 실패 계약", () => {
  it("API 가 던지면 null 을 반환한다", async () => {
    jolpica.getConstructorStandings.mockRejectedValue(new Error("boom"));

    const result = await fetchConstructorStandings();

    expect(result).toBeNull();
    expect(result).not.toEqual(staticData.constructorStandings);
  });

  it("빈 결과는 빈 배열", async () => {
    jolpica.getConstructorStandings.mockResolvedValue([]);

    const result = await fetchConstructorStandings();

    expect(result).toEqual([]);
  });
});
