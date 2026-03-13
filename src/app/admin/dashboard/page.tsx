import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readFileSync } from "fs";
import { join } from "path";
import AdminDashboardClient from "./AdminDashboardClient";
import { calendar, drivers } from "@/data/f1-data";

const DEFAULT_CONFIG = {
  analytics: { gtmId: "", gaId: "", naverCode: "", headCode: "", bodyCode: "" },
  meta: { siteTitle: "", titleTemplate: "", description: "", ogTitle: "", ogDescription: "", ogImage: "", keywords: "" },
  navLinks: [],
};

async function readConfig() {
  // 1) Firestore
  try {
    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    const { getFirestore } = await import("firebase-admin/firestore");
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    }
    const snap = await getFirestore().doc("admin/config").get();
    if (snap.exists) return snap.data() as typeof DEFAULT_CONFIG;
  } catch { /* fall through */ }

  // 2) 로컬 파일 fallback
  try {
    return JSON.parse(readFileSync(join(process.cwd(), "src/data/admin-config.json"), "utf-8"));
  } catch {
    return DEFAULT_CONFIG;
  }
}

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const cookieSecret = process.env.ADMIN_COOKIE_SECRET;
  if (!cookieSecret || cookieStore.get("pitlane_admin")?.value !== cookieSecret) {
    redirect("/admin");
  }

  const config = await readConfig();

  const pendingRounds = calendar
    .filter((r) => r.status !== "completed")
    .map((r) => ({ round: r.round, label: `Round ${r.round} — ${r.koreanName}` }));

  const driverList = drivers.map((d) => ({
    id: d.id,
    firstName: d.firstName,
    lastName: d.lastName,
    teamId: d.teamId,
  }));

  return (
    <AdminDashboardClient
      initialConfig={config}
      pendingRounds={pendingRounds}
      driverList={driverList}
      adminGoogleEmail={process.env.ADMIN_GOOGLE_EMAIL}
    />
  );
}
