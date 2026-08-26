"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type Post, type PostCategory, type PostSeo } from "@/lib/community/posts";
import { calendar, teams, drivers } from "@/data/f1-data";
import { MarkdownBody } from "./MarkdownBody";

const DRIVER_KO: Record<string, string> = {
  verstappen: "베르스타펜", hadjar: "아드자르", norris: "노리스", piastri: "피아스트리",
  hamilton: "해밀턴", leclerc: "르클레르", russell: "러셀", antonelli: "안토넬리",
  alonso: "알론소", stroll: "스트롤", gasly: "가슬리", colapinto: "콜라핀토",
  sainz: "사인스", albon: "알본", lawson: "로손", lindblad: "린드블라드",
  ocon: "오콘", bearman: "베어만", hulkenberg: "휠켄베르그", bortoleto: "보르톨레토",
  bottas: "보타스", perez: "페레스",
};

const TEAM_OPTIONS = teams.map((t) => ({
  id: t.id,
  label: `${t.koreanName} : ${t.driverIds.map((d) => DRIVER_KO[d] ?? drivers.find((dr) => dr.id === d)?.lastName ?? d).join(" · ")}`,
}));

const CATEGORIES: PostCategory[] = ["레이스 토론", "드라이버 & 팀", "기술 & 규정", "잡담"];

interface Props {
  post: Post;
}

export function PostEditForm({ post }: Props) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  const [category, setCategory] = useState<PostCategory>(post.category);
  const [roundTag, setRoundTag] = useState<number | null>(post.roundTag);
  const [teamTag, setTeamTag] = useState<string | null>(post.teamTag);
  const [title, setTitle] = useState(post.title ?? "");
  const [body, setBody] = useState(post.body);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [seoOpen, setSeoOpen] = useState(false);
  const [metaTitle, setMetaTitle] = useState(post.seo?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(post.seo?.metaDescription ?? "");
  const [primaryKeyword, setPrimaryKeyword] = useState(post.seo?.primaryKeyword ?? "");
  const [secondaryKeywords, setSecondaryKeywords] = useState(post.seo?.secondaryKeywords ?? "");

  useEffect(() => {
    fetch("/api/admin/check")
      .then((r) => r.json())
      .then((d) => setAuthorized(d.isAdmin === true))
      .catch(() => setAuthorized(false));
  }, []);

  // auth 확인 후 권한 없으면 돌려보냄
  useEffect(() => {
    if (authorized === false) {
      router.replace(`/community/${post.id}`);
    }
  }, [authorized, post.id, router]);

  if (authorized === null) {
    return <div className="text-center py-16 text-[#64748B]">확인 중...</div>;
  }
  if (authorized === false) return null;

  function handleCategoryChange(cat: PostCategory) {
    setCategory(cat);
    if (cat !== "레이스 토론") setRoundTag(null);
    if (cat !== "드라이버 & 팀") setTeamTag(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || submitting) return;
    if (category === "레이스 토론" && roundTag === null) return;
    if (category === "드라이버 & 팀" && teamTag === null) return;
    setSubmitting(true);
    try {
      const seo: PostSeo = {
        metaTitle: metaTitle.trim() || null,
        metaDescription: metaDescription.trim() || null,
        primaryKeyword: primaryKeyword.trim() || null,
        secondaryKeywords: secondaryKeywords.trim() || null,
        slug: post.seo?.slug ?? null,
      };
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || null,
          body: body.trim(),
          category,
          roundTag,
          teamTag,
          seo,
        }),
      });
      if (!res.ok) throw new Error("update failed");
      router.back();
      router.refresh();
    } catch {
      alert("수정 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 카테고리 */}
      <div>
        <label className="block text-sm text-[#94A3B8] mb-1.5">카테고리</label>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                category === cat
                  ? "bg-[#E8002D] text-white"
                  : "bg-white/5 text-[#94A3B8] hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 팀 선택 (드라이버 & 팀 전용, 필수) */}
      {category === "드라이버 & 팀" && (
        <div>
          <label className="block text-sm text-[#94A3B8] mb-1.5">
            팀 <span className="text-[#E8002D]">*</span>
          </label>
          <select
            value={teamTag ?? ""}
            onChange={(e) => setTeamTag(e.target.value || null)}
            required
            className="w-full bg-[#141420] border border-[#2D2D3A] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#E8002D] transition-colors"
          >
            <option value="" disabled>팀을 선택하세요</option>
            {TEAM_OPTIONS.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* 라운드 선택 (레이스 토론 전용, 필수) */}
      {category === "레이스 토론" && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1.5">
              라운드 <span className="text-[#E8002D]">*</span>
            </label>
            <select
              value={roundTag ?? ""}
              onChange={(e) => { setRoundTag(e.target.value ? Number(e.target.value) : null); setTeamTag(null); }}
              required
              className="w-full bg-[#141420] border border-[#2D2D3A] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#E8002D] transition-colors"
            >
              <option value="" disabled>라운드를 선택하세요</option>
              {calendar.map((r) => (
                <option key={r.round} value={r.round}>
                  R{r.round} — {r.koreanName}
                </option>
              ))}
            </select>
          </div>

          {roundTag !== null && (
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">팀 (선택)</label>
              <select
                value={teamTag ?? ""}
                onChange={(e) => setTeamTag(e.target.value || null)}
                className="w-full bg-[#141420] border border-[#2D2D3A] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#E8002D] transition-colors"
              >
                <option value="">전체 팀</option>
                {TEAM_OPTIONS.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* 제목 */}
      <div>
        <label className="block text-sm text-[#94A3B8] mb-1.5">제목 (선택)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
          maxLength={100}
          placeholder="제목을 입력하세요"
          className="w-full bg-[#141420] border border-[#2D2D3A] rounded-lg px-4 py-2.5 text-white placeholder-[#475569] focus:outline-none focus:border-[#E8002D] transition-colors"
        />
      </div>

      {/* 본문 */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm text-[#94A3B8]">내용 *</label>
          <div className="flex gap-1 text-xs">
            <button
              type="button"
              onClick={() => setTab("write")}
              className={`px-3 py-1 rounded transition-colors ${tab === "write" ? "bg-white/10 text-white" : "text-[#64748B] hover:text-white"}`}
            >
              쓰기
            </button>
            <button
              type="button"
              onClick={() => setTab("preview")}
              className={`px-3 py-1 rounded transition-colors ${tab === "preview" ? "bg-white/10 text-white" : "text-[#64748B] hover:text-white"}`}
            >
              미리보기
            </button>
          </div>
        </div>
        {tab === "write" ? (
          <>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={2000}
              rows={8}
              required
              className="w-full bg-[#141420] border border-[#2D2D3A] rounded-lg px-4 py-3 text-white placeholder-[#475569] focus:outline-none focus:border-[#E8002D] transition-colors resize-none font-mono text-sm"
            />
            <p className="text-xs text-[#475569] text-right mt-1">{body.length}/2000</p>
          </>
        ) : (
          <div className="min-h-[12rem] bg-[#141420] border border-[#2D2D3A] rounded-lg px-4 py-3">
            {body.trim() ? (
              <MarkdownBody>{body}</MarkdownBody>
            ) : (
              <p className="text-[#475569] text-sm">내용을 입력하면 여기에 미리보기가 표시됩니다.</p>
            )}
          </div>
        )}
      </div>

      {/* SEO 메타태그 */}
      <div className="border border-[#2D2D3A] rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setSeoOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-[#64748B] hover:text-white hover:bg-white/5 transition-colors"
        >
          <span className="font-medium">SEO 메타태그</span>
          <span className="text-xs">{seoOpen ? "▲" : "▼"}</span>
        </button>

        {seoOpen && (
          <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[#2D2D3A]">
            <div>
              <label className="block text-xs text-[#64748B] mb-1">Meta Title</label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                maxLength={100}
                placeholder={title.trim() || "메타 타이틀을 입력하세요"}
                className="w-full bg-[#0D0D14] border border-[#2D2D3A] rounded-lg px-3 py-2 text-sm text-white placeholder-[#3D3D50] focus:outline-none focus:border-[#E8002D] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-[#64748B] mb-1">Meta Description</label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                maxLength={200}
                rows={2}
                placeholder="검색 결과에 표시될 설명 (160자 권장)"
                className="w-full bg-[#0D0D14] border border-[#2D2D3A] rounded-lg px-3 py-2 text-sm text-white placeholder-[#3D3D50] focus:outline-none focus:border-[#E8002D] transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-xs text-[#64748B] mb-1">Primary Keyword</label>
              <input
                type="text"
                value={primaryKeyword}
                onChange={(e) => setPrimaryKeyword(e.target.value)}
                maxLength={80}
                placeholder="주요 키워드"
                className="w-full bg-[#0D0D14] border border-[#2D2D3A] rounded-lg px-3 py-2 text-sm text-white placeholder-[#3D3D50] focus:outline-none focus:border-[#E8002D] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-[#64748B] mb-1">Secondary Keywords</label>
              <input
                type="text"
                value={secondaryKeywords}
                onChange={(e) => setSecondaryKeywords(e.target.value)}
                maxLength={200}
                placeholder="쉼표로 구분 (예: 키워드1, 키워드2, 키워드3)"
                className="w-full bg-[#0D0D14] border border-[#2D2D3A] rounded-lg px-3 py-2 text-sm text-white placeholder-[#3D3D50] focus:outline-none focus:border-[#E8002D] transition-colors"
              />
            </div>

            {post.seo?.slug && (
              <p className="text-xs text-[#475569]">
                URL Slug: <span className="text-[#64748B] font-mono">/community/{post.seo.slug}</span>
                <span className="ml-2 text-[#3D3D50]">(수정 불가)</span>
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-[#94A3B8] hover:text-white transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={!body.trim() || submitting}
          className="px-6 py-2 text-sm bg-[#E8002D] text-white font-medium rounded-lg hover:bg-[#CC0028] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "저장 중..." : "저장하기"}
        </button>
      </div>
    </form>
  );
}
