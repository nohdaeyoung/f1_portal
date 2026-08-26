"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/community/AuthContext";
import { getComments, createComment, deleteComment, type Comment } from "@/lib/community/comments";
import { timeAgo } from "@/lib/community/utils";

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getComments(postId).then(setComments);
  }, [postId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !body.trim() || submitting) return;
    setSubmitting(true);
    try {
      const id = await createComment({
        postId,
        authorId: user.uid,
        authorNickname: user.displayName ?? "팬",
        body: body.trim(),
        parentId: replyTo,
      });
      setComments((prev) => [
        ...prev,
        {
          id,
          postId,
          authorId: user.uid,
          authorNickname: user.displayName ?? "팬",
          body: body.trim(),
          parentId: replyTo,
          createdAt: null,
        },
      ]);
      setBody("");
      setReplyTo(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    await deleteComment(postId, commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  const topComments = comments.filter((c) => !c.parentId);
  const replies = comments.filter((c) => c.parentId);

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider mb-4">
        댓글 {comments.length}
      </h3>

      {/* 댓글 작성 */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-6">
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 text-xs text-[#64748B]">
              <span>↩ 대댓글 작성 중</span>
              <button type="button" onClick={() => setReplyTo(null)} className="text-[#E8002D]">
                취소
              </button>
            </div>
          )}
          <div className="flex gap-3">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="댓글을 남겨보세요..."
              className="flex-1 bg-[#141420] border border-[#2D2D3A] rounded-lg px-3 py-2 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#E8002D] resize-none"
            />
            <button
              type="submit"
              disabled={!body.trim() || submitting}
              className="self-end px-4 py-2 text-sm bg-[#E8002D] text-white rounded-lg hover:bg-[#CC0028] disabled:opacity-50 transition-colors"
            >
              등록
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-[#64748B] mb-4">로그인 후 댓글을 작성할 수 있습니다.</p>
      )}

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {topComments.map((comment) => (
          <div key={comment.id}>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white">{comment.authorNickname}</span>
                  <span className="text-xs text-[#475569]">{timeAgo(comment.createdAt)}</span>
                </div>
                <p className="text-sm text-[#94A3B8] leading-relaxed">{comment.body}</p>
                <div className="flex items-center gap-3 mt-1">
                  {user && (
                    <button
                      onClick={() => setReplyTo(comment.id)}
                      className="text-xs text-[#475569] hover:text-white transition-colors"
                    >
                      답글
                    </button>
                  )}
                  {user?.uid === comment.authorId && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-xs text-[#475569] hover:text-[#E8002D] transition-colors"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 대댓글 */}
            {replies.filter((r) => r.parentId === comment.id).map((reply) => (
              <div key={reply.id} className="ml-6 mt-3 pl-4 border-l border-[#2D2D3A]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white">{reply.authorNickname}</span>
                  <span className="text-xs text-[#475569]">{timeAgo(reply.createdAt)}</span>
                </div>
                <p className="text-sm text-[#94A3B8]">{reply.body}</p>
                {user?.uid === reply.authorId && (
                  <button
                    onClick={() => handleDelete(reply.id)}
                    className="text-xs text-[#475569] hover:text-[#E8002D] transition-colors mt-1"
                  >
                    삭제
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
