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

export const revalidate = 300; // ISR: 5분마다 재생성

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

        <ChampionshipsSection drivers={driverStandings} constructors={constructorStandings} />

        {!weekendInfo.isWeekend && completed.length > 0 && (
          <RecentResultsSection completed={completed} />
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
