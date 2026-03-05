/**
 * AI News Digest Generator
 *
 * RSS 피드에서 수집한 F1 기사를 Claude API로 분석해
 * 한국어 심층 브리핑을 생성한다.
 *
 * 매일 오전 7시 (ISR / cron revalidate) 갱신을 기준으로 설계.
 * 호출 당 Claude Sonnet 4.6 사용 → 품질 우선.
 */

import Anthropic from "@anthropic-ai/sdk";
import { unstable_cache } from "next/cache";
import { getDailyDigest, type NewsArticle } from "./news";

// ─── Types ────────────────────────────────────────────────────

export interface AiDigestBullet {
  emoji: string;
  title: string;       // 토픽 제목 (15자 이내)
  text: string;        // 한국어 상세 요약 (80자 이내)
  context?: string;    // 배경 맥락 한 줄 (선택)
  sourceName?: string; // 출처 매체
  sourceUrl?: string;  // 원문 기사 URL
}

export interface AiDigest {
  generatedAt: string;        // ISO UTC
  dateLabel: string;          // "2026년 3월 4일 (어제)"
  headline: string;           // 하루 요약 핵심 한 문장
  summary: string;            // 3~5문장 심층 요약
  bullets: AiDigestBullet[];  // 주요 토픽 4~6개
  editorNote: string;         // 편집장 한마디 — 의견·전망 포함
  watchPoints: string[];      // 이번 주 관전 포인트 2~3개
  hotTopics: string[];        // 키워드 태그 4~6개
  articleCount: number;       // 분석한 기사 수
}

// ─── Helpers ─────────────────────────────────────────────────

function yesterdayLabel(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (어제)`;
}

function isYesterday(iso: string): boolean {
  const articleDate = new Date(iso);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    articleDate.getFullYear() === yesterday.getFullYear() &&
    articleDate.getMonth() === yesterday.getMonth() &&
    articleDate.getDate() === yesterday.getDate()
  );
}

function isWithin(iso: string, hours: number): boolean {
  return Date.now() - new Date(iso).getTime() < hours * 3_600_000;
}

/** 기사 목록에서 프롬프트용 텍스트 빌드 */
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

// ─── Claude API Call ─────────────────────────────────────────

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
      "sourceName": "출처 매체명",
      "sourceUrl": "해당 기사 원문 URL (입력 목록에서 가져올 것)"
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
- 출처 이름은 원문 영어 그대로 유지`;

async function callClaude(articleList: string): Promise<Omit<AiDigest, "generatedAt" | "dateLabel" | "articleCount"> | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[ai-digest] ANTHROPIC_API_KEY 미설정 → 데모 다이제스트 사용");
    return null;
  }

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `다음은 오늘의 F1 영문 기사 목록입니다. 심층 분석 후 한국어 브리핑 JSON을 작성하세요.\n\n${articleList}`,
        },
      ],
      system: SYSTEM_PROMPT,
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("[ai-digest] Claude API 오류:", e);
    return null;
  }
}

// ─── Static demo digest (API 키 없을 때 UI 확인용) ───────────

const DEMO_DIGEST: AiDigest = {
  generatedAt: new Date("2026-03-05T07:00:00+09:00").toISOString(),
  dateLabel: "2026년 3월 4일 (어제)",
  headline: "새 레귤레이션의 판도라 상자 열렸다 — 맥라렌·레드불·페라리 3파전 윤곽",
  summary:
    "호주 GP 개막을 나흘 앞두고 2026 시즌의 세력도가 서서히 모습을 드러내고 있다. " +
    "맥라렌은 최종 리버리 공개 행사에서 챔피언 노리스의 자신감을 전면에 내세웠고, " +
    "레드불 베르스타펜은 신규 레귤레이션 차량을 '완전히 다른 짐승'이라 표현하며 적응 기간을 시사했다. " +
    "페라리에서는 해밀턴-레클레르 듀오가 공개적으로 팀 내 역학을 언급하기 시작했고, " +
    "신생팀 캐딜락은 데뷔 레이스를 앞두고 가라지 내부를 공개해 미국 팀의 준비 수준을 확인시켰다. " +
    "멜버른 레이스 당일 강우 예보가 나오면서 타이어 전략이 첫 레이스의 핵심 변수가 될 전망이다.",
  bullets: [
    {
      emoji: "🧡",
      title: "맥라렌 리버리 공개",
      text: "노리스 '우리 차의 페이스에 자신 있다' — 2026 최종 디자인 언베일",
      context: "챔피언 넘버 #1 달고 타이틀 방어 시즌 출격",
      sourceName: "Autosport",
    },
    {
      emoji: "🐂",
      title: "베르스타펜의 경고",
      text: "'2026 차는 완전히 다른 짐승' — 신규 레귤레이션 적응에 시간 필요 시사",
      context: "4연속 챔피언도 새 기술 규정 앞에선 신중한 발언",
      sourceName: "Motorsport.com",
    },
    {
      emoji: "🔴",
      title: "해밀턴-레클레르 관계",
      text: "레클레르 '해밀턴과의 팀 내 역학, 기대와 경계가 교차' — 솔직한 내부 언급",
      context: "7관왕과 페라리 에이스의 동거, 팀 내 No.1 경쟁 불가피",
      sourceName: "The Race",
    },
    {
      emoji: "🌧️",
      title: "멜버른 비 예보",
      text: "레이스 당일 상당한 강우 예상 — 타이어 전략이 개막전 최대 변수",
      context: "2026 새 타이어 화합물의 빗속 성능은 미지수",
      sourceName: "Sky Sports F1",
    },
    {
      emoji: "🇺🇸",
      title: "캐딜락 가라지 공개",
      text: "GM 신생팀, 데뷔 전야 내부 공개 — 첫 F1 그리드 출격 준비 완료",
      context: "1950년 F1 창설 이래 최초의 미국계 신생팀",
      sourceName: "Sky Sports F1",
    },
    {
      emoji: "📋",
      title: "FIA 에어로 규정 명확화",
      text: "액티브 에어로 작동 조건 테크니컬 디렉티브 발표 — 팀 이의제기 수용",
      context: "새 레귤레이션 첫 시즌, 해석 혼란 정리 위한 FIA 신속 대응",
      sourceName: "Motorsport.com",
    },
  ],
  editorNote:
    "베르스타펜의 '다른 짐승' 발언이 의미심장하다. 역대 최다 우승 기록 보유자가 새 차에 적응이 필요하다고 공개 인정하는 것은 이번 레귤레이션 변경의 파급력이 그만큼 크다는 방증이다. " +
    "반면 노리스의 자신감은 맥라렌이 프리시즌 내내 숨겨온 페이스가 실제임을 시사할 수 있다. " +
    "해밀턴-레클레르 관계는 시즌 내내 F1 최대 드라마 중 하나가 될 것이며, 개막전 멜버른의 비는 의외의 우승자를 낳을 최적의 조건을 제공할 수 있다.",
  watchPoints: [
    "노리스 vs 베르스타펜 — 새 레귤레이션 첫 레이스에서 누가 더 빨리 적응하는가",
    "캐딜락 F1 데뷔 — 페레스·보타스가 포인트 스코어링에 성공할 수 있을까",
    "멜버른 빗속 레이스 — 젖은 노면에서 강한 드라이버가 개막전 판도 주도",
  ],
  hotTopics: ["2026 개막전", "새 레귤레이션", "해밀턴-레클레르", "캐딜락 데뷔", "멜버른 비"],
  articleCount: 10,
};

// ─── Public API ───────────────────────────────────────────────

/**
 * 어제(또는 최근 24h) 기사를 AI로 분석해 한국어 심층 다이제스트를 반환.
 * ANTHROPIC_API_KEY 미설정 시 데모 다이제스트 반환.
 * unstable_cache로 24h 캐시 — 'ai-digest' 태그로 cron 재검증.
 */
export const getAiDigest = unstable_cache(
  async (): Promise<AiDigest | null> => {
    // 1. RSS에서 기사 수집
    const digest = await getDailyDigest();
    const all = digest.recent;

    // 2. 어제 기사 우선, 없으면 최근 24h
    let articles = all.filter((a) => isYesterday(a.publishedAt));
    if (articles.length < 5) {
      articles = all.filter((a) => isWithin(a.publishedAt, 24));
    }
    if (articles.length === 0) {
      articles = all.slice(0, 20);
    }

    // 3. Claude 호출 — API 키 없으면 데모 다이제스트로 폴백
    const articleList = buildArticleList(articles);
    const result = await callClaude(articleList);
    if (!result) return DEMO_DIGEST;

    return {
      generatedAt: new Date().toISOString(),
      dateLabel: yesterdayLabel(),
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
  { revalidate: 86400, tags: ["ai-digest"] }
);
