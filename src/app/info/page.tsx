"use client";

import Link from "next/link";
import { useState } from "react";
import { changes2026 } from "@/data/regulations-2026";
import { allSections } from "@/data/regs";

const TABS = [
  { id: "changes", label: "2026년 변경사항" },
  { id: "regulations", label: "2026 F1 규정 전문" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const impactLabel = { high: "핵심 변경", medium: "변경", low: "소폭 변경" };
const impactBadge = {
  high: "text-[#E8002D] bg-[#E8002D]/15 border-[#E8002D]/40",
  medium: "text-[#F59E0B] bg-[#F59E0B]/15 border-[#F59E0B]/40",
  low: "text-[#64748B] bg-white/5 border-white/10",
};

export default function InfoPage() {
  const [activeTab, setActiveTab] = useState<TabId>("changes");

  const highChanges = changes2026.filter((c) => c.impact === "high");
  const otherChanges = changes2026.filter((c) => c.impact !== "high");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Hero Header */}
      <section className="mb-10">
        <span className="text-xs uppercase tracking-widest text-[#E8002D] font-bold">
          2026 Season · Regulations
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white mt-2 leading-tight">
          F1 레귤레이션
        </h1>
        <p className="text-[#94A3B8] mt-3 max-w-2xl leading-relaxed">
          2026년은 F1 역사상 가장 큰 기술 혁신의 해입니다.
          파워유닛, 공기역학, 지속가능성까지 — 초보자도 알기 쉽게 정리했습니다.
        </p>
        <div className="mt-5 w-16 h-1 bg-[#E8002D] rounded-full" />
      </section>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0D0D14] border border-[#2D2D3A] rounded-xl p-1 mb-10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === tab.id
                ? "bg-[#E8002D] text-white shadow"
                : "text-[#64748B] hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: 2026년 변경사항 ── */}
      {activeTab === "changes" && (
        <>
          {/* 핵심 변경 */}
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
                  <div
                    className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-20"
                    style={{ backgroundColor: change.color }}
                  />
                  <div className="relative p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full border"
                          style={{ color: change.color, backgroundColor: change.color + "20", borderColor: change.color + "40" }}
                        >
                          {change.category}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${impactBadge[change.impact]}`}>
                          {impactLabel[change.impact]}
                        </span>
                      </div>
                      {change.stat && (
                        <div className="text-right shrink-0">
                          <span className="block text-2xl font-black leading-none" style={{ color: change.color }}>
                            {change.stat}
                          </span>
                          <span className="block text-[10px] text-[#64748B] mt-0.5 leading-tight max-w-[80px]">
                            {change.statLabel}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{change.icon}</span>
                      <h3 className="text-base font-black text-white leading-tight">{change.title}</h3>
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed mb-3">{change.description}</p>
                    <div
                      className="rounded-xl px-4 py-3 border-l-2"
                      style={{ backgroundColor: change.color + "08", borderLeftColor: change.color + "80" }}
                    >
                      <p className="text-[10px] font-bold mb-1" style={{ color: change.color }}>💡 쉽게 말하면</p>
                      <p className="text-xs text-[#94A3B8] leading-relaxed">{change.beginner}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 기타 변경사항 */}
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
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{change.icon}</span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border"
                        style={{ color: change.color, backgroundColor: change.color + "18", borderColor: change.color + "35" }}
                      >
                        {change.category}
                      </span>
                    </div>
                    {change.stat && (
                      <span className="text-sm font-black shrink-0" style={{ color: change.color }}>
                        {change.stat}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-black text-white leading-snug">{change.title}</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">{change.description}</p>
                  <div
                    className="rounded-lg px-3 py-2.5 border-l-2 mt-auto"
                    style={{ backgroundColor: change.color + "08", borderLeftColor: change.color + "60" }}
                  >
                    <p className="text-[10px] font-bold mb-1" style={{ color: change.color }}>💡 쉽게 말하면</p>
                    <p className="text-[11px] text-[#94A3B8] leading-relaxed">{change.beginner}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ── Tab: 2026 F1 규정 전문 ── */}
      {activeTab === "regulations" && (
        <>
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

          <div className="space-y-4">
            {allSections.map((section) => (
              <Link
                key={section.sectionId}
                href={`/info/regulations/section/${section.sectionId}`}
                className="flex items-center gap-5 bg-[#141420] border border-[#2D2D3A] rounded-2xl px-6 py-5 hover:-translate-y-0.5 transition-all group"
              >
                <div
                  className="shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center"
                  style={{ backgroundColor: section.color + "15", border: `1px solid ${section.color}30` }}
                >
                  <span className="text-[10px] font-bold text-[#64748B]">Section</span>
                  <span className="text-xl font-black" style={{ color: section.color }}>{section.sectionId}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-base font-black text-white">{section.title}</h2>
                    <span className="text-xs text-[#64748B]">{section.titleEn}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#64748B]">
                    <span className="font-bold" style={{ color: section.color }}>{section.issue}</span>
                    <span>·</span>
                    <span>{section.approval}</span>
                    <span>·</span>
                    <span>{section.articles.length}개 조항</span>
                  </div>
                </div>
                <span className="text-[#64748B] group-hover:text-white transition-colors shrink-0 text-sm">→</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
