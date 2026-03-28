import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPost, getPostBySlug } from "@/lib/community/posts";
import { LikeButton } from "@/components/community/LikeButton";
import { CommentSection } from "@/components/community/CommentSection";
import { BotBadge } from "@/components/community/BotBadge";
import { MarkdownBody } from "@/components/community/MarkdownBody";
import { PostEditActions } from "@/components/community/PostEditActions";

export const revalidate = 60;

async function resolvePost(postId: string) {
  const byId = await getPost(postId);
  if (byId) return byId;
  return getPostBySlug(postId);
}

export async function generateMetadata({ params }: { params: Promise<{ postId: string }> }): Promise<Metadata> {
  const { postId } = await params;
  const post = await resolvePost(postId);
  if (!post) return { title: "게시글" };
  const title = post.seo?.metaTitle ?? post.title ?? post.body.slice(0, 60);
  const description = post.seo?.metaDescription ?? post.body.slice(0, 160).replace(/\n/g, " ");
  return {
    title,
    description,
    alternates: { canonical: `https://f1.324.ing/community/${post.id}` },
    openGraph: {
      title: `${title} | F1 커뮤니티`,
      description,
      url: `https://f1.324.ing/community/${post.id}`,
      images: [{ url: "/og-default.png", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title: `${title} | F1 커뮤니티`, description },
  };
}

function formatDate(ts: { seconds: number } | null): string {
  if (!ts) return "";
  return new Date(ts.seconds * 1000).toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

interface Props {
  params: Promise<{ postId: string }>;
}

export default async function PostDetailPage({ params }: Props) {
  const { postId } = await params;
  const post = await resolvePost(postId);
  if (!post) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* 뒤로 */}
      <Link href="/community" className="text-sm text-[#64748B] hover:text-white transition-colors mb-6 inline-block">
        ← 커뮤니티
      </Link>

      {/* 게시글 */}
      <article className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6 mb-6">
        {/* 메타 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-[#64748B] bg-white/5 px-2 py-0.5 rounded-full">
            {post.category}
          </span>
          {post.roundTag && (
            <span className="text-xs text-[#E8002D] bg-[#E8002D]/10 px-2 py-0.5 rounded-full">
              라운드 {post.roundTag}
            </span>
          )}
        </div>

        {/* 제목 */}
        {post.title && (
          <h1 className="text-xl font-bold text-white mb-4">{post.title}</h1>
        )}

        {/* 작성자 */}
        <div className="flex items-center justify-between mb-5 pb-5 border-b border-[#2D2D3A]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{post.authorNickname}</span>
            {post.isBot && <BotBadge />}
            <span className="text-xs text-[#475569]">{formatDate(post.createdAt)}</span>
          </div>
          <PostEditActions postId={post.id} />
        </div>

        {/* 본문 */}
        <MarkdownBody>{post.body}</MarkdownBody>

        {/* 액션 */}
        <div className="flex items-center gap-3 mt-6 pt-5 border-t border-[#2D2D3A]">
          <LikeButton postId={post.id} initialLikes={post.likes} />
          <span className="text-sm text-[#64748B]">💬 댓글 {post.commentCount}</span>
        </div>
      </article>

      {/* 댓글 */}
      <CommentSection postId={post.id} />
    </div>
  );
}
