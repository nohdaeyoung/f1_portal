import Link from "next/link";
import { teams, getTeamDrivers } from "@/data/f1-data";

export const metadata = {
  title: "팀 아카이브 | PitLane",
  description: "2026 시즌 F1 11개 컨스트럭터",
};

export default function TeamsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <section className="mb-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          팀 아카이브
        </h1>
        <p className="mt-3 text-[#64748B]">2026 시즌 11개 컨스트럭터</p>
        <div className="mt-4 mx-auto w-16 h-1 bg-[#E8002D] rounded-full" />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => {
          const teamDrivers = getTeamDrivers(team.id);
          return (
            <Link key={team.id} href={`/teams/${team.id}`} className="group block">
              <article
                className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 h-full"
                style={{ borderLeftWidth: "4px", borderLeftColor: team.primaryColor }}
              >
                <div className="p-6">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-white">{team.name}</h2>
                    <span className="text-sm text-[#64748B]">{team.koreanName}</span>
                  </div>

                  <div className="space-y-2 mb-5 text-sm text-[#64748B]">
                    <p>{team.base}</p>
                    <p>{team.powerUnit} PU</p>
                  </div>

                  {/* Drivers */}
                  <div className="mb-5 pt-4 border-t border-[#2D2D3A]">
                    <span className="block text-xs text-[#64748B] uppercase tracking-wider mb-3">
                      드라이버
                    </span>
                    {teamDrivers.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between mb-1.5"
                      >
                        <span className="text-sm text-white">
                          {d.firstName} {d.lastName}
                        </span>
                        <span
                          className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                          style={{
                            color: team.primaryColor,
                            backgroundColor: `${team.primaryColor}15`,
                          }}
                        >
                          #{d.number}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#2D2D3A]">
                    <div>
                      <span className="block text-2xl font-bold text-white">
                        {team.wins}
                      </span>
                      <span className="block text-xs text-[#64748B] uppercase">
                        Wins
                      </span>
                    </div>
                    <div>
                      <span className="block text-2xl font-bold text-white">
                        {team.constructorTitles}
                      </span>
                      <span className="block text-xs text-[#64748B] uppercase">
                        Titles
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
