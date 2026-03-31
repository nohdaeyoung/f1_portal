/**
 * AI News Digest Generator
 *
 * 매일 KST 오전 6시 갱신. 소스 기사는 갱신 기준 23시간 이내.
 * Claude Haiku 4.5 사용.
 */

import Anthropic from "@anthropic-ai/sdk";
import { unstable_cache } from "next/cache";
import { getF1News, type NewsArticle } from "./news";

// ─── KST helpers ──────────────────────────────────────────────

function kstDateStr(d: Date): string {
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

function kstHour(): number {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })).getHours();
}

/**
 * 캐시 키: KST 6시 이전이면 어제 날짜, 6시 이후면 오늘 날짜.
 * → 하루 1회 생성(6시 이후 첫 요청), 다음날 6시까지 동일 캐시 제공.
 */
function cacheKey(): string {
  const now = new Date();
  if (kstHour() < 6) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return kstDateStr(yesterday);
  }
  return kstDateStr(now);
}

function dateLabel(): string {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// ─── Types ────────────────────────────────────────────────────

export interface AiDigestBullet {
  emoji: string;
  title: string;
  text: string;
  context?: string;
  sourceName?: string;
  sourceUrl?: string;
}

export interface AiDigest {
  generatedAt: string;
  dateLabel: string;
  headline: string;
  summary: string;
  bullets: AiDigestBullet[];
  editorNote: string;
  watchPoints: string[];
  hotTopics: string[];
  articleCount: number;
}

// ─── Article helpers ──────────────────────────────────────────

function isWithin23h(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < 23 * 3_600_000;
}

function buildArticleList(articles: NewsArticle[]): string {
  return articles
    .slice(0, 35)
    .map(
      (a, i) =>
        `[${i + 1}] ${a.sourceName}: ${a.title}` +
        `\n    URL: ${a.link}` +
        (a.description ? `\n    → ${a.description.slice(0, 160)}` : "")
    )
    .join("\n\n");
}

// ─── Claude API ───────────────────────────────────────────────

const SYSTEM_PROMPT = `당신은 F1 전문 한국어 저널리스트이자 수석 편집장입니다.
영문 F1 기사들을 심층 분석해 한국 F1 팬을 위한 고품질 일일 브리핑을 작성하세요.
단순 요약이 아니라, F1 배경 지식을 바탕으로 맥락·의미·전망까지 담아야 합니다.

반드시 아래 JSON 형식으로만 응답하세요 (순수 JSON, 코드 블록 없이):
{
  "headline": "하루의 핵심을 압축한 임팩트 있는 한 문장 (40~50자)",
  "summary": "3~5문장 심층 요약. 단순 나열이 아니라 흐름·인과관계·챔피언십 영향까지 담을 것. 팬이 읽고 '오늘 F1에 무슨 일이 있었구나'를 완전히 파악할 수 있어야 함.",
  "bullets": [
    {
      "emoji": "이모지",
      "title": "토픽 제목 (15자 이내)",
      "text": "핵심 내용 요약 (최대 80자, 팩트+의미 포함)",
      "context": "배경 맥락이나 이유 한 줄 (선택, 최대 60자)",
      "sourceName": "출처 매체명 (원문 영어 그대로)",
      "sourceUrl": "반드시 입력 목록의 URL 필드에서 그대로 복사할 것 — 생략 불가"
    }
  ],
  "editorNote": "편집장 시각의 분석·의견·전망 2~3문장. '이번 소식이 시즌 전체에 어떤 의미인가', '팬이 주목해야 할 이유'를 담을 것. 객관적 팩트를 넘어 인사이트를 제공.",
  "watchPoints": [
    "이번 주 또는 다음 레이스에서 주목해야 할 관전 포인트 (각 40자 이내, 2~3개)"
  ],
  "hotTopics": ["키워드1", "키워드2", "키워드3", "키워드4"]
}

작성 규칙:
- 드라이버/팀 공식 한국어 표기: 베르스타펜·노리스·해밀턴·레클레르·러셀·알론소·사인스·피아스트리·가슬리·콜라핀토·알본·로손·린드블라드·오콩·베어만·휠켄베르그·보르톨레토·보타스·페레스·하자르·안토넬리·스트롤
- 팀명: 레드불·맥라렌·페라리·메르세데스·애스턴 마틴·알핀·윌리엄스·레이싱 불스·하스·자우버(아우디)·캐딜락
- bullets는 4~6개, 중요도 순으로 배치
- hotTopics는 4~6개 단어/짧은 구절
- editorNote는 팬의 감정·드라마·역사적 맥락을 살린 생동감 있는 문체로
- 출처 이름은 원문 영어 그대로 유지
- sourceUrl은 각 bullet마다 반드시 포함 (입력 목록 URL을 그대로 복사, URL을 변경하거나 생략하지 말 것)`;

async function callClaude(
  articleList: string
): Promise<Omit<AiDigest, "generatedAt" | "dateLabel" | "articleCount"> | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[ai-digest] ANTHROPIC_API_KEY 미설정");
    return null;
  }

  const client = new Anthropic({ apiKey });
  try {
    const message = await Promise.race([
      client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [{ role: "user", content: `다음은 최근 23시간 F1 영문 기사 목록입니다. 심층 분석 후 한국어 브리핑 JSON을 작성하세요.\n\n${articleList}` }],
        system: SYSTEM_PROMPT,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Claude API timeout 60s")), 60_000)
      ),
    ]);

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const stripped = raw.replace(/^```json\s*/im, "").replace(/\s*```\s*$/m, "").trim();
    const match = stripped.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error("[ai-digest] JSON 추출 실패. raw:", raw.slice(0, 200));
      return null;
    }
    return JSON.parse(match[0]);
  } catch (e) {
    console.error("[ai-digest] Claude API 오류:", e);
    return null;
  }
}

// ─── Cache ────────────────────────────────────────────────────

const _getCachedDigest = unstable_cache(
  async (_key: string): Promise<AiDigest | null> => {
    // 최근 23시간 기사 수집
    const all = await getF1News(150);
    const articles = all.filter((a) => isWithin23h(a.publishedAt));

    if (articles.length < 3) {
      console.log(`[ai-digest] 최근 23h 기사 ${articles.length}개 — 3개 미만 건너뜀`);
      return null;
    }

    console.log(`[ai-digest] ${articles.length}개 기사로 브리핑 생성 (key: ${_key})`);
    const articleList = buildArticleList(articles);
    const result = await callClaude(articleList);
    if (!result) return null;

    return {
      generatedAt: new Date().toISOString(),
      dateLabel: dateLabel(),
      headline: result.headline,
      summary: result.summary,
      bullets: result.bullets,
      editorNote: result.editorNote,
      watchPoints: result.watchPoints,
      hotTopics: result.hotTopics,
      articleCount: articles.length,
    };
  },
  ["ai-digest"],
  { revalidate: 3600, tags: ["ai-digest"] }
);

export async function getAiDigest(): Promise<AiDigest | null> {
  return _getCachedDigest(cacheKey());
}
