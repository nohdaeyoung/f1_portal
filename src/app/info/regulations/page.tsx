import Link from "next/link";
import { allSections } from "@/data/regs";

export const metadata = {
  title: "2026 F1 규정 | PitLane",
  description: "FIA 2026 F1 일반·스포팅·기술·파이넨셜·운영 규정 한국어 번역",
};

export default function RegulationsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#64748B] mb-6">
        <Link href="/info" className="hover:text-white transition-colors">정보</Link>
        <span>›</span>
        <span className="text-white">2026 규정</span>
      </nav>

      {/* Header */}
      <section className="mb-10">
        <span className="text-xs uppercase tracking-widest text-[#E8002D] font-bold">
          2026 Regulations
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white mt-2">
          2026 F1 규정
        </h1>
        <p className="text-[#64748B] mt-2">
          FIA 공식 규정 한국어 전문 번역 — Section A · B · C · D · F
        </p>
        <div className="mt-5 w-16 h-1 bg-[#E8002D] rounded-full" />
      </section>

      {/* Disclaimer */}
      <div className="mb-8 bg-[#141420] border border-[#2D2D3A] rounded-xl px-5 py-4 flex gap-3 items-start">
        <span className="text-lg shrink-0">ℹ️</span>
        <p className="text-xs text-[#64748B] leading-relaxed">
          본 페이지는 FIA 공식 규정을 한국어로 번역한 비공식 자료입니다.
          법적 효력이 있는 원문은{" "}
          <a
            href="https://www.fia.com/regulation/category/110"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#E8002D] hover:underline"
          >
            FIA 공식 웹사이트 ↗
          </a>
          에서 확인하세요. 원본 한국어 번역 출처:{" "}
          <a
            href="https://d.324.ing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#E8002D] hover:underline"
          >
            324 Archives ↗
          </a>
        </p>
      </div>

      {/* Section cards */}
      <div className="space-y-4">
        {allSections.map((section) => (
          <Link
            key={section.sectionId}
            href={`/info/regulations/section/${section.sectionId}`}
            className="flex items-center gap-5 bg-[#141420] border border-[#2D2D3A] rounded-2xl px-6 py-5 hover:-translate-y-0.5 hover:border-opacity-60 transition-all group"
            style={{ ["--hover-color" as string]: section.color }}
          >
            {/* Section badge */}
            <div
              className="shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center"
              style={{ backgroundColor: section.color + "15", border: `1px solid ${section.color}30` }}
            >
              <span className="text-[10px] font-bold text-[#64748B]">Section</span>
              <span
                className="text-xl font-black"
                style={{ color: section.color }}
              >
                {section.sectionId}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-base font-black text-white group-hover:text-inherit transition-colors">
                  {section.title}
                </h2>
                <span className="text-xs text-[#64748B]">{section.titleEn}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#64748B]">
                <span
                  className="font-bold"
                  style={{ color: section.color }}
                >
                  {section.issue}
                </span>
                <span>·</span>
                <span>{section.approval}</span>
                <span>·</span>
                <span>{section.articles.length}개 조항</span>
              </div>
            </div>

            <span className="text-[#64748B] group-hover:text-white transition-colors shrink-0 text-sm">
              →
            </span>
          </Link>
        ))}
      </div>

      {/* Back */}
      <div className="mt-8 text-center">
        <Link href="/info" className="text-sm text-[#64748B] hover:text-white transition-colors">
          ← 정보 허브로 돌아가기
        </Link>
      </div>
    </div>
  );
}
