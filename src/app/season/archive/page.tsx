"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SeasonProgressChart } from "@/components/season/SeasonProgressChart";

// 상한을 하드코딩하면 해가 바뀔 때마다 현재 시즌이 목록에서 빠진다.
const LATEST_SEASON = new Date().getFullYear();
const YEARS = Array.from({ length: LATEST_SEASON - 1950 + 1 }, (_, i) => LATEST_SEASON - i);

interface StandingRow {
  position: number;
  driverName: string;
  nationality: string;
  team: string;
  wins: number;
  points: number;
}

interface ProgressData {
  rounds: number;
  raceNames: string[];
  dataset: {
    driverId: string;
    driverName: string;
    team: string;
    finalPosition: number;
    finalPoints: number;
    color: string;
    points: number[];
  }[];
}

async function fetchSeasonStandings(year: number): Promise<StandingRow[]> {
  const res = await fetch(
    `https://api.jolpi.ca/ergast/f1/${year}/driverstandings.json`
  );
  if (!res.ok) return [];
  const data = await res.json();
  const list = data.MRData.StandingsTable.StandingsLists[0];
  if (!list) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return list.DriverStandings.map((s: any) => ({
    position: parseInt(s.position),
    driverName: `${s.Driver.givenName} ${s.Driver.familyName}`,
    nationality: s.Driver.nationality,
    team: s.Constructors?.[0]?.name ?? "—",
    wins: parseInt(s.wins),
    points: parseFloat(s.points),
  }));
}

async function fetchProgressData(year: number): Promise<ProgressData | null> {
  const res = await fetch(`/api/season/${year}/progress`);
  if (!res.ok) return null;
  return res.json();
}

export default function SeasonArchivePage() {
  const [year, setYear] = useState<number>(2025);
  const [standings, setStandings] = useState<StandingRow[] | null>(null);
  const [progress, setProgress] = useState<ProgressData | null | "loading">(null);
  const [loading, setLoading] = useState(false);

  async function load(y: number) {
    setYear(y);
    setLoading(true);
    setStandings(null);
    setProgress("loading");
    try {
      const [standingsData, progressData] = await Promise.all([
        fetchSeasonStandings(y),
        fetchProgressData(y),
      ]);
      setStandings(standingsData);
      setProgress(progressData);
    } catch {
      setStandings([]);
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(2025);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const champion = standings?.[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/season"
        className="inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-white transition-colors mb-10"
      >
        &larr; 시즌 트래커
      </Link>

      <section className="mb-8">
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">
          역대 시즌 아카이브
        </h1>
        <p className="text-[#64748B]">
          연도를 선택해 드라이버 챔피언십 순위와 라운드별 포인트 추이를 확인하세요.
        </p>
        <div className="mt-4 w-16 h-1 bg-[#E8002D] rounded-full" />
      </section>

      {/* Year selector */}
      <div className="flex items-center gap-4 mb-8">
        <label className="text-sm text-[#64748B] shrink-0">시즌 선택</label>
        <select
          value={year}
          onChange={(e) => load(Number(e.target.value))}
          className="bg-[#141420] border border-[#2D2D3A] text-white rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:border-[#E8002D] cursor-pointer"
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        {loading && (
          <span className="text-sm text-[#64748B]">불러오는 중...</span>
        )}
      </div>

      {/* Champion highlight */}
      {!loading && champion && (
        <div className="bg-[#FCD34D]/5 border border-[#FCD34D]/20 rounded-xl px-6 py-5 mb-8 flex items-center gap-4 flex-wrap">
          <span className="text-4xl font-black text-[#FCD34D]">🏆</span>
          <div>
            <span className="block text-xs text-[#FCD34D] uppercase tracking-widest mb-0.5">
              {year} 월드 챔피언
            </span>
            <span className="text-2xl font-black text-white">
              {champion.driverName}
            </span>
            <span className="ml-3 text-[#64748B] text-sm">{champion.team}</span>
          </div>
          <div className="ml-auto text-right">
            <span className="block text-3xl font-black text-[#FCD34D]">
              {champion.points}
            </span>
            <span className="text-xs text-[#64748B]">포인트</span>
          </div>
        </div>
      )}

      {/* Progress chart */}
      {progress === "loading" && (
        <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-8 mb-8 text-center text-sm text-[#64748B]">
          라운드별 포인트 데이터 불러오는 중... (시즌 라운드 수에 따라 5~15초 소요)
        </div>
      )}
      {progress && progress !== "loading" && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">
            {year} 라운드별 누적 포인트
          </h2>
          <SeasonProgressChart
            raceNames={progress.raceNames}
            dataset={progress.dataset}
          />
        </div>
      )}

      {/* Standings table */}
      {!loading && standings !== null && standings.length === 0 && (
        <div className="text-center py-16 text-[#64748B] text-sm">
          해당 시즌 데이터를 불러올 수 없습니다.
        </div>
      )}

      {!loading && standings !== null && standings.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">
            {year} 드라이버 챔피언십 최종 순위
          </h2>
          <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2D2D3A]">
                    <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase w-10">
                      #
                    </th>
                    <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase">
                      드라이버
                    </th>
                    <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase hidden sm:table-cell">
                      팀
                    </th>
                    <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase w-12">
                      승
                    </th>
                    <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase w-20">
                      포인트
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s) => (
                    <tr
                      key={s.position}
                      className={`border-b border-[#2D2D3A]/50 hover:bg-white/[0.02] transition-colors ${
                        s.position === 1 ? "bg-[#FCD34D]/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`font-black text-sm ${
                            s.position === 1
                              ? "text-[#FCD34D]"
                              : s.position === 2
                                ? "text-[#C0C0C0]"
                                : s.position === 3
                                  ? "text-[#CD7F32]"
                                  : "text-[#64748B]"
                          }`}
                        >
                          {s.position}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-white block">
                          {s.driverName}
                        </span>
                        <span className="text-xs text-[#64748B] sm:hidden">
                          {s.team}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#64748B] hidden sm:table-cell">
                        {s.team}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-white">
                        {s.wins}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-white">
                        {s.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-[#475569] mt-3">
            Jolpica(Ergast) 데이터 기준 · 최종 순위
          </p>
        </section>
      )}
    </div>
  );
}
