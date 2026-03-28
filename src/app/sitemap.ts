import { MetadataRoute } from "next";
import { drivers, teams, circuits, calendar } from "@/data/f1-data";
import { f1Eras } from "@/data/f1-eras";
import { getAdminDb } from "@/lib/firebase-admin";

export const revalidate = 3600; // 1시간마다 재생성

const BASE = "https://f1.324.ing";

async function fetchPostUrls(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    return [];
  }
  try {
    const db = getAdminDb();
    const snap = await db.collection("posts")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    return snap.docs.map((doc) => {
      const data = doc.data();
      const lastMod = data.updatedAt?.toDate?.() ?? data.createdAt?.toDate?.() ?? new Date();
      return {
        url: `${BASE}/community/${doc.id}`,
        lastModified: lastMod,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      };
    });
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── 정적 핵심 페이지 ──────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                      lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/news`,            lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/season`,          lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/drivers`,         lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/teams`,           lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/circuits`,        lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/community`,       lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/history`,         lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/info`,            lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/info/regulations`,lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/devlog`,          lastModified: now, changeFrequency: "daily",   priority: 0.5 },
  ];

  // ── F1 역사 시대별 ─────────────────────────────────
  const eraPages: MetadataRoute.Sitemap = f1Eras.map((e) => ({
    url: `${BASE}/history/era/${e.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // ── 규정 섹션 ──────────────────────────────────────
  const regulationSections: MetadataRoute.Sitemap = ["a", "b", "c", "d", "f"].map((id) => ({
    url: `${BASE}/info/regulations/section/${id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

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
    changeFrequency: r.status === "completed" ? "monthly" : "weekly",
    priority: r.status === "completed" ? 0.8 : 0.7,
  }));

  // ── 완료된 레이스 세션 결과 ───────────────────────
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

  const postPages = await fetchPostUrls();

  return [
    ...staticPages,
    ...eraPages,
    ...regulationSections,
    ...driverPages,
    ...teamPages,
    ...circuitPages,
    ...racePages,
    ...sessionPages,
    ...postPages,
  ];
}
