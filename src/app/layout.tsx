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
        <footer className="border-t border-[#2D2D3A] py-8 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-[#64748B]">
            <p>
              Pit<span className="text-[#E8002D]">Lane</span> &mdash; F1 종합 포털
            </p>
            <p className="mt-1 text-xs">
              Data from Jolpica F1 API & OpenF1. Not affiliated with Formula 1.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
