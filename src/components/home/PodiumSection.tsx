import Image from "next/image";
import Link from "next/link";
import { type LastRacePodium, type PodiumEntry } from "@/lib/data/live";
import { SectionHeader } from "@/components/ui/SectionHeader";

const MEDAL: Record<number, { emoji: string; labelColor: string; bg: string; border: string }> = {
  1: { emoji: "🥇", labelColor: "#FCD34D", bg: "bg-[#FCD34D]/8", border: "border-[#FCD34D]/30" },
  2: { emoji: "🥈", labelColor: "#C0C0C0", bg: "bg-[#C0C0C0]/8", border: "border-[#C0C0C0]/20" },
  3: { emoji: "🥉", labelColor: "#CD7F32", bg: "bg-[#CD7F32]/8", border: "border-[#CD7F32]/20" },
};

function shortTeam(name: string) {
  return name.replace("Scuderia ", "").replace(" Racing", "").replace(" F1 Team", "");
}

function PodiumCard({ entry, tall }: { entry: PodiumEntry; tall?: boolean }) {
  const m = MEDAL[entry.position];
  const lastName = entry.driverName.split(" ").slice(-1)[0];

  return (
    <Link href={`/drivers/${entry.driverId}`} className="group">
      <div
        className={`flex flex-col items-center justify-between rounded-xl border ${m.border} ${m.bg} transition-transform group-hover:scale-[1.02] overflow-hidden ${tall ? "py-5" : "py-4"}`}
        style={{ borderTopWidth: 3, borderTopColor: entry.teamColor }}
      >
        {/* 드라이버 이미지 or 메달 이모지 */}
        {entry.headshotUrl ? (
          <div className={`relative w-full ${tall ? "h-36" : "h-28"} overflow-hidden`}>
            <Image
              src={entry.headshotUrl}
              alt={entry.driverName}
              fill
              sizes="(max-width: 768px) 33vw, 200px"
              className="object-contain object-bottom"
            />
          </div>
        ) : (
          <span className={`${tall ? "text-4xl" : "text-3xl"} mb-2`}>{m.emoji}</span>
        )}

        <div className="text-center px-3 mt-2">
          <div className="text-sm sm:text-base font-black text-white leading-tight">
            {lastName}
          </div>
          <div className="text-[11px] font-semibold mt-0.5 truncate max-w-[100px]" style={{ color: entry.teamColor }}>
            {shortTeam(entry.team)}
          </div>
          {entry.gap && (
            <div className="text-[10px] text-[#64748B] font-mono mt-1 truncate max-w-[100px]">
              {entry.position === 1 ? entry.gap : `+${entry.gap}`}
            </div>
          )}
        </div>

        <span
          className="text-xs font-black mt-3 px-2 py-0.5 rounded-full"
          style={{ color: m.labelColor, backgroundColor: `${m.labelColor}20` }}
        >
          P{entry.position}
        </span>
      </div>
    </Link>
  );
}

export function PodiumSection({ data }: { data: LastRacePodium }) {
  const p1 = data.podium.find((x) => x.position === 1)!;
  const p2 = data.podium.find((x) => x.position === 2)!;
  const p3 = data.podium.find((x) => x.position === 3)!;

  return (
    <section>
      <SectionHeader
        title={`${data.koreanName} 포디움`}
        href={`/season/race/${data.round}?session=race`}
      />
      {/* Podium order: 2nd | 1st | 3rd */}
      <div className="grid grid-cols-3 gap-3 items-end">
        <PodiumCard entry={p2} />
        <PodiumCard entry={p1} tall />
        <PodiumCard entry={p3} />
      </div>
    </section>
  );
}
