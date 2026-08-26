import { Metadata } from "next";
import FantasyClient from "./FantasyClient";

export const metadata: Metadata = {
  title: "F1 Fantasy 헬퍼",
  description: "2026 F1 Fantasy 팀을 최적화하세요. 드라이버 & 컨스트럭터 가격표, 예산 계산기, 포인트 효율 분석.",
  openGraph: {
    title: "F1 Fantasy 헬퍼 | F1 by 324.ing",
    description: "2026 F1 Fantasy 팀을 최적화하세요. 드라이버 & 컨스트럭터 가격표, 예산 계산기, 포인트 효율 분석.",
    url: "https://f1.324.ing/fantasy",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function FantasyPage() {
  return <FantasyClient />;
}
