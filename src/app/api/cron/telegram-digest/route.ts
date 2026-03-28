/**
 * Cron Job — 매일 오전 7시 (KST) F1 AI 다이제스트 텔레그램 배포
 * vercel.json schedule: "0 22 * * *" (22:00 UTC = 07:00 KST)
 *
 * 환경변수:
 *   TELEGRAM_BOT_TOKEN  — 텔레그램 봇 토큰
 *   TELEGRAM_CHANNEL_ID — 채널 ID (예: @f1324ing 또는 -100xxxxxxxxxx)
 */

import { NextResponse } from "next/server";
import { getAiDigest, type AiDigest } from "@/lib/api/ai-digest";

export const runtime = "nodejs";

// ─── HTML 이스케이프 ────────────────────────────────────────────

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ─── 메시지 포맷 ───────────────────────────────────────────────

function formatMessage(digest: AiDigest): string {
  const bullets = digest.bullets
    .map((b) => `${b.emoji} <b>${esc(b.title)}</b>\n${esc(b.text)}`)
    .join("\n\n");

  const watchPoints = digest.watchPoints
    .map((w) => `• ${esc(w)}`)
    .join("\n");

  const hotTopics = digest.hotTopics
    .map((t) => `#${esc(t.replace(/\s+/g, "_"))}`)
    .join(" ");

  return [
    `🏎️ <b>F1 Daily Digest</b> — ${esc(digest.dateLabel)}`,
    "",
    `<b>${esc(digest.headline)}</b>`,
    "",
    esc(digest.summary),
    "",
    "─────────────────────",
    "<b>📌 주요 토픽</b>",
    "",
    bullets,
    "",
    "─────────────────────",
    `<b>📝 편집장 노트</b>`,
    "",
    esc(digest.editorNote),
    "",
    "<b>👀 관전 포인트</b>",
    watchPoints,
    "",
    hotTopics,
    "",
    `🔗 <a href="https://f1.324.ing">f1.324.ing</a>에서 전체 브리핑 보기`,
  ].join("\n");
}

// ─── Route ─────────────────────────────────────────────────────

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID ?? "@f1324ing";

  if (!botToken) {
    console.error("[cron/telegram-digest] TELEGRAM_BOT_TOKEN 미설정");
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });
  }

  const digest = await getAiDigest();
  if (!digest) {
    console.log("[cron/telegram-digest] 다이제스트 없음 — 전송 생략");
    return NextResponse.json({ skipped: true, reason: "no digest" });
  }

  const text = formatMessage(digest);

  const res = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: channelId,
        text,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("[cron/telegram-digest] Telegram API 오류:", err);
    return NextResponse.json({ error: err }, { status: 500 });
  }

  console.log(`[cron/telegram-digest] 전송 완료 → ${channelId} (${digest.dateLabel})`);
  return NextResponse.json({ ok: true, dateLabel: digest.dateLabel, channelId });
}
