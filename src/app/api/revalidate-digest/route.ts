import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Vercel Cron Job — 매일 KST 오전 6시 (21:00 UTC) 자동 호출
 * vercel.json: { "path": "/api/revalidate-digest", "schedule": "0 21 * * *" }
 *
 * 1. AI 다이제스트 캐시 무효화
 * 2. warm-digest 호출로 즉시 생성
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";
  const utcHour = new Date().getUTCHours();

  // KST 6시 = UTC 21시. ?force=1 로 언제든 수동 실행 가능.
  if (!force && utcHour !== 21) {
    return NextResponse.json({ ok: true, skipped: true, reason: "21 UTC 외 건너뜀" });
  }

  revalidateTag("ai-digest", "max");
  revalidatePath("/news");
  revalidatePath("/");

  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://f1.324.ing";

  fetch(`${baseUrl}/api/warm-digest`, {
    headers: cronSecret ? { authorization: `Bearer ${cronSecret}` } : {},
  }).catch((e) =>
    console.error("[revalidate-digest] warm-digest 호출 실패:", e)
  );

  return NextResponse.json({
    revalidated: true,
    timestamp: new Date().toISOString(),
    message: "캐시 무효화 완료, warm-digest 프리워밍 시작",
  });
}
