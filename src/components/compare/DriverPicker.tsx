"use client";

import { useState, useRef, useEffect } from "react";
import { drivers } from "@/data/f1-data";

interface Props {
  label: "A" | "B";
  value: string | null;
  exclude: string | null;
  onChange: (id: string) => void;
}

export function DriverPicker({ label, value, exclude, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = drivers.find((d) => d.id === value);
  const filtered = drivers.filter((d) => {
    if (d.id === exclude) return false;
    const q = query.toLowerCase();
    return (
      d.firstName.toLowerCase().includes(q) ||
      d.lastName.toLowerCase().includes(q) ||
      d.team.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const triggerId = `driver-picker-${label}-trigger`;
  const listboxId = `driver-picker-${label}-listbox`;

  return (
    <div ref={ref} className="relative w-full">
      <p className="text-xs text-[#64748B] uppercase tracking-widest mb-2" id={`driver-picker-${label}-label`}>드라이버 {label}</p>
      <button
        id={triggerId}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-labelledby={`driver-picker-${label}-label ${triggerId}`}
        className="w-full flex items-center gap-3 px-4 py-3 bg-[#141420] border border-[#2D2D3A] rounded-xl hover:border-[#3D3D4A] transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-f1-red"
      >
        {selected ? (
          <>
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: selected.teamColor }}
            />
            <span className="text-white font-medium">{selected.firstName} {selected.lastName}</span>
            <span className="text-[#64748B] text-sm ml-auto">{selected.team}</span>
          </>
        ) : (
          <span className="text-[#475569]">드라이버 선택...</span>
        )}
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={`드라이버 ${label} 선택`}
          className="absolute z-50 top-full mt-1 w-full bg-[#1A1A2E] border border-[#2D2D3A] rounded-xl shadow-xl overflow-hidden"
        >
          <div className="p-2 border-b border-[#2D2D3A]">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이름 또는 팀 검색..."
              aria-label="드라이버 검색"
              className="w-full bg-[#111118] text-white text-sm px-3 py-2 rounded-lg outline-none placeholder-[#475569]"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.map((d) => (
              <button
                key={d.id}
                role="option"
                aria-selected={d.id === value}
                onClick={() => { onChange(d.id); setOpen(false); setQuery(""); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-f1-red ${
                  d.id === value ? "bg-white/5" : ""
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: d.teamColor }}
                />
                <span className="text-white text-sm">{d.firstName} {d.lastName}</span>
                <span className="text-[#475569] text-xs ml-auto">{d.flag} {d.team}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-[#475569] text-sm text-center py-4">검색 결과 없음</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
