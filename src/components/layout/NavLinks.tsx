"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/news", label: "뉴스" },
  { href: "/season", label: "시즌" },
  { href: "/drivers", label: "드라이버" },
  { href: "/teams", label: "팀" },
  { href: "/circuits", label: "서킷" },
  { href: "/history", label: "역사" },
  { href: "/info", label: "규정" },
];

export function NavLinks() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // 경로 변경 시 드로어 닫기
  useEffect(() => { setOpen(false); }, [pathname]);

  // 드로어 열릴 때 body 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-1">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              isActive(link.href)
                ? "text-white bg-white/8 font-semibold"
                : "text-[#64748B] hover:text-white hover:bg-white/5"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Mobile hamburger button */}
      <button
        className="md:hidden flex flex-col justify-center items-center w-11 h-11 gap-1.5 rounded-lg hover:bg-white/5 transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={open}
      >
        <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${open ? "rotate-45 translate-y-2" : ""}`} />
        <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${open ? "opacity-0" : ""}`} />
        <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${open ? "-rotate-45 -translate-y-2" : ""}`} />
      </button>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`md:hidden fixed top-16 right-0 bottom-0 z-50 w-64 bg-[#111118] border-l border-[#2D2D3A] flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <nav className="flex-1 overflow-y-auto py-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-5 py-3.5 text-base font-medium transition-colors ${
                isActive(link.href)
                  ? "text-white bg-white/8 border-r-2 border-[#E8002D]"
                  : "text-[#94A3B8] hover:text-white hover:bg-white/5"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-[#2D2D3A] px-5 py-4">
          <p className="text-xs text-[#475569]">PitLane — F1 종합 포털</p>
        </div>
      </div>
    </>
  );
}
