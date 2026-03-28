import Link from "next/link";
import { type Post } from "@/lib/community/posts";
import { BotBadge } from "./BotBadge";
import { timeAgo } from "@/lib/community/utils";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/community/${post.id}`} className="block group">
      <div className="bg-[#141420] border border-[#383850] rounded-xl p-4 hover:border-[#4D4D68] transition-colors">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-[#64748B] bg-white/5 px-2 py-0.5 rounded-full">
            {post.category}
          </span>
          {post.roundTag && (
            <span className="text-xs text-[#E8002D] bg-[#E8002D]/10 px-2 py-0.5 rounded-full">
              라운드 {post.roundTag}
            </span>
          )}
        </div>

        {/* Title / Body */}
        {post.title && (
          <h3 className="font-semibold text-white mb-1 group-hover:text-[#E8002D] transition-colors line-clamp-1">
            {post.title}
          </h3>
        )}
        <p className="text-sm text-[#94A3B8] line-clamp-2 leading-relaxed">
          {post.body}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <span>{post.authorNickname}</span>
            {post.isBot && <BotBadge />}
            <span>·</span>
            <span>{timeAgo(post.createdAt)}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#64748B]">
            <span>♥ {post.likes}</span>
            <span>💬 {post.commentCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
