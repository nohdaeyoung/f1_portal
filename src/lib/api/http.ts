/**
 * 외부 F1 API 공용 fetch 계층.
 *
 * 세 upstream 의 실패 방식이 서로 다르므로 재시도 정책을 하나로 뭉뚱그리지 않는다.
 *
 *   Jolpica  429 → 잠시 뒤 재시도하면 대개 성공. 재시도 가치 있음.
 *   OpenF1   403 → 라이브 세션 페이월. 재시도해도 계속 403. 즉시 포기해야 함.
 *   FastF1   202 → 계산 중이라는 뜻. 재시도가 아니라 폴링 대상이고 호출부가 처리.
 *
 * 그래서 "무엇을 재시도할지"를 호출부가 retryOn 으로 정한다.
 */

export interface RetryOptions {
  /** 재시도할 HTTP 상태 코드. 비우면 재시도하지 않는다. */
  retryOn?: number[];
  /** 최대 재시도 횟수 (최초 시도는 제외). */
  maxRetries?: number;
  /** Next.js ISR 캐시 수명(초). */
  revalidate?: number;
  /** 오류 메시지 앞에 붙일 이름. */
  label?: string;
}

/** 지수 백오프 + 지터. 병렬 워커가 같은 순간에 몰려 재시도하는 것을 막는다. */
function backoffMs(attempt: number, retryAfterHeader: string | null): number {
  const retryAfter = Number(retryAfterHeader);
  if (Number.isFinite(retryAfter) && retryAfter > 0) return retryAfter * 1000;
  return 500 * 2 ** attempt + Math.random() * 400;
}

/**
 * 재시도 정책을 적용한 fetch. 응답 본문 파싱은 호출부 몫이다.
 * 재시도 대상이 아닌 상태 코드는 즉시 던진다.
 */
export async function fetchWithRetry(
  url: string,
  { retryOn = [], maxRetries = 4, revalidate, label = "API" }: RetryOptions = {}
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, revalidate == null ? undefined : { next: { revalidate } });
    if (res.ok) return res;

    const retryable = retryOn.includes(res.status) && attempt < maxRetries;
    if (!retryable) {
      throw new Error(`${label} error: ${res.status} ${url}`);
    }
    await new Promise((r) => setTimeout(r, backoffMs(attempt, res.headers.get("retry-after"))));
  }
}

/**
 * 제한된 동시성으로 실행한다. 전량 동시 발사는 공개 API 에서 429 를 부른다.
 * fetchChampionshipProgress 가 라운드 수만큼(시즌 말 23개) 한꺼번에 쏘던 자리.
 */
export async function batchedParallel<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency = 3
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    results.push(...(await Promise.all(items.slice(i, i + concurrency).map(fn))));
  }
  return results;
}
