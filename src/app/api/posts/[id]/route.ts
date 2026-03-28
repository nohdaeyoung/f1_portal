import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cookies } from "next/headers";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

/**
 * GET /api/posts/[id]
 *
 * Returns a single post by its ID (or slug if used as document ID).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const snap = await getDoc(doc(db, "posts", id));

    if (!snap.exists()) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const d = snap.data()!;
    return NextResponse.json({
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
    });
  } catch (err) {
    console.error("[api/posts/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/posts/[id]
 * Admin only — updates a post using Firebase Admin SDK.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const secret = process.env.ADMIN_COOKIE_SECRET;
  if (!secret || cookieStore.get("pitlane_admin")?.value !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await req.json();
    const { title, body, category, roundTag, teamTag, seo } = data;

    const { FieldValue } = await import("firebase-admin/firestore");
    await getAdminDb().collection("posts").doc(id).update({
      ...(title !== undefined && { title: title ?? null }),
      ...(body !== undefined && { body }),
      ...(category !== undefined && { category }),
      ...(roundTag !== undefined && { roundTag: roundTag ?? null }),
      ...(teamTag !== undefined && { teamTag: teamTag ?? null }),
      ...(seo !== undefined && { seo: seo ?? null }),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/posts/[id] PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/posts/[id]
 * Admin only — uses Firebase Admin SDK to bypass Firestore rules.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const secret = process.env.ADMIN_COOKIE_SECRET;
  if (!secret || cookieStore.get("pitlane_admin")?.value !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  }

  try {
    const { id } = await params;
    await getAdminDb().collection("posts").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/posts/[id] DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
