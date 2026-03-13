/**
 * 일일 보안 + QA 모니터링 크론
 * vercel.json schedule: "0 0 * * *" (00:00 UTC = 09:00 KST)
 *
 * 점검 항목:
 *  [보안] 쿠키 위조 차단, warm-digest 인증, 관리자 로그인 거부, 리다이렉트
 *  [QA]   주요 페이지 가용성, Railway 헬스, R2 캐시 히트
 *
 * 결과를 Telegram으로 발송
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SITE = "https://f1.324.ing";
const RAILWAY = "https://f1-production-f075.up.railway.app";

// ─── Telegram ─────────────────────────────────────────────────────────────────

async function sendTelegram(text: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID ?? "@f1324ing";
  if (!botToken) return;

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: channelId,
      text,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    }),
  });
}

// ─── 점검 헬퍼 ────────────────────────────────────────────────────────────────

async function checkStatus(url: string, options?: RequestInit): Promise<number> {
  try {
    const res = await fetch(url, { redirect: "manual", cache: "no-store", ...options });
    return res.status;
  } catch {
    return 0;
  }
}

async function checkJson(url: string, options?: RequestInit): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(url, { cache: "no-store", ...options });
    if (!res.ok) return { _status: res.status };
    return await res.json();
  } catch {
    return { _error: true };
  }
}

function icon(pass: boolean) {
  return pass ? "✅" : "❌";
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  // Vercel Cron 인증
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const kstDate = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).format(now);

  // ── 보안 점검 ──────────────────────────────────────────────────────────────

  // S1: 위조 쿠키로 관리자 API 접근 → 401이어야 함
  const s1 = await checkStatus(`${SITE}/api/admin/config`, {
    headers: { Cookie: "pitlane_admin=authenticated" },
  });
  const s1Pass = s1 === 401;

  // S2: 인증 없이 warm-digest 접근 → 401이어야 함
  const s2 = await checkStatus(`${SITE}/api/warm-digest`);
  const s2Pass = s2 === 401;

  // S3: 잘못된 관리자 비밀번호 → 401 반환이어야 함
  const s3Status = await checkStatus(`${SITE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: "probe", pw: "probe" }),
  });
  const s3Pass = s3Status === 401;

  // S4: 관리자 페이지 직접 접근 → 리다이렉트 (302/307)
  const s4 = await checkStatus(`${SITE}/admin/posts`);
  const s4Pass = s4 === 307 || s4 === 302 || s4 === 308;

  // ── QA 점검 ───────────────────────────────────────────────────────────────

  const [q1, q2, q3, q4] = await Promise.all([
    checkStatus(`${SITE}/`),
    checkStatus(`${SITE}/season`),
    checkStatus(`${SITE}/news`),
    checkStatus(`${SITE}/community`),
  ]);

  // Q5: Railway 헬스
  const railwayData = await checkJson(`${RAILWAY}/health`);
  const q5Pass = railwayData.status === "ok";

  // Q6: R2 캐시 (2026 호주 GP — prewarm 완료된 데이터)
  let q6Hit = false;
  try {
    const r2res = await fetch(
      `${SITE}/api/fastf1/replay-frames?year=2026&gp=Australian+Grand+Prix&session=R&fps=5`,
      { cache: "no-store" }
    );
    q6Hit = r2res.headers.get("x-cache") === "R2-HIT";
  } catch { /* 무시 */ }

  // ── 결과 집계 ──────────────────────────────────────────────────────────────

  const securityFails = [!s1Pass, !s2Pass, !s3Pass, !s4Pass].filter(Boolean).length;
  const qaFails = [q1, q2, q3, q4].filter(c => c !== 200).length + (!q5Pass ? 1 : 0);
  const totalFails = securityFails + qaFails;

  const statusLine = totalFails === 0
    ? "✅ 전체 이상 없음"
    : `🚨 이상 ${totalFails}건 감지`;

  const message = [
    `${totalFails > 0 ? "🚨" : "🔒"} <b>F1 사이트 일일 보안·QA 리포트</b>`,
    `📅 ${kstDate} KST`,
    "",
    "🛡️ <b>보안 점검</b>",
    `• [S1] 쿠키 위조 차단: ${icon(s1Pass)} ${s1Pass ? "PASS" : `FAIL (${s1})`}`,
    `• [S2] warm-digest 인증: ${icon(s2Pass)} ${s2Pass ? "PASS" : `FAIL (${s2})`}`,
    `• [S3] 잘못된 비밀번호 거부: ${icon(s3Pass)} ${s3Pass ? "PASS" : `FAIL (${s3Status})`}`,
    `• [S4] 관리자 리다이렉트: ${icon(s4Pass)} ${s4Pass ? "PASS" : `FAIL (${s4})`}`,
    "",
    "🌐 <b>사이트 가용성</b>",
    `• 메인(/): ${icon(q1 === 200)} ${q1}`,
    `• 시즌(/season): ${icon(q2 === 200)} ${q2}`,
    `• 뉴스(/news): ${icon(q3 === 200)} ${q3}`,
    `• 커뮤니티(/community): ${icon(q4 === 200)} ${q4}`,
    `• Railway API: ${icon(q5Pass)} ${q5Pass ? "정상" : "DOWN"}`,
    `• R2 캐시: ${q6Hit ? "✅ HIT" : "⚠️ MISS"}`,
    "",
    statusLine,
    `🔗 <a href="${SITE}">${SITE.replace("https://", "")}</a>`,
  ].join("\n");

  await sendTelegram(message);

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    totalFails,
    security: { s1Pass, s2Pass, s3Pass, s4Pass },
    qa: { q1, q2, q3, q4, railwayOk: q5Pass, r2Hit: q6Hit },
  });
}
