"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { calcRacePoints, calcTeamPoints } from "@/lib/f1-points";

interface NavLink {
  href: string;
  label: string;
  description: string;
}

interface MetaConfig {
  siteTitle: string;
  titleTemplate: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  keywords: string;
}

interface AdminConfig {
  analytics: {
    gtmId: string;
    gaId: string;
    naverCode: string;
    headCode: string;
    bodyCode: string;
  };
  navLinks: NavLink[];
  meta: MetaConfig;
}

interface DriverInfo {
  id: string;
  firstName: string;
  lastName: string;
  teamId: string;
}

interface Props {
  initialConfig: AdminConfig;
  pendingRounds: { round: number; label: string }[];
  driverList: DriverInfo[];
}

type Section = "analytics" | "nav" | "meta" | "circuit" | "race" | "season-points";

export default function AdminDashboardClient({
  initialConfig,
  pendingRounds,
  driverList,
}: Props) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>("analytics");
  const [config, setConfig] = useState<AdminConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveWarning, setSaveWarning] = useState("");

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  };

  const saveConfig = async () => {
    setSaving(true);
    setSaved(false);
    setSaveWarning("");
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.warning === "filesystem_readonly") {
        setSaveWarning("Vercel 배포 환경에서는 파일 저장이 제한됩니다. 환경 변수(NEXT_PUBLIC_GTM_ID 등)를 사용하세요.");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveWarning("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const updateAnalytics = (key: keyof AdminConfig["analytics"], value: string) => {
    setConfig((prev) => ({ ...prev, analytics: { ...prev.analytics, [key]: value } }));
  };

  const updateMeta = (key: keyof MetaConfig, value: string) => {
    setConfig((prev) => ({ ...prev, meta: { ...prev.meta, [key]: value } }));
  };

  const updateNavLink = (index: number, field: keyof NavLink, value: string) => {
    setConfig((prev) => {
      const links = [...prev.navLinks];
      links[index] = { ...links[index], [field]: value };
      return { ...prev, navLinks: links };
    });
  };

  const sections: { id: Section; label: string }[] = [
    { id: "analytics", label: "코드 삽입" },
    { id: "nav", label: "메뉴 관리" },
    { id: "meta", label: "메타태그" },
    { id: "circuit", label: "서킷 코너" },
    { id: "race", label: "레이스 결과" },
    { id: "season-points", label: "시즌 포인트" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[#2D2D3A] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-base font-black text-white">
            <span className="text-[#E8002D]">F1</span> by 324.ing
          </p>
          <span className="text-[10px] text-[#E8002D] border border-[#E8002D]/40 bg-[#E8002D]/10 px-2 py-0.5 rounded font-bold uppercase tracking-widest">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          {saved && (
            <span className="text-xs text-[#22C55E]">저장 완료</span>
          )}
          {activeSection !== "race" && (
            <button
              onClick={saveConfig}
              disabled={saving}
              className="px-4 py-1.5 bg-[#E8002D] hover:bg-[#C0001F] disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-[#64748B] hover:text-white text-xs font-bold rounded-lg transition-colors"
          >
            로그아웃
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-48 border-r border-[#2D2D3A] py-4 shrink-0">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full text-left px-5 py-3 text-sm font-medium transition-colors ${
                activeSection === s.id
                  ? "text-white bg-white/8 border-r-2 border-[#E8002D]"
                  : "text-[#64748B] hover:text-white hover:bg-white/5"
              }`}
            >
              {s.label}
            </button>
          ))}
        </aside>

        {/* Content */}
        <main className="flex-1 p-6 max-w-3xl">
          {saveWarning && (
            <div className="mb-4 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl px-4 py-3">
              <p className="text-xs text-[#F59E0B]">{saveWarning}</p>
            </div>
          )}

          {/* Analytics / Code injection */}
          {activeSection === "analytics" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-white mb-1">코드 삽입</h2>
                <p className="text-xs text-[#64748B]">
                  GTM, Google Analytics, 네이버 서치어드바이저 코드를 삽입합니다.
                </p>
              </div>

              <div className="space-y-4">
                <Field
                  label="Google Tag Manager ID"
                  hint="예: GTM-XXXXXXX"
                  value={config.analytics.gtmId}
                  onChange={(v) => updateAnalytics("gtmId", v)}
                  placeholder="GTM-XXXXXXX"
                />

                <Field
                  label="Google Analytics Measurement ID"
                  hint="예: G-XXXXXXXXXX"
                  value={config.analytics.gaId}
                  onChange={(v) => updateAnalytics("gaId", v)}
                  placeholder="G-XXXXXXXXXX"
                />

                <Field
                  label="네이버 서치어드바이저 인증 코드"
                  hint="메타 태그 content 값만 입력하세요"
                  value={config.analytics.naverCode}
                  onChange={(v) => updateAnalytics("naverCode", v)}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />

                <CodeField
                  label="<head> 추가 코드"
                  hint="<head> 태그 내에 삽입할 추가 코드"
                  value={config.analytics.headCode}
                  onChange={(v) => updateAnalytics("headCode", v)}
                />

                <CodeField
                  label="<body> 추가 코드"
                  hint="<body> 태그 시작 직후 삽입할 추가 코드"
                  value={config.analytics.bodyCode}
                  onChange={(v) => updateAnalytics("bodyCode", v)}
                />
              </div>

              <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest">환경 변수 (Vercel 배포 시)</p>
                <p className="text-xs text-[#475569]">
                  Vercel에 배포된 환경에서는 아래 환경 변수를 Vercel 대시보드에서 설정하세요.
                </p>
                <div className="font-mono text-xs text-[#94A3B8] space-y-1 mt-2">
                  <p>NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX</p>
                  <p>NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX</p>
                  <p>NEXT_PUBLIC_NAVER_CODE=xxxx...</p>
                </div>
              </div>
            </div>
          )}

          {/* Nav menu management */}
          {activeSection === "nav" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-white mb-1">메뉴 관리</h2>
                <p className="text-xs text-[#64748B]">
                  네비게이션 메뉴의 이름과 설명을 수정합니다.
                </p>
              </div>

              <div className="space-y-3">
                {config.navLinks.map((link, i) => (
                  <div
                    key={link.href}
                    className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-[#475569] font-mono">{link.href}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-[#64748B] uppercase tracking-widest mb-1">
                          메뉴명
                        </label>
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => updateNavLink(i, "label", e.target.value)}
                          className="w-full bg-[#0D0D14] border border-[#2D2D3A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8002D] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#64748B] uppercase tracking-widest mb-1">
                          설명
                        </label>
                        <input
                          type="text"
                          value={link.description}
                          onChange={(e) => updateNavLink(i, "description", e.target.value)}
                          className="w-full bg-[#0D0D14] border border-[#2D2D3A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8002D] transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-[#475569]">
                메뉴명 변경 사항은 저장 후 서버 재시작 또는 재배포 시 반영됩니다.
              </p>
            </div>
          )}

          {/* Meta tags */}
          {activeSection === "meta" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-white mb-1">메타태그 관리</h2>
                <p className="text-xs text-[#64748B]">
                  사이트 SEO를 위한 메타태그를 설정합니다. 저장 후 재배포 시 반영됩니다.
                </p>
              </div>

              <div className="space-y-4">
                <Field
                  label="사이트 기본 타이틀"
                  hint="홈페이지 기본 title (template 미적용 페이지)"
                  value={config.meta?.siteTitle ?? ""}
                  onChange={(v) => updateMeta("siteTitle", v)}
                  placeholder="F1 by 324.ing — F1 종합 포털"
                />
                <Field
                  label="타이틀 템플릿"
                  hint="%s 자리에 페이지별 제목이 들어갑니다"
                  value={config.meta?.titleTemplate ?? ""}
                  onChange={(v) => updateMeta("titleTemplate", v)}
                  placeholder="%s | F1 by 324.ing"
                />
                <Field
                  label="기본 설명 (description)"
                  hint="검색 결과에 표시되는 사이트 설명"
                  value={config.meta?.description ?? ""}
                  onChange={(v) => updateMeta("description", v)}
                  placeholder="2026 F1 드라이버 아카이브, 서킷 가이드, 시즌 트래커..."
                />
                <Field
                  label="OG Title"
                  hint="소셜 공유 시 표시되는 제목 (비워두면 사이트 타이틀 사용)"
                  value={config.meta?.ogTitle ?? ""}
                  onChange={(v) => updateMeta("ogTitle", v)}
                  placeholder="F1 by 324.ing — F1 종합 포털"
                />
                <Field
                  label="OG Description"
                  hint="소셜 공유 시 표시되는 설명 (비워두면 기본 설명 사용)"
                  value={config.meta?.ogDescription ?? ""}
                  onChange={(v) => updateMeta("ogDescription", v)}
                  placeholder="2026 F1 드라이버 아카이브, 서킷 가이드..."
                />
                <Field
                  label="OG Image URL"
                  hint="소셜 공유 이미지 경로 (예: /og-default.png 또는 절대 URL)"
                  value={config.meta?.ogImage ?? ""}
                  onChange={(v) => updateMeta("ogImage", v)}
                  placeholder="/og-default.png"
                />
                <Field
                  label="키워드 (keywords)"
                  hint="쉼표로 구분하여 입력하세요"
                  value={config.meta?.keywords ?? ""}
                  onChange={(v) => updateMeta("keywords", v)}
                  placeholder="F1, 포뮬러원, Formula 1, 2026 시즌"
                />
              </div>

              <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest">참고</p>
                <ul className="text-xs text-[#475569] space-y-1 list-disc list-inside">
                  <li>메타태그는 재배포(빌드) 후 반영됩니다</li>
                  <li>개별 페이지의 메타태그는 해당 페이지에서 별도 설정됩니다</li>
                  <li>OG Image는 1200×630px 권장</li>
                </ul>
              </div>
            </div>
          )}

          {/* Circuit corners */}
          {activeSection === "circuit" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-white mb-1">서킷 코너 입력</h2>
                <p className="text-xs text-[#64748B]">
                  관리자 로그인 상태에서 서킷 상세 페이지에서 직접 코너를 추가/편집할 수 있습니다.
                </p>
              </div>

              <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#22C55E]/20 flex items-center justify-center">
                    <span className="text-[#22C55E] text-sm font-black">✓</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">관리자 모드 활성화됨</p>
                    <p className="text-xs text-[#64748B]">현재 로그인된 상태입니다</p>
                  </div>
                </div>

                <div className="border-t border-[#2D2D3A] pt-4 space-y-2">
                  <p className="text-xs text-[#94A3B8] font-medium">서킷 코너 편집 방법:</p>
                  <ol className="text-xs text-[#64748B] space-y-1.5 list-decimal list-inside">
                    <li>서킷 상세 페이지로 이동하세요 (예: /circuits/spa)</li>
                    <li>트랙 맵 우측 상단의 "편집" 버튼을 클릭하세요</li>
                    <li>트랙 위를 클릭하여 코너를 추가하세요</li>
                    <li>코너명과 레이블 위치를 설정하세요</li>
                    <li>JSON을 복사하여 TrackMap.tsx의 CIRCUIT_CORNERS에 붙여넣으세요</li>
                  </ol>
                </div>

                <div className="bg-[#0D0D14] rounded-lg p-3">
                  <p className="text-[10px] text-[#475569] mb-2 uppercase tracking-widest">빠른 이동</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "albert-park", name: "멜버른" },
                      { id: "spa", name: "스파" },
                      { id: "monza", name: "몬자" },
                      { id: "monaco", name: "모나코" },
                      { id: "silverstone", name: "실버스톤" },
                      { id: "suzuka", name: "스즈카" },
                    ].map((c) => (
                      <a
                        key={c.id}
                        href={`/circuits/${c.id}`}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded text-xs text-[#94A3B8] hover:text-white transition-colors"
                      >
                        {c.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Race result input */}
          {activeSection === "race" && (
            <RaceInputSection
              pendingRounds={pendingRounds}
              driverList={driverList}
            />
          )}

          {/* Season points management */}
          {activeSection === "season-points" && (
            <SeasonPointsSection />
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Season Points Section ─────────────────────────────────────

const YEARS = Array.from({ length: 2025 - 1950 + 1 }, (_, i) => 2025 - i);

interface ProgressDataset {
  driverId: string;
  driverName: string;
  team: string;
  finalPosition: number;
  finalPoints: number;
  color: string;
  points: number[];
}

interface ProgressData {
  rounds: number;
  raceNames: string[];
  dataset: ProgressDataset[];
}

function SeasonPointsSection() {
  const [year, setYear] = useState(2025);
  const [status, setStatus] = useState<"idle" | "fetching" | "loading" | "ready" | "saving">("idle");
  const [edited, setEdited] = useState<ProgressData | null>(null);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState<"ok" | "err">("ok");

  const showMsg = (text: string, type: "ok" | "err") => {
    setMessage(text);
    setMsgType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  // Load saved data from Firestore
  const loadSaved = async (y: number) => {
    setStatus("loading");
    setEdited(null);
    try {
      const res = await fetch(`/api/admin/season-points/${y}`);
      const json = await res.json();
      if (json && json.rounds) {
        setEdited(JSON.parse(JSON.stringify(json)));
        setStatus("ready");
      } else {
        setStatus("idle");
      }
    } catch {
      setStatus("idle");
    }
  };

  // Fetch from Jolpica via our progress API
  const fetchFromApi = async () => {
    setStatus("fetching");
    setEdited(null);
    try {
      const res = await fetch(`/api/season/${year}/progress`);
      if (!res.ok) throw new Error("API error");
      const json: ProgressData = await res.json();
      setEdited(JSON.parse(JSON.stringify(json)));
      setStatus("ready");
    } catch {
      showMsg("데이터를 가져오지 못했습니다.", "err");
      setStatus("idle");
    }
  };

  const updatePoint = (driverIdx: number, roundIdx: number, value: string) => {
    if (!edited) return;
    const num = parseFloat(value) || 0;
    setEdited((prev) => {
      if (!prev) return prev;
      const next = { ...prev, dataset: prev.dataset.map((d, di) => {
        if (di !== driverIdx) return d;
        const pts = [...d.points];
        pts[roundIdx] = num;
        return { ...d, points: pts, finalPoints: pts[pts.length - 1] ?? 0 };
      }) };
      return next;
    });
  };

  const save = async () => {
    if (!edited) return;
    setStatus("saving");
    try {
      const res = await fetch(`/api/admin/season-points/${year}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edited),
      });
      const json = await res.json();
      if (json.ok) {
        showMsg("저장 완료", "ok");
      } else {
        showMsg(json.error ?? "저장 실패", "err");
      }
    } catch {
      showMsg("저장 중 오류가 발생했습니다.", "err");
    } finally {
      setStatus("ready");
    }
  };

  const handleYearChange = (y: number) => {
    setYear(y);
    setEdited(null);
    setStatus("idle");
  };

  const isBusy = status === "fetching" || status === "loading" || status === "saving";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-white mb-1">시즌 포인트 관리</h2>
        <p className="text-xs text-[#64748B]">
          연도별 라운드별 누적 포인트 데이터를 불러오고 수정·저장합니다.
        </p>
      </div>

      {/* Year + actions */}
      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-[10px] text-[#64748B] uppercase tracking-widest mb-1.5">시즌</label>
          <select
            value={year}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            disabled={isBusy}
            className="bg-[#0D0D14] border border-[#2D2D3A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8002D] disabled:opacity-50"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => loadSaved(year)}
          disabled={isBusy}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-sm text-[#94A3B8] hover:text-white rounded-lg transition-colors"
        >
          {status === "loading" ? "불러오는 중..." : "저장된 데이터 불러오기"}
        </button>
        <button
          onClick={fetchFromApi}
          disabled={isBusy}
          className="px-4 py-2 bg-[#2D2D3A] hover:bg-[#3D3D4A] disabled:opacity-50 text-sm text-white rounded-lg transition-colors"
        >
          {status === "fetching" ? "가져오는 중... (수십 초 소요)" : "Jolpica API에서 가져오기"}
        </button>
        {edited && (
          <button
            onClick={save}
            disabled={isBusy}
            className="px-4 py-2 bg-[#E8002D] hover:bg-[#C0001F] disabled:opacity-50 text-sm text-white font-bold rounded-lg transition-colors"
          >
            {status === "saving" ? "저장 중..." : "Firestore에 저장"}
          </button>
        )}
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 border text-xs ${msgType === "ok" ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]" : "bg-[#E8002D]/10 border-[#E8002D]/30 text-[#E8002D]"}`}>
          {message}
        </div>
      )}

      {/* Editable table */}
      {edited && (
        <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="text-xs w-max min-w-full">
              <thead>
                <tr className="border-b border-[#2D2D3A]">
                  <th className="sticky left-0 bg-[#141420] z-10 text-left px-4 py-2 text-[#64748B] uppercase tracking-widest w-40 shrink-0">드라이버</th>
                  {edited.raceNames.map((name, i) => (
                    <th key={i} className="px-2 py-2 text-center text-[#64748B] font-mono whitespace-nowrap min-w-[52px]">
                      <div>R{i + 1}</div>
                      <div className="text-[9px] text-[#475569] font-normal">{name.replace(" GP", "").slice(0, 8)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {edited.dataset.map((driver, di) => (
                  <tr key={driver.driverId} className="border-b border-[#2D2D3A]/50 hover:bg-white/[0.02]">
                    <td className="sticky left-0 bg-[#141420] z-10 px-4 py-2 whitespace-nowrap">
                      <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: driver.color }} />
                      <span className="text-[#94A3B8] font-medium">{driver.driverName}</span>
                    </td>
                    {driver.points.map((pts, ri) => (
                      <td key={ri} className="px-1 py-1 text-center">
                        <input
                          type="number"
                          value={pts}
                          onChange={(e) => updatePoint(di, ri, e.target.value)}
                          className="w-12 bg-[#0D0D14] border border-[#2D2D3A] rounded px-1 py-1 text-white text-center font-mono focus:outline-none focus:border-[#E8002D] transition-colors"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-[#2D2D3A]">
            <p className="text-[10px] text-[#475569]">
              누적 포인트 수정 후 "Firestore에 저장" 버튼을 눌러 저장하세요. 저장된 데이터는 역대 시즌 아카이브 차트에 반영됩니다.
            </p>
          </div>
        </div>
      )}

      {status === "idle" && !edited && (
        <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-8 text-center text-sm text-[#64748B]">
          연도를 선택하고 데이터를 불러오세요.
        </div>
      )}
    </div>
  );
}

// ─── Race Input Section ────────────────────────────────────────

type ResultStatus = "Finished" | "DNF" | "DSQ" | "DNS";

interface ResultRow {
  position: number;
  driverId: string;
  status: ResultStatus;
}

function makeRows(count: number): ResultRow[] {
  return Array.from({ length: count }, (_, i) => ({
    position: i + 1,
    driverId: "",
    status: "Finished" as ResultStatus,
  }));
}

function RaceInputSection({
  pendingRounds,
  driverList,
}: {
  pendingRounds: { round: number; label: string }[];
  driverList: DriverInfo[];
}) {
  const numRows = driverList.length || 22;

  const [round, setRound] = useState(pendingRounds[0]?.round ?? 0);
  const [isSprint, setIsSprint] = useState(false);
  const [activeTab, setActiveTab] = useState<"sprint" | "main">("sprint");

  if (pendingRounds.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">레이스 결과 입력</h2>
        <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6 text-center">
          <p className="text-sm text-[#64748B]">모든 라운드가 완료되었습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-white mb-1">레이스 결과 입력</h2>
        <p className="text-xs text-[#64748B]">
          Jolpica API 업데이트 전 수동으로 결과를 입력해 즉시 반영합니다.
        </p>
      </div>

      {/* Round + Sprint toggle */}
      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-[10px] text-[#64748B] uppercase tracking-widest mb-1.5">
              라운드
            </label>
            <select
              value={round}
              onChange={(e) => setRound(Number(e.target.value))}
              className="w-full bg-[#0D0D14] border border-[#2D2D3A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8002D] transition-colors"
            >
              {pendingRounds.map((r) => (
                <option key={r.round} value={r.round}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id="isSprint"
              checked={isSprint}
              onChange={(e) => {
                setIsSprint(e.target.checked);
                setActiveTab("sprint");
              }}
              className="w-4 h-4 accent-[#E8002D]"
            />
            <label htmlFor="isSprint" className="text-sm text-white cursor-pointer">
              스프린트 주말
            </label>
          </div>
        </div>
      </div>

      {isSprint ? (
        /* ── Sprint weekend: two separate sub-tabs ── */
        <div className="space-y-4">
          {/* Sub-tab header */}
          <div className="flex border border-[#2D2D3A] rounded-xl overflow-hidden">
            {(["sprint", "main"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-xs font-bold transition-colors ${
                  activeTab === tab
                    ? "bg-[#E8002D] text-white"
                    : "bg-[#141420] text-[#64748B] hover:text-white"
                }`}
              >
                {tab === "sprint" ? "스프린트 레이스" : "메인 레이스"}
              </button>
            ))}
          </div>

          {activeTab === "sprint" && (
            <SprintForm round={round} driverList={driverList} numRows={numRows} />
          )}
          {activeTab === "main" && (
            <MainRaceForm round={round} driverList={driverList} numRows={numRows} />
          )}
        </div>
      ) : (
        /* ── Regular weekend: single main race form ── */
        <MainRaceForm round={round} driverList={driverList} numRows={numRows} />
      )}
    </div>
  );
}

// ─── Sprint Form ───────────────────────────────────────────────

function SprintForm({
  round,
  driverList,
  numRows,
}: {
  round: number;
  driverList: DriverInfo[];
  numRows: number;
}) {
  const [results, setResults] = useState<ResultRow[]>(() => makeRows(numRows));
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const updateResult = (i: number, field: keyof ResultRow, value: string | number) => {
    setResults((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const preview = useMemo(() => {
    const filled = results.filter((r) => r.driverId);
    const dPts = calcRacePoints(filled, "", true);
    const tPts = calcTeamPoints(dPts, driverList.map((d) => ({ id: d.id, teamId: d.teamId })));
    return {
      drivers: Object.entries(dPts)
        .filter(([, p]) => p > 0)
        .sort(([, a], [, b]) => b - a)
        .map(([id, p]) => {
          const d = driverList.find((x) => x.id === id);
          return { id, name: d ? `${d.firstName} ${d.lastName}` : id, points: p };
        }),
      teams: Object.entries(tPts)
        .filter(([, p]) => p > 0)
        .sort(([, a], [, b]) => b - a)
        .map(([teamId, p]) => ({ teamId, points: p })),
    };
  }, [results, driverList]);

  const handleSubmit = async () => {
    const filled = results.filter((r) => r.driverId);
    if (!filled.length || !filled.find((r) => r.position === 1)) {
      setSubmitResult("error");
      setMessage("1위 드라이버를 포함해 결과를 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setSubmitResult("idle");
    setMessage("");
    try {
      const res = await fetch("/api/admin/race-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          season: 2026,
          round,
          isSprint: true,
          qualifying: { pole: "" },
          results: filled,
          fastestLap: { driverId: "", time: "" },
        }),
      });
      const data = await res.json();
      if (data.ok) { setSubmitResult("success"); setMessage(data.message); }
      else { setSubmitResult("error"); setMessage(data.error ?? "오류가 발생했습니다."); }
    } catch {
      setSubmitResult("error");
      setMessage("요청 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <ResultsTable
        label="스프린트 결과"
        results={results}
        driverList={driverList}
        onUpdate={updateResult}
      />
      <PointsPreview preview={preview} />
      <StatusMsg result={submitResult} message={message} />
      <button
        onClick={handleSubmit}
        disabled={submitting || submitResult === "success"}
        className="w-full py-3 bg-[#E8002D] hover:bg-[#C0001F] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
      >
        {submitting ? "저장 중..." : submitResult === "success" ? "완료" : "스프린트 결과 저장"}
      </button>
    </div>
  );
}

// ─── Main Race Form ────────────────────────────────────────────

function MainRaceForm({
  round,
  driverList,
  numRows,
}: {
  round: number;
  driverList: DriverInfo[];
  numRows: number;
}) {
  const [pole, setPole] = useState("");
  const [results, setResults] = useState<ResultRow[]>(() => makeRows(numRows));
  const [flDriver, setFlDriver] = useState("");
  const [flTime, setFlTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const updateResult = (i: number, field: keyof ResultRow, value: string | number) => {
    setResults((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const preview = useMemo(() => {
    const filled = results.filter((r) => r.driverId);
    const dPts = calcRacePoints(filled, flDriver, false);
    const tPts = calcTeamPoints(dPts, driverList.map((d) => ({ id: d.id, teamId: d.teamId })));
    return {
      drivers: Object.entries(dPts)
        .filter(([, p]) => p > 0)
        .sort(([, a], [, b]) => b - a)
        .map(([id, p]) => {
          const d = driverList.find((x) => x.id === id);
          return { id, name: d ? `${d.firstName} ${d.lastName}` : id, points: p };
        }),
      teams: Object.entries(tPts)
        .filter(([, p]) => p > 0)
        .sort(([, a], [, b]) => b - a)
        .map(([teamId, p]) => ({ teamId, points: p })),
    };
  }, [results, flDriver, driverList]);

  const handleSubmit = async () => {
    const filled = results.filter((r) => r.driverId);
    if (!filled.length || !filled.find((r) => r.position === 1)) {
      setSubmitResult("error");
      setMessage("1위 드라이버를 포함해 결과를 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setSubmitResult("idle");
    setMessage("");
    try {
      const res = await fetch("/api/admin/race-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          season: 2026,
          round,
          isSprint: false,
          qualifying: { pole },
          results: filled,
          fastestLap: { driverId: flDriver, time: flTime },
        }),
      });
      const data = await res.json();
      if (data.ok) { setSubmitResult("success"); setMessage(data.message); }
      else { setSubmitResult("error"); setMessage(data.error ?? "오류가 발생했습니다."); }
    } catch {
      setSubmitResult("error");
      setMessage("요청 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Qualifying pole */}
      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4 space-y-2">
        <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">퀄리파잉</p>
        <div>
          <label className="block text-[10px] text-[#64748B] mb-1.5">폴 포지션</label>
          <DriverSelect value={pole} onChange={setPole} driverList={driverList} />
        </div>
      </div>

      <ResultsTable
        label="레이스 결과"
        results={results}
        driverList={driverList}
        onUpdate={updateResult}
      />

      {/* Fastest lap */}
      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4 space-y-3">
        <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">패스티스트랩</p>
        <div className="flex gap-3">
          <div className="flex-1">
            <DriverSelect value={flDriver} onChange={setFlDriver} driverList={driverList} />
          </div>
          <input
            type="text"
            value={flTime}
            onChange={(e) => setFlTime(e.target.value)}
            placeholder="1:20.235"
            className="w-32 bg-[#0D0D14] border border-[#2D2D3A] rounded-lg px-3 py-2 text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#E8002D] transition-colors font-mono"
          />
        </div>
      </div>

      <PointsPreview preview={preview} />
      <StatusMsg result={submitResult} message={message} />
      <button
        onClick={handleSubmit}
        disabled={submitting || submitResult === "success"}
        className="w-full py-3 bg-[#E8002D] hover:bg-[#C0001F] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
      >
        {submitting ? "저장 중..." : submitResult === "success" ? "완료" : "저장 & 배포"}
      </button>
    </div>
  );
}

// ─── Shared sub-components ─────────────────────────────────────

function DriverSelect({
  value,
  onChange,
  driverList,
}: {
  value: string;
  onChange: (v: string) => void;
  driverList: DriverInfo[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#0D0D14] border border-[#2D2D3A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E8002D] transition-colors"
    >
      <option value="">— 드라이버 —</option>
      {driverList.map((d) => (
        <option key={d.id} value={d.id}>
          {d.firstName} {d.lastName}
        </option>
      ))}
    </select>
  );
}

function ResultsTable({
  label,
  results,
  driverList,
  onUpdate,
}: {
  label: string;
  results: ResultRow[];
  driverList: DriverInfo[];
  onUpdate: (i: number, field: keyof ResultRow, value: string | number) => void;
}) {
  return (
    <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4">
      <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-3">{label}</p>
      <div className="space-y-1.5">
        {results.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-[#475569] w-8 text-right font-mono shrink-0">
              P{row.position}
            </span>
            <select
              value={row.driverId}
              onChange={(e) => onUpdate(i, "driverId", e.target.value)}
              className="flex-1 bg-[#0D0D14] border border-[#2D2D3A] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#E8002D] transition-colors"
            >
              <option value="">— 드라이버 —</option>
              {driverList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.firstName} {d.lastName}
                </option>
              ))}
            </select>
            <select
              value={row.status}
              onChange={(e) => onUpdate(i, "status", e.target.value)}
              className="w-28 bg-[#0D0D14] border border-[#2D2D3A] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#E8002D] transition-colors"
              style={{
                color:
                  row.status === "Finished" ? "#22C55E"
                  : row.status === "DNF" ? "#F59E0B"
                  : "#E8002D",
              }}
            >
              <option value="Finished">✔ Finished</option>
              <option value="DNF">✘ DNF</option>
              <option value="DSQ">⊘ DSQ</option>
              <option value="DNS">— DNS</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

function PointsPreview({
  preview,
}: {
  preview: {
    drivers: { id: string; name: string; points: number }[];
    teams: { teamId: string; points: number }[];
  };
}) {
  if (!preview.drivers.length && !preview.teams.length) return null;
  return (
    <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4 space-y-3">
      <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">포인트 미리보기</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-[10px] text-[#475569] uppercase tracking-widest mb-2">드라이버</p>
          {preview.drivers.map((d) => (
            <div key={d.id} className="flex justify-between text-xs">
              <span className="text-[#94A3B8]">{d.name}</span>
              <span className="text-white font-bold">+{d.points}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-[#475569] uppercase tracking-widest mb-2">팀</p>
          {preview.teams.map((t) => (
            <div key={t.teamId} className="flex justify-between text-xs">
              <span className="text-[#94A3B8]">{t.teamId}</span>
              <span className="text-white font-bold">+{t.points}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusMsg({
  result,
  message,
}: {
  result: "idle" | "success" | "error";
  message: string;
}) {
  if (result === "idle") return null;
  return (
    <div
      className={`rounded-xl px-4 py-3 border ${
        result === "success"
          ? "bg-[#22C55E]/10 border-[#22C55E]/30"
          : "bg-[#E8002D]/10 border-[#E8002D]/30"
      }`}
    >
      <p className={`text-xs ${result === "success" ? "text-[#22C55E]" : "text-[#E8002D]"}`}>
        {message}
      </p>
    </div>
  );
}

// ─── Small field components ────────────────────────────────────

function Field({
  label, hint, value, onChange, placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4">
      <label className="block text-xs font-bold text-white mb-0.5">{label}</label>
      {hint && <p className="text-[10px] text-[#475569] mb-2">{hint}</p>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0D0D14] border border-[#2D2D3A] rounded-lg px-3 py-2 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#E8002D] transition-colors font-mono"
      />
    </div>
  );
}

function CodeField({
  label, hint, value, onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4">
      <label className="block text-xs font-bold text-white mb-0.5">{label}</label>
      {hint && <p className="text-[10px] text-[#475569] mb-2">{hint}</p>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full bg-[#0D0D14] border border-[#2D2D3A] rounded-lg px-3 py-2 text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#E8002D] transition-colors font-mono resize-none"
        placeholder="<!-- 코드를 여기에 입력하세요 -->"
      />
    </div>
  );
}
