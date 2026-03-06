import { type NewsArticle } from "@/lib/api/news";
import { SectionHeader } from "@/components/ui/SectionHeader";

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
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

export function NewsFeedSection({ articles }: { articles: NewsArticle[] }) {
  return (
    <section>
      <SectionHeader title="최신 뉴스" href="/news" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {articles.map((a) => {
          const accent = SOURCE_COLORS[a.sourceName] ?? "#E8002D";
          return (
            <a
              key={a.id}
              href={a.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 bg-[#141420] border border-[#2D2D3A] rounded-xl p-4 hover:-translate-y-0.5 hover:border-[#E8002D]/30 transition-all group"
            >
              {a.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.image} alt="" loading="lazy" className="shrink-0 w-20 h-14 rounded-lg object-cover bg-[#2D2D3A]" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white leading-snug group-hover:text-[#E8002D] transition-colors line-clamp-2">
                  {a.title}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-semibold" style={{ color: accent }}>{a.sourceName}</span>
                  <span className="text-[#3D3D50] text-xs">·</span>
                  <span className="text-xs text-[#64748B]">{timeAgo(a.publishedAt)}</span>
                </div>
              </div>
              <span className="text-[#64748B] group-hover:text-[#E8002D] transition-colors shrink-0 self-center hidden sm:block text-sm">→</span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
