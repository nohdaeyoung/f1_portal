import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getAiDigest } from "@/lib/api/ai-digest";

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel Pro: 최대 60초

/**
 * Vercel Cron Job — 매일 오전 7시 KST (22:00 UTC) 자동 호출
 * vercel.json: { "path": "/api/revalidate-digest", "schedule": "0 22 * * *" }
 *
 * 1. 기존 AI 다이제스트 캐시 무효화
 * 2. Claude API로 새 다이제스트 생성 (캐시 프리워밍)
 * 3. 페이지 ISR 캐시 무효화
 */
export async function GET(request: Request) {
  // Vercel cron 요청 또는 비밀 토큰으로만 허용
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. 캐시 무효화
  revalidateTag("ai-digest", "max");

  // 2. 새 다이제스트 생성 (캐시 프리워밍 — 사용자가 느린 첫 로딩을 겪지 않도록)
  let digestGenerated = false;
  try {
    const digest = await getAiDigest();
    digestGenerated = !!(digest && digest.headline !== "새 레귤레이션의 판도라 상자 열렸다 — 맥라렌·레드불·페라리 3파전 윤곽");
  } catch (e) {
    console.error("[revalidate-digest] 다이제스트 생성 실패:", e);
  }

  // 3. 페이지 ISR 갱신
  revalidatePath("/news");
  revalidatePath("/");

  return NextResponse.json({
    revalidated: true,
    digestGenerated,
    timestamp: new Date().toISOString(),
    message: digestGenerated ? "AI 다이제스트 갱신 완료" : "다이제스트 생성 실패 (데모 사용)",
  });
}
