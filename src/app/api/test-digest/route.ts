/**
 * 임시 테스트 엔드포인트 — 캐시 없이 AI 다이제스트 전체 생성 확인용
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

  try {
    const digest = await getDailyDigest();
    const articles = digest.recent.slice(0, 10);
    const articleList = articles
      .map((a, i) => `[${i + 1}] ${a.sourceName}: ${a.title}`)
      .join("\n");

    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `다음 F1 기사 목록을 보고 오늘의 핵심 헤드라인을 한국어로 한 문장만 작성해줘:\n\n${articleList}`,
      }],
    });

    const headline = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
    return NextResponse.json({
      ok: true,
      articleCount: digest.recent.length,
      headline,
      apiKeyLength: apiKey.length,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
