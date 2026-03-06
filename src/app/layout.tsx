import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "PitLane - F1 종합 포털",
  description: "드라이버 아카이브, 서킷 가이드, 시즌 트래커, 뉴스 허브를 하나로",
};

const navLinks = [
  { href: "/news", label: "뉴스" },
  { href: "/season", label: "시즌" },
  { href: "/drivers", label: "드라이버" },
  { href: "/teams", label: "팀" },
  { href: "/circuits", label: "서킷" },
  { href: "/info", label: "정보" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen flex flex-col">
        {/* GNB */}
        <header className="sticky top-0 z-50 bg-[#0A0A0F]/90 backdrop-blur-md border-b border-[#2D2D3A]">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link
              href="/"
              className="text-xl font-black tracking-tight text-white hover:text-[#E8002D] transition-colors"
            >
              Pit<span className="text-[#E8002D]">Lane</span>
            </Link>
            <div className="flex items-center gap-1 sm:gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-sm font-medium text-[#64748B] hover:text-white transition-colors rounded-lg hover:bg-white/5"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </header>

        {/* Main */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-[#2D2D3A] mt-16">
          {/* Main footer */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">

              {/* Brand */}
              <div>
                <Link
                  href="/"
                  className="text-xl font-black text-white hover:text-[#E8002D] transition-colors"
                >
                  Pit<span className="text-[#E8002D]">Lane</span>
                </Link>
                <p className="mt-2 text-xs text-[#64748B] leading-relaxed">
                  2026 F1 종합 포털 — 규정, 드라이버, 팀,<br />
                  서킷, 시즌 정보를 한 곳에서.
                </p>
              </div>

              {/* Navigation */}
              <div>
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-3">
                  페이지
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { href: "/news", label: "뉴스" },
                    { href: "/season", label: "시즌" },
                    { href: "/drivers", label: "드라이버" },
                    { href: "/teams", label: "팀" },
                    { href: "/circuits", label: "서킷" },
                    { href: "/info", label: "정보 허브" },
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-sm text-[#64748B] hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Dev */}
              <div>
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-3">
                  개발
                </p>
                <div className="space-y-2">
                  <Link
                    href="/devlog"
                    className="flex items-center gap-2 text-sm text-[#64748B] hover:text-white transition-colors group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] group-hover:animate-pulse" />
                    개발 노트
                    <span className="text-[10px] text-[#22C55E] bg-[#22C55E]/10 px-1.5 py-0.5 rounded font-bold">
                      매일 7시 갱신
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-[#2D2D3A]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-xs text-[#64748B]">
                © {new Date().getFullYear()} PitLane. All rights reserved.
              </p>
              <p className="text-xs text-[#64748B]">
                Data: Jolpica F1 API · OpenF1 · GitHub &mdash; Not affiliated with Formula 1® or FIA.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
