import Link from "next/link";
import { circuits } from "@/data/f1-data";

export const metadata = {
  title: "서킷 가이드 | PitLane",
  description: "2026 시즌 24개 그랑프리 서킷",
};

export default function CircuitsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <section className="mb-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          서킷 가이드
        </h1>
        <p className="mt-3 text-[#64748B]">2026 시즌 24개 그랑프리 서킷</p>
        <div className="mt-4 mx-auto w-16 h-1 bg-[#E8002D] rounded-full" />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {circuits.map((circuit) => (
          <Link
            key={circuit.id}
            href={`/circuits/${circuit.id}`}
            className="group block"
          >
            <article className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 h-full">
              <div className="p-6">
                <div className="text-4xl mb-4">{circuit.flag}</div>
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-white">{circuit.koreanName}</h2>
                  <span className="text-sm text-[#64748B]">{circuit.name}</span>
                </div>
                <p className="text-sm text-[#64748B] mb-5">
                  {circuit.city}, {circuit.country}
                </p>

                {/* Specs */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#2D2D3A] mb-4">
                  {[
                    { v: circuit.length, l: "km" },
                    { v: circuit.turns, l: "Turns" },
                    { v: circuit.drsZones, l: "DRS" },
                  ].map((s) => (
                    <div key={s.l} className="text-center">
                      <span className="block text-sm font-bold text-white">{s.v}</span>
                      <span className="block text-[10px] text-[#64748B] uppercase">
                        {s.l}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Lap Record */}
                <div className="pt-4 border-t border-[#2D2D3A] mb-3">
                  <span className="block text-xs text-[#64748B] uppercase mb-1">
                    Lap Record
                  </span>
                  <span className="text-sm font-mono font-bold text-[#E8002D]">
                    {circuit.lapRecord.time}
                  </span>
                  <span className="text-xs text-[#64748B] ml-2">
                    {circuit.lapRecord.driver} ({circuit.lapRecord.year})
                  </span>
                </div>

                {/* Type Badge */}
                <span
                  className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${
                    circuit.type === "street"
                      ? "text-blue-400 border-blue-500/30 bg-blue-500/10"
                      : "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                  }`}
                >
                  {circuit.type === "street" ? "Street Circuit" : "Permanent"}
                </span>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
