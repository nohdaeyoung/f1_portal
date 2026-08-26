import { Metadata } from "next";
import { Suspense } from "react";
import CompareClient from "./CompareClient";

export const metadata: Metadata = {
  title: "드라이버 비교",
  description: "두 F1 드라이버의 커리어 통계와 패스티스트랩 텔레메트리를 직접 비교하세요.",
  openGraph: {
    title: "드라이버 비교 | F1 by 324.ing",
    description: "두 F1 드라이버의 커리어 통계와 패스티스트랩 텔레메트리를 직접 비교하세요.",
    url: "https://f1.324.ing/compare",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-8 text-[#475569]">로딩 중...</div>}>
      <CompareClient />
    </Suspense>
  );
}
