/**
 * 캐시 프리워밍 엔드포인트
 * revalidate-digest 크론이 revalidateTag 후 이 엔드포인트를 HTTP 호출해
 * Claude API로 새 다이제스트를 생성하고 unstable_cache에 저장한다.
 *
 * Route Handler에서 revalidateTag는 다음 요청에서 적용되므로
 * 별도 요청으로 분리하는 것이 필수적이다.
 *
 * 다이제스트 생성 성공 시 텔레그램 채널(@f1324ing)로 자동 발송.
 */
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getAiDigest, type AiDigest } from "@/lib/api/ai-digest";
import { getF1News } from "@/lib/api/news";

export const runtime = "nodejs";
export const maxDuration = 120;

// ─── Telegram ─────────────────────────────────────────────────

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatTelegramMessage(digest: AiDigest): string {
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
    "<b>📝 편집장 노트</b>",
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

async function sendTelegram(digest: AiDigest): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID ?? "@f1324ing";
  if (!botToken) return;

  const res = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: channelId,
        text: formatTelegramMessage(digest),
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      }),
    }
  );

  if (!res.ok) {
    console.error("[warm-digest] Telegram 전송 실패:", await res.text());
  } else {
    console.log(`[warm-digest] Telegram 전송 완료 → ${channelId}`);
  }
}

// ─── Auth helper ───────────────────────────────────────────────

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const authHeader = (request as Request & { headers: Headers }).headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

// ─── Route ─────────────────────────────────────────────────────

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";
  const diag = url.searchParams.get("diag") === "1";

  // 진단 모드: 기사 수집 결과만 반환 (Claude 미호출)
  if (diag) {
    const articles = await getF1News(150);
    const now = new Date();
    const cutoff = now.getTime() - 23 * 3_600_000;
    const within23h = articles.filter(a => new Date(a.publishedAt).getTime() > cutoff);
    const kstHour = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" })).getHours();
    return NextResponse.json({
      total: articles.length,
      within23hCount: within23h.length,
      cutoffUtc: new Date(cutoff).toISOString(),
      kstHour,
      hasApiKey: !!process.env.ANTHROPIC_API_KEY,
      oldest: articles.at(-1)?.publishedAt,
      newest: articles[0]?.publishedAt,
      within23hTitles: within23h.slice(0, 5).map(a => ({ title: a.title, publishedAt: a.publishedAt })),
    });
  }

  try {
    // ?force=1: 캐시 무효화 후 별도 요청으로 warm-digest 재호출
    // (revalidateTag는 다음 요청에서 적용되므로 두 단계 분리 필수)
    if (force) {
      revalidateTag("ai-digest", "max");
      const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "https://f1.324.ing";
      const cronSecret = process.env.CRON_SECRET;
      fetch(`${baseUrl}/api/warm-digest`, {
        headers: cronSecret ? { authorization: `Bearer ${cronSecret}` } : {},
      }).catch((e) =>
        console.error("[warm-digest] 재호출 실패:", e)
      );
      return NextResponse.json({ ok: true, revalidated: true, warming: "scheduled" });
    }

    const digest = await getAiDigest();

    if (digest) {
      // fire-and-forget: 텔레그램 전송 실패해도 응답에 영향 없음
      sendTelegram(digest).catch((e) =>
        console.error("[warm-digest] Telegram 오류:", e)
      );
    }

    return NextResponse.json({
      ok: true,
      skipped: !digest,
      generatedAt: digest?.generatedAt,
      articleCount: digest?.articleCount,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
