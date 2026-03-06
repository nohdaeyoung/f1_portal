import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { f1Eras } from "@/data/f1-eras";

export function generateStaticParams() {
  return f1Eras.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const era = f1Eras.find((e) => e.slug === slug);
  if (!era) return { title: "Not Found" };
  return {
    title: `${era.name} (${era.period})`,
    description: era.tagline,
  };
}

// ─── 레이아웃별 컴포넌트 ──────────────────────────────────────

// minimal: 태동기 — 빈티지, 절제된 황금색
function LayoutMinimal({ era }: { era: (typeof f1Eras)[0] }) {
  const t = era.theme;
  return (
    <div className="min-h-screen" style={{ background: t.bg }}>
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 pt-24 pb-20">
          <Link href="/history" className="inline-flex items-center gap-2 text-xs mb-10 transition-opacity opacity-50 hover:opacity-100" style={{ color: t.textPrimary }}>
            ← 역사로 돌아가기
          </Link>
          <p className="text-xs tracking-[0.3em] uppercase mb-4 font-mono" style={{ color: t.secondary }}>
            {era.period}
          </p>
          <h1 className="text-5xl sm:text-7xl font-black text-white mb-4 tracking-tight leading-none">
            {era.name}
          </h1>
          <p className="text-lg sm:text-xl italic mb-8 leading-relaxed" style={{ color: t.textPrimary }}>
            "{era.tagline}"
          </p>
          <div className="w-32 h-0.5 rounded" style={{ backgroundColor: t.primary }} />
        </div>
        {/* Decorative period label */}
        <div className="absolute top-1/2 right-8 -translate-y-1/2 text-[120px] font-black opacity-[0.04] text-white leading-none select-none hidden lg:block">
          {era.period.split("–")[0]}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-24 space-y-16">
        {/* Overview */}
        <section className="space-y-6">
          {era.overview.map((para, i) => (
            <p key={i} className="text-base text-[#94A3B8] leading-loose">
              {para}
            </p>
          ))}
        </section>

        {/* Champions */}
        <ChampionsSection era={era} />

        {/* Key Drivers */}
        <DriversSection era={era} />

        {/* Moments */}
        <MomentsMinimal era={era} />

        {/* Legacy */}
        <LegacySection era={era} />

        <EraNav era={era} />
      </div>
    </div>
  );
}

// timeline: 영국 시대 — 그린, 타임라인 레이아웃
function LayoutTimeline({ era }: { era: (typeof f1Eras)[0] }) {
  const t = era.theme;
  return (
    <div className="min-h-screen" style={{ background: t.bg }}>
      {/* Hero */}
      <div className="border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 pt-20 pb-16">
          <Link href="/history" className="inline-flex items-center gap-2 text-xs mb-8 transition-opacity opacity-50 hover:opacity-100" style={{ color: t.textPrimary }}>
            ← 역사로 돌아가기
          </Link>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <span className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1 rounded mb-4" style={{ backgroundColor: t.badge, color: t.badgeText }}>
                {era.period}
              </span>
              <h1 className="text-5xl sm:text-7xl font-black text-white leading-none mb-3">
                {era.name}
              </h1>
              <p className="text-base leading-relaxed max-w-xl" style={{ color: t.textPrimary }}>
                {era.tagline}
              </p>
            </div>
            <div className="text-right hidden lg:block">
              <p className="text-[80px] font-black leading-none opacity-20 text-white">
                {era.champions.length}
              </p>
              <p className="text-xs text-white/30 uppercase tracking-widest -mt-2">시즌</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-16">
        {/* Overview */}
        <section className="grid lg:grid-cols-2 gap-8">
          {era.overview.map((para, i) => (
            <p key={i} className="text-sm text-[#94A3B8] leading-loose">
              {para}
            </p>
          ))}
        </section>

        {/* Timeline Moments */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-8" style={{ color: t.textPrimary }}>주요 사건</h2>
          <div className="relative pl-6 space-y-0">
            <div className="absolute left-0 top-0 bottom-0 w-px" style={{ backgroundColor: t.primary + "40" }} />
            {era.moments.map((m, i) => (
              <div key={i} className="relative pb-10">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-current" style={{ backgroundColor: t.bg, borderColor: t.primary, color: t.primary }} />
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5 ml-4 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs font-bold" style={{ color: t.primary }}>{m.year}</span>
                    <span className="text-sm font-bold text-white">{m.title}</span>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <ChampionsSection era={era} />
        <DriversSection era={era} />
        <LegacySection era={era} />
        <EraNav era={era} />
      </div>
    </div>
  );
}

// bold: 터보시대·베르스타펜 — 강렬한 컬러, 대형 타이포
function LayoutBold({ era }: { era: (typeof f1Eras)[0] }) {
  const t = era.theme;
  return (
    <div className="min-h-screen" style={{ background: t.bg }}>
      {/* Giant Hero */}
      <div className="relative overflow-hidden min-h-[60vh] flex items-center">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `repeating-linear-gradient(45deg, ${t.primary} 0, ${t.primary} 1px, transparent 0, transparent 50%)`,
          backgroundSize: "20px 20px"
        }} />
        <div className="relative max-w-6xl mx-auto px-6 py-24 w-full">
          <Link href="/history" className="inline-flex items-center gap-2 text-xs mb-8 transition-opacity opacity-50 hover:opacity-100" style={{ color: t.textPrimary }}>
            ← 역사로 돌아가기
          </Link>
          <p className="text-xs tracking-[0.4em] uppercase mb-3 font-mono" style={{ color: t.primary }}>
            Formula 1 · {era.period}
          </p>
          <h1 className="text-6xl sm:text-8xl font-black text-white leading-none mb-6 tracking-tighter">
            {era.name}
          </h1>
          <div className="w-full h-1 mb-6 rounded" style={{ background: `linear-gradient(to right, ${t.primary}, ${t.secondary}, transparent)` }} />
          <p className="text-xl sm:text-2xl font-bold leading-relaxed max-w-2xl" style={{ color: t.textPrimary }}>
            {era.tagline}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-24 space-y-20">
        {/* Overview */}
        <section>
          <div className="grid lg:grid-cols-3 gap-6">
            {era.overview.map((para, i) => (
              <div key={i} className="border-l-2 pl-5" style={{ borderColor: i === 0 ? t.primary : t.primary + "40" }}>
                <p className="text-sm text-[#94A3B8] leading-loose">{para}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Moments — card grid */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: t.primary }}>결정적 순간들</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {era.moments.map((m, i) => (
              <div key={i} className="rounded-2xl p-6 border" style={{ backgroundColor: t.primary + "08", borderColor: t.primary + "20" }}>
                <span className="font-mono text-xs font-black block mb-2" style={{ color: t.primary }}>{m.year}</span>
                <h3 className="text-base font-bold text-white mb-2">{m.title}</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <ChampionsSection era={era} />
        <DriversSection era={era} />
        <LegacySection era={era} />
        <EraNav era={era} />
      </div>
    </div>
  );
}

// split: 라이벌리 시대 — 두 색의 대립
function LayoutSplit({ era }: { era: (typeof f1Eras)[0] }) {
  const t = era.theme;
  return (
    <div className="min-h-screen" style={{ background: t.bg }}>
      {/* Split Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-y-0 left-0 w-1/2 opacity-10" style={{ background: `linear-gradient(to right, ${t.primary}, transparent)` }} />
          <div className="absolute inset-y-0 right-0 w-1/2 opacity-10" style={{ background: `linear-gradient(to left, ${t.secondary}, transparent)` }} />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-16">
          <Link href="/history" className="inline-flex items-center gap-2 text-xs mb-10 transition-opacity opacity-50 hover:opacity-100" style={{ color: t.textPrimary }}>
            ← 역사로 돌아가기
          </Link>
          <div className="flex items-center gap-4 mb-6">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded" style={{ backgroundColor: t.primary + "30", color: t.primary }}>{era.period}</span>
            <span className="text-xs text-white/20">라이벌리의 시대</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-white leading-none mb-6">
            {era.name}
          </h1>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 flex-1 rounded" style={{ backgroundColor: t.primary }} />
            <span className="text-xs text-white/30 uppercase tracking-widest font-mono">vs</span>
            <div className="h-1 flex-1 rounded" style={{ backgroundColor: t.secondary }} />
          </div>
          <p className="text-lg leading-relaxed max-w-2xl" style={{ color: t.textPrimary }}>
            {era.tagline}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-24 space-y-16">
        {/* Overview */}
        <section className="space-y-6">
          {era.overview.map((para, i) => (
            <p key={i} className="text-sm text-[#94A3B8] leading-loose">{para}</p>
          ))}
        </section>

        {/* Moments */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-6" style={{ color: t.textPrimary }}>결정적 순간들</h2>
          <div className="space-y-3">
            {era.moments.map((m, i) => (
              <div key={i} className="flex gap-6 p-5 rounded-xl border" style={{ borderColor: (i % 2 === 0 ? t.primary : t.secondary) + "30", backgroundColor: "rgba(255,255,255,0.02)" }}>
                <div className="shrink-0 pt-0.5">
                  <span className="font-mono text-sm font-black" style={{ color: i % 2 === 0 ? t.primary : t.secondary }}>{m.year}</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">{m.title}</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <ChampionsSection era={era} />
        <DriversSection era={era} />
        <LegacySection era={era} />
        <EraNav era={era} />
      </div>
    </div>
  );
}

// magazine: 슈마허 — 잡지스러운 강렬한 레드
function LayoutMagazine({ era }: { era: (typeof f1Eras)[0] }) {
  const t = era.theme;
  return (
    <div className="min-h-screen" style={{ background: t.bg }}>
      {/* Bold magazine header */}
      <div className="border-b-4" style={{ borderColor: t.primary }}>
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-12">
          <Link href="/history" className="inline-flex items-center gap-2 text-xs mb-8 transition-opacity opacity-50 hover:opacity-100" style={{ color: t.textPrimary }}>
            ← 역사로 돌아가기
          </Link>
          <div className="grid lg:grid-cols-[1fr,auto] gap-8 items-end">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="px-3 py-1 text-xs font-black uppercase tracking-widest text-black rounded" style={{ backgroundColor: t.primary }}>
                  {era.period}
                </div>
                <div className="h-px flex-1 opacity-20" style={{ backgroundColor: t.primary }} />
              </div>
              <h1 className="text-6xl sm:text-8xl font-black leading-none mb-4" style={{ color: t.primary }}>
                {era.name}
              </h1>
              <p className="text-lg font-bold text-white leading-relaxed">{era.tagline}</p>
            </div>
            <div className="text-right">
              <p className="text-[6rem] font-black leading-none opacity-15 text-white">{era.champions.length}×</p>
              <p className="text-xs text-white/30 uppercase tracking-widest">챔피언십</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-24 space-y-16">
        {/* Lead article style */}
        <section className="pt-12">
          <div className="grid lg:grid-cols-[2fr,1fr] gap-10">
            <div className="space-y-5">
              {era.overview.map((para, i) => (
                <p key={i} className={`leading-loose ${i === 0 ? "text-base text-white/80 font-medium" : "text-sm text-[#94A3B8]"}`}>
                  {para}
                </p>
              ))}
            </div>
            {/* Quick stats box */}
            <div className="space-y-3">
              <div className="p-5 rounded-xl border" style={{ borderColor: t.primary + "40", backgroundColor: t.badge }}>
                <p className="text-xs uppercase tracking-widest mb-4" style={{ color: t.badgeText }}>핵심 수치</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-3xl font-black" style={{ color: t.primary }}>{era.champions.length}</p>
                    <p className="text-xs text-white/40">시즌 지배</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black" style={{ color: t.primary }}>{era.moments.length}</p>
                    <p className="text-xs text-white/40">결정적 순간</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black" style={{ color: t.primary }}>{era.keyDrivers.length}</p>
                    <p className="text-xs text-white/40">핵심 드라이버</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Moments */}
        <section>
          <h2 className="text-xs font-black uppercase tracking-widest mb-6" style={{ color: t.primary }}>— 결정적 순간들</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {era.moments.map((m, i) => (
              <div key={i} className={`p-6 rounded-xl border ${i === 0 ? "sm:col-span-2" : ""}`} style={{ borderColor: t.primary + "30", backgroundColor: t.primary + "06" }}>
                <span className="font-mono text-xs font-black" style={{ color: t.primary }}>{m.year} — </span>
                <span className="text-sm font-bold text-white">{m.title}</span>
                <p className="text-xs text-[#64748B] leading-relaxed mt-2">{m.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <ChampionsSection era={era} />
        <DriversSection era={era} />
        <LegacySection era={era} />
        <EraNav era={era} />
      </div>
    </div>
  );
}

// centered: 베텔·메르세데스 — 중앙 정렬, 클린
function LayoutCentered({ era }: { era: (typeof f1Eras)[0] }) {
  const t = era.theme;
  return (
    <div className="min-h-screen" style={{ background: t.bg }}>
      {/* Centered hero */}
      <div className="text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, ${t.primary} 1px, transparent 1px)`,
          backgroundSize: "40px 40px"
        }} />
        <div className="relative max-w-3xl mx-auto px-6 pt-24 pb-16">
          <Link href="/history" className="inline-flex items-center gap-2 text-xs mb-10 transition-opacity opacity-50 hover:opacity-100" style={{ color: t.textPrimary }}>
            ← 역사로 돌아가기
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-mono font-bold mb-6" style={{ borderColor: t.primary + "40", color: t.primary, backgroundColor: t.primary + "10" }}>
            {era.period}
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-white leading-none mb-6">
            {era.name}
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: t.textPrimary }}>
            {era.tagline}
          </p>
          <div className="flex items-center justify-center gap-2 mt-8">
            <div className="h-px w-16 rounded" style={{ backgroundColor: t.primary + "40" }} />
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.primary }} />
            <div className="h-px w-16 rounded" style={{ backgroundColor: t.primary + "40" }} />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pb-24 space-y-16">
        {/* Overview */}
        <section className="space-y-6">
          {era.overview.map((para, i) => (
            <p key={i} className="text-sm text-[#94A3B8] leading-loose">{para}</p>
          ))}
        </section>

        {/* Moments */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-center mb-8" style={{ color: t.textPrimary }}>결정적 순간들</h2>
          <div className="space-y-3">
            {era.moments.map((m, i) => (
              <div key={i} className="p-5 rounded-xl border text-left" style={{ borderColor: t.primary + "20", backgroundColor: t.primary + "06" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs font-bold" style={{ color: t.primary }}>{m.year}</span>
                  <span className="text-sm font-bold text-white">{m.title}</span>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <ChampionsSection era={era} />
        <DriversSection era={era} />
        <LegacySection era={era} />
        <EraNav era={era} />
      </div>
    </div>
  );
}

// ─── 공통 섹션 컴포넌트 ────────────────────────────────────────

function ChampionsSection({ era }: { era: (typeof f1Eras)[0] }) {
  const t = era.theme;
  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: t.textPrimary }}>시즌별 챔피언</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {era.champions.map((c) => (
          <div key={c.year} className="flex items-center gap-2.5 p-3 rounded-lg border" style={{ borderColor: t.primary + "20", backgroundColor: t.primary + "05" }}>
            <span className="font-mono text-xs font-black w-10 shrink-0" style={{ color: t.primary }}>{c.year}</span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{c.flag} {c.driver}</p>
              <p className="text-[10px] text-[#475569] truncate">{c.team}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DriversSection({ era }: { era: (typeof f1Eras)[0] }) {
  const t = era.theme;
  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: t.textPrimary }}>핵심 드라이버</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {era.keyDrivers.map((d) => (
          <div key={d.name} className="p-5 rounded-xl border" style={{ borderColor: t.primary + "20", backgroundColor: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">{d.flag}</span>
              <div>
                <p className="font-bold text-white text-sm">{d.name}</p>
                {d.titles > 0 && (
                  <p className="text-xs font-bold mt-0.5" style={{ color: t.primary }}>{d.titles}회 챔피언</p>
                )}
              </div>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">{d.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MomentsMinimal({ era }: { era: (typeof f1Eras)[0] }) {
  const t = era.theme;
  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: t.textPrimary }}>결정적 순간들</h2>
      <div className="space-y-4">
        {era.moments.map((m, i) => (
          <div key={i} className="flex gap-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <span className="font-mono text-xs font-black w-12 shrink-0 pt-0.5" style={{ color: t.primary }}>{m.year}</span>
            <div>
              <p className="text-sm font-bold text-white mb-1">{m.title}</p>
              <p className="text-xs text-[#64748B] leading-relaxed">{m.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LegacySection({ era }: { era: (typeof f1Eras)[0] }) {
  const t = era.theme;
  return (
    <section className="p-6 rounded-2xl border" style={{ borderColor: t.primary + "30", backgroundColor: t.primary + "08" }}>
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: t.primary }}>레거시</p>
      <p className="text-sm text-[#CBD5E1] leading-loose">{era.legacy}</p>
    </section>
  );
}

function EraNav({ era }: { era: (typeof f1Eras)[0] }) {
  const idx = f1Eras.findIndex((e) => e.slug === era.slug);
  const prev = idx > 0 ? f1Eras[idx - 1] : null;
  const next = idx < f1Eras.length - 1 ? f1Eras[idx + 1] : null;

  return (
    <nav className="flex items-center justify-between pt-8 border-t border-white/5">
      {prev ? (
        <Link href={`/history/era/${prev.slug}`} className="group flex items-center gap-3 text-left">
          <span className="text-[#64748B] group-hover:text-white transition-colors text-lg">←</span>
          <div>
            <p className="text-[10px] text-[#475569] uppercase tracking-widest">이전 시대</p>
            <p className="text-sm font-bold text-white group-hover:text-[#E8002D] transition-colors">{prev.name}</p>
          </div>
        </Link>
      ) : <div />}
      <Link href="/history" className="text-xs text-[#475569] hover:text-white transition-colors">역사 홈</Link>
      {next ? (
        <Link href={`/history/era/${next.slug}`} className="group flex items-center gap-3 text-right">
          <div>
            <p className="text-[10px] text-[#475569] uppercase tracking-widest">다음 시대</p>
            <p className="text-sm font-bold text-white group-hover:text-[#E8002D] transition-colors">{next.name}</p>
          </div>
          <span className="text-[#64748B] group-hover:text-white transition-colors text-lg">→</span>
        </Link>
      ) : <div />}
    </nav>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default async function EraPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const era = f1Eras.find((e) => e.slug === slug);
  if (!era) notFound();

  switch (era.theme.layout) {
    case "minimal":    return <LayoutMinimal era={era} />;
    case "timeline":   return <LayoutTimeline era={era} />;
    case "bold":       return <LayoutBold era={era} />;
    case "split":      return <LayoutSplit era={era} />;
    case "magazine":   return <LayoutMagazine era={era} />;
    case "centered":   return <LayoutCentered era={era} />;
    default:           return <LayoutCentered era={era} />;
  }
}
