/**
 * Vercel Cron Job — 매일 오후 12시 KST (03:00 UTC) 자동 호출
 * vercel.json schedule: "0 3 * * *"
 *
 * /api/revalidate-digest와 동일한 로직 — Vercel은 동일 path 중복 불가로 별도 분리
 */
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag("ai-digest", "max");
  revalidatePath("/news");
  revalidatePath("/");

  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://f1.324.ing";

  fetch(`${baseUrl}/api/warm-digest`).catch((e) =>
    console.error("[revalidate-digest-noon] warm-digest 호출 실패:", e)
  );

  return NextResponse.json({
    revalidated: true,
    timestamp: new Date().toISOString(),
    message: "12시 KST 갱신 — 캐시 무효화 완료, warm-digest 프리워밍 시작",
  });
}
