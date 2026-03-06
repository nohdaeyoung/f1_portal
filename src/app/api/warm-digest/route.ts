/**
 * 캐시 프리워밍 + 디버그 엔드포인트
 */
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getDailyDigest } from "@/lib/api/news";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const start = Date.now();
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY 없음" });
  }

  // RSS 수집
  let articleCount = 0;
  let articleSample = "";
  try {
    const digest = await getDailyDigest();
    articleCount = digest.recent.length;
    articleSample = digest.recent.slice(0, 3).map(a => `${a.sourceName}: ${a.title}`).join(" | ");
  } catch (e) {
    return NextResponse.json({ error: "RSS 실패", detail: String(e) });
  }

  const rssMs = Date.now() - start;

  // Claude 호출 (전체 프롬프트 테스트)
  let claudeRaw = "";
  let claudeError = "";
  let parseOk = false;
  let parsed: unknown = null;

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: `다음 F1 기사 ${articleCount}건을 분석해 JSON 브리핑을 작성하세요:\n${articleSample}\n\n응답은 반드시 {"headline":"...","summary":"...","bullets":[],"editorNote":"...","watchPoints":[],"hotTopics":[]} 형식의 순수 JSON으로.`,
      }],
    });
    claudeRaw = msg.content[0].type === "text" ? msg.content[0].text.slice(0, 300) : "(no text)";
    const jsonMatch = claudeRaw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
      parseOk = true;
    }
  } catch (e) {
    claudeError = String(e);
  }

  return NextResponse.json({
    ok: parseOk,
    articleCount,
    rssMs,
    totalMs: Date.now() - start,
    claudeRaw: claudeRaw.slice(0, 200),
    claudeError: claudeError || undefined,
    parseOk,
    headline: parseOk && parsed && typeof parsed === "object" && "headline" in parsed
      ? (parsed as Record<string, unknown>).headline
      : undefined,
  });
}
