import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const secret = process.env.ADMIN_COOKIE_SECRET;
  const isAdmin = !!secret && cookieStore.get("pitlane_admin")?.value === secret;
  return NextResponse.json({ isAdmin });
}
