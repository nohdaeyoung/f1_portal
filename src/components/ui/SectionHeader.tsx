import Link from "next/link";

interface SectionHeaderProps {
  title: string;
  href?: string;
  linkLabel?: string;
  className?: string;
}

export function SectionHeader({ title, href, linkLabel = "전체 보기", className = "" }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {href && (
        <Link
          href={href}
          className="text-sm text-[#64748B] hover:text-[#E8002D] transition-colors font-medium"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
