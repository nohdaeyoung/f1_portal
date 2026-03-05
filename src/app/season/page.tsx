import Link from "next/link";
import { getDriver, getTeam, getCircuit, type Standing, type ConstructorStanding, type RaceCalendar, type SessionSchedule } from "@/data/f1-data";
import {
  fetchDriverStandings,
  fetchConstructorStandings,
  fetchCalendar,
} from "@/lib/data/live";
import { RaceWeekendLive } from "./RaceWeekendLive";

export const metadata = {
  title: "시즌 트래커 | PitLane",
  description: "2026 F1 시즌 순위, 캘린더, 결과",
};

function DriverStandingsTable({ standings }: { standings: Standing[] }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-white mb-6">드라이버 챔피언십</h2>
      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2D2D3A]">
                <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase w-12">
                  #
                </th>
                <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase">
                  드라이버
                </th>
                <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase">
                  팀
                </th>
                <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase w-16">
                  승
                </th>
                <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase w-20">
                  포인트
                </th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s) => {
                const driver = getDriver(s.driverId);
                if (!driver) return null;
                return (
                  <tr
                    key={s.driverId}
                    className="border-b border-[#2D2D3A]/50 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-black ${
                          s.position === 1
                            ? "text-[#FCD34D]"
                            : s.position === 2
                              ? "text-[#C0C0C0]"
                              : s.position === 3
                                ? "text-[#CD7F32]"
                                : "text-[#64748B]"
                        }`}
                      >
                        {s.position}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/drivers/${driver.id}`}
                        className="hover:text-[#E8002D] transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="w-1 h-6 rounded-full"
                            style={{ backgroundColor: driver.teamColor }}
                          />
                          <span className="font-bold text-white">
                            {driver.firstName} {driver.lastName}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#64748B]">{driver.team}</td>
                    <td className="px-4 py-3 text-right text-white font-mono">
                      {s.wins}
                    </td>
                    <td className="px-4 py-3 text-right text-white font-black text-base">
                      {s.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ConstructorStandingsTable({
  standings,
}: {
  standings: ConstructorStanding[];
}) {
  return (
    <section>
      <h2 className="text-xl font-bold text-white mb-6">
        컨스트럭터 챔피언십
      </h2>
      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2D2D3A]">
                <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase w-12">
                  #
                </th>
                <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase">
                  팀
                </th>
                <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase w-16">
                  승
                </th>
                <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase w-20">
                  포인트
                </th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s) => {
                const team = getTeam(s.teamId);
                if (!team) return null;
                return (
                  <tr
                    key={s.teamId}
                    className="border-b border-[#2D2D3A]/50 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-black ${
                          s.position === 1
                            ? "text-[#FCD34D]"
                            : s.position === 2
                              ? "text-[#C0C0C0]"
                              : s.position === 3
                                ? "text-[#CD7F32]"
                                : "text-[#64748B]"
                        }`}
                      >
                        {s.position}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/teams/${team.id}`}
                        className="hover:text-[#E8002D] transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: team.primaryColor }}
                          />
                          <span className="font-bold text-white">{team.name}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right text-white font-mono">
                      {s.wins}
                    </td>
                    <td className="px-4 py-3 text-right text-white font-black text-base">
                      {s.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
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
  return (
    <section>
      <h2 className="text-xl font-bold text-white mb-6">레이스 캘린더</h2>
      <div className="space-y-3">
        {races.map((race) => {
          const circuit = getCircuit(race.circuitId);
          const isNext = race.status === "next";
          const isCompleted = race.status === "completed";

          return (
            <div
              key={race.round}
              className={`flex items-center gap-4 rounded-xl p-4 border transition-all ${
                isNext
                  ? "bg-[#E8002D]/10 border-[#E8002D]/30"
                  : "bg-[#141420] border-[#2D2D3A]"
              }`}
            >
              <div className="w-12 text-center">
                <span className="text-xs text-[#64748B] block">R{race.round}</span>
                {isNext && (
                  <span className="text-[10px] font-bold text-[#E8002D] block mt-0.5">
                    NEXT
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/circuits/${race.circuitId}`}
                  className="hover:text-[#E8002D] transition-colors"
                >
                  <span className="text-sm font-bold text-white block">
                    {race.koreanName}
                  </span>
                </Link>
                <span className="text-xs text-[#64748B] block">
                  {circuit?.koreanName} &middot; {race.date}
                </span>
              </div>
              <div className="text-right shrink-0">
                {isCompleted && race.winner ? (
                  <span className="text-sm font-bold text-[#FCD34D]">
                    {race.winner}
                  </span>
                ) : isNext ? (
                  <span className="text-xs font-bold text-[#E8002D]">곧 시작</span>
                ) : (
                  <span className="text-xs text-[#64748B]">예정</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default async function SeasonPage() {
  // 3개 API를 병렬로 호출 (실패 시 각각 mock 폴백)
  const [driverStandings, constructorStandings, calendar] = await Promise.all([
    fetchDriverStandings(),
    fetchConstructorStandings(),
    fetchCalendar(),
  ]);

  const nextRace = calendar.find((r) => r.status === "next");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <section className="mb-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          2026 시즌 트래커
        </h1>
        <p className="mt-3 text-[#64748B]">
          드라이버 & 컨스트럭터 챔피언십 · {calendar.length} 라운드
        </p>
        <div className="mt-4 mx-auto w-16 h-1 bg-[#E8002D] rounded-full" />
      </section>

      {nextRace?.sessions && (
        <RaceWeekendLive
          sessions={nextRace.sessions}
          round={nextRace.round}
          raceName={nextRace.koreanName}
          circuitCity={getCircuit(nextRace.circuitId)?.city}
        />
      )}
      {nextRace && !nextRace.sessions && <NextRaceSchedule race={nextRace} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <DriverStandingsTable standings={driverStandings} />
        <ConstructorStandingsTable standings={constructorStandings} />
      </div>

      <RaceCalendarSection races={calendar} />
    </div>
  );
}
