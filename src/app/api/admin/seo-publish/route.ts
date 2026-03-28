import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

type Category = "레이스 토론" | "드라이버 & 팀" | "기술 & 규정" | "잡담";

const VALID_CATEGORIES: Category[] = [
  "레이스 토론",
  "드라이버 & 팀",
  "기술 & 규정",
  "잡담",
];

/**
 * POST /api/admin/seo-publish
 *
 * SEO Machine에서 작성한 글을 커뮤니티에 게시합니다.
 * Authorization: Bearer {CRON_SECRET}
 *
 * Body:
 *   title       - 글 제목
 *   body        - 본문 (마크다운 또는 텍스트)
 *   category    - "레이스 토론" | "드라이버 & 팀" | "기술 & 규정" | "잡담"
 *   roundTag    - 라운드 번호 (선택)
 *   seo         - SEO 메타데이터 (선택)
 */
export async function POST(request: NextRequest) {
  // 인증
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Firebase Admin 설정 확인
  if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    return NextResponse.json(
      { error: "Firebase Admin not configured" },
      { status: 503 }
    );
  }

  let body: {
    title?: string;
    body?: string;
    category?: string;
    roundTag?: number;
    seo?: Record<string, string>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // 필수 필드 검증
  if (!body.body || body.body.trim().length === 0) {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }

  const category: Category = VALID_CATEGORIES.includes(body.category as Category)
    ? (body.category as Category)
    : "레이스 토론";

  try {
    const db = getAdminDb();

    const postBody = body.body.trim();

    const payload = {
      authorId: "seo_machine",
      authorNickname: "사미사 admin",
      authorAvatarUrl: null,
      category,
      title: body.title ?? null,
      body: postBody,
      imageUrl: null,
      roundTag: body.roundTag ?? null,
      teamTag: null,
      likes: 0,
      commentCount: 0,
      isBot: true,
      botPersonaId: "seo_machine",
      seo: body.seo ?? null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: null,
    };

    const counterRef = db.collection("meta").doc("postCounter");
    const newId = await db.runTransaction(async (tx) => {
      const snap = await tx.get(counterRef);
      const count = (snap.data()?.count ?? 0) + 1;
      tx.set(counterRef, { count });
      tx.set(db.collection("posts").doc(String(count)), payload);
      return String(count);
    });

    return NextResponse.json({
      success: true,
      postId: newId,
      postUrl: `https://f1.324.ing/community/${newId}`,
      category,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[api/admin/seo-publish]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
