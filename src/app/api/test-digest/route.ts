/**
 * 임시 테스트 엔드포인트 — Claude API 직접 호출 확인용
 * 배포 확인 후 삭제 예정
 */
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getDailyDigest } from "@/lib/api/news";

export const runtime = "nodejs";

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY 없음" }, { status: 500 });
  }

  // RSS 기사 수집
  let articleCount = 0;
  try {
    const digest = await getDailyDigest();
    articleCount = digest.recent.length;
  } catch (e) {
    return NextResponse.json({ error: "RSS 수집 실패", detail: String(e) }, { status: 500 });
  }

  // Claude API 간단 테스트
  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 50,
      messages: [{ role: "user", content: "F1 한 문장으로 설명해줘" }],
    });
    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    return NextResponse.json({ ok: true, articleCount, claudeTest: text.slice(0, 100) });
  } catch (e) {
    return NextResponse.json({ error: "Claude API 호출 실패", detail: String(e) }, { status: 500 });
  }
}
