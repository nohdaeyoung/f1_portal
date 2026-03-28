import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

interface JolpicaResult {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: {
    driverId: string;
    givenName: string;
    familyName: string;
    nationality: string;
  };
  Constructor: {
    constructorId: string;
    name: string;
  };
  grid: string;
  laps: string;
  status: string;
  Time?: { time: string };
  FastestLap?: {
    rank: string;
    lap: string;
    Time: { time: string };
  };
}

interface JolpicaRace {
  season: string;
  round: string;
  raceName: string;
  Circuit: { circuitId: string; circuitName: string };
  date: string;
  Results: JolpicaResult[];
}

function buildRaceContext(race: JolpicaRace): string {
  const fastestLapDriver = race.Results.find(
    (r) => r.FastestLap?.rank === "1"
  );

  const rows = race.Results.map((r) => {
    const fl = r.FastestLap?.rank === "1" ? " ⚡FL" : "";
    const isFinished = r.status === "Finished";
    const statusStr = isFinished ? "Finished" : `DNF (${r.status})`;
    return `${r.position}위 ${r.Driver.givenName} ${r.Driver.familyName} (${r.Constructor.name}) - ${r.points}pts - ${statusStr}${fl}`;
  }).join("\n");

  const flLine = fastestLapDriver
    ? `패스티스트 랩: ${fastestLapDriver.Driver.givenName} ${fastestLapDriver.Driver.familyName} (${fastestLapDriver.FastestLap!.Time.time})`
    : "";

  return `레이스: ${race.raceName} (${race.season} 시즌, 라운드 ${race.round})
서킷: ${race.Circuit.circuitName}
날짜: ${race.date}

전체 결과:
${rows}

${flLine}

위 데이터를 바탕으로 F1 커뮤니티용 레이스 결과 요약 게시글을 마크다운 형식으로 작성하세요.

작성 규칙:
- 800~1200자 분량
- 제목 없이 본문부터 시작 (## H2 섹션은 사용 가능)
- 상위 10위까지 결과를 마크다운 테이블로 작성 (순위, 드라이버, 팀, 포인트)
- DNF 드라이버가 있으면 별도 언급
- 패스티스트 랩 드라이버 강조
- 레이스 하이라이트 및 주요 관전 포인트 코멘트
- 팬 커뮤니티 말투 (공식적이지 않게, 친근하게)
- 자신이 AI라고 언급하지 마세요`;
}

/**
 * Vercel Cron — 일요일 15:00 KST (06:00 UTC)
 * vercel.json: { "path": "/api/cron/race-result", "schedule": "0 6 * * 0" }
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    return NextResponse.json({ skipped: true, reason: "Firebase Admin not configured" });
  }

  try {
    // 최신 레이스 결과 조회
    const res = await fetch(
      "https://api.jolpi.ca/ergast/f1/current/last/results.json",
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    const race: JolpicaRace | undefined = data?.MRData?.RaceTable?.Races?.[0];

    if (!race) {
      return NextResponse.json({ skipped: true, reason: "No recent race found" });
    }

    const roundNumber = Number(race.round);
    const db = getAdminDb();

    // 중복 체크: 같은 라운드에 race_result 게시글이 이미 있으면 스킵
    const existing = await db
      .collection("posts")
      .where("botPersonaId", "==", "race_result")
      .where("roundTag", "==", roundNumber)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json({
        skipped: true,
        reason: `Already posted for round ${roundNumber}`,
        round: roundNumber,
      });
    }

    // Claude로 게시글 생성
    const client = new Anthropic();
    const raceContext = buildRaceContext(race);

    const aiResponse = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: "당신은 F1 커뮤니티의 공식 레이스 결과 정리 봇입니다. 레이스 데이터를 바탕으로 팬들이 읽기 좋은 마크다운 형식의 결과 요약 게시글을 작성하세요.",
      messages: [{ role: "user", content: raceContext }],
    });

    const body = (aiResponse.content[0] as { text: string }).text.trim();

    // 우승자 이름 (SEO용)
    const winner = race.Results[0];
    const winnerName = `${winner.Driver.givenName} ${winner.Driver.familyName}`;

    // Firestore에 저장
    const docRef = await db.collection("posts").add({
      authorId: "seo_machine",
      authorNickname: "📊 SEO Machine",
      authorAvatarUrl: null,
      category: "레이스 토론",
      title: `${race.season} ${race.raceName} — 공식 레이스 결과`,
      body,
      imageUrl: null,
      roundTag: roundNumber,
      teamTag: null,
      likes: 0,
      commentCount: 0,
      isBot: true,
      botPersonaId: "race_result",
      seo: {
        metaTitle: `${race.season} F1 ${race.raceName} 레이스 결과 | F1 by 324.ing`,
        metaDescription: `${winnerName} 우승 — ${race.raceName} 공식 레이스 결과와 드라이버 순위`,
        primaryKeyword: `${race.season} F1 ${race.raceName}`,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: null,
    });

    return NextResponse.json({
      success: true,
      postId: docRef.id,
      postUrl: `https://f1.324.ing/community/${docRef.id}`,
      race: race.raceName,
      round: race.round,
      winner: winnerName,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[api/cron/race-result]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
