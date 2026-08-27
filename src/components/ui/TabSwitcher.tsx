"use client";

import { useState, type ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
}

interface Props {
  tabs: readonly Tab[];
  /** 서버에서 미리 렌더된 패널. 키는 Tab.id 와 일치해야 한다. */
  panels: Record<string, ReactNode>;
  /** 탭이 많아 한 줄에 안 들어갈 때 가로 스크롤 허용 */
  scrollable?: boolean;
}

/**
 * 탭 전환만 담당하는 최소 클라이언트 컴포넌트.
 *
 *   서버 컴포넌트 (무거운 데이터 보유)
 *        │  panels={{ id: <이미 렌더된 JSX> }}
 *        ▼
 *   TabSwitcher (useState 만 보유)
 *
 * 데이터 모듈을 여기서 import 하지 말 것 — 하는 순간 클라이언트 번들로 딸려간다.
 * 규정 전문(~400KB)이 브라우저로 넘어가던 원인이 정확히 그것이었다.
 */
export function TabSwitcher({ tabs, panels, scrollable = false }: Props) {
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id ?? "");

  return (
    <>
      <div
        className={`flex gap-1 bg-[#0D0D14] border border-[#2D2D3A] rounded-xl p-1 mb-10${
          scrollable ? " overflow-x-auto" : ""
        }`}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all${
              scrollable ? " min-w-max whitespace-nowrap" : ""
            } ${
              activeTab === tab.id
                ? "bg-[#E8002D] text-white shadow"
                : "text-[#64748B] hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {panels[activeTab] ?? null}
    </>
  );
}
