import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
  where,
  startAfter,
  type DocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAdminDb, getAdminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

const MAX_LIMIT = 50;

function toPostJson(snap: DocumentSnapshot) {
  if (!snap.exists()) return null;
  const d = snap.data()!;
  return {
    id: snap.id,
    authorId: d.authorId,
    authorNickname: d.authorNickname,
    category: d.category,
    title: d.title ?? null,
    body: d.body,
    roundTag: d.roundTag ?? null,
    teamTag: d.teamTag ?? null,
    likes: d.likes ?? 0,
    commentCount: d.commentCount ?? 0,
    isBot: d.isBot ?? false,
    seo: d.seo ?? null,
    createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
    updatedAt: d.updatedAt?.toDate?.()?.toISOString() ?? null,
  };
}

/**
 * GET /api/posts
 *
 * Query params:
 *   category   - "레이스 토론" | "드라이버 & 팀" | "기술 & 규정" | "잡담"
 *   round      - number (roundTag filter)
 *   limit      - number (default: 20, max: 50)
 *   after      - document ID to paginate from (startAfter cursor)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category") ?? undefined;
    const round = searchParams.get("round");
    const limitParam = Math.min(parseInt(searchParams.get("limit") ?? "20"), MAX_LIMIT);
    const afterId = searchParams.get("after") ?? undefined;

    let q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(limitParam)
    );

    if (category) q = query(q, where("category", "==", category));
    if (round) q = query(q, where("roundTag", "==", parseInt(round)));

    if (afterId) {
      const cursorSnap = await getDoc(doc(db, "posts", afterId));
      if (cursorSnap.exists()) q = query(q, startAfter(cursorSnap));
    }

    const snap = await getDocs(q);
    const posts = snap.docs.map(toPostJson).filter(Boolean);
    const lastId = snap.docs[snap.docs.length - 1]?.id ?? null;

    return NextResponse.json({
      posts,
      count: posts.length,
      nextCursor: lastId,
    });
  } catch (err) {
    console.error("[api/posts]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/posts
 *
 * 글 작성. Admin SDK 트랜잭션으로 순번 ID 발급 (meta/postCounter).
 * Auth: pitlane_admin 쿠키 or Authorization: Bearer {Firebase ID token}
 */
export async function POST(req: NextRequest) {
  // ── 인증 ──────────────────────────────────────────────────
  const cookieStore = await cookies();
  const secret = process.env.ADMIN_COOKIE_SECRET;
  const isAdmin = !!secret && cookieStore.get("pitlane_admin")?.value === secret;

  let authorId = "admin";
  let authorNickname = "관리자";
  let authorAvatarUrl: string | null = null;

  if (!isAdmin) {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
      const decoded = await getAdminAuth().verifyIdToken(token);
      authorId = decoded.uid;
      authorNickname = (decoded.name as string | undefined) ?? "사용자";
      authorAvatarUrl = (decoded.picture as string | undefined) ?? null;
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // ── 요청 본문 파싱 ────────────────────────────────────────
  const data = await req.json();
  const { category, title, body: bodyText, imageUrl, roundTag, teamTag, seo } = data;

  if (!bodyText?.trim()) return NextResponse.json({ error: "body required" }, { status: 400 });

  const payload = {
    authorId,
    authorNickname,
    authorAvatarUrl,
    category,
    title: title ?? null,
    body: bodyText.trim(),
    imageUrl: imageUrl ?? null,
    roundTag: roundTag ?? null,
    teamTag: teamTag ?? null,
    seo: seo ?? null,
    likes: 0,
    commentCount: 0,
    isBot: false,
    botPersonaId: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: null,
  };

  const adminDb = getAdminDb();

  // ── 순번 ID (트랜잭션) ────────────────────────────────────
  const counterRef = adminDb.collection("meta").doc("postCounter");
  const newId = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const count = (snap.data()?.count ?? 0) + 1;
    tx.set(counterRef, { count });
    tx.set(adminDb.collection("posts").doc(String(count)), payload);
    return String(count);
  });

  return NextResponse.json({ id: newId }, { status: 201 });
}
