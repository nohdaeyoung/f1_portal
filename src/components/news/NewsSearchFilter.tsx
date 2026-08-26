"use client";

import { useState, useMemo } from "react";
import type { NewsArticle } from "@/lib/api/news";

const SOURCE_COLORS: Record<string, string> = {
  "Autosport": "#E8002D",
  "Motorsport.com": "#FF6700",
  "The Race": "#00B4D8",
  "BBC Sport": "#FF6B35",
  "RaceFans": "#7C3AED",
  "Sky Sports F1": "#0EA5E9",
};

const TOPIC_ICONS: Record<string, string> = {
  "레이스 & 퀄리파잉": "🏁",
  "팀 & 기술": "🔧",
  "드라이버 소식": "🪖",
  "F1 비즈니스": "💼",
  "기타 소식": "📰",
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

function ArticleCard({ article, compact = false }: { article: NewsArticle; compact?: boolean }) {
  const accent = SOURCE_COLORS[article.sourceName] ?? "#E8002D";
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 bg-[#141420] border border-[#2D2D3A] rounded-xl p-4 hover:-translate-y-0.5 hover:border-[#E8002D]/30 transition-all group"
    >
      {article.image && !compact && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.image}
          alt=""
          loading="lazy"
          className="shrink-0 w-24 h-16 sm:w-28 sm:h-[4.5rem] rounded-lg object-cover bg-[#2D2D3A]"
        />
      )}
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

interface Topic {
  ko: string;
  articles: NewsArticle[];
}

interface Props {
  topics: Topic[];
  others: NewsArticle[];
  recent: NewsArticle[];
}

export function NewsSearchFilter({ topics, others, recent }: Props) {
  const [query, setQuery] = useState("");
  const [activeSource, setActiveSource] = useState<string | null>(null);

  const allArticles = useMemo(() => {
    const seen = new Set<string>();
    const all: NewsArticle[] = [];
    for (const t of topics) for (const a of t.articles) { if (!seen.has(a.id)) { seen.add(a.id); all.push(a); } }
    for (const a of others) { if (!seen.has(a.id)) { seen.add(a.id); all.push(a); } }
    for (const a of recent) { if (!seen.has(a.id)) { seen.add(a.id); all.push(a); } }
    return all;
  }, [topics, others, recent]);

  const isFiltering = query.trim().length > 0 || activeSource !== null;

  const filteredArticles = useMemo(() => {
    if (!isFiltering) return [];
    const q = query.trim().toLowerCase();
    return allArticles.filter((a) => {
      const matchesSource = activeSource ? a.sourceName === activeSource : true;
      const matchesQuery = q
        ? a.title.toLowerCase().includes(q) || (a.description ?? "").toLowerCase().includes(q)
        : true;
      return matchesSource && matchesQuery;
    });
  }, [allArticles, query, activeSource, isFiltering]);

  return (
    <div>
      {/* Search + filter bar */}
      <div className="mb-8 space-y-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm pointer-events-none">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="기사 검색..."
            className="w-full bg-[#141420] border border-[#2D2D3A] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-[#475569] focus:outline-none focus:border-[#E8002D]/50 transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Source filter chips */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(SOURCE_COLORS).map(([src, color]) => (
            <button
              key={src}
              onClick={() => setActiveSource(activeSource === src ? null : src)}
              className="text-xs font-medium px-2.5 py-1 rounded-full transition-all"
              style={{
                backgroundColor: activeSource === src ? color + "33" : color + "1A",
                color,
                border: `1px solid ${activeSource === src ? color + "80" : "transparent"}`,
              }}
            >
              {src}
            </button>
          ))}
        </div>
      </div>

      {/* Search results */}
      {isFiltering ? (
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-[#64748B]">검색 결과</span>
            <span className="text-xs font-bold text-[#E8002D] bg-[#E8002D]/10 px-2 py-0.5 rounded-full">
              {filteredArticles.length}건
            </span>
          </div>
          {filteredArticles.length > 0 ? (
            <div className="space-y-3">
              {filteredArticles.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          ) : (
            <p className="text-center text-[#64748B] py-10">검색 결과가 없습니다.</p>
          )}
        </section>
      ) : (
        <>
          {/* Topic sections */}
          {(topics.length > 0 || others.length > 0) && (
            <section className="mb-14 space-y-10">
              {topics.map((topic) => (
                <div key={topic.ko}>
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

              {others.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-lg">📰</span>
                    <h2 className="text-lg font-black text-white">기타 소식</h2>
                    <span className="text-xs font-bold text-[#64748B] bg-white/5 px-2 py-0.5 rounded-full">
                      {others.length}건
                    </span>
                  </div>
                  <div className="space-y-3">
                    {others.slice(0, 4).map((a) => (
                      <ArticleCard key={a.id} article={a} compact />
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* All recent */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-[#2D2D3A]" />
            <span className="text-xs text-[#64748B] uppercase tracking-widest">최신 뉴스 전체</span>
            <div className="flex-1 h-px bg-[#2D2D3A]" />
          </div>
          <section className="space-y-3">
            {recent.map((a) => (
              <ArticleCard key={a.id} article={a} compact />
            ))}
            {recent.length === 0 && (
              <p className="text-center text-[#64748B] py-10">뉴스를 불러올 수 없습니다.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
