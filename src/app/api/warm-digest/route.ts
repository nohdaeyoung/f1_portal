/**
 * 캐시 프리워밍 엔드포인트
 * revalidate-digest 크론이 revalidateTag 후 이 엔드포인트를 호출해
 * Claude API로 새 다이제스트를 생성하고 unstable_cache에 캐싱한다.
 */
import { NextResponse } from "next/server";
import { getAiDigest } from "@/lib/api/ai-digest";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const start = Date.now();
  try {
    const digest = await getAiDigest();
    const isDemo = digest?.generatedAt === new Date("2026-03-05T07:00:00+09:00").toISOString();
    return NextResponse.json({
      ok: true,
      isDemo,
      headline: digest?.headline?.slice(0, 60),
      articleCount: digest?.articleCount,
      generatedAt: digest?.generatedAt,
      elapsed: `${Date.now() - start}ms`,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), elapsed: `${Date.now() - start}ms` }, { status: 500 });
  }
}
