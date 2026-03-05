import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Vercel Cron Job — 매일 오전 7시 KST (22:00 UTC) 자동 호출
 * vercel.json: { "path": "/api/revalidate-digest", "schedule": "0 22 * * *" }
 *
 * AI 다이제스트가 포함된 페이지를 강제 재생성한다.
 */
export async function GET(request: Request) {
  // Vercel cron 요청 또는 비밀 토큰으로만 허용
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidatePath("/news");
  revalidatePath("/");

  return NextResponse.json({
    revalidated: true,
    timestamp: new Date().toISOString(),
    message: "AI 다이제스트 페이지 재생성 완료",
  });
}
