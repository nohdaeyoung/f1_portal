import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { getAdminDb } from "@/lib/firebase-admin";

const CONFIG_PATH = join(process.cwd(), "src/data/admin-config.json");
const FIRESTORE_DOC = "admin/config";


// ─── Read config: Firestore → local file fallback ──────────────

async function readConfig() {
  // 1) Firestore
  try {
    const db = getAdminDb();
    if (db) {
      const snap = await db.doc(FIRESTORE_DOC).get();
      if (snap.exists) return snap.data();
    }
  } catch { /* fall through */ }

  // 2) Local file fallback
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
  } catch {
    return { analytics: {}, navLinks: [] };
  }
}

// ─── Write config: Firestore + local file (if writable) ────────

async function saveConfig(body: unknown) {
  let firestoreOk = false;

  // 1) Firestore
  try {
    const db = getAdminDb();
    if (db) {
      await db.doc(FIRESTORE_DOC).set(body as Record<string, unknown>);
      firestoreOk = true;
    }
  } catch { /* fall through */ }

  // 2) Local file (dev / writable env)
  try {
    writeFileSync(CONFIG_PATH, JSON.stringify(body, null, 2), "utf-8");
  } catch { /* read-only on Vercel — OK if Firestore succeeded */ }

  return firestoreOk;
}

// ─── Routes ────────────────────────────────────────────────────

export async function GET() {
  const cookieStore = await cookies();
  if (!process.env.ADMIN_COOKIE_SECRET || cookieStore.get("pitlane_admin")?.value !== process.env.ADMIN_COOKIE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await readConfig());
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && !origin.includes("f1.324.ing") && !origin.includes("localhost")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cookieStore = await cookies();
  if (!process.env.ADMIN_COOKIE_SECRET || cookieStore.get("pitlane_admin")?.value !== process.env.ADMIN_COOKIE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const saved = await saveConfig(body);

  if (!saved) {
    return NextResponse.json({ ok: true, warning: "filesystem_readonly" });
  }
  return NextResponse.json({ ok: true });
}
