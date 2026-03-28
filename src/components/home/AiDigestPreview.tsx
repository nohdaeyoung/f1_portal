import Link from "next/link";
import { type AiDigest } from "@/lib/api/ai-digest";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function AiDigestPreview({ digest }: { digest: AiDigest | null }) {
  return (
    <section>
      <SectionHeader title="오늘의 F1" href="/news" linkLabel="AI 브리핑 전체 보기" />
      {digest ? (
        <div className="hud-card rounded-xl overflow-hidden border border-border-default bg-bg-surface">
          {/* 터미널 상단 바 */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-bg-overlay border-b border-border-subtle">
            <span className="flex items-center gap-1.5" aria-hidden="true">
              <span className="w-2.5 h-2.5 rounded-full bg-f1-red/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FCD34D]/50" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]/50" />
            </span>
            <span className="font-mono text-[10px] text-text-disabled tracking-wider ml-2">
              f1-ai-digest
              <span className="animate-blink-cursor ml-0.5 text-[#00D2BE]">▎</span>
            </span>
            <span className="ml-auto font-display text-[9px] tracking-widest uppercase text-text-disabled">
              claude · live
            </span>
          </div>

          {/* 헤드라인 */}
          <div className="px-5 py-4 border-b border-border-subtle bg-f1-red/5">
            <p className="font-display text-xs tracking-widest uppercase text-f1-red mb-2">
              &gt; TODAY&#39;S HEADLINE
            </p>
            <p className="text-sm font-bold text-white leading-snug">{digest.headline}</p>
          </div>

          {/* 본문 */}
          <div className="px-5 py-4 space-y-4">
            <p className="font-mono text-xs text-text-muted leading-relaxed line-clamp-2">
              <span className="text-[#00D2BE]">$ </span>
              {digest.summary}
            </p>

            {digest.bullets.slice(0, 3).length > 0 && (
              <ul className="space-y-2" aria-label="주요 포인트">
                {digest.bullets.slice(0, 3).map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm animate-scan-sweep" style={{ animationDelay: `${i * 80}ms` }}>
                    <span className="shrink-0 mt-0.5 text-base leading-none" aria-hidden="true">{b.emoji}</span>
                    <span className="text-text-secondary leading-snug">
                      <span className="text-white font-semibold">{b.title} </span>
                      {b.text}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {digest.hotTopics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border-subtle">
                {digest.hotTopics.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[10px] bg-white/5 text-text-muted px-2 py-0.5 rounded border border-border-subtle hover:border-[#00D2BE]/40 hover:text-[#00D2BE] transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 하단 링크 */}
          <div className="border-t border-border-subtle bg-bg-overlay/50">
            <Link
              href="/news"
              className="flex items-center px-5 py-3 min-h-[44px] font-display text-[10px] tracking-widest uppercase text-text-disabled hover:text-[#00D2BE] transition-colors focus-visible:outline-none focus-visible:text-[#00D2BE]"
            >
              FULL BRIEFING →
            </Link>
          </div>
        </div>
      ) : (
        <div className="hud-card rounded-xl border border-border-default bg-bg-surface px-5 py-8 text-center">
          <p className="font-mono text-xs text-text-disabled">
            <span className="text-[#00D2BE]">$ </span>
            loading digest
            <span className="animate-blink-cursor ml-0.5">▎</span>
          </p>
        </div>
      )}
    </section>
  );
}
