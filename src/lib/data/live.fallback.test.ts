import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * live.ts 의 실패 폴백 계약을 고정하는 테스트.
 *
 * 현재 동작: 외부 API 가 실패하거나 빈 결과를 주면 조용히 목업 데이터를 반환한다.
 * 사용자는 진짜 순위표와 임시 데이터를 구분할 방법이 없고, 서버 로그에만 warn 이 남는다.
 *
 * 이 테스트는 "지금 이렇다"를 박아두는 용도다. 폴백 계약을 명시적으로 바꿀 때
 * (T3) 어떤 동작이 바뀌는지 diff 로 드러나게 하는 것이 목적이다.
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
const { driverStandings: mockDriverStandings, constructorStandings: mockConstructorStandings } =
  await import("@/data/f1-data");

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("fetchDriverStandings — 현재 폴백 계약", () => {
  it("API 가 던지면 목업 순위표를 반환한다 (사용자는 구분 불가)", async () => {
    jolpica.getDriverStandings.mockRejectedValue(new Error("Jolpica API error: 429"));

    const result = await fetchDriverStandings();

    expect(result).toEqual(mockDriverStandings);
    // 실패 신호는 서버 로그에만 남는다
    expect(console.warn).toHaveBeenCalled();
  });

  it("API 가 빈 배열을 주면 목업 순위표를 반환한다", async () => {
    jolpica.getDriverStandings.mockResolvedValue([]);

    const result = await fetchDriverStandings();

    expect(result).toEqual(mockDriverStandings);
  });

  it("정상 응답은 로컬 드라이버 ID 로 매핑해 반환한다", async () => {
    jolpica.getDriverStandings.mockResolvedValue([
      { position: "1", points: "25", wins: "1", Driver: { driverId: "max_verstappen" } },
    ]);

    const result = await fetchDriverStandings();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ position: 1, points: 25, wins: 1 });
    // Jolpica ID 를 그대로 노출하지 않는다
    expect(result[0].driverId).not.toBe("max_verstappen");
  });
});

describe("fetchConstructorStandings — 현재 폴백 계약", () => {
  it("API 가 던지면 목업 컨스트럭터 순위를 반환한다", async () => {
    jolpica.getConstructorStandings.mockRejectedValue(new Error("boom"));

    const result = await fetchConstructorStandings();

    expect(result).toEqual(mockConstructorStandings);
  });

  it("빈 배열도 목업으로 폴백한다", async () => {
    jolpica.getConstructorStandings.mockResolvedValue([]);

    const result = await fetchConstructorStandings();

    expect(result).toEqual(mockConstructorStandings);
  });
});
