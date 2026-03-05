import Link from "next/link";
import { notFound } from "next/navigation";
import { teams, getTeam, getTeamDrivers } from "@/data/f1-data";
import { fetchTeamHistory } from "@/lib/data/live";

export async function generateStaticParams() {
  return teams.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = getTeam(id);
  if (!t) return { title: "Not Found | PitLane" };
  return { title: `${t.name} | PitLane` };
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const team = getTeam(id);
  if (!team) notFound();

  const teamDrivers = getTeamDrivers(team.id);
  const history = await fetchTeamHistory(team.id);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/teams"
        className="inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-white transition-colors mb-10"
      >
        &larr; 팀 목록
      </Link>

      {/* Hero */}
      <section className="mb-12">
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
          {team.name}
        </h1>
        <p className="text-lg text-[#64748B] mt-2">{team.koreanName}</p>
        <div
          className="mt-4 w-24 h-1 rounded-full"
          style={{ backgroundColor: team.primaryColor }}
        />
      </section>

      {/* Info */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        {[
          { l: "본부", v: team.base },
          { l: "팀 대표", v: team.principal },
          { l: "파워 유닛", v: team.powerUnit },
          { l: "컨스트럭터 타이틀", v: `${team.constructorTitles}회` },
        ].map((item) => (
          <div
            key={item.l}
            className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-5"
          >
            <span className="block text-xs text-[#64748B] uppercase tracking-wider mb-1">
              {item.l}
            </span>
            <span className="block text-base font-bold text-white">{item.v}</span>
          </div>
        ))}
      </section>

      {/* Stats */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6">팀 통계</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { l: "레이스 우승", v: team.wins },
            { l: "포디움", v: team.podiums },
            { l: "폴 포지션", v: team.poles },
            { l: "컨스트럭터 타이틀", v: team.constructorTitles },
          ].map((s) => (
            <div
              key={s.l}
              className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6 text-center hover:-translate-y-1 transition-all"
            >
              <span
                className="block text-3xl sm:text-4xl font-black mb-2"
                style={{ color: team.primaryColor }}
              >
                {s.v}
              </span>
              <span className="block text-xs text-[#64748B] uppercase tracking-wider">
                {s.l}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Drivers */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6">현역 드라이버</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {teamDrivers.map((driver) => (
            <Link
              key={driver.id}
              href={`/drivers/${driver.id}`}
              className="group block"
            >
              <div
                className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6 hover:-translate-y-1 transition-all relative overflow-hidden"
                style={{ borderTopWidth: "3px", borderTopColor: team.primaryColor }}
              >
                <div
                  className="absolute top-3 right-4 text-5xl font-black select-none pointer-events-none"
                  style={{ color: team.primaryColor, opacity: 0.2 }}
                >
                  {driver.number}
                </div>
                <span className="text-2xl mb-2 block">{driver.flag}</span>
                <span className="block text-sm text-[#64748B]">
                  {driver.firstName}
                </span>
                <span className="block text-xl font-bold text-white">
                  {driver.lastName}
                </span>
                <div className="flex gap-4 mt-3 text-xs text-[#64748B]">
                  <span>Wins: {driver.wins}</span>
                  <span>Podiums: {driver.podiums}</span>
                  <span>Titles: {driver.championships}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Driver Championships */}
      {team.driverChampionships.length > 0 && (
        <section className="mb-12 pt-8 border-t border-[#2D2D3A]">
          <h2 className="text-xl font-bold text-white mb-6">역대 드라이버 챔피언</h2>
          <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2D2D3A]">
                    <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase w-16">연도</th>
                    <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase">드라이버</th>
                    <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase hidden sm:table-cell">타이틀 확정 서킷</th>
                  </tr>
                </thead>
                <tbody>
                  {[...team.driverChampionships].reverse().map((dc) => (
                    <tr key={dc.year} className="border-b border-[#2D2D3A]/50 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-mono text-[#64748B]">{dc.year}</td>
                      <td className="px-4 py-3 font-bold text-white">{dc.driver}</td>
                      <td className="px-4 py-3 text-[#64748B] hidden sm:table-cell">{dc.circuitKo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Championship Years */}
      {team.constructorTitleYears.length > 0 && (
        <section className="mb-12 pt-8 border-t border-[#2D2D3A]">
          <h2 className="text-xl font-bold text-white mb-6">
            컨스트럭터 챔피언십 우승
          </h2>
          <div className="flex flex-wrap gap-3">
            {team.constructorTitleYears.map((year) => (
              <span
                key={year}
                className="px-4 py-2 rounded-lg text-sm font-bold border"
                style={{
                  color: team.primaryColor,
                  borderColor: `${team.primaryColor}44`,
                  backgroundColor: `${team.primaryColor}10`,
                }}
              >
                {year}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Season History */}
      {history.length > 0 && (
        <section className="pt-8 border-t border-[#2D2D3A]">
          <h2 className="text-xl font-bold text-white mb-6">연도별 컨스트럭터 순위</h2>
          <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2D2D3A]">
                    <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase w-16">연도</th>
                    <th className="text-center px-4 py-3 text-xs text-[#64748B] uppercase w-16">순위</th>
                    <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase w-20">승</th>
                    <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase w-24">포인트</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.season} className="border-b border-[#2D2D3A]/50 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-mono text-[#64748B]">{h.season}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className="text-sm font-black"
                          style={{ color: h.position <= 3 ? team.primaryColor : "#64748B" }}
                        >
                          {h.position}위
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-white">{h.wins}</td>
                      <td className="px-4 py-3 text-right font-black text-white">{h.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
