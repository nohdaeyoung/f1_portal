import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Regression: ISSUE-001 — 캘린더가 API round 번호를 정체성으로 써서 무너졌다.
 * Found by /qa on 2026-08-27
 * Report: .gstack/qa-reports/qa-report-f1-324-ing-2026-08-27.md
 *
 * Jolpica 는 취소된 라운드를 빼고 재번호를 매기고, 매핑표에 없는 서킷은 API
 * round 를 그대로 들고 들어온다. 그 결과 /season 에 R14·R21 이 두 줄씩 뜨고
 * R22(라스베이거스)는 사라져 /season/race/22 가 404 였다.
 *
 * 계약: 캘린더의 라운드 집합은 API 응답과 무관하게 항상 로컬 캘린더와 같다.
 * API 는 날짜·세션시간·우승자만 채운다.
 */

vi.mock("next/cache", () => ({
  unstable_cache: <T,>(fn: T) => fn,
}));

const jolpica = vi.hoisted(() => ({
  getRaceSchedule: vi.fn(),
  getAllResults: vi.fn(),
}));

vi.mock("@/lib/api/jolpica", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, ...jolpica };
});

const { fetchCalendar } = await import("./live");
const { calendar: localCalendar } = await import("@/data/f1-data");

/** 실제 Jolpica 2026 응답의 문제 구간만 추린 것 (23경기, 재번호, 미매핑 서킷) */
const jolpicaRace = (round: number, circuitId: string, raceName: string, date: string) => ({
  round: String(round),
  raceName,
  date,
  Circuit: { circuitId, circuitName: raceName, Location: { locality: "", country: "" } },
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  jolpica.getAllResults.mockResolvedValue([]);
});

describe("fetchCalendar — 라운드 정체성", () => {
  it("API 가 재번호를 매겨도 로컬 라운드 번호를 그대로 지킨다", async () => {
    // Jolpica 는 취소된 바레인(R4)·사우디(R5)를 빼고 마이애미를 R4 로 준다
    jolpica.getRaceSchedule.mockResolvedValue([
      jolpicaRace(1, "albert_park", "Australian Grand Prix", "2026-03-08"),
      jolpicaRace(4, "miami", "Miami Grand Prix", "2026-05-03"),
    ]);

    const cal = await fetchCalendar();

    expect(cal.find((r) => r.circuitId === "miami")!.round).toBe(6);
    expect(cal.find((r) => r.circuitId === "albert-park")!.round).toBe(1);
  });

  it("라스베이거스가 R22 로 남는다 (예전엔 사라져 404 였다)", async () => {
    // Jolpica 는 circuitId 를 las_vegas 가 아니라 vegas 로 주고, round 는 21 이다
    jolpica.getRaceSchedule.mockResolvedValue([
      jolpicaRace(20, "interlagos", "Brazilian Grand Prix", "2026-11-08"),
      jolpicaRace(21, "vegas", "Las Vegas Grand Prix", "2026-11-22"),
    ]);

    const cal = await fetchCalendar();
    const vegas = cal.find((r) => r.circuitId === "las-vegas");

    expect(vegas).toBeDefined();
    expect(vegas!.round).toBe(22);
    expect(vegas!.koreanName).toBe("라스베이거스 GP");
  });

  it("madring 을 마드리드 GP(R16)로 알아본다", async () => {
    jolpica.getRaceSchedule.mockResolvedValue([
      jolpicaRace(14, "madring", "Spanish Grand Prix", "2026-09-13"),
    ]);

    const cal = await fetchCalendar();
    const madrid = cal.find((r) => r.circuitId === "madrid");

    expect(madrid!.round).toBe(16);
    expect(madrid!.koreanName).toBe("마드리드 GP");
  });

  it("라운드 번호가 중복되지 않는다", async () => {
    // 미매핑 서킷(sepang)이 로컬 R16 을 덮어써 중복을 만들던 조합
    jolpica.getRaceSchedule.mockResolvedValue([
      jolpicaRace(14, "madring", "Spanish Grand Prix", "2026-09-13"),
      jolpicaRace(16, "sepang", "Bahrain Grand Prix in Malaysia", "2026-10-04"),
      jolpicaRace(20, "interlagos", "Brazilian Grand Prix", "2026-11-08"),
      jolpicaRace(21, "vegas", "Las Vegas Grand Prix", "2026-11-22"),
    ]);

    const cal = await fetchCalendar();
    const rounds = cal.map((r) => r.round);

    expect(new Set(rounds).size).toBe(rounds.length);
  });

  it("로컬 캘린더에 없는 API 서킷은 버리고 로그로 남긴다", async () => {
    jolpica.getRaceSchedule.mockResolvedValue([
      jolpicaRace(16, "sepang", "Bahrain Grand Prix in Malaysia", "2026-10-04"),
    ]);

    const cal = await fetchCalendar();

    expect(cal.some((r) => r.circuitId === "sepang")).toBe(false);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("sepang"));
  });

  it("API 가 일부만 줘도 라운드 집합은 로컬 캘린더와 같다", async () => {
    jolpica.getRaceSchedule.mockResolvedValue([
      jolpicaRace(1, "albert_park", "Australian Grand Prix", "2026-03-08"),
    ]);

    const cal = await fetchCalendar();

    expect(cal.map((r) => r.round)).toEqual(localCalendar.map((r) => r.round));
  });

  it("API 가 던져도 라운드 집합은 같다", async () => {
    jolpica.getRaceSchedule.mockRejectedValue(new Error("Jolpica API error: 429"));

    const cal = await fetchCalendar();

    expect(cal.map((r) => r.round)).toEqual(localCalendar.map((r) => r.round));
  });

  it("취소된 라운드는 API 가 완주 날짜를 줘도 cancelled 로 남는다", async () => {
    jolpica.getRaceSchedule.mockResolvedValue([
      jolpicaRace(1, "albert_park", "Australian Grand Prix", "2026-03-08"),
    ]);

    const cal = await fetchCalendar();

    expect(cal.find((r) => r.round === 4)!.status).toBe("cancelled");
    expect(cal.find((r) => r.round === 5)!.status).toBe("cancelled");
  });
});
