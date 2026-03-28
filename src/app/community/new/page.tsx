import type { Metadata } from "next";
import Link from "next/link";
import { PostForm } from "@/components/community/PostForm";

export const metadata: Metadata = {
  title: "글쓰기",
  robots: { index: false, follow: false },
};

export default function NewPostPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/community" className="text-[#64748B] hover:text-white transition-colors text-sm">
          ← 커뮤니티
        </Link>
        <h1 className="text-xl font-bold text-white">글쓰기</h1>
      </div>
      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6">
        <PostForm />
      </div>
    </div>
  );
}
