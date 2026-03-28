"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

type NavChild = { href: string; label: string };
type NavItem =
  | { href: string; label: string; children?: undefined }
  | { href?: undefined; label: string; children: NavChild[] };

const navLinks: NavItem[] = [
  { href: "/news", label: "뉴스" },
  { href: "/season", label: "시즌" },
  {
    label: "드라이버와 팀",
    children: [
      { href: "/drivers", label: "드라이버" },
      { href: "/compare", label: "드라이버 비교" },
      { href: "/teams", label: "팀" },
    ],
  },
  { href: "/circuits", label: "서킷" },
  {
    label: "F1 가이드",
    children: [
      { href: "/history", label: "역사" },
      { href: "/info", label: "규정" },
    ],
  },
  { href: "/community", label: "커뮤니티" },
];

export function NavLinks() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setOpen(false); setOpenMenu(null); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpenMenu(null); setOpen(false); }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const isActive = useCallback((href: string) =>
    pathname === href || pathname.startsWith(href + "/"), [pathname]);

  function isGroupActive(children: NavChild[]) {
    return children.some((c) => isActive(c.href));
  }

  function toggleMenu(label: string) {
    setOpenMenu((prev) => (prev === label ? null : label));
  }

  return (
    <>
      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-0.5" ref={navRef} role="navigation" aria-label="주 메뉴">
        {navLinks.map((link) => {
          if (link.children) {
            const active = isGroupActive(link.children);
            const isOpen = openMenu === link.label;
            const menuId = `nav-menu-${link.label.replace(/\s/g, "-")}`;
            return (
              <div key={link.label} className="relative">
                <button
                  onClick={() => toggleMenu(link.label)}
                  aria-haspopup="menu"
                  aria-expanded={isOpen}
                  aria-controls={menuId}
                  className={[
                    "flex items-center gap-1 px-3 min-h-[44px] text-sm font-medium rounded-lg transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-f1-red focus-visible:ring-offset-1 focus-visible:ring-offset-bg-base",
                    active || isOpen
                      ? "text-white bg-white/8 font-semibold"
                      : "text-text-muted hover:text-white hover:bg-white/5",
                  ].join(" ")}
                >
                  {link.label}
                  <svg
                    className={`w-3 h-3 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <ul
                    id={menuId}
                    role="menu"
                    className="absolute top-full left-0 mt-1.5 w-44 bg-bg-raised border border-border-default rounded-xl shadow-xl overflow-hidden z-50 hud-card"
                  >
                    {link.children.map((child) => (
                      <li key={child.href} role="none">
                        <Link
                          href={child.href}
                          role="menuitem"
                          className={[
                            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
                            "focus-visible:outline-none focus-visible:bg-white/8 focus-visible:text-white",
                            isActive(child.href)
                              ? "text-white bg-white/8 border-l-2 border-f1-red"
                              : "text-text-secondary hover:text-white hover:bg-white/5",
                          ].join(" ")}
                        >
                          {isActive(child.href) && (
                            <span className="w-1 h-1 rounded-full bg-f1-red shrink-0" aria-hidden="true" />
                          )}
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          }
          return (
            <Link
              key={link.href}
              href={link.href!}
              className={[
                "inline-flex items-center px-3 min-h-[44px] text-sm font-medium rounded-lg transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-f1-red focus-visible:ring-offset-1 focus-visible:ring-offset-bg-base",
                isActive(link.href!)
                  ? "text-white font-semibold border-b-2 border-f1-red rounded-none pb-[6px]"
                  : "text-text-muted hover:text-white hover:bg-white/5",
              ].join(" ")}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden flex flex-col justify-center items-center w-11 h-11 gap-1.5 rounded-lg hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-f1-red"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={open}
        aria-controls="mobile-nav"
      >
        <span className={`block w-5 h-0.5 bg-white transition-all duration-200 origin-center ${open ? "rotate-45 translate-y-2" : ""}`} aria-hidden="true" />
        <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${open ? "opacity-0 scale-x-0" : ""}`} aria-hidden="true" />
        <span className={`block w-5 h-0.5 bg-white transition-all duration-200 origin-center ${open ? "-rotate-45 -translate-y-2" : ""}`} aria-hidden="true" />
      </button>

      {/* Mobile drawer */}
      {mounted && createPortal(
        <>
          {open && (
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
          )}
          <nav
            id="mobile-nav"
            aria-label="모바일 메뉴"
            aria-hidden={!open}
            className={`fixed top-16 right-0 bottom-0 z-50 w-64 bg-bg-raised border-l border-border-default flex flex-col transition-transform duration-200 ${
              open ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <ul className="flex-1 overflow-y-auto py-4 list-none m-0 p-0">
              {navLinks.map((link) => {
                if (link.children) {
                  const active = isGroupActive(link.children);
                  return (
                    <li key={link.label}>
                      <p
                        className={`px-5 py-2 text-[10px] font-display font-bold uppercase tracking-widest ${
                          active ? "text-f1-red" : "text-text-disabled"
                        }`}
                        aria-hidden="true"
                      >
                        {link.label}
                      </p>
                      <ul className="list-none m-0 p-0">
                        {link.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={[
                                "flex items-center gap-3 pl-8 pr-5 py-2.5 text-sm font-medium transition-colors",
                                "focus-visible:outline-none focus-visible:bg-white/8 focus-visible:text-white",
                                isActive(child.href)
                                  ? "text-white border-r-2 border-f1-red bg-white/5"
                                  : "text-text-muted hover:text-white hover:bg-white/5",
                              ].join(" ")}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                }
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href!}
                      className={[
                        "flex items-center gap-3 px-5 py-3 text-base font-medium transition-colors",
                        "focus-visible:outline-none focus-visible:bg-white/8 focus-visible:text-white",
                        isActive(link.href!)
                          ? "text-white bg-white/8 border-r-2 border-f1-red"
                          : "text-text-secondary hover:text-white hover:bg-white/5",
                      ].join(" ")}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-border-default px-5 py-4">
              <p className="font-display text-xs tracking-widest uppercase text-text-disabled">
                <span className="text-f1-red">F1</span> · 324.ING
              </p>
            </div>
          </nav>
        </>,
        document.body
      )}
    </>
  );
}
