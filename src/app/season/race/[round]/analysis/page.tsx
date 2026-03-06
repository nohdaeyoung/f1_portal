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
  if (!race) return { title: "텔레메트리 | PitLane" };
  return { title: `${race.koreanName} 분석 | PitLane` };
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
        <nav className="flex items-center gap-2 text-xs text-[#475569]">
          <Link href="/season" className="hover:text-white transition-colors">시즌</Link>
          <span>/</span>
          <Link href={`/season/race/${roundNum}`} className="hover:text-white transition-colors">
            Round {roundNum} · {race.koreanName}
          </Link>
          <span>/</span>
          <span className="text-[#94A3B8]">분석</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] text-[#E8002D] uppercase tracking-widest font-bold mb-1">
              데이터 분석
            </p>
            <h1 className="text-2xl sm:text-3xl font-black leading-tight">{race.koreanName}</h1>
            <p className="text-sm text-[#64748B] mt-0.5">{race.name}</p>
          </div>
          <Link
            href={`/season/race/${roundNum}`}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-[#64748B] hover:text-white hover:bg-white/10 transition-colors"
          >
            ← 레이스 페이지
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
