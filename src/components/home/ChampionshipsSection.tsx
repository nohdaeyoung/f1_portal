import Link from "next/link";
import { getDriver, getTeam, type Standing, type ConstructorStanding } from "@/data/f1-data";
import { SectionHeader } from "@/components/ui/SectionHeader";

function medalClass(pos: number) {
  if (pos === 1) return "bg-[#FCD34D]/20 text-[#FCD34D]";
  if (pos === 2) return "bg-[#C0C0C0]/20 text-[#C0C0C0]";
  if (pos === 3) return "bg-[#CD7F32]/20 text-[#CD7F32]";
  return "bg-white/5 text-[#64748B]";
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Driver */}
        <div>
          <p className="text-xs text-[#64748B] uppercase tracking-widest mb-3">드라이버</p>
          <div className="space-y-2">
            {drivers.slice(0, 5).map((s) => {
              const d = getDriver(s.driverId);
              if (!d) return null;
              return (
                <Link
                  key={s.driverId}
                  href={`/drivers/${s.driverId}`}
                  className="flex items-center gap-3 bg-[#141420] border border-[#2D2D3A] rounded-xl px-4 py-3 hover:-translate-y-0.5 transition-all group"
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${medalClass(s.position)}`}>
                    {s.position}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white group-hover:text-[#E8002D] transition-colors truncate">
                        {d.firstName[0]}. {d.lastName}
                      </span>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.teamColor }} />
                    </div>
                    <div className="mt-1.5 h-1 bg-[#2D2D3A] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(s.points / driverMax) * 100}%`, backgroundColor: d.teamColor }} />
                    </div>
                  </div>
                  <span className="text-base font-black text-white tabular-nums shrink-0">{s.points}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Constructor */}
        <div>
          <p className="text-xs text-[#64748B] uppercase tracking-widest mb-3">컨스트럭터</p>
          <div className="space-y-2">
            {constructors.slice(0, 5).map((s) => {
              const team = getTeam(s.teamId);
              if (!team) return null;
              return (
                <Link
                  key={s.teamId}
                  href={`/teams/${s.teamId}`}
                  className="flex items-center gap-3 bg-[#141420] border border-[#2D2D3A] rounded-xl px-4 py-3 hover:-translate-y-0.5 transition-all group"
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${medalClass(s.position)}`}>
                    {s.position}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white group-hover:text-[#E8002D] transition-colors truncate">{team.name}</span>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: team.primaryColor }} />
                    </div>
                    <div className="mt-1.5 h-1 bg-[#2D2D3A] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(s.points / constructorMax) * 100}%`, backgroundColor: team.primaryColor }} />
                    </div>
                  </div>
                  <span className="text-base font-black text-white tabular-nums shrink-0">{s.points}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
