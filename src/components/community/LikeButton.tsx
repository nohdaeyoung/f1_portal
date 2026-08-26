"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/community/AuthContext";
import { toggleLike, isLiked } from "@/lib/community/posts";

interface LikeButtonProps {
  postId: string;
  initialLikes: number;
}

export function LikeButton({ postId, initialLikes }: LikeButtonProps) {
  const { user } = useAuth();
  const userId = user?.uid ?? null;
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialLikes);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    isLiked(postId, userId).then(setLiked);
  }, [postId, userId]);

  async function handleLike() {
    if (!userId || loading) return;
    setLoading(true);
    const prev = liked;
    setLiked(!prev);
    setCount((c) => c + (prev ? -1 : 1));
    try {
      await toggleLike(postId, userId, prev);
    } catch {
      setLiked(prev);
      setCount((c) => c + (prev ? 1 : -1));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLike}
      disabled={!userId}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
        liked
          ? "bg-[#E8002D]/15 text-[#E8002D]"
          : "bg-white/5 text-[#64748B] hover:text-white hover:bg-white/10"
      } disabled:cursor-not-allowed`}
      title={!userId ? "로그인 후 좋아요를 누를 수 있습니다" : undefined}
    >
      {liked ? "♥" : "♡"} {count}
    </button>
  );
}
