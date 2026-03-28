import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminDb } from "@/lib/firebase-admin";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const db = getAdminDb();
  if (!db) return NextResponse.json({}, { status: 200 });
  try {
    const snap = await db.doc(`circuits/${id}`).get();
    return NextResponse.json(snap.exists ? snap.data() : {});
  } catch {
    return NextResponse.json({}, { status: 200 });
  }
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;

  const cookieStore = await cookies();
  if (!process.env.ADMIN_COOKIE_SECRET || cookieStore.get("pitlane_admin")?.value !== process.env.ADMIN_COOKIE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const db = getAdminDb();
  if (!db) return NextResponse.json({ ok: false, error: "no_db" }, { status: 500 });

  try {
    await db.doc(`circuits/${id}`).set(body, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
