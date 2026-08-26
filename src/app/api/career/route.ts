import { NextRequest, NextResponse } from "next/server";
import { fetchDriverCareerStats } from "@/lib/data/live";

export async function GET(req: NextRequest) {
  const driver = req.nextUrl.searchParams.get("driver");
  if (!driver) {
    return NextResponse.json({ error: "driver param required" }, { status: 400 });
  }

  const stats = await fetchDriverCareerStats(driver);
  return NextResponse.json(stats, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
  });
}
