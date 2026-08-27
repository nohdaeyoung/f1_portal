import type { Metadata } from "next";
import { type RaceCalendar, type SessionSchedule } from "@/data/f1-data";
import { fetchDriverStandings, fetchConstructorStandings, fetchCalendar } from "@/lib/data/live";
import { getAiDigest } from "@/lib/api/ai-digest";
import { getF1News } from "@/lib/api/news";
import { type OF1Session } from "@/lib/api/openf1";
import LiveSessionDashboard from "@/components/live/LiveSessionDashboard";
import { websiteSchema, organizationSchema, jsonLdScript } from "@/lib/jsonld";
import { NextRaceHero } from "@/components/home/NextRaceHero";
import { RaceWeekendHero, type RaceWeekendInfo } from "@/components/home/RaceWeekendHero";
import { ChampionshipsSection } from "@/components/home/ChampionshipsSection";
import { RecentResultsSection } from "@/components/home/RecentResultsSection";
import { AiDigestPreview } from "@/components/home/AiDigestPreview";
import { NewsFeedSection } from "@/components/home/NewsFeedSection";
import { SeasonCalendar } from "@/components/home/SeasonCalendar";
import { PodiumSection } from "@/components/home/PodiumSection";
import { fetchLastRacePodium } from "@/lib/data/live";

export const revalidate = 300; // ISR: 5분마다 재생성

export const metadata: Metadata = {
  title: "F1 by 324.ing — 2026 F1 종합 포털",
  description: "2026 F1 시즌 드라이버·팀·서킷 정보, 실시간 레이스 결과, AI 뉴스 브리핑을 한 곳에서. 챔피언십 순위, 세션 일정, 커뮤니티.",
  keywords: ["F1", "포뮬러원", "Formula 1", "2026 F1 시즌", "F1 드라이버", "F1 팀", "F1 서킷", "그랑프리", "F1 챔피언십", "F1 뉴스"],
  alternates: { canonical: "https://f1.324.ing" },
  openGraph: {
    title: "F1 by 324.ing — 2026 F1 종합 포털",
    description: "2026 F1 시즌 드라이버·팀·서킷 정보, 실시간 레이스 결과, AI 뉴스 브리핑을 한 곳에서.",
    url: "https://f1.324.ing",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "F1 by 324.ing" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "F1 by 324.ing — 2026 F1 종합 포털",
    description: "2026 F1 시즌 드라이버·팀·서킷 정보, 실시간 레이스 결과, AI 뉴스 브리핑을 한 곳에서.",
    images: ["/og-default.png"],
  },
};

// ─── Utils ────────────────────────────────────────────────────

function getSessionList(s: SessionSchedule): { key: string; name: string; time: string }[] {
  const list: { key: string; name: string; time: string }[] = [];
  if (s.fp1) list.push({ key: "fp1", name: "FP 1", time: s.fp1 });
  if (s.isSprint) {
    if (s.sq) list.push({ key: "sq", name: "스프린트 퀄리", time: s.sq });
    if (s.sprint) list.push({ key: "sprint", name: "스프린트", time: s.sprint });
  } else {
    if (s.fp2) list.push({ key: "fp2", name: "FP 2", time: s.fp2 });
    if (s.fp3) list.push({ key: "fp3", name: "FP 3", time: s.fp3 });
  }
  list.push({ key: "qualifying", name: "퀄리파잉", time: s.qualifying });
  list.push({ key: "race", name: "레이스", time: s.race });
  return list;
}

function getRaceWeekendInfo(nextRace: RaceCalendar | undefined, of1Sessions: OF1Session[]): RaceWeekendInfo {
  const empty: RaceWeekendInfo = { isWeekend: false, nextSession: null, liveSession: null, currentRace: null };
  if (!nextRace?.sessions) return empty;

  const now = Date.now();
  const s = nextRace.sessions;
  const sessions = getSessionList(s);
  const firstTime = new Date(sessions[0].time).getTime();
  const raceEndTime = new Date(s.race).getTime() + 6 * 3_600_000;

  if (now < firstTime || now > raceEndTime) return empty;

  const activeOf1 = of1Sessions.find((s) => {
    const start = new Date(s.date_start).getTime();
    const end = new Date(s.date_end).getTime();
    return start <= now && now <= end;
  });

  let liveSession: { key: string; name: string; time: string } | null = null;
  if (activeOf1) {
    const of1Start = new Date(activeOf1.date_start).getTime();
    liveSession = sessions.find(
      (sess) => Math.abs(new Date(sess.time).getTime() - of1Start) < 4 * 3_600_000
    ) ?? null;
  }

  const nextSession = sessions.find((sess) => new Date(sess.time).getTime() > now) ?? null;
  return { isWeekend: true, nextSession, liveSession, currentRace: nextRace };
}

// ─── Page ───────────────────────────────────────────────────────

function isPodiumWindow(raceDate: string): boolean {
  const race = new Date(raceDate).getTime();
  const now = Date.now();
  return now >= race && now <= race + 3 * 24 * 3600 * 1000;
}

export default async function HomePage() {
  const year = new Date().getFullYear();
  const [driverStandings, constructorStandings, calendar, aiDigest, newsArticles, of1Sessions] =
    await Promise.all([
      fetchDriverStandings(),
      fetchConstructorStandings(),
      fetchCalendar(),
      getAiDigest(),
      getF1News(8),
      fetch(`https://api.openf1.org/v1/sessions?year=${year}`, { next: { revalidate: 3600 } })
        .then((r) => (r.ok ? (r.json() as Promise<OF1Session[]>) : []))
        .catch(() => [] as OF1Session[]),
    ]);

  const nextRace = calendar.find((r) => r.status === "next");
  const completed = calendar.filter((r) => r.status === "completed");
  const weekendInfo = getRaceWeekendInfo(nextRace, of1Sessions);

  const lastCompleted = [...completed].reverse()[0];
  const podiumData =
    lastCompleted && isPodiumWindow(lastCompleted.date)
      ? await fetchLastRacePodium(lastCompleted.round, lastCompleted.koreanName)
      : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(websiteSchema()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(organizationSchema()) }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {weekendInfo.isWeekend ? (
          <RaceWeekendHero info={weekendInfo} />
        ) : (
          nextRace && <NextRaceHero race={nextRace} />
        )}

        {weekendInfo.isWeekend && <LiveSessionDashboard />}

        {podiumData && <PodiumSection data={podiumData} />}

        {/* 순위 조회에 실패하면(null) 홈에서는 섹션을 숨긴다. 홈은 여러 섹션이
            늘어선 화면이라 큰 에러 박스보다 조용히 빠지는 편이 낫고, 자세한
            상태는 /season 에서 안내한다. 지난 순위표를 대신 보여주지는 않는다. */}
        {driverStandings && constructorStandings && (
          <ChampionshipsSection drivers={driverStandings} constructors={constructorStandings} />
        )}

        {!weekendInfo.isWeekend && (
          completed.length > 0
            ? <RecentResultsSection completed={completed} />
            : (
              <div className="text-center py-10 text-text-muted text-sm">
                아직 완료된 레이스가 없습니다. 시즌 첫 레이스를 기대하세요!
              </div>
            )
        )}

        <AiDigestPreview digest={aiDigest} />

        {newsArticles.length > 0 && (
          <NewsFeedSection articles={newsArticles.slice(0, weekendInfo.isWeekend ? 8 : 6)} />
        )}

        {!weekendInfo.isWeekend && <SeasonCalendar calendar={calendar} />}
      </div>
    </>
  );
}
