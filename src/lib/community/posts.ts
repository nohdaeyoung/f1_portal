import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  serverTimestamp,
  increment,
  type DocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type PostCategory = "레이스 토론" | "드라이버 & 팀" | "기술 & 규정" | "잡담";

export interface PostSeo {
  metaTitle: string | null;
  metaDescription: string | null;
  primaryKeyword: string | null;
  secondaryKeywords: string | null;
  slug: string | null;
}

export interface Post {
  id: string;
  authorId: string;
  authorNickname: string;
  authorAvatarUrl: string | null;
  category: PostCategory;
  title: string | null;
  body: string;
  imageUrl: string | null;
  roundTag: number | null;
  likes: number;
  commentCount: number;
  isBot: boolean;
  botPersonaId: string | null;
  teamTag: string | null;
  seo: PostSeo | null;
  createdAt: { seconds: number; nanoseconds: number } | null;
  updatedAt: { seconds: number; nanoseconds: number } | null;
}

const PAGE_SIZE = 20;

function toPost(snap: DocumentSnapshot): Post {
  const d = snap.data()!;
  return {
    id: snap.id,
    authorId: d.authorId,
    authorNickname: d.authorNickname,
    authorAvatarUrl: d.authorAvatarUrl ?? null,
    category: d.category,
    title: d.title ?? null,
    body: d.body,
    imageUrl: d.imageUrl ?? null,
    roundTag: d.roundTag ?? null,
    likes: d.likes ?? 0,
    commentCount: d.commentCount ?? 0,
    isBot: d.isBot ?? false,
    botPersonaId: d.botPersonaId ?? null,
    teamTag: d.teamTag ?? null,
    seo: d.seo ?? null,
    createdAt: d.createdAt ?? null,
    updatedAt: d.updatedAt ?? null,
  };
}

/** 게시글 목록 (카테고리 필터, 커서 페이지네이션) */
export async function getPosts(
  category?: PostCategory,
  cursor?: DocumentSnapshot
): Promise<{ posts: Post[]; lastDoc: DocumentSnapshot | null }> {
  let q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc"),
    limit(PAGE_SIZE)
  );
  if (category) q = query(q, where("category", "==", category));
  if (cursor) q = query(q, startAfter(cursor));

  const snap = await getDocs(q);
  const posts = snap.docs.map(toPost);
  return { posts, lastDoc: snap.docs[snap.docs.length - 1] ?? null };
}

/** 단일 게시글 조회 */
export async function getPost(postId: string): Promise<Post | null> {
  const snap = await getDoc(doc(db, "posts", postId));
  return snap.exists() ? toPost(snap) : null;
}

/** slug로 게시글 조회 (seo.slug 필드 쿼리) */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const q = query(
    collection(db, "posts"),
    where("seo.slug", "==", slug),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return toPost(snap.docs[0]);
}

/** 게시글 작성 */
export async function createPost(data: {
  authorId: string;
  authorNickname: string;
  authorAvatarUrl: string | null;
  category: PostCategory;
  title: string | null;
  body: string;
  imageUrl: string | null;
  roundTag: number | null;
  isBot?: boolean;
  botPersonaId?: string | null;
  teamTag?: string | null;
  seo?: PostSeo | null;
  customId?: string;
}): Promise<string> {
  const payload = {
    ...data,
    likes: 0,
    commentCount: 0,
    isBot: data.isBot ?? false,
    botPersonaId: data.botPersonaId ?? null,
    teamTag: data.teamTag ?? null,
    seo: data.seo ?? null,
    createdAt: serverTimestamp(),
    updatedAt: null,
  };

  if (data.customId) {
    const ref = doc(db, "posts", data.customId);
    const existing = await getDoc(ref);
    if (existing.exists()) throw new Error("SLUG_TAKEN");
    await setDoc(ref, payload);
    return data.customId;
  }

  // 클라이언트 SDK는 보안 규칙 제약으로 직접 호출하지 않음.
  // 글 작성은 POST /api/posts (Admin SDK) 를 통해 처리됨.
  throw new Error("Use POST /api/posts instead");
}

/** 게시글 수정 */
export async function updatePost(
  postId: string,
  data: {
    title?: string | null;
    body?: string;
    category?: PostCategory;
    roundTag?: number | null;
    teamTag?: string | null;
    seo?: PostSeo | null;
  }
): Promise<void> {
  await updateDoc(doc(db, "posts", postId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/** 게시글 삭제 */
export async function deletePost(postId: string): Promise<void> {
  await deleteDoc(doc(db, "posts", postId));
}

/** 좋아요 토글 (denormalized counter) */
export async function toggleLike(
  postId: string,
  userId: string,
  liked: boolean
): Promise<void> {
  const likeId = `${userId}_${postId}`;
  const likeRef = doc(db, "likes", likeId);
  const postRef = doc(db, "posts", postId);

  if (liked) {
    await deleteDoc(likeRef);
    updateDoc(postRef, { likes: increment(-1) }).catch(() => {});
  } else {
    await setDoc(likeRef, { userId, postId, createdAt: serverTimestamp() });
    updateDoc(postRef, { likes: increment(1) }).catch(() => {});
  }
}

/** 좋아요 여부 확인 */
export async function isLiked(postId: string, userId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "likes", `${userId}_${postId}`));
  return snap.exists();
}
