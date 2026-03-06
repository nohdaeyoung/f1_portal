import Link from "next/link";
import { notFound } from "next/navigation";
import { circuits, getCircuit } from "@/data/f1-data";
import { fetchCircuitWinners } from "@/lib/data/live";
import { TrackMap } from "./TrackMap";
import { circuitSchema, breadcrumbSchema, jsonLdScript } from "@/lib/jsonld";

export async function generateStaticParams() {
  return circuits.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getCircuit(id);
  if (!c) return { title: "Not Found" };
  const title = c.koreanName;
  const description = `${c.koreanName} — ${c.country}. 트랙 길이 ${c.length}km, ${c.turns}개 코너. 랩 레코드, 서킷 특징, 역대 우승자 정보.`;
  return {
    title,
    description,
    openGraph: {
      title: `${title} | PitLane`,
      description,
      url: `https://f1.324.ing/circuits/${id}`,
      images: [{ url: "/og-default.png", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function CircuitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const circuit = getCircuit(id);
  if (!circuit) notFound();

  const winners = await fetchCircuitWinners(id);

  const specs = [
    { l: "트랙 길이", v: `${circuit.length} km` },
    { l: "코너 수", v: `${circuit.turns}개` },
    { l: "DRS 존", v: `${circuit.drsZones}개` },
    { l: "레이스 랩", v: `${circuit.laps}랩` },
    { l: "서킷 유형", v: circuit.type === "street" ? "시가지" : "상설" },
  ];

  const ldCircuit = circuitSchema({
    id: circuit.id,
    name: circuit.name,
    koreanName: circuit.koreanName,
    city: circuit.city,
    country: circuit.country,
    length: String(circuit.length),
    turns: circuit.turns,
    coordinates: circuit.coordinates,
  });
  const ldBreadcrumb = breadcrumbSchema([
    { name: "홈", url: "https://f1.324.ing" },
    { name: "서킷", url: "https://f1.324.ing/circuits" },
    { name: circuit.koreanName, url: `https://f1.324.ing/circuits/${circuit.id}` },
  ]);

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(ldCircuit) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(ldBreadcrumb) }} />
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/circuits"
        className="inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-white transition-colors mb-10"
      >
        &larr; 서킷 목록
      </Link>

      {/* Hero */}
      <section className="mb-12">
        <div className="text-4xl mb-4">{circuit.flag}</div>
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
          {circuit.koreanName}
        </h1>
        <p className="text-lg text-[#64748B] mt-2">{circuit.name}</p>
        <p className="text-sm text-[#64748B] mt-1">
          {circuit.city}, {circuit.country}
        </p>
        <div className="mt-4 w-24 h-1 bg-[#E8002D] rounded-full" />
      </section>

      {/* Overview */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4">서킷 소개</h2>
        <p className="text-[#94A3B8] leading-relaxed text-base mb-6">{circuit.description}</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {circuit.highlights.map((h, i) => (
            <li key={i} className="flex items-start gap-3 bg-[#141420] border border-[#2D2D3A] rounded-xl px-5 py-4 text-sm text-[#CBD5E1]">
              <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-[#E8002D]/20 text-[#E8002D] flex items-center justify-center text-xs font-bold">{i + 1}</span>
              {h}
            </li>
          ))}
        </ul>
      </section>

      {/* Specs */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6">서킷 사양</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {specs.map((s) => (
            <div
              key={s.l}
              className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6 text-center hover:-translate-y-1 transition-all"
            >
              <span className="block text-2xl sm:text-3xl font-black text-[#E8002D] mb-2">
                {s.v}
              </span>
              <span className="block text-xs text-[#64748B] uppercase tracking-wider">
                {s.l}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Lap Record */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6">랩 레코드</h2>
        <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6 flex items-center gap-8 flex-wrap">
          <div>
            <span className="block text-xs text-[#64748B] uppercase mb-1">기록</span>
            <span className="block text-3xl font-mono font-black text-[#E8002D]">
              {circuit.lapRecord.time}
            </span>
          </div>
          <div className="h-12 w-px bg-[#2D2D3A] hidden sm:block" />
          <div>
            <span className="block text-xs text-[#64748B] uppercase mb-1">
              드라이버
            </span>
            <span className="block text-lg font-bold text-white">
              {circuit.lapRecord.driver}
            </span>
          </div>
          <div className="h-12 w-px bg-[#2D2D3A] hidden sm:block" />
          <div>
            <span className="block text-xs text-[#64748B] uppercase mb-1">연도</span>
            <span className="block text-lg font-bold text-white">
              {circuit.lapRecord.year}
            </span>
          </div>
        </div>
      </section>

      {/* Track Map */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6">트랙 맵</h2>
        <TrackMap circuitId={circuit.id} />
      </section>

      {/* Meta */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6">
          <span className="block text-xs text-[#64748B] uppercase mb-1">첫 그랑프리</span>
          <span className="block text-2xl font-bold text-white">{circuit.firstGrandPrix}</span>
        </div>
        <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6">
          <span className="block text-xs text-[#64748B] uppercase mb-1">위치 좌표</span>
          <span className="block text-lg font-mono text-white">
            {circuit.coordinates.lat}, {circuit.coordinates.lng}
          </span>
        </div>
      </section>

      {/* Past Winners */}
      {winners.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-6">역대 우승자</h2>
          <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2D2D3A]">
                    <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase w-16">연도</th>
                    <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase">우승자</th>
                    <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase hidden sm:table-cell">팀</th>
                    <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase hidden md:table-cell">기록</th>
                  </tr>
                </thead>
                <tbody>
                  {winners.map((w) => (
                    <tr key={w.season} className="border-b border-[#2D2D3A]/50 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-mono text-[#64748B]">{w.season}</td>
                      <td className="px-4 py-3 font-bold text-white">{w.winner}</td>
                      <td className="px-4 py-3 text-[#64748B] hidden sm:table-cell">{w.constructor}</td>
                      <td className="px-4 py-3 text-right font-mono text-[#64748B] hidden md:table-cell">{w.time ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
    </>
  );
}
