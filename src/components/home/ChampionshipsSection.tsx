import Link from "next/link";
import { getDriver, getTeam, type Standing, type ConstructorStanding } from "@/data/f1-data";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { HudCard } from "@/components/ui/HudCard";

function posColor(pos: number) {
  if (pos === 1) return "#FCD34D";
  if (pos === 2) return "#C0C0C0";
  if (pos === 3) return "#CD7F32";
  return "#475569";
}

export function ChampionshipsSection({
  drivers,
  constructors,
}: {
  drivers: Standing[];
  constructors: ConstructorStanding[];
}) {
  const driverMax = Math.max(drivers[0]?.points ?? 0, 1);
  const constructorMax = Math.max(constructors[0]?.points ?? 0, 1);

  return (
    <section>
      <SectionHeader title="챔피언십 현황" href="/season" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Driver standings */}
        <HudCard label="DRIVER STANDINGS" labelRight="2026">
          <div className="divide-y divide-border-subtle/50">
            {drivers.slice(0, 5).map((s) => {
              const d = getDriver(s.driverId);
              if (!d) return null;
              const pct = (s.points / driverMax) * 100;
              const isP1 = s.position === 1;
              return (
                <Link
                  key={s.driverId}
                  href={`/drivers/${s.driverId}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors group focus-visible:outline-none focus-visible:bg-white/[0.05]"
                >
                  {/* Position */}
                  <span
                    className="font-display text-sm font-bold w-6 shrink-0 tabular-nums"
                    style={{ color: posColor(s.position) }}
                  >
                    {String(s.position).padStart(2, "0")}
                  </span>

                  {/* Team color bar */}
                  <span
                    className="w-0.5 h-8 rounded-full shrink-0 opacity-80"
                    style={{ backgroundColor: d.teamColor }}
                    aria-hidden="true"
                  />

                  {/* Name + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className={`font-display text-sm font-bold tracking-wide uppercase truncate transition-colors ${isP1 ? "text-white" : "text-text-secondary group-hover:text-white"}`}>
                        {d.firstName[0]}. {d.lastName}
                      </span>
                    </div>
                    {/* progress bar */}
                    <div className="mt-1.5 h-px bg-border-subtle rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: d.teamColor }}
                      />
                    </div>
                  </div>

                  {/* Points */}
                  <span className={`font-mono text-sm font-bold tabular-nums shrink-0 ${isP1 ? "text-[#FCD34D]" : "text-text-primary"}`}>
                    {s.points}
                  </span>
                </Link>
              );
            })}
          </div>
        </HudCard>

        {/* Constructor standings */}
        <HudCard label="CONSTRUCTOR STANDINGS" labelRight="2026">
          <div className="divide-y divide-border-subtle/50">
            {constructors.slice(0, 5).map((s) => {
              const team = getTeam(s.teamId);
              if (!team) return null;
              const pct = (s.points / constructorMax) * 100;
              const isP1 = s.position === 1;
              return (
                <Link
                  key={s.teamId}
                  href={`/teams/${s.teamId}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors group focus-visible:outline-none focus-visible:bg-white/[0.05]"
                >
                  {/* Position */}
                  <span
                    className="font-display text-sm font-bold w-6 shrink-0 tabular-nums"
                    style={{ color: posColor(s.position) }}
                  >
                    {String(s.position).padStart(2, "0")}
                  </span>

                  {/* Team dot */}
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: team.primaryColor }}
                    aria-hidden="true"
                  />

                  {/* Name + bar */}
                  <div className="flex-1 min-w-0">
                    <span className={`font-display text-sm font-bold tracking-wide truncate block transition-colors ${isP1 ? "text-white" : "text-text-secondary group-hover:text-white"}`}>
                      {team.name}
                    </span>
                    <div className="mt-1.5 h-px bg-border-subtle rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: team.primaryColor }}
                      />
                    </div>
                  </div>

                  {/* Points */}
                  <span className={`font-mono text-sm font-bold tabular-nums shrink-0 ${isP1 ? "text-[#FCD34D]" : "text-text-primary"}`}>
                    {s.points}
                  </span>
                </Link>
              );
            })}
          </div>
        </HudCard>

      </div>
    </section>
  );
}
