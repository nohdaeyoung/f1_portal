import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchCalendar } from "@/lib/data/live";
import { calendar as mockCalendar } from "@/data/f1-data";
import TelemetryClient from "./TelemetryClient";

export const revalidate = 3600;

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
  if (!race) return { title: "텔레메트리" };
  const title = `${race.koreanName} 텔레메트리 분석`;
  const description = `${race.name} 텔레메트리 데이터 분석 — 드라이버 랩타임, 속도 비교.`;
  return {
    title,
    description,
    alternates: { canonical: `https://f1.324.ing/season/race/${race.round}/analysis` },
    openGraph: {
      title: `${title} | F1 by 324.ing`,
      description,
      url: `https://f1.324.ing/season/race/${race.round}/analysis`,
      images: [{ url: "/og-default.png", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title: `${title} | F1 by 324.ing`, description },
  };
}

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ round: string }>;
}) {
  const { round } = await params;
  const roundNum = parseInt(round);
  const calendar = await fetchCalendar();
  const race = calendar.find((r) => r.round === roundNum);
  if (!race) notFound();

  return (
    <main className="min-h-screen bg-[#0D0D14] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="flex items-center gap-2 font-mono text-[10px] text-text-disabled">
          <Link href="/season" className="hover:text-white transition-colors">SEASON</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/season/race/${roundNum}`} className="hover:text-white transition-colors">
            R{String(roundNum).padStart(2, "0")} {race.koreanName.toUpperCase()}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-text-secondary" aria-current="page">ANALYSIS</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-[10px] text-f1-red uppercase tracking-widest font-bold mb-1">
              DATA ANALYSIS
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide leading-tight">{race.koreanName}</h1>
            <p className="font-mono text-xs text-text-disabled mt-1">{race.name}</p>
          </div>
          <Link
            href={`/season/race/${roundNum}`}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-border-default rounded-lg font-display text-[10px] uppercase tracking-widest text-text-disabled hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-f1-red"
          >
            ← RACE PAGE
          </Link>
        </div>

        <TelemetryClient
          year={new Date(race.date).getFullYear()}
          gp={String(roundNum)}
          raceName={race.koreanName}
        />
      </div>
    </main>
  );
}
