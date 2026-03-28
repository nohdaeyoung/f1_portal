import { notFound } from "next/navigation";
import Link from "next/link";
import { getPost } from "@/lib/community/posts";
import { PostEditForm } from "@/components/community/PostEditForm";

interface Props {
  params: Promise<{ postId: string }>;
}

export default async function EditPostPage({ params }: Props) {
  const { postId } = await params;
  const post = await getPost(postId);
  if (!post) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href={`/community/${postId}`}
        className="text-sm text-[#64748B] hover:text-white transition-colors mb-6 inline-block"
      >
        ← 게시글로 돌아가기
      </Link>
      <h1 className="text-xl font-bold text-white mb-6">게시글 수정</h1>
      <PostEditForm post={post} />
    </div>
  );
}
