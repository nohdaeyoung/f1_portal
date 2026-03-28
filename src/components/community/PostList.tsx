"use client";

import { useState, useEffect } from "react";
import { getPosts, type Post, type PostCategory } from "@/lib/community/posts";
import { calendar, teams } from "@/data/f1-data";
import { PostCard } from "./PostCard";

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
  label: `${t.koreanName} : ${t.driverIds.map((d) => DRIVER_KO[d] ?? d).join(" · ")}`,
}));

const CATEGORIES: { label: string; value: PostCategory | undefined }[] = [
  { label: "전체", value: undefined },
  { label: "레이스 토론", value: "레이스 토론" },
  { label: "드라이버 & 팀", value: "드라이버 & 팀" },
  { label: "기술 & 규정", value: "기술 & 규정" },
  { label: "잡담", value: "잡담" },
];

export function PostList({
  initialRound,
  initialPosts,
}: {
  initialRound?: number;
  initialPosts?: Post[];
}) {
  const [category, setCategory] = useState<PostCategory | undefined>(
    initialRound ? "레이스 토론" : undefined
  );
  const [roundTag, setRoundTag] = useState<number | null>(initialRound ?? null);
  const [teamTag, setTeamTag] = useState<string | null>(null);
  const [allPosts, setAllPosts] = useState<Post[]>(initialPosts ?? []);
  const [loading, setLoading] = useState(!initialPosts);

  useEffect(() => {
    if (initialPosts) return; // server-rendered data already available
    getPosts(undefined).then(({ posts }) => {
      setAllPosts(posts);
      setLoading(false);
    });
  }, [initialPosts]);

  function handleCategoryChange(value: PostCategory | undefined) {
    setCategory(value);
    setRoundTag(null);
    setTeamTag(null);
  }

  const posts = allPosts
    .filter((p) => !category || p.category === category)
    .filter((p) => roundTag === null || p.roundTag === roundTag)
    .filter((p) => teamTag === null || p.teamTag === teamTag);

  return (
    <div>
      {/* 카테고리 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            onClick={() => handleCategoryChange(cat.value)}
            className={`shrink-0 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              category === cat.value
                ? "bg-[#E8002D] text-white font-medium"
                : "bg-white/5 text-[#94A3B8] hover:text-white"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 라운드 서브 필터 (레이스 토론 선택 시) */}
      {category === "레이스 토론" && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          <button
            onClick={() => setRoundTag(null)}
            className={`shrink-0 px-3 py-1 text-xs rounded-lg transition-colors ${
              roundTag === null
                ? "bg-white/20 text-white font-medium"
                : "bg-white/5 text-[#64748B] hover:text-white"
            }`}
          >
            전체
          </button>
          {calendar.map((r) => (
            <button
              key={r.round}
              onClick={() => setRoundTag(r.round)}
              className={`shrink-0 px-3 py-1 text-xs rounded-lg transition-colors ${
                roundTag === r.round
                  ? "bg-white/20 text-white font-medium"
                  : "bg-white/5 text-[#64748B] hover:text-white"
              }`}
            >
              R{r.round} {r.koreanName}
            </button>
          ))}
        </div>
      )}
      {/* 팀 3단계 필터 (레이스 토론 → 라운드 선택 후) */}
      {category === "레이스 토론" && roundTag !== null && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide pl-2 border-l-2 border-white/10">
          <button
            onClick={() => setTeamTag(null)}
            className={`shrink-0 px-3 py-1 text-xs rounded-lg transition-colors ${
              teamTag === null
                ? "bg-white/20 text-white font-medium"
                : "bg-white/5 text-[#64748B] hover:text-white"
            }`}
          >
            전체 팀
          </button>
          {TEAM_OPTIONS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTeamTag(t.id)}
              className={`shrink-0 px-3 py-1 text-xs rounded-lg transition-colors ${
                teamTag === t.id
                  ? "bg-white/20 text-white font-medium"
                  : "bg-white/5 text-[#64748B] hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* 팀 서브 필터 (드라이버 & 팀 선택 시) */}
      {category === "드라이버 & 팀" && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          <button
            onClick={() => setTeamTag(null)}
            className={`shrink-0 px-3 py-1 text-xs rounded-lg transition-colors ${
              teamTag === null
                ? "bg-white/20 text-white font-medium"
                : "bg-white/5 text-[#64748B] hover:text-white"
            }`}
          >
            전체
          </button>
          {TEAM_OPTIONS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTeamTag(t.id)}
              className={`shrink-0 px-3 py-1 text-xs rounded-lg transition-colors ${
                teamTag === t.id
                  ? "bg-white/20 text-white font-medium"
                  : "bg-white/5 text-[#64748B] hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      {category !== "레이스 토론" && category !== "드라이버 & 팀" && <div className="mb-4" />}

      {/* 글 목록 */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-[#141420] border border-[#2D2D3A] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-[#64748B]">
          <p className="text-4xl mb-3">🏁</p>
          <p>아직 게시글이 없습니다.</p>
          <p className="text-sm mt-1">첫 글을 작성해보세요!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
