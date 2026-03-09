import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import { NavLinks } from "@/components/layout/NavLinks";
import { readFileSync } from "fs";
import { join } from "path";
import "./globals.css";

// ─── Admin config: Firestore → local file fallback ─────────────

async function getAdminCfg() {
  // 1) Firestore (Vercel 배포 환경)
  try {
    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    const { getFirestore } = await import("firebase-admin/firestore");
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    }
    const db = getFirestore();
    const snap = await db.doc("admin/config").get();
    if (snap.exists) {
      const data = snap.data()!;
      return { analytics: data.analytics ?? {}, meta: data.meta ?? {} };
    }
  } catch { /* fall through to local file */ }

  // 2) Local file fallback
  try {
    const raw = readFileSync(join(process.cwd(), "src/data/admin-config.json"), "utf-8");
    const parsed = JSON.parse(raw);
    return { analytics: parsed.analytics ?? {}, meta: parsed.meta ?? {} };
  } catch { return { analytics: {} as Record<string, string>, meta: {} as Record<string, string> }; }
}

async function getAnalytics() {
  const { analytics: cfg } = await getAdminCfg();
  return {
    gtmId:     (process.env.NEXT_PUBLIC_GTM_ID      ?? cfg.gtmId     ?? "").trim(),
    gaId:      (process.env.NEXT_PUBLIC_GA_ID       ?? cfg.gaId      ?? "").trim(),
    naverCode: (process.env.NEXT_PUBLIC_NAVER_CODE  ?? cfg.naverCode ?? "").trim(),
    headCode:  (cfg.headCode  ?? "").trim(),
    bodyCode:  (cfg.bodyCode  ?? "").trim(),
  };
}

async function getMetaCfg() {
  return (await getAdminCfg()).meta;
}

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_URL = "https://f1.324.ing";

const DEFAULT_TITLE = "F1 by 324.ing — F1 종합 포털";
const DEFAULT_TEMPLATE = "%s | F1 by 324.ing";
const DEFAULT_DESC = "2026 F1 드라이버 아카이브, 서킷 가이드, 시즌 트래커, AI 뉴스 브리핑을 한 곳에서.";
const DEFAULT_OG_IMAGE = "/og-default.png";
const DEFAULT_KEYWORDS = "F1,포뮬러원,Formula 1,2026 시즌,F1 드라이버,F1 서킷,그랑프리";

export async function generateMetadata(): Promise<Metadata> {
  const analytics = await getAnalytics();
  const meta = await getMetaCfg();

  const siteTitle   = meta.siteTitle?.trim()      || DEFAULT_TITLE;
  const template    = meta.titleTemplate?.trim()   || DEFAULT_TEMPLATE;
  const description = meta.description?.trim()     || DEFAULT_DESC;
  const ogTitle     = meta.ogTitle?.trim()         || siteTitle;
  const ogDesc      = meta.ogDescription?.trim()   || description;
  const ogImage     = meta.ogImage?.trim()         || DEFAULT_OG_IMAGE;
  const keywords    = meta.keywords?.trim()        || DEFAULT_KEYWORDS;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: siteTitle,
      template,
    },
    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/icon.png", type: "image/png", sizes: "512x512" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    },
    description,
    keywords: keywords.split(",").map((k: string) => k.trim()).filter(Boolean),
    authors: [{ name: "F1 by 324.ing" }],
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url: SITE_URL,
      siteName: "F1 by 324.ing",
      title: ogTitle,
      description: ogDesc,
      images: [{ url: ogImage, width: 1200, height: 630, alt: "F1 by 324.ing" }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDesc,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    other: {
      "google-adsense-account": "ca-pub-3123034690561929",
      ...(analytics.naverCode && { "naver-site-verification": analytics.naverCode }),
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const analytics = await getAnalytics();
  return (
    <html lang="ko" className={inter.variable}>
      <body className="antialiased min-h-screen flex flex-col">
        {/* GTM noscript */}
        {analytics.gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${analytics.gtmId}`}
              height="0" width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        {/* GTM */}
        {analytics.gtmId && (
          <Script id="gtm-init" strategy="afterInteractive">{`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${analytics.gtmId}');
          `}</Script>
        )}
        {/* Google Analytics */}
        {analytics.gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${analytics.gaId}`} strategy="afterInteractive" />
            <Script id="ga-init" strategy="afterInteractive">{`
              window.dataLayer=window.dataLayer||[];
              function gtag(){dataLayer.push(arguments);}
              gtag('js',new Date());
              gtag('config','${analytics.gaId}');
            `}</Script>
          </>
        )}
        {/* Custom head/body code */}
        {analytics.headCode && (
          <div dangerouslySetInnerHTML={{ __html: analytics.headCode }} />
        )}
        {analytics.bodyCode && (
          <div dangerouslySetInnerHTML={{ __html: analytics.bodyCode }} />
        )}
        {/* GNB */}
        <header className="sticky top-0 z-50 bg-bg-base/90 backdrop-blur-md border-b border-border-default">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link
              href="/"
              className="text-xl font-black tracking-tight text-white hover:text-f1-red transition-colors"
            >
              <span className="text-f1-red">F1</span> by 324.ing
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
                  <span className="text-f1-red">F1</span> by 324.ing
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
                © {new Date().getFullYear()} F1 by 324.ing. All rights reserved.
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
