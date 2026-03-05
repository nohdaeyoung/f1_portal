/**
 * Cron Job — 매일 오전 7시 (KST) 개발 노트 갱신
 * vercel.json schedule: "0 22 * * *" (22:00 UTC = 07:00 KST)
 *
 * 전날 GitHub 커밋이 있을 경우 /devlog 페이지를 revalidate
 */

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { fetchRecentCommits } from "@/lib/api/github";

export const runtime = "nodejs";

export async function GET(request: Request) {
  // Vercel Cron 인증 확인
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 전날 (KST 기준) 커밋이 있는지 확인
    const commits = await fetchRecentCommits(2); // 최근 2일

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKST = yesterday.toLocaleDateString("sv-SE", {
      timeZone: "Asia/Seoul",
    });

    const hasYesterdayCommits = commits.some((c) => {
      const dateKST = new Date(c.commit.author.date).toLocaleDateString(
        "sv-SE",
        { timeZone: "Asia/Seoul" }
      );
      return dateKST === yesterdayKST;
    });

    if (hasYesterdayCommits) {
      revalidatePath("/devlog");
      return NextResponse.json({
        revalidated: true,
        date: yesterdayKST,
        commits: commits.length,
      });
    }

    return NextResponse.json({
      revalidated: false,
      message: "전날 커밋 없음 — 갱신 생략",
      date: yesterdayKST,
    });
  } catch (e) {
    console.error("[cron/devlog] error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
