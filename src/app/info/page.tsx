import Link from "next/link";
import { changes2026 } from "@/data/regulations-2026";
import { allSections } from "@/data/regs";

export const metadata = {
  title: "F1 정보 허브 | PitLane",
  description: "2026 F1 규정, 기술 가이드, F1 입문 정보를 한곳에서",
};

const impactLabel = { high: "핵심 변경", medium: "변경", low: "소폭 변경" };
const impactBadge = {
  high: "text-[#E8002D] bg-[#E8002D]/15 border-[#E8002D]/40",
  medium: "text-[#F59E0B] bg-[#F59E0B]/15 border-[#F59E0B]/40",
  low: "text-[#64748B] bg-white/5 border-white/10",
};

export default function InfoPage() {
  const highChanges = changes2026.filter((c) => c.impact === "high");
  const otherChanges = changes2026.filter((c) => c.impact !== "high");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── Hero Header ──────────────────────────────────────── */}
      <section className="mb-12">
        <span className="text-xs uppercase tracking-widest text-[#E8002D] font-bold">
          2026 Season · Major Changes
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white mt-2 leading-tight">
          2026 F1,<br className="sm:hidden" /> 이렇게 바뀐다
        </h1>
        <p className="text-[#94A3B8] mt-3 max-w-2xl leading-relaxed">
          2026년은 F1 역사상 가장 큰 기술 혁신의 해입니다.
          파워유닛, 공기역학, 지속가능성까지 — 초보자도 알기 쉽게 정리했습니다.
        </p>
        <div className="mt-5 w-16 h-1 bg-[#E8002D] rounded-full" />
      </section>

      {/* ── 핵심 변경 4대장 ──────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-black text-white">핵심 변경사항</h2>
          <span className="text-xs font-bold text-[#E8002D] bg-[#E8002D]/10 border border-[#E8002D]/30 px-2.5 py-1 rounded-full">
            MAJOR · {highChanges.length}건
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {highChanges.map((change) => (
            <div
              key={change.title}
              className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#141420] to-[#1a1a2e]"
              style={{ borderColor: change.color + "25" }}
            >
              {/* Glow accent */}
              <div
                className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-20"
                style={{ backgroundColor: change.color }}
              />

              <div className="relative p-5">
                {/* Top bar */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full border"
                      style={{
                        color: change.color,
                        backgroundColor: change.color + "20",
                        borderColor: change.color + "40",
                      }}
                    >
                      {change.category}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${impactBadge[change.impact]}`}>
                      {impactLabel[change.impact]}
                    </span>
                  </div>
                  {change.stat && (
                    <div className="text-right shrink-0">
                      <span
                        className="block text-2xl font-black leading-none"
                        style={{ color: change.color }}
                      >
                        {change.stat}
                      </span>
                      <span className="block text-[10px] text-[#64748B] mt-0.5 leading-tight max-w-[80px]">
                        {change.statLabel}
                      </span>
                    </div>
                  )}
                </div>

                {/* Icon + Title */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{change.icon}</span>
                  <h3 className="text-base font-black text-white leading-tight">{change.title}</h3>
                </div>

                {/* Expert description */}
                <p className="text-xs text-[#64748B] leading-relaxed mb-3">
                  {change.description}
                </p>

                {/* Beginner explanation */}
                <div
                  className="rounded-xl px-4 py-3 border-l-2"
                  style={{
                    backgroundColor: change.color + "08",
                    borderLeftColor: change.color + "80",
                  }}
                >
                  <p className="text-[10px] font-bold mb-1" style={{ color: change.color }}>
                    💡 쉽게 말하면
                  </p>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    {change.beginner}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 기타 변경사항 ────────────────────────────────────── */}
      <section className="mb-14">
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-lg font-black text-white">추가 변경사항</h2>
          <span className="text-xs font-bold text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-2.5 py-1 rounded-full">
            {otherChanges.length}건
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {otherChanges.map((change) => (
            <div
              key={change.title}
              className="rounded-xl border bg-[#141420] p-4 flex flex-col gap-3"
              style={{ borderColor: change.color + "20" }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{change.icon}</span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border"
                    style={{
                      color: change.color,
                      backgroundColor: change.color + "18",
                      borderColor: change.color + "35",
                    }}
                  >
                    {change.category}
                  </span>
                </div>
                {change.stat && (
                  <span
                    className="text-sm font-black shrink-0"
                    style={{ color: change.color }}
                  >
                    {change.stat}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="text-sm font-black text-white leading-snug">{change.title}</h3>

              {/* Expert desc */}
              <p className="text-xs text-[#64748B] leading-relaxed">{change.description}</p>

              {/* Beginner */}
              <div
                className="rounded-lg px-3 py-2.5 border-l-2 mt-auto"
                style={{
                  backgroundColor: change.color + "08",
                  borderLeftColor: change.color + "60",
                }}
              >
                <p className="text-[10px] font-bold mb-1" style={{ color: change.color }}>
                  💡 쉽게 말하면
                </p>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">{change.beginner}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Divider ──────────────────────────────────────────── */}
      <div className="border-t border-[#2D2D3A] mb-12" />

      {/* ── 2026 규정 전문 ───────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#64748B] font-bold">
              Official Regulations
            </span>
            <h2 className="text-xl font-black text-white mt-1">2026 F1 규정 전문</h2>
            <p className="text-xs text-[#64748B] mt-1">FIA 공식 규정 한국어 번역본</p>
          </div>
          <Link href="/info/regulations" className="text-xs text-[#E8002D] hover:underline shrink-0">
            전체 보기 →
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {allSections.map((section) => (
            <Link
              key={section.sectionId}
              href={`/info/regulations/section/${section.sectionId}`}
              className="flex items-center gap-4 bg-[#141420] border border-[#2D2D3A] rounded-xl px-4 py-3.5 hover:-translate-y-0.5 transition-all group"
            >
              <div
                className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg"
                style={{ backgroundColor: section.color + "15", color: section.color }}
              >
                {section.sectionId}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white group-hover:text-[#E8002D] transition-colors truncate">
                  {section.title}
                </p>
                <p className="text-xs text-[#64748B]">{section.issue} · {section.articles.length}개 조항</p>
              </div>
              <span className="text-[#64748B] group-hover:text-[#E8002D] transition-colors text-sm shrink-0">→</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
