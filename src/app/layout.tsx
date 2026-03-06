import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { NavLinks } from "@/components/layout/NavLinks";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_URL = "https://f1.324.ing";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PitLane — F1 종합 포털",
    template: "%s | PitLane",
  },
  description: "2026 F1 드라이버 아카이브, 서킷 가이드, 시즌 트래커, AI 뉴스 브리핑을 한 곳에서.",
  keywords: ["F1", "포뮬러원", "Formula 1", "2026 시즌", "F1 드라이버", "F1 서킷", "그랑프리"],
  authors: [{ name: "PitLane" }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "PitLane",
    title: "PitLane — F1 종합 포털",
    description: "2026 F1 드라이버 아카이브, 서킷 가이드, 시즌 트래커, AI 뉴스 브리핑을 한 곳에서.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "PitLane F1 포털" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PitLane — F1 종합 포털",
    description: "2026 F1 드라이버 아카이브, 서킷 가이드, 시즌 트래커, AI 뉴스 브리핑을 한 곳에서.",
    images: ["/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={inter.variable}>
      <body className="antialiased min-h-screen flex flex-col">
        {/* GNB */}
        <header className="sticky top-0 z-50 bg-bg-base/90 backdrop-blur-md border-b border-border-default">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link
              href="/"
              className="text-xl font-black tracking-tight text-white hover:text-f1-red transition-colors"
            >
              Pit<span className="text-f1-red">Lane</span>
            </Link>
            <NavLinks />
          </nav>
        </header>

        {/* Main */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-border-default mt-16">
          {/* Main footer */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">

              {/* Brand */}
              <div>
                <Link
                  href="/"
                  className="text-xl font-black text-white hover:text-f1-red transition-colors"
                >
                  Pit<span className="text-f1-red">Lane</span>
                </Link>
                <p className="mt-2 text-xs text-text-muted leading-relaxed">
                  2026 F1 종합 포털 — 규정, 드라이버, 팀,<br />
                  서킷, 시즌 정보를 한 곳에서.
                </p>
              </div>

              {/* Navigation */}
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">
                  페이지
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { href: "/news", label: "뉴스" },
                    { href: "/season", label: "시즌" },
                    { href: "/drivers", label: "드라이버" },
                    { href: "/teams", label: "팀" },
                    { href: "/circuits", label: "서킷" },
                    { href: "/history", label: "역사" },
                    { href: "/info", label: "레귤레이션" },
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-sm text-text-muted hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Dev */}
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">
                  개발
                </p>
                <div className="space-y-2">
                  <Link
                    href="/devlog"
                    className="flex items-center gap-2 text-sm text-text-muted hover:text-white transition-colors group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-status-active group-hover:animate-pulse" />
                    개발 노트
                    <span className="text-xs text-status-active bg-status-active/10 px-1.5 py-0.5 rounded font-bold">
                      매일 7시 갱신
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-border-default">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-xs text-text-muted">
                © {new Date().getFullYear()} PitLane. All rights reserved.
              </p>
              <p className="text-xs text-text-muted">
                Data: Jolpica F1 API · OpenF1 · GitHub &mdash; Not affiliated with Formula 1® or FIA.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
