/**
 * 캐시 프리워밍 엔드포인트 (getAiDigest 직접 호출)
 */
import { NextResponse } from "next/server";
import { getAiDigest } from "@/lib/api/ai-digest";

export const runtime = "nodejs";
export const maxDuration = 60;

const DEMO_GENERATED_AT = new Date("2026-03-05T07:00:00+09:00").toISOString();

export async function GET() {
  const start = Date.now();
  try {
    const digest = await getAiDigest();
    const isDemo = digest?.generatedAt === DEMO_GENERATED_AT;
    return NextResponse.json({
      ok: !isDemo,
      isDemo,
      headline: digest?.headline?.slice(0, 80),
      articleCount: digest?.articleCount,
      generatedAt: digest?.generatedAt,
      elapsed: `${Date.now() - start}ms`,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), elapsed: `${Date.now() - start}ms` }, { status: 500 });
  }
}
