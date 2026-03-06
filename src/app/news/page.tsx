import { getDailyDigest, type NewsArticle } from "@/lib/api/news";
import { getAiDigest, type AiDigest } from "@/lib/api/ai-digest";

export const metadata = {
  title: "F1 뉴스 & AI 브리핑",
  description: "Autosport, Motorsport.com 등 6개 매체의 F1 최신 뉴스와 Claude AI가 매일 정리하는 토픽별 브리핑.",
  openGraph: {
    title: "F1 뉴스 & AI 브리핑 | PitLane",
    description: "Autosport, Motorsport.com 등 6개 매체의 F1 최신 뉴스와 Claude AI가 매일 정리하는 토픽별 브리핑.",
    url: "https://f1.324.ing/news",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

// force-dynamic: 빌드 시 Claude API 호출 실패 방지 → 서버 렌더링 + unstable_cache가 데이터 캐싱 담당
export const dynamic = "force-dynamic";

// ─── Source badge colors ──────────────────────────────────────

const SOURCE_COLORS: Record<string, string> = {
  "Autosport": "#E8002D",
  "Motorsport.com": "#FF6700",
  "The Race": "#00B4D8",
  "BBC Sport": "#FF6B35",
  "RaceFans": "#7C3AED",
  "Sky Sports F1": "#0EA5E9",
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

// ─── AI Digest Section ────────────────────────────────────────

function AiDigestSection({ digest }: { digest: AiDigest }) {
  return (
    <section className="mb-12">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-[#E8002D]">
          AI 브리핑
        </span>
        <span className="text-[#2D2D3A] text-xs">·</span>
        <span className="text-xs text-[#64748B]">{digest.dateLabel}</span>
        <span className="ml-auto text-xs text-[#64748B]">
          {digest.articleCount}건 분석
        </span>
      </div>

      {/* Main card */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#141420] border border-[#E8002D]/25 rounded-2xl overflow-hidden">
        {/* Headline bar */}
        <div className="bg-[#E8002D]/10 border-b border-[#E8002D]/20 px-6 py-4">
          <p className="text-base sm:text-lg font-black text-white leading-snug">
            {digest.headline}
          </p>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Summary paragraph */}
          <p className="text-sm text-[#94A3B8] leading-relaxed">{digest.summary}</p>

          {/* Bullet points */}
          <ul className="space-y-3">
            {digest.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3 bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.06]">
                <span className="shrink-0 text-lg leading-none mt-0.5">{b.emoji}</span>
                <div className="flex-1 min-w-0">
                  {b.title && (
                    b.sourceUrl ? (
                      <a
                        href={b.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[#E8002D] uppercase tracking-wide mb-0.5 hover:underline inline-flex items-center gap-1"
                      >
                        {b.title} ↗
                      </a>
                    ) : (
                      <p className="text-xs font-bold text-[#E8002D] uppercase tracking-wide mb-0.5">{b.title}</p>
                    )
                  )}
                  <p className="text-sm text-[#CBD5E1] leading-relaxed">{b.text}</p>
                  {b.context && (
                    <p className="text-xs text-[#64748B] mt-1 leading-relaxed">💡 {b.context}</p>
                  )}
                </div>
                {b.sourceName && (
                  <span
                    className="shrink-0 self-start mt-0.5 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{
                      color: SOURCE_COLORS[b.sourceName] ?? "#64748B",
                      backgroundColor: (SOURCE_COLORS[b.sourceName] ?? "#64748B") + "20",
                    }}
                  >
                    {b.sourceName}
                  </span>
                )}
              </li>
            ))}
          </ul>

          {/* Editor Note */}
          {digest.editorNote && (
            <div className="bg-[#E8002D]/[0.06] border border-[#E8002D]/20 rounded-xl px-5 py-4">
              <p className="text-xs font-bold text-[#E8002D] uppercase tracking-widest mb-2">편집장 한마디</p>
              <p className="text-sm text-[#CBD5E1] leading-relaxed">{digest.editorNote}</p>
            </div>
          )}

          {/* Watch Points */}
          {digest.watchPoints && digest.watchPoints.length > 0 && (
            <div>
              <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-2">이번 주 관전 포인트</p>
              <ul className="space-y-2">
                {digest.watchPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[#94A3B8]">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-xs font-black text-white mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Hot topics */}
          {digest.hotTopics.length > 0 && (
            <div className="pt-2 border-t border-[#2D2D3A] flex items-center flex-wrap gap-2">
              <span className="text-xs text-[#64748B] mr-1">주목 키워드</span>
              {digest.hotTopics.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-white/5 text-[#94A3B8] px-2.5 py-1 rounded-full border border-white/10"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-black/20 border-t border-[#2D2D3A] flex items-center justify-between">
          <span className="text-xs text-[#64748B]">
            Claude AI 자동 요약 · 매일 오전 7시 갱신
          </span>
          <span className="text-xs text-[#E8002D]/60 font-mono">
            {new Date(digest.generatedAt).toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Asia/Seoul",
            })}{" "}
            KST
          </span>
        </div>
      </div>
    </section>
  );
}

// ─── Article card ─────────────────────────────────────────────

function ArticleCard({ article, compact = false }: { article: NewsArticle; compact?: boolean }) {
  const accent = SOURCE_COLORS[article.sourceName] ?? "#E8002D";
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 bg-[#141420] border border-[#2D2D3A] rounded-xl p-4 hover:-translate-y-0.5 hover:border-[#E8002D]/30 transition-all group"
    >
      {/* Thumbnail */}
      {article.image && !compact && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.image}
          alt=""
          loading="lazy"
          className="shrink-0 w-24 h-16 sm:w-28 sm:h-[4.5rem] rounded-lg object-cover bg-[#2D2D3A]"
        />
      )}

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white leading-snug group-hover:text-[#E8002D] transition-colors line-clamp-2">
          {article.title}
        </p>
        {!compact && article.description && (
          <p className="text-xs text-[#64748B] mt-1.5 line-clamp-2 leading-relaxed">
            {article.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs font-semibold" style={{ color: accent }}>
            {article.sourceName}
          </span>
          <span className="text-[#2D2D3A] text-xs">&middot;</span>
          <span className="text-xs text-[#64748B]">{timeAgo(article.publishedAt)}</span>
        </div>
      </div>

      <span className="text-[#64748B] group-hover:text-[#E8002D] transition-colors shrink-0 self-center hidden sm:block text-sm">
        →
      </span>
    </a>
  );
}

// ─── Topic icons ──────────────────────────────────────────────

const TOPIC_ICONS: Record<string, string> = {
  "레이스 & 퀄리파잉": "🏁",
  "팀 & 기술": "🔧",
  "드라이버 소식": "🪖",
  "F1 비즈니스": "💼",
  "기타 소식": "📰",
};

// ─── Page ─────────────────────────────────────────────────────

export default async function NewsPage() {
  // Parallel fetch — AI digest and RSS digest
  const [aiDigest, digest] = await Promise.all([
    getAiDigest(),
    getDailyDigest(),
  ]);

  const hasDigest = digest.topics.length > 0 || digest.others.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── Header ─────────────────────────────── */}
      <section className="mb-10">
        <span className="text-xs uppercase tracking-widest text-[#E8002D] font-bold">
          F1 Daily Digest
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white mt-2">
          오늘의 F1 다이제스트
        </h1>
        <p className="text-[#64748B] mt-2">{digest.date}</p>

        {/* Stats bar */}
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#64748B]">
          <span>
            <span className="font-bold text-white">{digest.totalToday}</span>건 당일 기사
          </span>
          <span>
            <span className="font-bold text-white">{digest.sourceCount}</span>개 매체 수집
          </span>
          <span>
            <span className="font-bold text-white">{digest.topics.length}</span>개 토픽 분류
          </span>
        </div>

        {/* Source badges */}
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(SOURCE_COLORS).map(([src, color]) => (
            <span
              key={src}
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ backgroundColor: color + "1A", color }}
            >
              {src}
            </span>
          ))}
        </div>

        <div className="mt-5 w-16 h-1 bg-[#E8002D] rounded-full" />
      </section>

      {/* ── AI Digest Section ───────────────────── */}
      {aiDigest ? (
        <AiDigestSection digest={aiDigest} />
      ) : (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#64748B]">
              AI 브리핑
            </span>
          </div>
          <div className="bg-[#141420] border border-[#2D2D3A] rounded-2xl px-6 py-5 text-sm text-[#64748B] flex items-center gap-3">
            <span className="text-lg">🤖</span>
            <span>
              AI 요약을 불러오지 못했습니다.{" "}
              <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">ANTHROPIC_API_KEY</code>{" "}
              환경 변수를 설정하면 자동 활성화됩니다.
            </span>
          </div>
        </section>
      )}

      {/* ── Daily Digest (topic sections) ──────── */}
      {hasDigest ? (
        <section className="mb-14 space-y-10">
          {digest.topics.map((topic) => (
            <div key={topic.ko}>
              {/* Topic header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-lg">{TOPIC_ICONS[topic.ko] ?? "📰"}</span>
                <h2 className="text-lg font-black text-white">{topic.ko}</h2>
                <span className="text-xs font-bold text-[#E8002D] bg-[#E8002D]/10 px-2 py-0.5 rounded-full">
                  {topic.articles.length}건
                </span>
              </div>
              <div className="space-y-3">
                {topic.articles.slice(0, 5).map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </div>
          ))}

          {/* Unclassified articles */}
          {digest.others.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-lg">📰</span>
                <h2 className="text-lg font-black text-white">기타 소식</h2>
                <span className="text-xs font-bold text-[#64748B] bg-white/5 px-2 py-0.5 rounded-full">
                  {digest.others.length}건
                </span>
              </div>
              <div className="space-y-3">
                {digest.others.slice(0, 4).map((a) => (
                  <ArticleCard key={a.id} article={a} compact />
                ))}
              </div>
            </div>
          )}
        </section>
      ) : (
        <div className="mb-14 bg-[#141420] border border-[#2D2D3A] rounded-xl p-8 text-center text-[#64748B]">
          오늘 기사를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </div>
      )}

      {/* ── Divider ────────────────────────────── */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 h-px bg-[#2D2D3A]" />
        <span className="text-xs text-[#64748B] uppercase tracking-widest">최신 뉴스 전체</span>
        <div className="flex-1 h-px bg-[#2D2D3A]" />
      </div>

      {/* ── All Recent Articles ─────────────────── */}
      <section className="space-y-3">
        {digest.recent.map((a) => (
          <ArticleCard key={a.id} article={a} compact />
        ))}
        {digest.recent.length === 0 && (
          <p className="text-center text-[#64748B] py-10">뉴스를 불러올 수 없습니다.</p>
        )}
      </section>
    </div>
  );
}
