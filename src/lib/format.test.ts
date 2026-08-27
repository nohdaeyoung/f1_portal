import { describe, it, expect } from "vitest";
import { toNumber, fmtGap, type TimingValue } from "./format";

/**
 * OpenF1 응답 형태 회귀 테스트.
 *
 * gap_to_leader / duration 은 숫자만 오지 않는다:
 *  - 퀄리 계열: [Q1, Q2, Q3] 배열
 *  - 랩다운   : "+1 LAP" 문자열
 *
 * 이걸 숫자로 단정했다가 /season/race/3/race 프리렌더가
 * "TypeError: c.toFixed is not a function" 으로 죽었다.
 * lib/format.ts 의 실제 구현을 검증한다.
 */


describe("toNumber — OpenF1 숫자 필드 정규화", () => {
  it("숫자는 그대로", () => expect(toNumber(1.234)).toBe(1.234));
  it("0 도 숫자로 (리더 판정에 필요)", () => expect(toNumber(0)).toBe(0));
  it("배열은 첫 세그먼트", () => expect(toNumber([91.2, 90.8, 90.1])).toBe(91.2));
  it("문자열은 숫자가 아님", () => expect(toNumber("+1 LAP")).toBeNull());
  it("null 은 null", () => expect(toNumber(null)).toBeNull());
  it("NaN 은 숫자로 치지 않는다", () => expect(toNumber(NaN)).toBeNull());
  it("빈 배열은 null", () => expect(toNumber([])).toBeNull());
});

describe("fmtGap — 갭 표시", () => {
  it("0 이면 리더", () => expect(fmtGap(0)).toBe("리더"));
  it("숫자는 +초 3자리", () => expect(fmtGap(2.974)).toBe("+2.974"));
  it("랩다운 문자열은 그대로 보여준다 (터지지 않는다)", () => {
    expect(() => fmtGap("+1 LAP")).not.toThrow();
    expect(fmtGap("+1 LAP")).toBe("+1 LAP");
  });
  it("배열은 첫 세그먼트 기준", () => expect(fmtGap([1.5])).toBe("+1.500"));
  it("null 은 대시", () => expect(fmtGap(null)).toBe("—"));
  it("빈 문자열은 대시", () => expect(fmtGap("  ")).toBe("—"));
});
