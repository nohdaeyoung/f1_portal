/**
 * GitHub API Client
 * Public repo (nohdaeyoung/f1_portal) — no auth needed, 60 req/h limit
 */

const REPO = "nohdaeyoung/f1_portal";
const BASE = "https://api.github.com";

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string; // ISO
    };
  };
  html_url: string;
}

export interface DevlogDay {
  dateKST: string;      // "YYYY-MM-DD" (KST)
  dateLabel: string;    // "3월 6일 (목)" 형식
  commits: {
    sha: string;
    message: string;    // 첫 줄만
    body: string;       // 나머지 (있으면)
    url: string;
  }[];
}

/** KST 기준 YYYY-MM-DD */
function toKSTDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

/** 커밋 목록 → KST 날짜별 그룹 (최신순) */
export function groupByDate(commits: GitHubCommit[]): DevlogDay[] {
  const map = new Map<string, DevlogDay>();

  for (const c of commits) {
    const dateKST = toKSTDate(c.commit.author.date);
    if (!map.has(dateKST)) {
      const d = new Date(c.commit.author.date);
      const dateLabel = d.toLocaleDateString("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "long",
        day: "numeric",
        weekday: "short",
      });
      map.set(dateKST, { dateKST, dateLabel, commits: [] });
    }

    const [title, ...rest] = c.commit.message.split("\n");
    const body = rest
      .join("\n")
      .replace(/Co-Authored-By:.*/gi, "")
      .trim();

    // bot / merge 커밋 제외
    if (title.startsWith("Merge ") || title.includes("Co-Authored")) continue;

    map.get(dateKST)!.commits.push({
      sha: c.sha.slice(0, 7),
      message: title,
      body,
      url: c.html_url,
    });
  }

  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, v]) => v);
}

/** 최근 N일 커밋 가져오기 (ISR 캐시 1시간) */
export async function fetchRecentCommits(days = 60): Promise<GitHubCommit[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const url = `${BASE}/repos/${REPO}/commits?since=${since.toISOString()}&per_page=100`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/vnd.github.v3+json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
