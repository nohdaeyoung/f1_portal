import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "pitlane_admin";

export async function POST(req: Request) {
  const adminId = process.env.ADMIN_ID;
  const adminPw = process.env.ADMIN_PW;
  const cookieSecret = process.env.ADMIN_COOKIE_SECRET;

  if (!adminId || !adminPw || !cookieSecret) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 503 });
  }

  const { id, pw } = await req.json();

  if (id !== adminId || pw !== adminPw) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, cookieSecret, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
