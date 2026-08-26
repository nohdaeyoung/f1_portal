"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useAuth } from "@/lib/community/AuthContext";
import { signInWithGoogle, signOut } from "@/lib/community/auth";
import { loadFantasySave, saveFantasy } from "@/lib/community/fantasy";
import {
  fantasyDrivers,
  fantasyTeams,
  FANTASY_RULES,
  type FantasyDriver,
  type FantasyTeam,
} from "@/data/fantasy-prices";

// ─── 탭 타입 ──────────────────────────────────────────────────
type Tab = "builder" | "drivers" | "teams";

// ─── 유틸 ────────────────────────────────────────────────────
function fmt(price: number): string {
  return `$${price.toFixed(1)}M`;
}

function ppm(price: number, points: number): string {
  if (!price || !points) return "—";
  return (points / price).toFixed(1);
}

// ─── 드라이버 카드 ─────────────────────────────────────────────
function DriverCard({
  driver,
  selected,
  disabled,
  onToggle,
}: {
  driver: FantasyDriver;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled && !selected}
      className={`w-full text-left rounded-xl border p-3 transition-all ${
        selected
          ? "bg-[#E8002D]/15 border-[#E8002D]/50 ring-1 ring-[#E8002D]/30"
          : disabled
            ? "bg-[#141420] border-[#2D2D3A] opacity-30 cursor-not-allowed"
            : "bg-[#141420] border-[#2D2D3A] hover:border-white/20 hover:bg-white/[0.03]"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-base">{driver.flag}</span>
          <span className="font-bold text-white text-sm">{driver.lastName}</span>
        </div>
        <span className={`text-sm font-black ${selected ? "text-[#E8002D]" : "text-white"}`}>
          {fmt(driver.price)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ color: driver.teamColor, backgroundColor: `${driver.teamColor}20` }}
        >
          {driver.team}
        </span>
        {driver.points > 0 && (
          <span className="text-[10px] text-[#64748B]">{driver.points}pts</span>
        )}
      </div>
    </button>
  );
}

// ─── 팀 카드 ──────────────────────────────────────────────────
function TeamCard({
  team,
  selected,
  disabled,
  onToggle,
}: {
  team: FantasyTeam;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled && !selected}
      className={`w-full text-left rounded-xl border p-3 transition-all ${
        selected
          ? "bg-[#E8002D]/15 border-[#E8002D]/50 ring-1 ring-[#E8002D]/30"
          : disabled
            ? "bg-[#141420] border-[#2D2D3A] opacity-30 cursor-not-allowed"
            : "bg-[#141420] border-[#2D2D3A] hover:border-white/20 hover:bg-white/[0.03]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: team.primaryColor }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-sm">{team.koreanName}</span>
            <span className={`text-sm font-black ${selected ? "text-[#E8002D]" : "text-white"}`}>
              {fmt(team.price)}
            </span>
          </div>
          {team.points > 0 && (
            <span className="text-[10px] text-[#64748B]">{team.points}pts</span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────
export default function FantasyClient() {
  const { user, authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("builder");
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"price" | "points" | "ppm">("price");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  // ── 로그인 시 저장 데이터 불러오기 ──────────────────────────
  useEffect(() => {
    if (!user) return;
    isFirstLoad.current = true;
    loadFantasySave(user.uid).then((saved) => {
      if (saved) {
        setSelectedDriverIds(saved.drivers);
        setSelectedTeamIds(saved.teams);
      }
      isFirstLoad.current = false;
    });
  }, [user]);

  // ── 선택 변경 시 자동 저장 (debounce 1.5s) ──────────────────
  useEffect(() => {
    if (!user || isFirstLoad.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus("saving");
    saveTimerRef.current = setTimeout(async () => {
      await saveFantasy(user.uid, selectedDriverIds, selectedTeamIds);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 1500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDriverIds, selectedTeamIds]);

  // ── 예산 계산 ──────────────────────────────────────────────
  const driverCost = selectedDriverIds.reduce(
    (sum, id) => sum + (fantasyDrivers.find((d) => d.id === id)?.price ?? 0), 0
  );
  const teamCost = selectedTeamIds.reduce(
    (sum, id) => sum + (fantasyTeams.find((t) => t.id === id)?.price ?? 0), 0
  );
  const totalCost = driverCost + teamCost;
  const remaining = FANTASY_RULES.totalBudget - totalCost;
  const budgetPct = Math.min((totalCost / FANTASY_RULES.totalBudget) * 100, 100);

  // ── 토글 함수 ──────────────────────────────────────────────
  function toggleDriver(id: string) {
    setSelectedDriverIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < FANTASY_RULES.maxDrivers
          ? [...prev, id]
          : prev
    );
  }

  function toggleTeam(id: string) {
    setSelectedTeamIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < FANTASY_RULES.maxTeams
          ? [...prev, id]
          : prev
    );
  }

  // ── 같은 팀 제한 ──────────────────────────────────────────
  function isDriverDisabled(driver: FantasyDriver): boolean {
    if (selectedDriverIds.includes(driver.id)) return false;
    if (selectedDriverIds.length >= FANTASY_RULES.maxDrivers) return true;
    // 같은 팀 드라이버 최대 2명
    const sameTeamCount = selectedDriverIds.filter(
      (id) => fantasyDrivers.find((d) => d.id === id)?.teamId === driver.teamId
    ).length;
    if (sameTeamCount >= FANTASY_RULES.maxPerTeam) return true;
    // 예산 초과 체크
    if (remaining < driver.price && !selectedDriverIds.includes(driver.id)) return true;
    return false;
  }

  function isTeamDisabled(team: FantasyTeam): boolean {
    if (selectedTeamIds.includes(team.id)) return false;
    if (selectedTeamIds.length >= FANTASY_RULES.maxTeams) return true;
    if (remaining < team.price) return true;
    return false;
  }

  // ── 정렬된 드라이버 / 팀 ──────────────────────────────────
  const sortedDrivers = useMemo(() => {
    return [...fantasyDrivers].sort((a, b) => {
      if (sortBy === "price") return b.price - a.price;
      if (sortBy === "points") return b.points - a.points;
      if (sortBy === "ppm") {
        const ppma = a.points > 0 ? a.points / a.price : 0;
        const ppmb = b.points > 0 ? b.points / b.price : 0;
        return ppmb - ppma;
      }
      return 0;
    });
  }, [sortBy]);

  const sortedTeams = useMemo(() => {
    return [...fantasyTeams].sort((a, b) => {
      if (sortBy === "price") return b.price - a.price;
      if (sortBy === "points") return b.points - a.points;
      if (sortBy === "ppm") {
        const ppma = a.points > 0 ? a.points / a.price : 0;
        const ppmb = b.points > 0 ? b.points / b.price : 0;
        return ppmb - ppma;
      }
      return 0;
    });
  }, [sortBy]);

  // ── 선택된 드라이버/팀 정보 ──────────────────────────────
  const selectedDrivers = selectedDriverIds
    .map((id) => fantasyDrivers.find((d) => d.id === id)!)
    .filter(Boolean);
  const selectedTeams = selectedTeamIds
    .map((id) => fantasyTeams.find((t) => t.id === id)!)
    .filter(Boolean);

  const isComplete =
    selectedDriverIds.length === FANTASY_RULES.maxDrivers &&
    selectedTeamIds.length === FANTASY_RULES.maxTeams;

  const totalPoints = [...selectedDrivers, ...selectedTeams].reduce(
    (sum, x) => sum + x.points, 0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            F1 Fantasy 헬퍼
          </h1>
          <p className="mt-2 text-[#64748B]">
            드라이버 5명 + 컨스트럭터 2팀 · 총 예산 ${FANTASY_RULES.totalBudget}M
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs text-[#475569]">
            <span>⚠️</span>
            <span>가격은 시즌 개막 기준 예상가 — 실제 가격은 <a href="https://fantasy.formula1.com" target="_blank" rel="noopener noreferrer" className="text-[#64748B] underline">fantasy.formula1.com</a>에서 확인</span>
          </div>
        </div>

        {/* Auth + save status */}
        <div className="flex items-center gap-3 shrink-0">
          {saveStatus === "saving" && (
            <span className="text-xs text-[#64748B]">저장 중...</span>
          )}
          {saveStatus === "saved" && (
            <span className="text-xs text-[#22C55E]">✓ 저장됨</span>
          )}
          {!authLoading && (
            user ? (
              <div className="flex items-center gap-2">
                {user.photoURL && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
                )}
                <span className="text-xs text-[#94A3B8] max-w-[100px] truncate">{user.displayName}</span>
                <button
                  onClick={() => signOut()}
                  className="text-xs text-[#475569] hover:text-white transition-colors px-2 py-1 rounded border border-[#2D2D3A] hover:border-white/20"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <button
                onClick={() => signInWithGoogle()}
                className="flex items-center gap-2 px-3 py-2 bg-white text-[#111] text-xs font-bold rounded-lg hover:bg-white/90 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
                Google로 저장
              </button>
            )
          )}
        </div>
      </div>

      {/* Budget bar */}
      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-white">예산 사용 현황</span>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[#64748B]">사용: <span className="text-white font-bold">{fmt(totalCost)}</span></span>
            <span className={`font-black ${remaining < 0 ? "text-[#E8002D]" : remaining < 5 ? "text-[#FCD34D]" : "text-[#22C55E]"}`}>
              잔여: {fmt(remaining)}
            </span>
          </div>
        </div>
        <div className="h-2 bg-[#1E2030] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              budgetPct > 95 ? "bg-[#E8002D]" : budgetPct > 80 ? "bg-[#FCD34D]" : "bg-[#22C55E]"
            }`}
            style={{ width: `${budgetPct}%` }}
          />
        </div>

        {/* Selected team summary */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-[#64748B] uppercase tracking-widest mb-2">
              드라이버 ({selectedDriverIds.length}/{FANTASY_RULES.maxDrivers})
            </p>
            <div className="space-y-1">
              {selectedDrivers.map((d) => (
                <div key={d.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span>{d.flag}</span>
                    <span className="text-white font-bold">{d.lastName}</span>
                    <span className="text-[#64748B]">#{d.number}</span>
                  </div>
                  <span className="text-[#E8002D] font-bold">{fmt(d.price)}</span>
                </div>
              ))}
              {Array.from({ length: FANTASY_RULES.maxDrivers - selectedDriverIds.length }).map((_, i) => (
                <div key={i} className="text-xs text-[#2D2D3A] border border-dashed border-[#2D2D3A] rounded px-2 py-0.5 text-center">
                  + 드라이버 선택
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-[#64748B] uppercase tracking-widest mb-2">
              컨스트럭터 ({selectedTeamIds.length}/{FANTASY_RULES.maxTeams})
            </p>
            <div className="space-y-1">
              {selectedTeams.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.primaryColor }} />
                    <span className="text-white font-bold">{t.koreanName}</span>
                  </div>
                  <span className="text-[#E8002D] font-bold">{fmt(t.price)}</span>
                </div>
              ))}
              {Array.from({ length: FANTASY_RULES.maxTeams - selectedTeamIds.length }).map((_, i) => (
                <div key={i} className="text-xs text-[#2D2D3A] border border-dashed border-[#2D2D3A] rounded px-2 py-0.5 text-center">
                  + 컨스트럭터 선택
                </div>
              ))}
            </div>
          </div>
        </div>

        {isComplete && (
          <div className="mt-4 pt-4 border-t border-[#2D2D3A] flex items-center justify-between">
            <div>
              <span className="text-xs text-[#64748B]">팀 완성!</span>
              {totalPoints > 0 && (
                <span className="ml-2 text-sm font-bold text-[#A855F7]">총 {totalPoints}pts</span>
              )}
            </div>
            <button
              onClick={() => { setSelectedDriverIds([]); setSelectedTeamIds([]); }}
              className="text-xs text-[#64748B] hover:text-white transition-colors px-3 py-1 rounded border border-[#2D2D3A] hover:border-white/20"
            >
              초기화
            </button>
          </div>
        )}
      </div>

      {/* Tab menu */}
      <div className="flex gap-1 mb-6 border-b border-[#2D2D3A]">
        {([
          { key: "builder", label: "팀 빌더" },
          { key: "drivers", label: "드라이버 가격표" },
          { key: "teams", label: "컨스트럭터 가격표" },
        ] as { key: Tab; label: string }[]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-bold transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "text-white border-[#E8002D]"
                : "text-[#64748B] border-transparent hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
        {/* Sort selector */}
        <div className="ml-auto flex items-center gap-1 pb-1">
          {(["price", "points", "ppm"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1 text-xs rounded-lg font-bold transition-colors ${
                sortBy === s ? "bg-[#E8002D] text-white" : "bg-white/5 text-[#64748B] hover:text-white"
              }`}
            >
              {s === "price" ? "가격순" : s === "points" ? "포인트순" : "효율순"}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Builder */}
      {activeTab === "builder" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Drivers */}
          <div>
            <p className="text-xs text-[#64748B] uppercase tracking-widest mb-3">
              드라이버 ({selectedDriverIds.length}/{FANTASY_RULES.maxDrivers})
            </p>
            <div className="grid grid-cols-2 gap-2">
              {sortedDrivers.map((driver) => (
                <DriverCard
                  key={driver.id}
                  driver={driver}
                  selected={selectedDriverIds.includes(driver.id)}
                  disabled={isDriverDisabled(driver)}
                  onToggle={() => toggleDriver(driver.id)}
                />
              ))}
            </div>
          </div>

          {/* Teams */}
          <div>
            <p className="text-xs text-[#64748B] uppercase tracking-widest mb-3">
              컨스트럭터 ({selectedTeamIds.length}/{FANTASY_RULES.maxTeams})
            </p>
            <div className="grid grid-cols-1 gap-2">
              {sortedTeams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  selected={selectedTeamIds.includes(team.id)}
                  disabled={isTeamDisabled(team)}
                  onToggle={() => toggleTeam(team.id)}
                />
              ))}
            </div>

            {/* Rules summary */}
            <div className="mt-6 bg-[#141420] border border-[#2D2D3A] rounded-xl p-4 space-y-2">
              <p className="text-xs text-[#64748B] uppercase tracking-widest mb-3">Fantasy 규칙</p>
              {[
                { label: "총 예산", value: `$${FANTASY_RULES.totalBudget}M` },
                { label: "드라이버", value: `${FANTASY_RULES.maxDrivers}명 선택` },
                { label: "컨스트럭터", value: `${FANTASY_RULES.maxTeams}팀 선택` },
                { label: "같은 팀 드라이버", value: `최대 ${FANTASY_RULES.maxPerTeam}명` },
                { label: "DRS 부스트", value: "1명에게 ×2 포인트" },
                { label: "Mega Driver", value: "1명에게 ×3 포인트 (한정)" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-[#64748B]">{label}</span>
                  <span className="text-white font-bold">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Driver price table */}
      {activeTab === "drivers" && (
        <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-[#64748B] uppercase tracking-widest border-b border-[#2D2D3A]">
                <th className="text-left px-4 py-3">드라이버</th>
                <th className="text-left px-4 py-3">팀</th>
                <th className="text-right px-4 py-3">가격</th>
                <th className="text-right px-4 py-3">포인트</th>
                <th className="text-right px-4 py-3">효율(pts/M)</th>
              </tr>
            </thead>
            <tbody>
              {sortedDrivers.map((d, i) => (
                <tr
                  key={d.id}
                  className={`border-b border-[#1E2030] hover:bg-white/[0.02] transition-colors ${
                    selectedDriverIds.includes(d.id) ? "bg-[#E8002D]/10" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{d.flag}</span>
                      <div>
                        <span className="font-bold text-white">{d.lastName}</span>
                        <span className="text-[#64748B] text-xs ml-1">#{d.number}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded"
                      style={{ color: d.teamColor, backgroundColor: `${d.teamColor}20` }}
                    >
                      {d.team}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-black text-white tabular-nums">{fmt(d.price)}</td>
                  <td className="px-4 py-3 text-right text-[#94A3B8] tabular-nums">
                    {d.points > 0 ? d.points : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#A855F7] font-bold">
                    {ppm(d.price, d.points)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Team price table */}
      {activeTab === "teams" && (
        <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-[#64748B] uppercase tracking-widest border-b border-[#2D2D3A]">
                <th className="text-left px-4 py-3">컨스트럭터</th>
                <th className="text-right px-4 py-3">가격</th>
                <th className="text-right px-4 py-3">포인트</th>
                <th className="text-right px-4 py-3">효율(pts/M)</th>
              </tr>
            </thead>
            <tbody>
              {sortedTeams.map((t) => (
                <tr
                  key={t.id}
                  className={`border-b border-[#1E2030] hover:bg-white/[0.02] transition-colors ${
                    selectedTeamIds.includes(t.id) ? "bg-[#E8002D]/10" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.primaryColor }} />
                      <span className="font-bold text-white">{t.koreanName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-black text-white tabular-nums">{fmt(t.price)}</td>
                  <td className="px-4 py-3 text-right text-[#94A3B8] tabular-nums">
                    {t.points > 0 ? t.points : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#A855F7] font-bold">
                    {ppm(t.price, t.points)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-[10px] text-[#475569] text-center">
        가격은 시즌 개막 예상가 기준 · 실제 가격 및 포인트는 <a href="https://fantasy.formula1.com" target="_blank" rel="noopener noreferrer" className="underline">fantasy.formula1.com</a>에서 확인 · 시즌 중 가격 변동 있음
      </p>
    </div>
  );
}
