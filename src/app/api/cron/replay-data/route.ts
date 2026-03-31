/**
 * Cron Job — 매일 09:00 KST (00:00 UTC)
 * vercel.json: { "path": "/api/cron/replay-data", "schedule": "0 0 * * *" }
 *
 * Railway FastF1 API의 /cron/generate-replay 엔드포인트를 호출하여
 * 최신 레이스의 리플레이 데이터를 자동 생성 + R2 업로드합니다.
 * R2에 이미 캐시되어 있으면 스킵 (중복 계산 방지).
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300; // FastF1 계산에 최대 5분 소요

const FF1_BASE = process.env.FASTF1_API_URL ?? "http://localhost:8000";

export async function GET(request: Request) {
  // Vercel Cron 인증
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Railway FastF1 API에 리플레이 생성 요청 (최신 레이스 자동 감지)
    const res = await fetch(`${FF1_BASE}/cron/generate-replay`, {
      method: "POST",
      headers: { authorization: `Bearer ${cronSecret}` },
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[cron/replay-data] FastF1 API error:", data);
      return NextResponse.json(
        { ok: false, error: data.detail ?? "FastF1 API error" },
        { status: res.status },
      );
    }

    console.log("[cron/replay-data] Result:", data);
    return NextResponse.json({ ok: true, ...data });
  } catch (e) {
    console.error("[cron/replay-data] Error:", e);
    return NextResponse.json(
      { ok: false, error: "FastF1 API 연결 실패" },
      { status: 502 },
    );
  }
}
