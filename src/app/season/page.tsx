import Link from "next/link";
import { getDriver, getTeam, getCircuit, type RaceCalendar, type SessionSchedule } from "@/data/f1-data";
import {
  fetchDriverStandings,
  fetchConstructorStandings,
  fetchCalendar,
  fetchLastRacePodium,
  fetchChampionshipProgress,
} from "@/lib/data/live";
import { PodiumSection } from "@/components/home/PodiumSection";
import { RaceWeekendLive } from "./RaceWeekendLive";
import { StandingsTabs } from "@/components/season/StandingsTabs";
import { RoundStandingsViewer } from "@/components/season/RoundStandingsViewer";

export const metadata = {
  title: "2026 시즌 트래커",
  description: "2026 F1 시즌 드라이버 챔피언십 순위, 컨스트럭터 순위, 레이스 캘린더 및 결과를 실시간으로 확인하세요.",
  openGraph: {
    title: "2026 F1 시즌 트래커 | F1 by 324.ing",
    description: "2026 F1 시즌 드라이버 챔피언십 순위, 컨스트럭터 순위, 레이스 캘린더 및 결과를 실시간으로 확인하세요.",
    url: "https://f1.324.ing/season",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

// ─── Date range helper ────────────────────────────────────────

/** FP1 ISO(UTC) ~ 레이스 날짜 범위를 "MM.DD~DD" 형식으로 반환 */
function fmtDateRange(raceDate: string, fp1Iso?: string): string {
  const raceMM = raceDate.slice(5, 7);
  const raceDD = raceDate.slice(8, 10);
  const raceStr = `${raceMM}.${raceDD}`;
  if (!fp1Iso) return raceStr;

  const fp1 = new Date(fp1Iso);
  const fp1MM = String(fp1.getUTCMonth() + 1).padStart(2, "0");
  const fp1DD = String(fp1.getUTCDate()).padStart(2, "0");
  if (fp1DD === raceDD) return raceStr;

  return fp1MM === raceMM
    ? `${fp1MM}.${fp1DD}~${raceDD}`
    : `${fp1MM}.${fp1DD}~${raceMM}.${raceDD}`;
}

// ─── Session labels ───────────────────────────────────────────

const SESSION_LABELS: { key: keyof SessionSchedule; ko: string; sprint?: boolean }[] = [
  { key: "fp1",        ko: "FP1 프리 프랙티스" },
  { key: "fp2",        ko: "FP2 프리 프랙티스",  sprint: false },
  { key: "fp3",        ko: "FP3 프리 프랙티스",  sprint: false },
  { key: "sq",         ko: "스프린트 퀄리파잉",   sprint: true  },
  { key: "sprint",     ko: "스프린트 레이스",     sprint: true  },
  { key: "qualifying", ko: "퀄리파잉" },
  { key: "race",       ko: "레이스" },
];

function fmtKST(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", weekday: "short" }),
    time: d.toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" }),
    past: d.getTime() < Date.now(),
  };
}

function NextRaceSchedule({ race }: { race: RaceCalendar }) {
  const s = race.sessions;
  if (!s) return null;
  const circuit = getCircuit(race.circuitId);

  const rows = SESSION_LABELS.filter(({ key, sprint }) => {
    if (key === "isSprint") return false;
    const val = s[key] as string | undefined;
    if (!val) return false;
    if (sprint === true  && !s.isSprint) return false;
    if (sprint === false &&  s.isSprint) return false;
    return true;
  });

  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold text-white mb-2">다음 레이스 세션 일정</h2>
      <p className="text-sm text-[#64748B] mb-6">
        R{race.round} {race.koreanName}
        {circuit && ` · ${circuit.city}, ${circuit.country}`}
        {s.isSprint && (
          <span className="ml-2 text-xs font-bold text-[#FF6700] bg-[#FF6700]/10 px-2 py-0.5 rounded-full">
            스프린트 주말
          </span>
        )}
      </p>

      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
        {rows.map(({ key, ko }, i) => {
          const iso = s[key] as string;
          const { date, time, past } = fmtKST(iso);
          const isRace = key === "race";
          return (
            <div
              key={key}
              className={`flex items-center justify-between px-5 py-4 ${
                i < rows.length - 1 ? "border-b border-[#2D2D3A]" : ""
              } ${past ? "opacity-40" : ""}`}
            >
              <div className="flex items-center gap-3">
                {isRace && <span className="w-2 h-2 rounded-full bg-[#E8002D] shrink-0" />}
                <span className={`text-sm font-bold ${isRace ? "text-white" : "text-[#94a3b8]"}`}>
                  {ko}
                </span>
                {past && <span className="text-[10px] text-[#64748B] font-medium">완료</span>}
              </div>
              <div className="text-right">
                <span className={`text-sm font-mono ${isRace ? "text-[#E8002D] font-black" : "text-white"}`}>
                  {time} KST
                </span>
                <span className="block text-xs text-[#64748B] mt-0.5">{date}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RaceCalendarSection({ races }: { races: RaceCalendar[] }) {
  const completedCount = races.filter((r) => r.status === "completed").length;
  const cancelledCount = races.filter((r) => r.status === "cancelled").length;
  const totalCount = races.length - cancelledCount;

  return (
    <section>
      <div className="flex items-baseline gap-3 mb-5">
        <h2 className="font-display text-xl font-bold tracking-widest uppercase text-white">
          RACE CALENDAR
        </h2>
        <span className="font-mono text-xs text-text-disabled tabular-nums">
          {completedCount}/{totalCount}
        </span>
        {/* progress bar */}
        <div className="flex-1 h-px bg-border-subtle overflow-hidden rounded-full hidden sm:block">
          <div
            className="h-full bg-f1-red transition-all duration-700"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        {races.map((race) => {
          const circuit = getCircuit(race.circuitId);
          const isNext = race.status === "next";
          const isCompleted = race.status === "completed";
          const isCancelled = race.status === "cancelled";

          return (
            <Link
              key={race.round}
              href={`/season/race/${race.round}`}
              className={[
                "flex items-center gap-3 rounded-lg px-4 py-3 border transition-all group",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-f1-red focus-visible:ring-offset-1 focus-visible:ring-offset-bg-base",
                isCancelled
                  ? "bg-transparent border-border-subtle/30 opacity-45 hover:opacity-60"
                  : isNext
                  ? "bg-f1-red/8 border-f1-red/25 hover:bg-f1-red/12"
                  : isCompleted
                  ? "bg-transparent border-border-subtle/50 hover:bg-white/[0.02] opacity-70 hover:opacity-100"
                  : "bg-bg-surface border-border-default hover:bg-white/[0.03]",
              ].join(" ")}
            >
              {/* Round + status dot */}
              <div className="w-10 shrink-0 flex flex-col items-center gap-0.5">
                <span className={`font-display text-[10px] font-bold tracking-widest uppercase ${isCancelled ? "line-through text-text-disabled/60" : "text-text-disabled"}`}>
                  R{String(race.round).padStart(2, "0")}
                </span>
                {isNext && (
                  <span className="w-1.5 h-1.5 rounded-full bg-f1-red animate-pulse" aria-label="다음 레이스" />
                )}
                {isCompleted && (
                  <span className="w-1.5 h-1.5 rounded-full bg-status-active/60" aria-label="완료" />
                )}
                {isCancelled && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]/60" aria-label="취소" />
                )}
              </div>

              {/* Divider */}
              <div className={`w-px self-stretch ${isCancelled ? "bg-[#EF4444]/20" : isNext ? "bg-f1-red/30" : "bg-border-subtle"}`} aria-hidden="true" />

              {/* Race name + circuit */}
              <div className="flex-1 min-w-0">
                <span className={`font-display text-sm font-bold tracking-wide block truncate transition-colors ${
                  isCancelled ? "line-through text-text-disabled/60" : isNext ? "text-white" : isCompleted ? "text-text-secondary group-hover:text-white" : "text-text-secondary"
                }`}>
                  {race.koreanName}
                </span>
                <span className={`font-mono text-[10px] block truncate ${isCancelled ? "line-through text-text-disabled/50" : "text-text-disabled"}`}>
                  {circuit?.koreanName}
                  <span className="mx-1.5">·</span>
                  {fmtDateRange(race.date, race.sessions?.fp1)}
                </span>
              </div>

              {/* Winner / status */}
              <div className="text-right shrink-0">
                {isCancelled ? (
                  <span className="font-display text-[10px] font-bold text-[#EF4444] tracking-widest uppercase">
                    CANCELLED
                  </span>
                ) : isCompleted && race.winner ? (
                  <span className="font-display text-sm font-bold text-[#FCD34D] tracking-wide">
                    {race.winner.split(" ").slice(-1)[0].toUpperCase()}
                  </span>
                ) : isNext ? (
                  <span className="font-display text-[10px] font-bold text-f1-red tracking-widest uppercase">
                    NEXT →
                  </span>
                ) : (
                  <span className="font-display text-[10px] text-text-disabled tracking-widest uppercase">TBD</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function isPodiumWindow(raceDate: string): boolean {
  const race = new Date(raceDate).getTime();
  const now = Date.now();
  return now >= race && now <= race + 3 * 24 * 3600 * 1000;
}

export default async function SeasonPage() {
  const [driverStandings, constructorStandings, calendar] = await Promise.all([
    fetchDriverStandings(),
    fetchConstructorStandings(),
    fetchCalendar(),
  ]);

  const nextRace = calendar.find((r) => r.status === "next");
  const completed = calendar.filter((r) => r.status === "completed");
  const completedRounds = completed.map((r) => r.round);
  const championshipProgress = completedRounds.length >= 2
    ? await fetchChampionshipProgress(2026, completedRounds)
    : [];
  const lastCompleted = [...completed].reverse()[0];
  const podiumData =
    lastCompleted && isPodiumWindow(lastCompleted.date)
      ? await fetchLastRacePodium(lastCompleted.round, lastCompleted.koreanName)
      : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <section className="mb-10 text-center">
        <h1 className="font-display text-5xl sm:text-7xl font-bold text-white tracking-widest uppercase text-wrap-balance">
          2026 SEASON
        </h1>
        <p className="mt-3 text-[#64748B]">
          드라이버 & 컨스트럭터 챔피언십 · {calendar.length} 라운드
        </p>
        <div className="mt-4 mx-auto w-16 h-1 bg-[#E8002D] rounded-full" />
        <div className="mt-6">
          <Link
            href="/season/archive"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#141420] border border-[#2D2D3A] rounded-lg text-sm text-[#94A3B8] hover:text-white hover:border-[#3D3D4A] transition-colors"
          >
            역대 시즌 아카이브 →
          </Link>
        </div>
      </section>

      {podiumData && (
        <div className="mb-10">
          <PodiumSection data={podiumData} />
        </div>
      )}

      {nextRace?.sessions && (
        <RaceWeekendLive
          sessions={nextRace.sessions}
          round={nextRace.round}
          raceName={nextRace.koreanName}
          circuitCity={getCircuit(nextRace.circuitId)?.city}
        />
      )}
      {nextRace && !nextRace.sessions && <NextRaceSchedule race={nextRace} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 items-start">
        <StandingsTabs
          driverRows={driverStandings.flatMap((s) => {
            const driver = getDriver(s.driverId);
            if (!driver) return [];
            return [{
              driverId: s.driverId,
              href: `/drivers/${driver.id}`,
              firstName: driver.firstName,
              lastName: driver.lastName,
              teamColor: driver.teamColor,
              team: driver.team,
              position: s.position,
              wins: s.wins,
              points: s.points,
            }];
          })}
          teamRows={constructorStandings.flatMap((s) => {
            const team = getTeam(s.teamId);
            if (!team) return [];
            return [{
              teamId: s.teamId,
              href: `/teams/${team.id}`,
              name: team.name,
              primaryColor: team.primaryColor,
              position: s.position,
              wins: s.wins,
              points: s.points,
            }];
          })}
          championshipProgress={championshipProgress}
          completedRounds={completedRounds}
        />
        {completedRounds.length > 0 && (
          <RoundStandingsViewer completedRounds={completedRounds} season={2026} />
        )}
      </div>

      <RaceCalendarSection races={calendar} />
    </div>
  );
}
