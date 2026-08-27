/**
 * F1 타이밍 값 표시 포맷.
 *
 * OpenF1 의 랩타임·갭 필드는 숫자만 오지 않는다:
 *  - 퀄리 계열 세션: 세그먼트별 배열 [Q1, Q2, Q3]
 *  - 랩다운 차량   : "+1 LAP" 같은 문자열
 *
 * 숫자로 단정했다가 /season/race/3/race 프리렌더가
 * "TypeError: toFixed is not a function" 으로 죽은 적이 있다.
 * 표시 함수는 전부 이 형태를 견뎌야 한다.
 */

export type TimingValue = number | number[] | string | null | undefined;

/** 배열이면 첫 세그먼트를, 유한한 숫자가 아니면 null 을 돌려준다. */
export function toNumber(v: TimingValue): number | null {
  const raw = Array.isArray(v) ? v[0] : v;
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

/** 랩타임을 m:ss.mmm 으로. 값이 없으면 대시. */
export function fmtLap(v: TimingValue): string {
  const sec = toNumber(v);
  if (sec == null || sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(3).padStart(6, "0");
  return `${m}:${s}`;
}

/** 선두와의 갭. 0 이면 리더, 숫자면 +초, "+1 LAP" 같은 문자열은 그대로. */
export function fmtGap(v: TimingValue): string {
  const n = toNumber(v);
  if (n === 0) return "리더";
  if (n != null) return `+${n.toFixed(3)}`;
  const raw = Array.isArray(v) ? v[0] : v;
  return typeof raw === "string" && raw.trim() ? raw : "—";
}
