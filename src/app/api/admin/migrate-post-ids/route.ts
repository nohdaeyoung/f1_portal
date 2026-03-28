/**
 * POST /api/admin/migrate-post-ids
 *
 * 기존 posts의 Firebase 자동 ID를 createdAt 오름차순 순번(1, 2, 3...)으로 재할당.
 * comments 서브컬렉션 + likes 컬렉션도 함께 업데이트.
 * Admin 전용 (pitlane_admin 쿠키 필요).
 *
 * 안전을 위해 2단계 처리:
 *   1단계: 대상 글을 임시 ID(__tmp_{n})로 복사 + 원본 삭제
 *   2단계: 임시 ID에서 최종 순번 ID로 이동
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel max for hobby plan

export async function POST(_req: NextRequest) {
  const cookieStore = await cookies();
  if (!process.env.ADMIN_COOKIE_SECRET || cookieStore.get("pitlane_admin")?.value !== process.env.ADMIN_COOKIE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  const log: string[] = [];

  // ── 1. 전체 글 createdAt 오름차순 조회 ───────────────────
  const postsSnap = await db.collection("posts").orderBy("createdAt", "asc").get();
  const posts = postsSnap.docs;
  log.push(`총 게시글: ${posts.length}개`);

  // 이미 올바른 ID를 가진 글 건너뛰기
  const toMigrate = posts
    .map((doc, i) => ({ doc, targetId: String(i + 1) }))
    .filter(({ doc, targetId }) => doc.id !== targetId);

  if (toMigrate.length === 0) {
    await db.collection("meta").doc("postCounter").set({ count: posts.length });
    return NextResponse.json({ message: "이미 모두 순번 ID입니다.", log });
  }

  log.push(`마이그레이션 대상: ${toMigrate.length}개`);

  // ── 2. 1단계: 대상 글을 임시 ID로 복사 + 원본 삭제 ──────
  for (const { doc, targetId } of toMigrate) {
    const tmpId = `__tmp_${targetId}`;
    const postData = doc.data();

    // 글 임시 복사
    await db.collection("posts").doc(tmpId).set(postData);

    // comments 서브컬렉션 복사
    const commentsSnap = await db
      .collection("posts").doc(doc.id)
      .collection("comments").get();

    for (const commentDoc of commentsSnap.docs) {
      await db.collection("posts").doc(tmpId)
        .collection("comments").doc(commentDoc.id)
        .set({ ...commentDoc.data(), postId: targetId });
      await commentDoc.ref.delete();
    }

    // likes 복사 (postId 필드로 조회)
    const likesSnap = await db.collection("likes")
      .where("postId", "==", doc.id).get();

    if (!likesSnap.empty) {
      const batch = db.batch();
      for (const likeDoc of likesSnap.docs) {
        const likeData = likeDoc.data();
        const newLikeId = `${likeData.userId}_${targetId}`;
        batch.set(db.collection("likes").doc(newLikeId), { ...likeData, postId: targetId });
        batch.delete(likeDoc.ref);
      }
      await batch.commit();
    }

    // 원본 삭제
    await doc.ref.delete();
    log.push(`[1단계] ${doc.id} → ${tmpId}`);
  }

  // ── 3. 2단계: 임시 ID → 최종 순번 ID ─────────────────────
  for (const { targetId } of toMigrate) {
    const tmpId = `__tmp_${targetId}`;
    const tmpSnap = await db.collection("posts").doc(tmpId).get();
    if (!tmpSnap.exists) {
      log.push(`[오류] ${tmpId} 없음 (건너뜀)`);
      continue;
    }

    // 최종 ID로 복사
    await db.collection("posts").doc(targetId).set(tmpSnap.data()!);

    // comments 서브컬렉션 이동
    const commentsSnap = await db
      .collection("posts").doc(tmpId)
      .collection("comments").get();

    for (const commentDoc of commentsSnap.docs) {
      await db.collection("posts").doc(targetId)
        .collection("comments").doc(commentDoc.id)
        .set(commentDoc.data());
      await commentDoc.ref.delete();
    }

    // 임시 문서 삭제
    await tmpSnap.ref.delete();
    log.push(`[2단계] ${tmpId} → ${targetId}`);
  }

  // ── 4. postCounter 업데이트 ───────────────────────────────
  await db.collection("meta").doc("postCounter").set({ count: posts.length });
  log.push(`postCounter 설정: ${posts.length}`);

  return NextResponse.json({ message: "마이그레이션 완료", migrated: toMigrate.length, log });
}
