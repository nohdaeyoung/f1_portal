import Link from "next/link";
import type { Metadata } from "next";
import { modernChampions, classicChampions, multiChampions } from "@/data/f1-champions";
import { teams } from "@/data/f1-data";
import { f1Eras } from "@/data/f1-eras";

export const metadata: Metadata = {
  title: "F1 역사",
  description: "포뮬러 1의 역사 — 역대 드라이버 & 컨스트럭터 챔피언, 다중 챔피언, 시대별 강팀 기록.",
};

export default function HistoryPage() {
  // 팀 컨스트럭터 타이틀 수 (현재 팀들 — f1-data 기준)
  const teamsWithTitles = teams
    .filter((t) => t.constructorTitles > 0)
    .sort((a, b) => b.constructorTitles - a.constructorTitles);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <section className="mb-14">
        <div className="text-4xl mb-4">🏆</div>
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
          F1 역사
        </h1>
        <p className="text-lg text-[#64748B] mt-3 max-w-2xl leading-relaxed">
          1950년 첫 그랑프리부터 2024년까지 — 역대 챔피언, 전설적 드라이버,
          그리고 F1을 지배한 팀들의 이야기.
        </p>
        <div className="mt-5 w-24 h-1 bg-[#E8002D] rounded-full" />
      </section>

      {/* 다중 챔피언 드라이버 */}
      <section className="mb-16">
        <h2 className="text-2xl font-black text-white mb-2">전설의 챔피언</h2>
        <p className="text-sm text-[#64748B] mb-6">2회 이상 드라이버 챔피언십을 획득한 드라이버</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {multiChampions.map((c) => (
            <div
              key={c.driver}
              className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-5 flex items-center gap-4 hover:-translate-y-0.5 transition-transform"
            >
              <div className="shrink-0 w-14 h-14 rounded-full bg-[#0D0D14] border border-[#2D2D3A] flex items-center justify-center text-2xl">
                {c.flag}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white text-sm leading-tight">{c.driver}</p>
                <p className="text-xs text-[#64748B] mt-0.5">{c.nationality}</p>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[#E8002D] font-black text-lg">{c.titles}</span>
                  <span className="text-xs text-[#64748B]">회</span>
                  <span className="text-[10px] text-[#475569] ml-1">
                    {c.years.join(", ")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 역대 챔피언 — 현대 (2000–2024) */}
      <section className="mb-16">
        <h2 className="text-2xl font-black text-white mb-2">역대 챔피언 (2000–2024)</h2>
        <p className="text-sm text-[#64748B] mb-6">드라이버 및 컨스트럭터 챔피언십 최종 결과</p>
        <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2D2D3A]">
                  <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase w-16">연도</th>
                  <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase">드라이버 챔피언</th>
                  <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase hidden sm:table-cell">컨스트럭터 챔피언</th>
                </tr>
              </thead>
              <tbody>
                {modernChampions.map((c) => (
                  <tr
                    key={c.year}
                    className="border-b border-[#2D2D3A]/50 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-[#64748B] font-bold">{c.year}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span>{c.driverFlag}</span>
                        <span className="font-bold text-white">{c.driver}</span>
                        <span
                          className="hidden md:inline-block text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: c.teamColor + "22",
                            color: c.teamColor,
                            border: `1px solid ${c.teamColor}44`,
                          }}
                        >
                          {c.team}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span
                        className="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: c.constructorColor + "22",
                          color: c.constructorColor,
                          border: `1px solid ${c.constructorColor}44`,
                        }}
                      >
                        {c.constructorChampion}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 역대 챔피언 — 클래식 (1950–1999) */}
      <section className="mb-16">
        <h2 className="text-2xl font-black text-white mb-2">역대 챔피언 (1950–1999)</h2>
        <p className="text-sm text-[#64748B] mb-6">F1 역사의 시작부터 밀레니엄 이전까지</p>
        <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2D2D3A]">
                  <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase w-16">연도</th>
                  <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase">드라이버 챔피언</th>
                  <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase hidden sm:table-cell">컨스트럭터 챔피언</th>
                </tr>
              </thead>
              <tbody>
                {classicChampions.map((c) => (
                  <tr
                    key={c.year}
                    className="border-b border-[#2D2D3A]/50 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-[#64748B] font-bold">{c.year}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span>{c.driverFlag}</span>
                        <span className="font-bold text-white">{c.driver}</span>
                        <span className="hidden md:inline text-xs text-[#475569]">
                          ({c.team})
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-[#64748B]">
                      {c.constructorChampion ?? <span className="text-[#3D3D50] text-xs">해당 없음</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 팀별 컨스트럭터 타이틀 */}
      <section className="mb-16">
        <h2 className="text-2xl font-black text-white mb-2">컨스트럭터 강팀</h2>
        <p className="text-sm text-[#64748B] mb-6">현재 팀 기준 역대 컨스트럭터 챔피언십 획득 횟수</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamsWithTitles.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-5 hover:-translate-y-0.5 hover:border-[#3D3D50] transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: team.primaryColor + "22",
                    color: team.primaryColor,
                    border: `1px solid ${team.primaryColor}44`,
                  }}
                >
                  {team.koreanName}
                </span>
                <span className="text-[10px] text-[#475569] group-hover:text-[#64748B] transition-colors">
                  →
                </span>
              </div>
              <div className="flex items-end gap-2">
                <span
                  className="text-4xl font-black"
                  style={{ color: team.primaryColor }}
                >
                  {team.constructorTitles}
                </span>
                <span className="text-sm text-[#64748B] mb-1">회</span>
              </div>
              <p className="text-[10px] text-[#475569] mt-2 leading-relaxed">
                {team.constructorTitleYears.join(" · ")}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 시대별 이야기 */}
      <section className="mb-16">
        <h2 className="text-2xl font-black text-white mb-2">시대별 이야기</h2>
        <p className="text-sm text-[#64748B] mb-6">F1의 역사를 지배한 시대와 팀들</p>
        <div className="space-y-3">
          {f1Eras.map((era) => (
            <Link
              key={era.slug}
              href={`/history/era/${era.slug}`}
              className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-5 flex gap-4 hover:border-[#3D3D50] hover:-translate-y-0.5 transition-all group block"
            >
              <div
                className="shrink-0 w-1 rounded-full self-stretch"
                style={{ backgroundColor: era.theme.primary }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5">
                  <h3 className="font-bold text-white text-sm">{era.name}</h3>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0D0D14] border border-[#2D2D3A]"
                    style={{ color: era.theme.primary }}
                  >
                    {era.period}
                  </span>
                </div>
                <p className="text-sm text-[#64748B] leading-relaxed">{era.tagline}</p>
              </div>
              <div className="shrink-0 self-center text-[#475569] group-hover:text-[#64748B] transition-colors text-sm">
                →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 더 알아보기 */}
      <section>
        <h2 className="text-2xl font-black text-white mb-6">더 알아보기</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/drivers"
            className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6 hover:-translate-y-1 hover:border-[#3D3D50] transition-all group"
          >
            <div className="text-2xl mb-3">🏎</div>
            <h3 className="font-bold text-white mb-1">2026 드라이버</h3>
            <p className="text-xs text-[#64748B]">현재 시즌 드라이버 프로필 및 커리어 통계</p>
            <span className="mt-3 inline-block text-xs text-[#E8002D] group-hover:underline">보러가기 →</span>
          </Link>
          <Link
            href="/teams"
            className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6 hover:-translate-y-1 hover:border-[#3D3D50] transition-all group"
          >
            <div className="text-2xl mb-3">🔧</div>
            <h3 className="font-bold text-white mb-1">팀 & 컨스트럭터</h3>
            <p className="text-xs text-[#64748B]">각 팀의 역사와 시즌별 성적 추이</p>
            <span className="mt-3 inline-block text-xs text-[#E8002D] group-hover:underline">보러가기 →</span>
          </Link>
          <Link
            href="/circuits"
            className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6 hover:-translate-y-1 hover:border-[#3D3D50] transition-all group"
          >
            <div className="text-2xl mb-3">🏁</div>
            <h3 className="font-bold text-white mb-1">서킷 역대 우승자</h3>
            <p className="text-xs text-[#64748B]">서킷별 최근 30년 역대 우승자 기록</p>
            <span className="mt-3 inline-block text-xs text-[#E8002D] group-hover:underline">보러가기 →</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
