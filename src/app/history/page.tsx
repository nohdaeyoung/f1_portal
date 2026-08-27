import Link from "next/link";
import { modernChampions, classicChampions, multiChampions } from "@/data/f1-champions";
import { teams } from "@/data/f1-data";
import { f1Eras } from "@/data/f1-eras";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableHeaderRow } from "@/components/ui/Table";
import { TabSwitcher } from "@/components/ui/TabSwitcher";

// 서버 컴포넌트로 유지할 것. "use client" 를 붙이면 f1-data(92KB) + f1-eras(52KB) +
// f1-champions(16KB)가 통째로 클라이언트 번들에 실린다.
// 탭 전환 상태는 TabSwitcher 가 담당한다.

const TABS = [
  { id: "legends", label: "전설의 챔피언과 컨스트럭터" },
  { id: "champions", label: "역대 챔피언" },
  { id: "eras", label: "시대별 이야기" },
] as const;

export default function HistoryPage() {

  const teamsWithTitles = teams
    .filter((t) => t.constructorTitles > 0)
    .sort((a, b) => b.constructorTitles - a.constructorTitles);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <section className="mb-10">
        <div className="text-4xl mb-4">🏆</div>
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">F1 역사</h1>
        <p className="text-lg text-[#64748B] mt-3 max-w-2xl leading-relaxed">
          1950년 첫 그랑프리부터 2024년까지 — 역대 챔피언, 전설적 드라이버,
          그리고 F1을 지배한 팀들의 이야기.
        </p>
        <div className="mt-5 w-24 h-1 bg-[#E8002D] rounded-full" />
      </section>

      {/* 탭 UI 와 전환 상태는 TabSwitcher(클라이언트)가, 데이터 렌더는 여기(서버)가 담당 */}
      <TabSwitcher
        tabs={TABS}
        scrollable
        panels={{
          legends: (
        <>
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
                      <span className="text-[10px] text-[#475569] ml-1">{c.years.join(", ")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

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
                    <span className="text-[10px] text-[#475569] group-hover:text-[#64748B] transition-colors">→</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black" style={{ color: team.primaryColor }}>
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
        </>
          ),
          champions: (
        <>
          <section className="mb-16">
            <h2 className="text-2xl font-black text-white mb-2">역대 챔피언 (2000–2024)</h2>
            <p className="text-sm text-[#64748B] mb-6">드라이버 및 컨스트럭터 챔피언십 최종 결과</p>
            <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableHeaderRow>
                    <TableHead className="w-16">연도</TableHead>
                    <TableHead>드라이버 챔피언</TableHead>
                    <TableHead className="hidden sm:table-cell">컨스트럭터 챔피언</TableHead>
                  </TableHeaderRow>
                </TableHeader>
                <TableBody>
                  {modernChampions.map((c) => (
                    <TableRow key={c.year}>
                      <TableCell className="font-mono text-[#64748B] font-bold">{c.year}</TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-black text-white mb-2">역대 챔피언 (1950–1999)</h2>
            <p className="text-sm text-[#64748B] mb-6">F1 역사의 시작부터 밀레니엄 이전까지</p>
            <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableHeaderRow>
                    <TableHead className="w-16">연도</TableHead>
                    <TableHead>드라이버 챔피언</TableHead>
                    <TableHead className="hidden sm:table-cell">컨스트럭터 챔피언</TableHead>
                  </TableHeaderRow>
                </TableHeader>
                <TableBody>
                  {classicChampions.map((c) => (
                    <TableRow key={c.year}>
                      <TableCell className="font-mono text-[#64748B] font-bold">{c.year}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span>{c.driverFlag}</span>
                          <span className="font-bold text-white">{c.driver}</span>
                          <span className="hidden md:inline text-xs text-[#475569]">({c.team})</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-[#64748B]">
                        {c.constructorChampion ?? <span className="text-[#3D3D50] text-xs">해당 없음</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        </>
          ),
          eras: (
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
                <div className="shrink-0 self-center text-[#475569] group-hover:text-[#64748B] transition-colors text-sm">→</div>
              </Link>
            ))}
          </div>
        </section>
          ),
        }}
      />
    </div>
  );
}
