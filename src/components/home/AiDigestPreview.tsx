import Link from "next/link";
import { type AiDigest } from "@/lib/api/ai-digest";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function AiDigestPreview({ digest }: { digest: AiDigest | null }) {
  return (
    <section>
      <SectionHeader title="오늘의 F1" href="/news" linkLabel="AI 브리핑 전체 보기" />
      {digest ? (
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#141420] border border-[#E8002D]/20 rounded-xl overflow-hidden">
          <div className="bg-[#E8002D]/10 border-b border-[#E8002D]/20 px-5 py-4">
            <p className="text-sm font-black text-white leading-snug">{digest.headline}</p>
          </div>
          <div className="px-5 py-4 space-y-4">
            <p className="text-sm text-[#94A3B8] leading-relaxed line-clamp-3">{digest.summary}</p>
            {digest.bullets.slice(0, 3).length > 0 && (
              <ul className="space-y-2">
                {digest.bullets.slice(0, 3).map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="shrink-0 mt-0.5">{b.emoji}</span>
                    <span className="text-[#94A3B8]">
                      <span className="text-white font-semibold">{b.title} </span>
                      {b.text}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {digest.hotTopics.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1 border-t border-[#2D2D3A]">
                {digest.hotTopics.map((tag) => (
                  <span key={tag} className="text-xs bg-white/5 text-[#94A3B8] px-2.5 py-1 rounded-full border border-white/10">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6 text-sm text-[#64748B]">
          뉴스 브리핑을 준비 중입니다...
        </div>
      )}
    </section>
  );
}
