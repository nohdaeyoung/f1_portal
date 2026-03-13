import { NextResponse } from "next/server";

const COOKIE_NAME = "pitlane_admin";

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: "No token" }, { status: 400 });
    }

    const cookieSecret = process.env.ADMIN_COOKIE_SECRET;
    const allowedEmail = process.env.ADMIN_GOOGLE_EMAIL;
    if (!cookieSecret || !allowedEmail) {
      return NextResponse.json({ error: "Admin not configured" }, { status: 503 });
    }

    // Firebase Admin으로 ID token 검증
    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    const { getAuth } = await import("firebase-admin/auth");

    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    }

    const decoded = await getAuth().verifyIdToken(idToken);
    const receivedEmail = (decoded.email ?? "").trim().toLowerCase();
    const expectedEmail = allowedEmail.trim().toLowerCase();
    if (receivedEmail !== expectedEmail) {
      return NextResponse.json({ error: "Unauthorized email", received: receivedEmail, expected: expectedEmail }, { status: 403 });
    }

    const res = NextResponse.json({ ok: true, email: decoded.email });
    res.cookies.set(COOKIE_NAME, cookieSecret, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 8,
      path: "/",
    });

    return res;
  } catch (e) {
    console.error("[admin/google-login] error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
