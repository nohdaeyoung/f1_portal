/**
 * 캐시 프리워밍 엔드포인트
 * revalidate-digest 크론이 revalidateTag 후 이 엔드포인트를 HTTP 호출해
 * Claude API로 새 다이제스트를 생성하고 unstable_cache에 저장한다.
 *
 * Route Handler에서 revalidateTag는 다음 요청에서 적용되므로
 * 별도 요청으로 분리하는 것이 필수적이다.
 */
import { NextResponse } from "next/server";
import { getAiDigest } from "@/lib/api/ai-digest";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  try {
    const digest = await getAiDigest();
    return NextResponse.json({
      ok: true,
      generatedAt: digest?.generatedAt,
      articleCount: digest?.articleCount,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
