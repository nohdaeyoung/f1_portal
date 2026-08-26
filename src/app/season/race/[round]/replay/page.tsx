import { notFound } from "next/navigation";
import { fetchCalendar } from "@/lib/data/live";
import { calendar as mockCalendar } from "@/data/f1-data";
import ReplayClient from "./ReplayClient";

export const revalidate = 86400;

export async function generateStaticParams() {
  return mockCalendar.map((r) => ({ round: String(r.round) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ round: string }>;
}) {
  const { round } = await params;
  const calendar = await fetchCalendar();
  const race = calendar.find((r) => r.round === parseInt(round));
  if (!race) return { title: "리플레이" };
  const title = `${race.koreanName} 리플레이`;
  const description = `${race.name} 리플레이 — 레이스 포지션 변화를 시각화해서 확인하세요.`;
  return {
    title,
    description,
    alternates: { canonical: `https://f1.324.ing/season/race/${race.round}/replay` },
    openGraph: {
      title: `${title} | F1 by 324.ing`,
      description,
      url: `https://f1.324.ing/season/race/${race.round}/replay`,
      images: [{ url: "/og-default.png", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title: `${title} | F1 by 324.ing`, description },
  };
}

export default async function ReplayPage({
  params,
}: {
  params: Promise<{ round: string }>;
}) {
  const { round } = await params;
  const roundNum = parseInt(round);
  const calendar = await fetchCalendar();
  const race = calendar.find((r) => r.round === roundNum);
  if (!race) notFound();

  const year = new Date(race.date).getFullYear();

  return (
    <ReplayClient
      year={year}
      gpName={race.name}
      round={roundNum}
      raceName={race.koreanName}
    />
  );
}
