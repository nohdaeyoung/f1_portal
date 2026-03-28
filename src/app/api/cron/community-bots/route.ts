import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { sampleBots, type BotPersona } from "@/lib/community/bots";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

async function generateBotPost(bot: BotPersona, raceContext: string): Promise<string> {
  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: `${bot.systemPrompt}

규칙:
- 200~350자 사이의 자연스러운 한국어 커뮤니티 글을 작성하세요
- 실제 레이스 결과를 반영하세요
- 팬 커뮤니티 말투를 사용하세요 (공식적이지 않게)
- 자신이 AI라는 것을 글에서 언급하지 마세요 (프로필에 표시됨)
- 글만 반환하고 따옴표나 설명을 추가하지 마세요`,
    messages: [{ role: "user", content: raceContext }],
  });
  return (response.content[0] as { text: string }).text.trim();
}

/**
 * Vercel Cron — 일요일 13:00 KST (04:00 UTC)
 * vercel.json: { "path": "/api/cron/community-bots", "schedule": "0 4 * * 0" }
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Firebase Admin 환경변수 미설정 시 스킵
  if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    return NextResponse.json({ skipped: true, reason: "Firebase Admin not configured" });
  }

  try {
    // 최신 레이스 결과 조회 (Jolpica)
    const scheduleRes = await fetch(
      "https://api.jolpi.ca/ergast/f1/current/last/results.json",
      { next: { revalidate: 3600 } }
    );
    const scheduleData = await scheduleRes.json();
    const race = scheduleData?.MRData?.RaceTable?.Races?.[0];

    if (!race) {
      return NextResponse.json({ skipped: true, reason: "No recent race found" });
    }

    const top5 = race.Results?.slice(0, 5)
      .map((r: { position: string; Driver: { familyName: string }; Constructor: { name: string } }) =>
        `${r.position}위 ${r.Driver.familyName} (${r.Constructor.name})`
      )
      .join(", ");

    const raceContext = `
레이스: ${race.raceName} (${race.season} 시즌, 라운드 ${race.round})
서킷: ${race.Circuit?.circuitName}
상위 5명: ${top5}

이 레이스에 대한 당신의 관점에서 짧은 커뮤니티 글을 작성하세요.
`;

    // 봇 4개 선택 후 글 생성
    const bots = sampleBots(4);
    const db = getAdminDb();
    const results: string[] = [];

    for (const bot of bots) {
      try {
        const body = await generateBotPost(bot, raceContext);
        await db.collection("posts").add({
          authorId: `bot_${bot.id}`,
          authorNickname: `${bot.avatar} ${bot.nickname}`,
          authorAvatarUrl: null,
          category: "레이스 토론",
          title: null,
          body,
          imageUrl: null,
          roundTag: Number(race.round),
          likes: 0,
          commentCount: 0,
          isBot: true,
          botPersonaId: bot.id,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: null,
        });
        results.push(`${bot.nickname} ✓`);
      } catch (e) {
        results.push(`${bot.nickname} ✗ ${e}`);
      }
    }

    return NextResponse.json({
      success: true,
      race: race.raceName,
      round: race.round,
      bots: results,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
