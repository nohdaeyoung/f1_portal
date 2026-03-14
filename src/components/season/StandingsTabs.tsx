"use client";

import { useState } from "react";
import Link from "next/link";
import { ChampionshipProgressChart } from "./ChampionshipProgressChart";
import type { ChampionshipProgress } from "@/lib/data/live";

interface DriverRow {
  driverId: string;
  href: string;
  firstName: string;
  lastName: string;
  teamColor: string;
  team: string;
  position: number;
  wins: number;
  points: number;
}

interface TeamRow {
  teamId: string;
  href: string;
  name: string;
  primaryColor: string;
  position: number;
  wins: number;
  points: number;
}

interface Props {
  driverRows: DriverRow[];
  teamRows: TeamRow[];
  championshipProgress: ChampionshipProgress[];
  completedRounds: number[];
}

type Tab = "driver" | "constructor" | "progress";

function posBadge(pos: number) {
  return pos === 1
    ? "text-[#FCD34D]"
    : pos === 2
      ? "text-[#C0C0C0]"
      : pos === 3
        ? "text-[#CD7F32]"
        : "text-[#64748B]";
}

export function StandingsTabs({ driverRows, teamRows, championshipProgress, completedRounds }: Props) {
  const showProgress = championshipProgress.length > 0;
  const tabs: { id: Tab; label: string }[] = [
    { id: "driver", label: "드라이버" },
    { id: "constructor", label: "컨스트럭터" },
    ...(showProgress ? [{ id: "progress" as Tab, label: "포인트 추이" }] : []),
  ];
  const [active, setActive] = useState<Tab>("driver");

  return (
    <section>
      <div className="flex items-center gap-2 mb-4 h-9">
        <h2 className="text-xl font-bold text-white">챔피언 순위</h2>
        <div className="flex gap-1 ml-auto" role="tablist" aria-label="순위 탭">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              id={`standings-tab-${t.id}`}
              aria-selected={active === t.id}
              aria-controls={`standings-panel-${t.id}`}
              tabIndex={active === t.id ? 0 : -1}
              onClick={() => setActive(t.id)}
              onKeyDown={(e) => {
                const ids = tabs.map((x) => x.id);
                const idx = ids.indexOf(t.id);
                if (e.key === "ArrowRight") setActive(ids[(idx + 1) % ids.length]);
                if (e.key === "ArrowLeft") setActive(ids[(idx - 1 + ids.length) % ids.length]);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-f1-red ${
                active === t.id
                  ? "bg-[#E8002D] text-white"
                  : "bg-[#141420] border border-[#2D2D3A] text-[#64748B] hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {active === "driver" && (
        <div role="tabpanel" id="standings-panel-driver" aria-labelledby="standings-tab-driver" className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2D2D3A]">
                <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase w-10">#</th>
                <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase">드라이버</th>
                <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase hidden sm:table-cell">팀</th>
                <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase w-12">승</th>
                <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase w-20">포인트</th>
              </tr>
            </thead>
            <tbody>
              {driverRows.map((d) => (
                <tr key={d.driverId} className="border-b border-[#2D2D3A]/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <span className={`text-sm font-black ${posBadge(d.position)}`}>{d.position}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={d.href} className="hover:text-[#E8002D] transition-colors">
                      <span className="flex items-center gap-2">
                        <span className="w-1 h-6 rounded-full shrink-0" style={{ backgroundColor: d.teamColor }} />
                        <span className="font-bold text-white">{d.firstName} {d.lastName}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#64748B] hidden sm:table-cell">{d.team}</td>
                  <td className="px-4 py-3 text-right font-mono text-white">{d.wins}</td>
                  <td className="px-4 py-3 text-right font-black text-white text-base">{d.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active === "constructor" && (
        <div role="tabpanel" id="standings-panel-constructor" aria-labelledby="standings-tab-constructor" className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2D2D3A]">
                <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase w-10">#</th>
                <th className="text-left px-4 py-3 text-xs text-[#64748B] uppercase">팀</th>
                <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase w-12">승</th>
                <th className="text-right px-4 py-3 text-xs text-[#64748B] uppercase w-20">포인트</th>
              </tr>
            </thead>
            <tbody>
              {teamRows.map((t) => (
                <tr key={t.teamId} className="border-b border-[#2D2D3A]/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <span className={`text-sm font-black ${posBadge(t.position)}`}>{t.position}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={t.href} className="hover:text-[#E8002D] transition-colors">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.primaryColor }} />
                        <span className="font-bold text-white">{t.name}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-white">{t.wins}</td>
                  <td className="px-4 py-3 text-right font-black text-white text-base">{t.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active === "progress" && showProgress && (
        <ChampionshipProgressChart data={championshipProgress} rounds={completedRounds} />
      )}
    </section>
  );
}
