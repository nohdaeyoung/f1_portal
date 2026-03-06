import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { drivers, getDriver, getTeam } from "@/data/f1-data";
import { fetchDriverSeasonResults, fetchDriverHeadshot, fetchDriverCareerStats } from "@/lib/data/live";
import { driverSchema, breadcrumbSchema, jsonLdScript } from "@/lib/jsonld";

export async function generateStaticParams() {
  return drivers.map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = getDriver(id);
  if (!d) return { title: "Not Found" };
  const team = getTeam(d.teamId);
  const title = `${d.firstName} ${d.lastName}`;
  const description = `${d.firstName} ${d.lastName} — ${team?.name ?? ""} 드라이버. 2026 F1 시즌 성적, 커리어 통계, 드라이버 프로필.`;
  return {
    title,
    description,
    openGraph: {
      title: `${title} | PitLane`,
      description,
      url: `https://f1.324.ing/drivers/${id}`,
      images: [{ url: "/og-default.png", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function DriverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const driver = getDriver(id);
  if (!driver) notFound();

  const team = getTeam(driver.teamId);

  const [raceResults, headshot, careerStats] = await Promise.all([
    fetchDriverSeasonResults(driver.id),
    fetchDriverHeadshot(driver.number),
    fetchDriverCareerStats(driver.id),
  ]);

  const stats = [
    { label: "우승", value: driver.wins },
    { label: "포디움", value: driver.podiums },
    { label: "폴 포지션", value: driver.poles },
    { label: "챔피언십", value: driver.championships },
    { label: "통산 포인트", value: driver.points },
  ];

  const ldDriver = driverSchema({
    id: driver.id,
    firstName: driver.firstName,
    lastName: driver.lastName,
    nationality: driver.nationality,
    dateOfBirth: driver.dateOfBirth,
    teamName: team?.name,
    number: driver.number,
  });
  const ldBreadcrumb = breadcrumbSchema([
    { name: "홈", url: "https://f1.324.ing" },
    { name: "드라이버", url: "https://f1.324.ing/drivers" },
    { name: `${driver.firstName} ${driver.lastName}`, url: `https://f1.324.ing/drivers/${driver.id}` },
  ]);

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(ldDriver) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(ldBreadcrumb) }} />
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/drivers"
        className="inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-white transition-colors mb-10"
      >
        &larr; 드라이버 목록
      </Link>

      {/* Hero */}
      <section className="mb-12 flex items-start gap-6 flex-wrap">
        {headshot && (
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border border-[#2D2D3A] flex-shrink-0 bg-[#141420]">
            <Image
              src={headshot}
              alt={`${driver.firstName} ${driver.lastName}`}
              fill
              className="object-cover object-top"
              sizes="144px"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div
            className="text-6xl sm:text-7xl font-black leading-none select-none mb-2"
            style={{ color: driver.teamColor, opacity: 0.35 }}
          >
            {driver.number}
          </div>
          <span className="text-lg text-[#64748B]">{driver.firstName}</span>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
            {driver.lastName}
          </h1>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: driver.teamColor }}
            />
            <span className="text-[#64748B]">{driver.team}</span>
            {driver.championships > 0 && (
              <span className="px-3 py-1 bg-[#FCD34D]/20 text-[#FCD34D] text-xs font-bold rounded-full border border-[#FCD34D]/30">
                WDC x{driver.championships}
              </span>
            )}
          </div>
          <div
            className="mt-4 w-24 h-1 rounded-full"
            style={{ backgroundColor: driver.teamColor }}
          />
        </div>
      </section>

      {/* Info */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        {[
          { l: "카 넘버", v: `#${driver.number}` },
          { l: "국적", v: `${driver.flag} ${driver.nationality}` },
          { l: "팀", v: driver.team },
          { l: "생년월일", v: driver.dateOfBirth },
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

      {/* Bio + Strengths */}
      <section className="mb-12">
        <p className="text-[#94A3B8] leading-relaxed text-base mb-6">{driver.bio}</p>
        <div className="flex flex-wrap gap-2">
          {driver.strengths.map((s) => (
            <span
              key={s}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border"
              style={{
                color: driver.teamColor,
                borderColor: driver.teamColor + "50",
                backgroundColor: driver.teamColor + "12",
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* Career Highlights */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-5">커리어 하이라이트</h2>
        <ol className="space-y-3">
          {driver.careerHighlights.map((h, i) => (
            <li key={i} className="flex items-start gap-4 bg-[#141420] border border-[#2D2D3A] rounded-xl px-5 py-4">
              <span
                className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black mt-0.5"
                style={{ backgroundColor: driver.teamColor + "25", color: driver.teamColor }}
              >
                {i + 1}
              </span>
              <span className="text-sm text-[#CBD5E1] leading-relaxed">{h}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Stats */}
      <section>
        <h2 className="text-xl font-bold text-white mb-6">커리어 통계</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6 text-center hover:-translate-y-1 transition-all"
            >
              <span
                className="block text-3xl sm:text-4xl font-black mb-2"
                style={{ color: driver.teamColor }}
              >
                {s.value}
              </span>
              <span className="block text-xs text-[#64748B] uppercase tracking-wider">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 2026 Season Results */}
      <section className="mt-12 pt-8 border-t border-[#2D2D3A]">
        <h2 className="text-xl font-bold text-white mb-6">2026 시즌 결과</h2>
        {raceResults.length === 0 ? (
          <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-8 text-center text-[#64748B] text-sm">
            2026 시즌이 곧 시작됩니다
          </div>
        ) : (
          <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2D2D3A]">
                    <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase w-8">R</th>
                    <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase">그랑프리</th>
                    <th className="text-center px-4 py-3 text-xs text-[#64748B] uppercase w-14">그리드</th>
                    <th className="text-center px-4 py-3 text-xs text-[#64748B] uppercase w-14">결과</th>
                    <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase w-16">포인트</th>
                    <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase hidden md:table-cell">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {raceResults.map((r) => {
                    const finished = r.positionText !== "R" && r.positionText !== "D" && r.positionText !== "W" && r.positionText !== "E" && r.positionText !== "F";
                    const isTop3 = r.position !== null && r.position <= 3;
                    return (
                      <tr key={r.round} className="border-b border-[#2D2D3A]/50 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-mono text-[#64748B] text-xs">{r.round}</td>
                        <td className="px-4 py-3 text-white font-medium">{r.raceName.replace(" Grand Prix", " GP")}</td>
                        <td className="px-4 py-3 text-center font-mono text-[#64748B]">{r.grid === 0 ? "PL" : r.grid}</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className="font-black text-base"
                            style={{ color: isTop3 ? driver.teamColor : finished ? "#fff" : "#64748B" }}
                          >
                            {r.positionText}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-white">{r.points > 0 ? `+${r.points}` : "—"}</td>
                        <td className="px-4 py-3 text-right text-[#64748B] text-xs hidden md:table-cell">{r.status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Career Stats by Year */}
      {careerStats.length > 0 && (
        <section className="mt-12 pt-8 border-t border-[#2D2D3A]">
          <h2 className="text-xl font-bold text-white mb-6">연도별 커리어 통계</h2>
          <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2D2D3A]">
                    <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase w-14">시즌</th>
                    <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase w-40">팀</th>
                    <th className="text-center px-4 py-3 text-xs text-[#64748B] uppercase w-14">순위</th>
                    <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase w-14">우승</th>
                    <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase w-14">폴</th>
                    <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase w-20">포인트</th>
                  </tr>
                </thead>
                <tbody>
                  {careerStats.map((s) => (
                    <tr key={s.season} className="border-b border-[#2D2D3A]/50 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-mono text-[#64748B]">{s.season}</td>
                      <td className="px-4 py-3 text-white text-sm">{s.team}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className="text-sm font-black"
                          style={{
                            color: s.position === 1 ? driver.teamColor
                              : s.position === 2 || s.position === 3 ? "#FCD34D"
                              : "#64748B"
                          }}
                        >
                          {s.position != null ? `${s.position}위` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-white">{s.wins}</td>
                      <td className="px-4 py-3 text-right font-mono text-white">{s.poles}</td>
                      <td className="px-4 py-3 text-right font-black text-white">{s.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Team Link */}
      {team && (
        <section className="mt-12 pt-8 border-t border-[#2D2D3A]">
          <Link
            href={`/teams/${team.id}`}
            className="inline-flex items-center gap-3 bg-[#141420] border border-[#2D2D3A] rounded-xl px-6 py-4 hover:-translate-y-0.5 transition-all group"
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: team.primaryColor }}
            />
            <span className="text-white font-medium group-hover:text-[#E8002D] transition-colors">
              {team.name} 팀 페이지 보기 &rarr;
            </span>
          </Link>
        </section>
      )}
    </div>
    </>
  );
}
