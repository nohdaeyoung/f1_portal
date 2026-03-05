import { fetchRecentCommits, groupByDate, type DevlogDay } from "@/lib/api/github";
import { devlogHistory, formatDevlogDate, TYPE_META } from "@/data/devlog";

export const revalidate = 3600; // 매시간 ISR (cron이 7am에 강제 갱신)

export const metadata = {
  title: "개발 노트 | PitLane",
  description: "PitLane F1 포털 개발 히스토리 및 변경사항 기록",
};

// ─── GitHub 커밋 → DevlogDay 병합 ────────────────────────────

async function buildTimeline(): Promise<{
  gitDays: DevlogDay[];
  totalCommits: number;
}> {
  const commits = await fetchRecentCommits(90);
  const gitDays = groupByDate(commits);
  return { gitDays, totalCommits: commits.length };
}

// ─── 타입 뱃지 ────────────────────────────────────────────────

function TypeBadge({ type }: { type: keyof typeof TYPE_META }) {
  const m = TYPE_META[type];
  return (
    <span
      className="text-[10px] font-black px-2 py-0.5 rounded-full border"
      style={{
        color: m.color,
        backgroundColor: m.bg,
        borderColor: m.color + "40",
      }}
    >
      {m.label}
    </span>
  );
}

// ─── 커밋 메시지 파싱 (feat: → 기능, fix: → 수정 …) ──────────

function parseCommitType(msg: string): string {
  if (msg.startsWith("feat:"))   return "기능";
  if (msg.startsWith("fix:"))    return "수정";
  if (msg.startsWith("style:"))  return "스타일";
  if (msg.startsWith("chore:"))  return "정리";
  if (msg.startsWith("docs:"))   return "문서";
  if (msg.startsWith("refactor:")) return "리팩터";
  if (msg.startsWith("infra:"))  return "인프라";
  return "업데이트";
}

function commitColor(msg: string) {
  if (msg.startsWith("feat:"))   return "#0EA5E9";
  if (msg.startsWith("fix:"))    return "#22C55E";
  if (msg.startsWith("style:"))  return "#A855F7";
  if (msg.startsWith("chore:"))  return "#64748B";
  if (msg.startsWith("docs:"))   return "#F59E0B";
  return "#94A3B8";
}

function cleanMsg(msg: string): string {
  return msg
    .replace(/^(feat|fix|style|chore|docs|refactor|infra|data|design):\s*/i, "")
    .trim();
}

// ─── Page ─────────────────────────────────────────────────────

export default async function DevlogPage() {
  const { gitDays, totalCommits } = await buildTimeline();

  // 정적 히스토리를 날짜별로 그룹핑
  const staticByDate = new Map<string, typeof devlogHistory>();
  for (const entry of devlogHistory) {
    if (!staticByDate.has(entry.date)) staticByDate.set(entry.date, []);
    staticByDate.get(entry.date)!.push(entry);
  }

  // 전체 날짜 목록 (정적 + GitHub, 중복 제거, 최신순)
  const allDates = [
    ...new Set([
      ...devlogHistory.map((e) => e.date),
      ...gitDays.map((d) => d.dateKST),
    ]),
  ].sort((a, b) => b.localeCompare(a));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── Header ── */}
      <section className="mb-12">
        <span className="text-xs uppercase tracking-widest text-[#E8002D] font-bold">
          Changelog · Dev Notes
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white mt-2">
          개발 노트
        </h1>
        <p className="text-[#64748B] mt-2 text-sm">
          PitLane F1 포털 개발 히스토리 — 매일 오전 7시 자동 갱신
        </p>
        <div className="mt-4 w-16 h-1 bg-[#E8002D] rounded-full" />

        {/* 통계 */}
        <div className="mt-6 flex gap-4 flex-wrap">
          {[
            { label: "총 커밋", value: totalCommits },
            { label: "업데이트 일수", value: allDates.length },
            { label: "정적 항목", value: devlogHistory.length },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-[#141420] border border-[#2D2D3A] rounded-xl px-5 py-3 text-center"
            >
              <span className="block text-2xl font-black text-[#E8002D]">{s.value}</span>
              <span className="block text-xs text-[#64748B] mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Timeline ── */}
      <div className="relative">
        {/* 세로선 */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-[#2D2D3A]" />

        <div className="space-y-10">
          {allDates.map((date) => {
            const staticEntries = staticByDate.get(date) ?? [];
            const gitDay = gitDays.find((d) => d.dateKST === date);
            const gitCommits = gitDay?.commits ?? [];
            const dateLabel = staticEntries[0]
              ? formatDevlogDate(date)
              : gitDay?.dateLabel ?? date;

            return (
              <div key={date} className="pl-12 relative">
                {/* 날짜 dot */}
                <div className="absolute left-0 w-8 h-8 rounded-full bg-[#141420] border-2 border-[#E8002D] flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#E8002D]" />
                </div>

                {/* 날짜 레이블 */}
                <p className="text-xs text-[#64748B] font-mono mb-4 -mt-0.5">
                  {dateLabel}
                </p>

                <div className="space-y-4">
                  {/* 정적 히스토리 항목 */}
                  {staticEntries.map((entry, i) => (
                    <div
                      key={i}
                      className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-5"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <TypeBadge type={entry.type} />
                        <h3 className="text-sm font-black text-white">{entry.title}</h3>
                      </div>
                      <ul className="space-y-1.5">
                        {entry.items.map((item, j) => (
                          <li key={j} className="flex items-start gap-2 text-xs text-[#94A3B8]">
                            <span className="text-[#E8002D] shrink-0 mt-0.5">▸</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {/* GitHub 커밋 */}
                  {gitCommits.length > 0 && (
                    <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl overflow-hidden">
                      <div className="px-5 py-3 border-b border-[#2D2D3A] flex items-center gap-2">
                        <span className="text-xs text-[#64748B]">GitHub 커밋</span>
                        <span className="text-[10px] font-bold text-[#64748B] bg-white/5 px-1.5 py-0.5 rounded">
                          {gitCommits.length}건
                        </span>
                      </div>
                      <div className="divide-y divide-[#2D2D3A]/50">
                        {gitCommits.map((commit) => {
                          const color = commitColor(commit.message);
                          const type = parseCommitType(commit.message);
                          const clean = cleanMsg(commit.message);
                          return (
                            <div key={commit.sha} className="px-5 py-3 group">
                              <div className="flex items-start gap-2">
                                <span
                                  className="text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                                  style={{
                                    color,
                                    backgroundColor: color + "18",
                                  }}
                                >
                                  {type}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <a
                                    href={commit.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-bold text-white hover:text-[#E8002D] transition-colors leading-snug block"
                                  >
                                    {clean}
                                  </a>
                                  {commit.body && (
                                    <p className="text-xs text-[#64748B] mt-1 leading-relaxed whitespace-pre-line">
                                      {commit.body}
                                    </p>
                                  )}
                                </div>
                                <a
                                  href={commit.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-mono text-[#64748B] hover:text-[#E8002D] transition-colors shrink-0 mt-1"
                                >
                                  {commit.sha}
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 시작점 */}
        <div className="pl-12 relative mt-10">
          <div className="absolute left-0 w-8 h-8 rounded-full bg-[#E8002D]/10 border-2 border-[#E8002D]/30 flex items-center justify-center">
            <span className="text-[10px]">🏎</span>
          </div>
          <p className="text-xs text-[#64748B] font-mono -mt-0.5">
            2026년 3월 — PitLane 프로젝트 시작
          </p>
        </div>
      </div>
    </div>
  );
}
