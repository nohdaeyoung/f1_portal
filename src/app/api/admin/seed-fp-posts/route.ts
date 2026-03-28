import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { teams } from "@/data/f1-data";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const maxDuration = 300;

const DRIVER_KO: Record<string, string> = {
  verstappen: "베르스타펜", hadjar: "아드자르", norris: "노리스", piastri: "피아스트리",
  hamilton: "해밀턴", leclerc: "르클레르", russell: "러셀", antonelli: "안토넬리",
  alonso: "알론소", stroll: "스트롤", gasly: "가슬리", colapinto: "콜라핀토",
  sainz: "사인스", albon: "알본", lawson: "로손", lindblad: "린드블라드",
  ocon: "오콘", bearman: "베어만", hulkenberg: "휠켄베르그", bortoleto: "보르톨레토",
  bottas: "보타스", perez: "페레스",
};

async function fetchFpContext(): Promise<Record<string, string>> {
  try {
    const res = await fetch(
      "https://api.openf1.org/v1/sessions?year=2026&circuit_key=1",
      { next: { revalidate: 0 } }
    );
    if (!res.ok) throw new Error("OpenF1 unavailable");
    const sessions = await res.json() as Array<{ session_type: string; session_name: string; date_start: string }>;
    const fp = sessions.filter((s) => s.session_type === "Practice");
    if (fp.length >= 3) {
      return {
        FP1: `2026 호주 GP 프리 프랙티스 1 (앨버트 파크, 멜버른). 시즌 첫 공식 주행. 시작 시각: ${fp[0].date_start}`,
        FP2: `2026 호주 GP 프리 프랙티스 2 (앨버트 파크, 멜버른). 롱런 및 타이어 전략 데이터 수집 세션. 시작 시각: ${fp[1].date_start}`,
        FP3: `2026 호주 GP 프리 프랙티스 3 (앨버트 파크, 멜버른). 예선 시뮬레이션 집중. 시작 시각: ${fp[2].date_start}`,
      };
    }
  } catch {
    // fall through to mock
  }
  return {
    FP1: "2026 호주 GP 프리 프랙티스 1 — 앨버트 파크, 멜버른. 2026 시즌 새 레귤레이션 첫 공식 주행. 팀들이 셋업 베이스라인을 잡는 세션.",
    FP2: "2026 호주 GP 프리 프랙티스 2 — 앨버트 파크, 멜버른. 롱런 페이스 및 타이어 디그레이데이션 데이터 수집. 레이스 전략 힌트가 드러나는 세션.",
    FP3: "2026 호주 GP 프리 프랙티스 3 — 앨버트 파크, 멜버른. 예선 준비 최종 세션. 소프트 타이어 싱글 랩 어택으로 예선 순위를 가늠하는 중요 세션.",
  };
}

async function generatePost(
  client: Anthropic,
  teamKo: string,
  personaName: string,
  personaStyle: string,
  fpContext: string
): Promise<string> {
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: `${personaStyle}

규칙:
- 150~280자 자연스러운 한국어 커뮤니티 글 작성
- 프리 프랙티스 세션 내용을 반영해서 팬 관점에서 의견 서술
- 팬 커뮤니티 말투 사용 (공식적이지 않게)
- 자신이 AI라는 언급 금지
- 글만 반환, 따옴표나 부연 설명 없이`,
    messages: [{ role: "user", content: fpContext }],
  });
  return (res.content[0] as { text: string }).text.trim();
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    return NextResponse.json({ skipped: true, reason: "Firebase Admin not configured" });
  }

  const db = getAdminDb();
  const client = new Anthropic();
  const fpContext = await fetchFpContext();

  const FP_SESSIONS = [
    { key: "FP1", label: "FP1", context: fpContext.FP1 },
    { key: "FP2", label: "FP2", context: fpContext.FP2 },
    { key: "FP3", label: "FP3", context: fpContext.FP3 },
  ];

  const results: string[] = [];

  for (const team of teams) {
    const d1 = DRIVER_KO[team.driverIds[0]] ?? team.driverIds[0];
    const d2 = DRIVER_KO[team.driverIds[1]] ?? team.driverIds[1];

    const personas = [
      {
        fp: FP_SESSIONS[0],
        nickname: `${team.koreanName} 팬`,
        avatar: "🏎️",
        style: `당신은 ${team.koreanName}의 열성 팬입니다. 팀 전체 퍼포먼스에 관심이 많습니다.`,
      },
      {
        fp: FP_SESSIONS[1],
        nickname: `${d1} 팬클럽`,
        avatar: "⭐",
        style: `당신은 ${team.koreanName}의 ${d1} 선수의 열성 팬입니다. ${d1}의 드라이빙과 랩타임에 집중합니다.`,
      },
      {
        fp: FP_SESSIONS[2],
        nickname: `${d2} 응원단`,
        avatar: "🔥",
        style: `당신은 ${team.koreanName}의 ${d2} 선수 팬입니다. ${d2}의 경쟁력과 가능성을 긍정적으로 봅니다.`,
      },
    ];

    for (const p of personas) {
      try {
        const body = await generatePost(client, team.koreanName, p.nickname, p.style, p.fp.context);
        const payload = {
          authorId: `bot_fp_${team.id}_${p.fp.key}`,
          authorNickname: `${p.avatar} ${p.nickname}`,
          authorAvatarUrl: null,
          category: "레이스 토론" as const,
          title: `[${p.fp.label}] ${team.koreanName} 분석`,
          body,
          imageUrl: null,
          roundTag: 1,
          teamTag: team.id,
          likes: 0,
          commentCount: 0,
          isBot: true,
          botPersonaId: `fp_${team.id}_${p.fp.key}`,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: null,
        };
        const counterRef = db.collection("meta").doc("postCounter");
        await db.runTransaction(async (tx) => {
          const snap = await tx.get(counterRef);
          const count = (snap.data()?.count ?? 0) + 1;
          tx.set(counterRef, { count });
          tx.set(db.collection("posts").doc(String(count)), payload);
        });
        results.push(`${team.koreanName} ${p.fp.label} ✓`);
      } catch (e) {
        results.push(`${team.koreanName} ${p.fp.label} ✗ ${e}`);
      }
    }
  }

  return NextResponse.json({
    success: true,
    total: results.length,
    results,
    timestamp: new Date().toISOString(),
  });
}
