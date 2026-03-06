import Link from "next/link";
import { drivers } from "@/data/f1-data";

export const metadata = {
  title: "F1 드라이버 아카이브",
  description: "2026 시즌 현역 F1 드라이버 22명의 프로필, 통계, 시즌 성적을 한눈에 확인하세요.",
  openGraph: {
    title: "F1 드라이버 아카이브 | PitLane",
    description: "2026 시즌 현역 F1 드라이버 22명의 프로필, 통계, 시즌 성적을 한눈에 확인하세요.",
    url: "https://f1.324.ing/drivers",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function DriversPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <section className="mb-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          드라이버 아카이브
        </h1>
        <p className="mt-3 text-[#64748B]">2026 시즌 현역 22명</p>
        <div className="mt-4 mx-auto w-16 h-1 bg-[#E8002D] rounded-full" />
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {drivers.map((driver) => (
          <Link
            key={driver.id}
            href={`/drivers/${driver.id}`}
            className="group block"
          >
            <article
              className="relative bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 h-full"
              style={{ borderTopWidth: "3px", borderTopColor: driver.teamColor }}
            >
              <div
                className="absolute top-3 right-3 text-5xl sm:text-6xl font-black leading-none select-none pointer-events-none"
                style={{ color: driver.teamColor, opacity: 0.25 }}
              >
                {driver.number}
              </div>
              <div className="relative p-5 sm:p-6">
                <span className="text-2xl mb-3 block">{driver.flag}</span>
                <div className="mb-4">
                  <span className="block text-xs text-[#64748B] uppercase tracking-wider">
                    {driver.firstName}
                  </span>
                  <span className="block text-lg sm:text-xl font-bold text-white leading-tight">
                    {driver.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: driver.teamColor }}
                  />
                  <span className="text-xs text-[#64748B] truncate">
                    {driver.team}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#2D2D3A]">
                  {[
                    { v: driver.wins, l: "Wins" },
                    { v: driver.podiums, l: "Podiums" },
                    { v: driver.championships, l: "Titles" },
                  ].map((s) => (
                    <div key={s.l} className="text-center">
                      <span className="block text-sm font-bold text-white">
                        {s.v}
                      </span>
                      <span className="block text-[10px] text-[#64748B] uppercase tracking-wider">
                        {s.l}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
