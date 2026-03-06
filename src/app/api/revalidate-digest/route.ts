import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Vercel Cron Job — 매일 오전 7시 KST (22:00 UTC) 자동 호출
 * vercel.json: { "path": "/api/revalidate-digest", "schedule": "0 22 * * *" }
 *
 * 1. 기존 AI 다이제스트 캐시 무효화 (revalidateTag)
 * 2. 별도 warm-digest 엔드포인트를 호출해 Claude API 프리워밍
 *    (Route Handler에서 revalidateTag는 다음 요청에서 적용되므로 분리 필요)
 * 3. 페이지 ISR 캐시 무효화
 */
export async function GET(request: Request) {
  // Vercel cron 요청 또는 비밀 토큰으로만 허용
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. 캐시 무효화 (다음 요청부터 적용)
  revalidateTag("ai-digest", "max");

  // 2. 페이지 ISR 갱신
  revalidatePath("/news");
  revalidatePath("/");

  // 3. 별도 요청으로 캐시 프리워밍 (fire-and-forget)
  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://f1.324.ing";

  fetch(`${baseUrl}/api/warm-digest`).catch((e) =>
    console.error("[revalidate-digest] warm-digest 호출 실패:", e)
  );

  return NextResponse.json({
    revalidated: true,
    timestamp: new Date().toISOString(),
    message: "캐시 무효화 완료, warm-digest 프리워밍 시작",
    warmUrl: `${baseUrl}/api/warm-digest`,
  });
}
