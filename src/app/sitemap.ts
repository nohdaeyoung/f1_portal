import { MetadataRoute } from "next";
import { drivers, teams, circuits, calendar } from "@/data/f1-data";

const BASE = "https://f1.324.ing";

const SESSION_KEYS = ["fp1", "fp2", "fp3", "sq", "sprint", "qualifying", "race"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // ── 정적 페이지 ──────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/news`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/season`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/drivers`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/teams`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/circuits`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/info`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  // ── 드라이버 상세 ─────────────────────────────────
  const driverPages: MetadataRoute.Sitemap = drivers.map((d) => ({
    url: `${BASE}/drivers/${d.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // ── 팀 상세 ──────────────────────────────────────
  const teamPages: MetadataRoute.Sitemap = teams.map((t) => ({
    url: `${BASE}/teams/${t.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // ── 서킷 상세 ─────────────────────────────────────
  const circuitPages: MetadataRoute.Sitemap = circuits.map((c) => ({
    url: `${BASE}/circuits/${c.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // ── 레이스 상세 ───────────────────────────────────
  const racePages: MetadataRoute.Sitemap = calendar.map((r) => ({
    url: `${BASE}/season/race/${r.round}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // ── 세션 결과 (완료된 레이스만) ───────────────────
  const completedRaces = calendar.filter((r) => r.status === "completed");
  const sessionPages: MetadataRoute.Sitemap = completedRaces.flatMap((r) => {
    const s = r.sessions;
    if (!s) return [];
    const keys = s.isSprint
      ? ["fp1", "sq", "sprint", "qualifying", "race"]
      : ["fp1", "fp2", "fp3", "qualifying", "race"];
    return keys.map((key) => ({
      url: `${BASE}/season/race/${r.round}/${key}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  });

  return [
    ...staticPages,
    ...driverPages,
    ...teamPages,
    ...circuitPages,
    ...racePages,
    ...sessionPages,
  ];
}
