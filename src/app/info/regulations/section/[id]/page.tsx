import { notFound } from "next/navigation";
import Link from "next/link";
import { sectionMap } from "@/data/regs";
import type { RegArticle } from "@/data/regs";

export function generateStaticParams() {
  return ["A", "B", "C", "D", "F"].map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const section = sectionMap[id.toUpperCase()];
  if (!section) return {};
  return {
    title: `2026 F1 ${section.label} ${section.title} | PitLane`,
    description: `${section.titleEn} — FIA 2026 F1 규정 한국어 번역`,
  };
}

// ─── Article renderer (recursive) ─────────────────────────────

function ArticleBlock({
  article,
  accentColor,
  depth = 0,
}: {
  article: RegArticle;
  accentColor: string;
  depth?: number;
}) {
  const isTop = depth === 0;
  const isMid = depth === 1;

  return (
    <div
      id={article.num}
      className={`scroll-mt-24 ${isTop ? "mb-8" : isMid ? "mb-4 ml-4" : "mb-3 ml-8"}`}
    >
      {/* Article header */}
      <div
        className={`flex items-start gap-3 ${
          isTop
            ? "bg-[#141420] border border-[#2D2D3A] rounded-xl px-5 py-4"
            : isMid
            ? "bg-[#0F0F1A] border-l-2 rounded-r-lg px-4 py-3"
            : "px-3 py-2"
        }`}
        style={isMid ? { borderLeftColor: accentColor } : {}}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={`font-mono font-bold shrink-0 ${
                isTop ? "text-base" : isMid ? "text-sm" : "text-xs"
              }`}
              style={{ color: accentColor }}
            >
              {article.num}
            </span>
            <span
              className={`font-bold text-white ${
                isTop ? "text-base" : isMid ? "text-sm" : "text-xs"
              }`}
            >
              {article.title}
            </span>
            {article.changed && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                style={{
                  color: accentColor,
                  backgroundColor: accentColor + "25",
                  border: `1px solid ${accentColor}40`,
                }}
              >
                변경사항
              </span>
            )}
          </div>

          {article.body && (
            <p className="text-sm text-[#94A3B8] leading-relaxed">{article.body}</p>
          )}

          {article.points && article.points.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {article.points.map((pt, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#CBD5E1]">
                  <span
                    className="shrink-0 w-1.5 h-1.5 rounded-full mt-[7px]"
                    style={{ backgroundColor: accentColor }}
                  />
                  <span className="leading-relaxed">{pt}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Children */}
      {article.children && article.children.length > 0 && (
        <div className="mt-2 space-y-1">
          {article.children.map((child) => (
            <ArticleBlock
              key={child.num}
              article={child}
              accentColor={accentColor}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TOC ──────────────────────────────────────────────────────

function TableOfContents({ articles, accentColor }: { articles: RegArticle[]; accentColor: string }) {
  return (
    <nav className="space-y-1">
      {articles.map((art) => (
        <a
          key={art.num}
          href={`#${art.num}`}
          className="flex items-center gap-2 text-xs text-[#64748B] hover:text-white transition-colors py-1 group"
        >
          <span
            className="font-mono font-bold shrink-0 group-hover:opacity-100 opacity-80"
            style={{ color: accentColor }}
          >
            {art.num}
          </span>
          <span className="truncate">{art.title}</span>
        </a>
      ))}
    </nav>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default async function SectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const section = sectionMap[id.toUpperCase()];
  if (!section) notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#64748B] mb-6">
        <Link href="/info" className="hover:text-white transition-colors">정보</Link>
        <span>›</span>
        <Link href="/info/regulations" className="hover:text-white transition-colors">2026 규정</Link>
        <span>›</span>
        <span className="text-white">{section.label}</span>
      </nav>

      {/* Hero header */}
      <div
        className="rounded-2xl overflow-hidden mb-10"
        style={{
          background: `linear-gradient(135deg, ${section.color}15 0%, #0A0A0F 60%)`,
          border: `1px solid ${section.color}30`,
        }}
      >
        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ color: section.color, backgroundColor: section.color + "20" }}
            >
              {section.label}
            </span>
            <span className="text-xs text-[#64748B]">{section.issue}</span>
            <span className="text-xs text-[#64748B]">·</span>
            <span className="text-xs text-[#64748B]">{section.approval}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {section.title}
          </h1>
          <p className="text-sm text-[#64748B] mt-1">{section.titleEn}</p>
          <p className="text-xs text-[#475569] mt-3">
            본 번역은 FIA 공식 규정의 한국어 요약본입니다.{" "}
            <a
              href="https://www.fia.com/regulation/category/110"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white"
            >
              원문 확인 ↗
            </a>
          </p>
        </div>
      </div>

      <div className="flex gap-8 relative">
        {/* Sidebar TOC */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24 bg-[#0F0F1A] border border-[#2D2D3A] rounded-xl p-4">
            <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-3">
              목차
            </p>
            <TableOfContents
              articles={section.articles}
              accentColor={section.color}
            />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {section.articles.map((article) => (
            <ArticleBlock
              key={article.num}
              article={article}
              accentColor={section.color}
              depth={0}
            />
          ))}

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-[#2D2D3A]">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <p className="text-xs text-[#64748B]">
                출처: FIA 2026 Formula 1 Regulations — {section.label}: {section.titleEn} ({section.issue})
              </p>
              <Link
                href="/info/regulations"
                className="text-sm text-[#E8002D] hover:underline shrink-0"
              >
                ← 규정 목록으로
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
