import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE = "pitlane_admin";

function isAuthenticated(request: NextRequest) {
  const secret = process.env.ADMIN_COOKIE_SECRET;
  if (!secret) return false; // 환경변수 미설정 시 인증 불가 (안전한 기본값)
  return request.cookies.get(ADMIN_COOKIE)?.value === secret;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin 페이지 보호 (로그인 페이지 제외)
  if (pathname.startsWith("/admin") && pathname !== "/admin") {
    if (!isAuthenticated(request)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // /api/admin/* 보호 (로그인 API 및 자체 Bearer 토큰 인증 API 제외)
  const publicAdminApis = ["/api/admin/login", "/api/admin/google-login", "/api/admin/seo-publish"];
  if (pathname.startsWith("/api/admin/") && !publicAdminApis.includes(pathname)) {
    if (!isAuthenticated(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
