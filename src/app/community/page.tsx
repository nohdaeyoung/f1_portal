import type { Metadata } from "next";
import Link from "next/link";
import { AuthButton } from "@/components/community/AuthButton";
import { PostList } from "@/components/community/PostList";
import type { Post } from "@/lib/community/posts";
import { getAdminDb } from "@/lib/firebase-admin";

export const revalidate = 300; // 5분 ISR — Google이 게시글 목록을 색인할 수 있음

export const metadata: Metadata = {
  title: "커뮤니티",
  description: "F1 팬들과 레이스 결과, 드라이버, 팀에 대해 이야기를 나눠보세요. 라운드별 토론, 분석 게시글, 예선·레이스 실시간 반응.",
  keywords: ["F1 커뮤니티", "F1 팬 포럼", "그랑프리 토론", "F1 레이스 분석"],
  alternates: { canonical: "https://f1.324.ing/community" },
  openGraph: {
    title: "F1 커뮤니티 | F1 by 324.ing",
    description: "F1 팬들과 레이스 결과, 드라이버, 팀에 대해 이야기를 나눠보세요.",
    url: "https://f1.324.ing/community",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "F1 커뮤니티" }],
  },
  twitter: { card: "summary_large_image", title: "F1 커뮤니티 | F1 by 324.ing", description: "F1 팬들과 레이스 결과, 드라이버, 팀에 대해 이야기를 나눠보세요." },
};

async function fetchInitialPosts(): Promise<Post[]> {
  if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    return [];
  }
  try {
    const db = getAdminDb();
    const snap = await db.collection("posts").orderBy("createdAt", "desc").limit(50).get();
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        authorId: data.authorId,
        authorNickname: data.authorNickname,
        authorAvatarUrl: data.authorAvatarUrl ?? null,
        category: data.category,
        title: data.title ?? null,
        body: data.body,
        imageUrl: data.imageUrl ?? null,
        roundTag: data.roundTag ?? null,
        likes: data.likes ?? 0,
        commentCount: data.commentCount ?? 0,
        isBot: data.isBot ?? false,
        botPersonaId: data.botPersonaId ?? null,
        teamTag: data.teamTag ?? null,
        seo: data.seo ?? null,
        createdAt: data.createdAt
          ? { seconds: data.createdAt.seconds, nanoseconds: data.createdAt.nanoseconds }
          : null,
        updatedAt: data.updatedAt
          ? { seconds: data.updatedAt.seconds, nanoseconds: data.updatedAt.nanoseconds }
          : null,
      } satisfies Post;
    });
  } catch {
    return [];
  }
}

interface Props {
  searchParams: Promise<{ round?: string }>;
}

export default async function CommunityPage({ searchParams }: Props) {
  const { round } = await searchParams;
  const initialRound = round ? parseInt(round) : undefined;
  const initialPosts = await fetchInitialPosts();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">커뮤니티</h1>
          <p className="text-sm text-[#64748B] mt-1">F1 팬들과 이야기를 나눠보세요</p>
        </div>
        <div className="flex items-center gap-3">
          <AuthButton />
          <Link
            href="/community/new"
            className="px-4 py-2 text-sm bg-[#E8002D] text-white font-medium rounded-lg hover:bg-[#CC0028] transition-colors"
          >
            글쓰기
          </Link>
        </div>
      </div>

      <PostList
        initialRound={isNaN(initialRound!) ? undefined : initialRound}
        initialPosts={initialPosts}
      />
    </div>
  );
}
