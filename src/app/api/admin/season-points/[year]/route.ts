import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminDb } from "@/lib/firebase-admin";

async function isAuthed() {
  const cookieStore = await cookies();
  return !!process.env.ADMIN_COOKIE_SECRET && cookieStore.get("pitlane_admin")?.value === process.env.ADMIN_COOKIE_SECRET;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ year: string }> }
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year } = await params;
  try {
    const db = getAdminDb();
    if (!db) return NextResponse.json(null);
    const snap = await db.doc(`seasonPoints/${year}`).get();
    if (!snap.exists) return NextResponse.json(null);
    return NextResponse.json(snap.data());
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ year: string }> }
) {
  const origin = req.headers.get("origin");
  if (origin && !origin.includes("f1.324.ing") && !origin.includes("localhost")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year } = await params;
  const body = await req.json();

  try {
    const db = getAdminDb();
    if (!db) return NextResponse.json({ ok: false, error: "Firebase unavailable" });
    await db.doc(`seasonPoints/${year}`).set(body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
