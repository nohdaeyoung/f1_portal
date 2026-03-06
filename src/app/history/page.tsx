import Link from "next/link";
import type { Metadata } from "next";
import { modernChampions, classicChampions, multiChampions } from "@/data/f1-champions";
import { teams } from "@/data/f1-data";

export const metadata: Metadata = {
  title: "F1 역사",
  description: "포뮬러 1의 역사 — 역대 드라이버 & 컨스트럭터 챔피언, 다중 챔피언, 시대별 강팀 기록.",
};

// 시대 구분
const eras = [
  {
    name: "태동기",
    period: "1950–1957",
    desc: "알파 로메오, 페라리, 마세라티가 경쟁하던 초창기. 판지오가 5번의 타이틀로 최고의 드라이버로 군림.",
    color: "#94A3B8",
  },
  {
    name: "영국 시대",
    period: "1958–1969",
    desc: "Cooper, BRM, Lotus, Tyrrell 등 영국 팀들이 주도. 짐 클라크, 재키 스튜어트의 전성기.",
    color: "#60A5FA",
  },
  {
    name: "터보 시대",
    period: "1977–1988",
    desc: "터보차저 도입으로 출력 경쟁. 르노, 맥라렌, 윌리엄스, 페라리가 각축. 프로스트-세나 라이벌리 시작.",
    color: "#F59E0B",
  },
  {
    name: "윌리엄스·맥라렌 전성기",
    period: "1988–1997",
    desc: "맥라렌-혼다의 황금기, 세나-프로스트 전쟁, 이후 윌리엄스 지배. F1 역사상 가장 드라마틱한 라이벌리.",
    color: "#FF8000",
  },
  {
    name: "슈마허·페라리 왕조",
    period: "2000–2004",
    desc: "미하엘 슈마허와 페라리의 5연속 더블 챔피언. 역사상 가장 지배적인 팀·드라이버 조합.",
    color: "#DC0000",
  },
  {
    name: "레드불·베텔 시대",
    period: "2010–2013",
    desc: "레드불의 4연속 컨스트럭터 우승. 세바스티안 베텔이 최연소 4회 챔피언 기록 수립.",
    color: "#3671C6",
  },
  {
    name: "메르세데스 왕조",
    period: "2014–2021",
    desc: "V6 하이브리드 터보 도입 이후 8연속 컨스트럭터 챔피언. 해밀턴 7번째 타이틀로 슈마허 타이 기록.",
    color: "#00D2BE",
  },
  {
    name: "베르스타펜 시대",
    period: "2021–현재",
    desc: "막스 베르스타펜이 4연속 드라이버 챔피언 달성. 레드불 지배 속 2024년 맥라렌의 컨스트럭터 역전.",
    color: "#3671C6",
  },
];

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
          {eras.map((era) => (
            <div
              key={era.name}
              className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-5 flex gap-4"
            >
              <div
                className="shrink-0 w-1 rounded-full self-stretch"
                style={{ backgroundColor: era.color }}
              />
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <h3 className="font-bold text-white text-sm">{era.name}</h3>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0D0D14] border border-[#2D2D3A]"
                    style={{ color: era.color }}
                  >
                    {era.period}
                  </span>
                </div>
                <p className="text-sm text-[#64748B] leading-relaxed">{era.desc}</p>
              </div>
            </div>
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
