import { NextResponse } from "next/server";

const COOKIE_NAME = "pitlane_admin";

export async function POST(req: Request) {
  try {
    const adminId = process.env.ADMIN_ID;
    const adminPw = process.env.ADMIN_PW;
    const cookieSecret = process.env.ADMIN_COOKIE_SECRET;

    if (!adminId || !adminPw || !cookieSecret) {
      return NextResponse.json({ error: "Admin not configured" }, { status: 503 });
    }

    const body = await req.json();
    const { id, pw } = body;

    if (id !== adminId || pw !== adminPw) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, cookieSecret, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 8,
      path: "/",
    });

    return res;
  } catch (e) {
    console.error("[admin/login] error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
