"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { drivers } from "@/data/f1-data";
import { calendar } from "@/data/f1-data";
import { DriverPicker } from "@/components/compare/DriverPicker";
import { CompareCareerChart } from "@/components/compare/CompareCareerChart";
import { CompareCareerTable } from "@/components/compare/CompareCareerTable";
import { TelemetryCompareChart } from "@/components/compare/TelemetryCompareChart";

// ─── Types ────────────────────────────────────────────────────

interface SeasonStat {
  season: string;
  team: string;
  position: number | null;
  wins: number;
  poles: number;
  points: number;
}

interface TelPoint {
  Distance: number;
  Speed: number | null;
  Throttle: number | null;
  Brake: boolean | null;
}

// ─── FastF1 driver abbreviation map ──────────────────────────

const DRIVER_ABBR: Record<string, string> = {
  verstappen: "VER", hadjar: "HAD", norris: "NOR", piastri: "PIA",
  hamilton: "HAM", leclerc: "LEC", russell: "RUS", antonelli: "ANT",
  alonso: "ALO", stroll: "STR", gasly: "GAS", colapinto: "COL",
  sainz: "SAI", albon: "ALB", lawson: "LAW", lindblad: "LIN",
  ocon: "OCO", bearman: "BEA", hulkenberg: "HUL", bortoleto: "BOR",
};

// ─── Summary cards ───────────────────────────────────────────

function SummaryCard({
  label, valueA, valueB, colorA, colorB, higherWins = true,
}: {
  label: string;
  valueA: number;
  valueB: number;
  colorA: string;
  colorB: string;
  higherWins?: boolean;
}) {
  const aWins = higherWins ? valueA > valueB : valueA < valueB;
  const bWins = higherWins ? valueB > valueA : valueB < valueA;
  return (
    <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4 text-center">
      <p className="text-xs text-[#64748B] uppercase tracking-widest mb-3">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <span className={`text-2xl font-bold tabular-nums ${aWins ? "text-white" : "text-[#475569]"}`}
          style={aWins ? { color: colorA } : {}}>
          {valueA}
        </span>
        <span className="text-xs text-[#475569] mb-1">vs</span>
        <span className={`text-2xl font-bold tabular-nums ${bWins ? "text-white" : "text-[#475569]"}`}
          style={bWins ? { color: colorB } : {}}>
          {valueB}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function CompareClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [driverA, setDriverA] = useState<string | null>(searchParams.get("a"));
  const [driverB, setDriverB] = useState<string | null>(searchParams.get("b"));
  const [tab, setTab] = useState<"career" | "telemetry">("career");

  // Career data
  const [statsA, setStatsA] = useState<SeasonStat[]>([]);
  const [statsB, setStatsB] = useState<SeasonStat[]>([]);
  const [loadingCareer, setLoadingCareer] = useState(false);

  // Telemetry data
  const completedRaces = calendar.filter((r) => r.status === "completed");
  const [telYear, setTelYear] = useState<number>(2026);
  const [telGp, setTelGp] = useState<number | null>(
    completedRaces.length > 0 ? completedRaces[completedRaces.length - 1].round : null
  );
  const [telSession, setTelSession] = useState<"R" | "Q">("R");
  const [telA, setTelA] = useState<TelPoint[]>([]);
  const [telB, setTelB] = useState<TelPoint[]>([]);
  const [telLoading, setTelLoading] = useState(false);
  const [telError, setTelError] = useState<string | null>(null);

  // Driver info
  const driverInfoA = drivers.find((d) => d.id === driverA);
  const driverInfoB = drivers.find((d) => d.id === driverB);

  // URL sync
  useEffect(() => {
    const params = new URLSearchParams();
    if (driverA) params.set("a", driverA);
    if (driverB) params.set("b", driverB);
    router.replace(`/compare${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  }, [driverA, driverB, router]);

  // Career data fetch
  const fetchCareer = useCallback(async (idA: string | null, idB: string | null) => {
    if (!idA && !idB) return;
    setLoadingCareer(true);
    try {
      const [resA, resB] = await Promise.all([
        idA ? fetch(`/api/career?driver=${idA}`).then((r) => r.json()) : Promise.resolve([]),
        idB ? fetch(`/api/career?driver=${idB}`).then((r) => r.json()) : Promise.resolve([]),
      ]);
      setStatsA(Array.isArray(resA) ? resA : []);
      setStatsB(Array.isArray(resB) ? resB : []);
    } catch {
      setStatsA([]);
      setStatsB([]);
    } finally {
      setLoadingCareer(false);
    }
  }, []);

  useEffect(() => {
    fetchCareer(driverA, driverB);
  }, [driverA, driverB, fetchCareer]);

  // Telemetry fetch
  const fetchTelemetry = useCallback(async () => {
    if (!driverA || !driverB || !telGp) return;
    const abbrA = DRIVER_ABBR[driverA];
    const abbrB = DRIVER_ABBR[driverB];
    if (!abbrA || !abbrB) {
      setTelError("선택한 드라이버의 텔레메트리 약어를 찾을 수 없습니다.");
      return;
    }
    setTelLoading(true);
    setTelError(null);
    setTelA([]);
    setTelB([]);
    try {
      const [resA, resB] = await Promise.all([
        fetch(`/api/fastf1/fastest-lap?year=${telYear}&gp=${telGp}&session=${telSession}&driver=${abbrA}`),
        fetch(`/api/fastf1/fastest-lap?year=${telYear}&gp=${telGp}&session=${telSession}&driver=${abbrB}`),
      ]);
      if (!resA.ok || !resB.ok) throw new Error("FastF1 응답 오류");
      const [dataA, dataB] = await Promise.all([resA.json(), resB.json()]);
      setTelA(Array.isArray(dataA) ? dataA : []);
      setTelB(Array.isArray(dataB) ? dataB : []);
    } catch (e) {
      setTelError((e as Error).message || "텔레메트리 로드 실패");
    } finally {
      setTelLoading(false);
    }
  }, [driverA, driverB, telYear, telGp, telSession]);

  // Career summary totals
  const totalPtsA = statsA.reduce((s, r) => s + r.points, 0);
  const totalPtsB = statsB.reduce((s, r) => s + r.points, 0);
  const totalWinsA = statsA.reduce((s, r) => s + r.wins, 0);
  const totalWinsB = statsB.reduce((s, r) => s + r.wins, 0);
  const totalPolesA = statsA.reduce((s, r) => s + r.poles, 0);
  const totalPolesB = statsB.reduce((s, r) => s + r.poles, 0);
  const champsA = statsA.filter((s) => s.position === 1).length;
  const champsB = statsB.filter((s) => s.position === 1).length;

  const bothSelected = driverA && driverB;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">드라이버 비교</h1>
        <p className="text-[#64748B] text-sm">두 드라이버의 커리어 통계와 패스티스트랩 텔레메트리를 비교합니다.</p>
      </div>

      {/* Driver Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DriverPicker label="A" value={driverA} exclude={driverB} onChange={setDriverA} />
        <DriverPicker label="B" value={driverB} exclude={driverA} onChange={setDriverB} />
      </div>

      {!bothSelected && (
        <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-8 text-center">
          <p className="text-[#475569]">위에서 두 드라이버를 선택하면 비교가 시작됩니다.</p>
        </div>
      )}

      {bothSelected && (
        <>
          {/* Tab nav */}
          <div className="flex gap-1 border-b border-[#2D2D3A]" role="tablist" aria-label="비교 탭">
            {([
              { key: "career", label: "커리어 비교" },
              { key: "telemetry", label: "랩 텔레메트리" },
            ] as const).map((t, idx, arr) => (
              <button
                key={t.key}
                role="tab"
                id={`compare-tab-${t.key}`}
                aria-selected={tab === t.key}
                aria-controls={`compare-panel-${t.key}`}
                tabIndex={tab === t.key ? 0 : -1}
                onClick={() => setTab(t.key)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") setTab(arr[(idx + 1) % arr.length].key);
                  if (e.key === "ArrowLeft") setTab(arr[(idx - 1 + arr.length) % arr.length].key);
                }}
                className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8002D] focus-visible:ring-offset-1 ${
                  tab === t.key
                    ? "text-white border-[#E8002D]"
                    : "text-[#64748B] border-transparent hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Career Tab ── */}
          {tab === "career" && (
            <div className="space-y-6">
              {loadingCareer ? (
                <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-8 text-center">
                  <p className="text-[#475569]">데이터 로딩 중...</p>
                </div>
              ) : (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <SummaryCard
                      label="챔피언십"
                      valueA={champsA} valueB={champsB}
                      colorA={driverInfoA?.teamColor ?? "#ffffff"}
                      colorB={driverInfoB?.teamColor ?? "#ffffff"}
                    />
                    <SummaryCard
                      label="통산 우승"
                      valueA={totalWinsA} valueB={totalWinsB}
                      colorA={driverInfoA?.teamColor ?? "#ffffff"}
                      colorB={driverInfoB?.teamColor ?? "#ffffff"}
                    />
                    <SummaryCard
                      label="폴 포지션"
                      valueA={totalPolesA} valueB={totalPolesB}
                      colorA={driverInfoA?.teamColor ?? "#ffffff"}
                      colorB={driverInfoB?.teamColor ?? "#ffffff"}
                    />
                    <SummaryCard
                      label="통산 포인트"
                      valueA={totalPtsA} valueB={totalPtsB}
                      colorA={driverInfoA?.teamColor ?? "#ffffff"}
                      colorB={driverInfoB?.teamColor ?? "#ffffff"}
                    />
                  </div>

                  <CompareCareerChart
                    statsA={statsA} statsB={statsB}
                    colorA={driverInfoA?.teamColor ?? "#ffffff"}
                    colorB={driverInfoB?.teamColor ?? "#ffffff"}
                    nameA={`${driverInfoA?.firstName} ${driverInfoA?.lastName}`}
                    nameB={`${driverInfoB?.firstName} ${driverInfoB?.lastName}`}
                  />

                  <CompareCareerTable
                    statsA={statsA} statsB={statsB}
                    colorA={driverInfoA?.teamColor ?? "#ffffff"}
                    colorB={driverInfoB?.teamColor ?? "#ffffff"}
                  />
                </>
              )}
            </div>
          )}

          {/* ── Telemetry Tab ── */}
          {tab === "telemetry" && (
            <div className="space-y-4">
              {/* Race picker */}
              <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-4">
                <div className="flex flex-wrap gap-3 items-end">
                  <div>
                    <label className="text-xs text-[#64748B] uppercase tracking-widest block mb-1.5">연도</label>
                    <select
                      value={telYear}
                      onChange={(e) => { setTelYear(Number(e.target.value)); setTelGp(null); setTelA([]); setTelB([]); }}
                      className="bg-[#111118] border border-[#2D2D3A] text-white text-sm rounded-lg px-3 py-2 outline-none"
                    >
                      {[2026, 2025, 2024, 2023, 2022].map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-[#64748B] uppercase tracking-widest block mb-1.5">그랑프리</label>
                    <select
                      value={telGp ?? ""}
                      onChange={(e) => { setTelGp(Number(e.target.value)); setTelA([]); setTelB([]); }}
                      className="bg-[#111118] border border-[#2D2D3A] text-white text-sm rounded-lg px-3 py-2 outline-none min-w-[160px]"
                    >
                      <option value="">선택...</option>
                      {(telYear === 2026 ? completedRaces : []).map((r) => (
                        <option key={r.round} value={r.round}>{r.koreanName}</option>
                      ))}
                      {telYear !== 2026 && (
                        Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>라운드 {n}</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-[#64748B] uppercase tracking-widest block mb-1.5">세션</label>
                    <select
                      value={telSession}
                      onChange={(e) => { setTelSession(e.target.value as "R" | "Q"); setTelA([]); setTelB([]); }}
                      className="bg-[#111118] border border-[#2D2D3A] text-white text-sm rounded-lg px-3 py-2 outline-none"
                    >
                      <option value="R">레이스</option>
                      <option value="Q">예선</option>
                    </select>
                  </div>

                  <button
                    onClick={fetchTelemetry}
                    disabled={!telGp || telLoading}
                    className="px-4 py-2 bg-[#E8002D] text-white text-sm font-medium rounded-lg hover:bg-[#C8001D] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {telLoading ? "로딩 중..." : "비교"}
                  </button>
                </div>
              </div>

              {telLoading && (
                <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6 text-center space-y-2">
                  <div className="w-6 h-6 border-2 border-[#E8002D] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-[#94A3B8] text-sm">텔레메트리 데이터 로딩 중...</p>
                  <p className="text-[#475569] text-xs">처음 요청은 FastF1 데이터 처리로 최대 2분 소요될 수 있습니다.</p>
                </div>
              )}

              {telError && !telLoading && (
                <div className="bg-[#1A0A0A] border border-[#5C1A1A] rounded-xl p-4 text-[#F87171] text-sm">
                  {telError}
                </div>
              )}

              {telA.length > 0 && telB.length > 0 && !telLoading && (
                <TelemetryCompareChart
                  telA={telA} telB={telB}
                  colorA={driverInfoA?.teamColor ?? "#ffffff"}
                  colorB={driverInfoB?.teamColor ?? "#ffffff"}
                  nameA={`${driverInfoA?.firstName} ${driverInfoA?.lastName}`}
                  nameB={`${driverInfoB?.firstName} ${driverInfoB?.lastName}`}
                />
              )}

              {telA.length === 0 && telB.length === 0 && !telLoading && !telError && (
                <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-8 text-center">
                  <p className="text-[#475569] text-sm">레이스를 선택하고 비교 버튼을 누르세요.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
