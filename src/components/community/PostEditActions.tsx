"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  postId: string;
}

export function PostEditActions({ postId }: Props) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/check")
      .then((r) => r.json())
      .then((d) => setIsAdmin(d.isAdmin === true))
      .catch(() => {});
  }, []);

  if (!isAdmin) return null;

  async function handleDelete() {
    if (!confirm("게시글을 삭제하시겠습니까?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      router.push("/community");
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Link
        href={`/community/${postId}/edit`}
        className="px-3 py-1.5 text-xs text-[#94A3B8] hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
      >
        수정
      </Link>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="px-3 py-1.5 text-xs text-[#94A3B8] hover:text-red-400 bg-white/5 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
      >
        {deleting ? "삭제 중..." : "삭제"}
      </button>
    </div>
  );
}
