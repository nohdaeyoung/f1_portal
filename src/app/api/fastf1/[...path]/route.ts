import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FF1_BASE = process.env.FASTF1_API_URL ?? "http://localhost:8000";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = "/" + path.join("/");
  const search = req.nextUrl.searchParams.toString();
  const url = `${FF1_BASE}${endpoint}${search ? `?${search}` : ""}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `FastF1 service error: ${res.status}` },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
    });
  } catch {
    return NextResponse.json(
      { error: "FastF1 service unavailable" },
      { status: 503 }
    );
  }
}
