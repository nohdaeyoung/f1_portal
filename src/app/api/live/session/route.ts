import { NextResponse } from "next/server";
import { getLatestSession } from "@/lib/api/openf1";

export const revalidate = 60;

export async function GET() {
  try {
    const session = await getLatestSession();
    if (!session) return NextResponse.json(null);
    return NextResponse.json({
      session_key: session.session_key,
      meeting_key: session.meeting_key,
      session_name: session.session_name,
      session_type: session.session_type,
      date_start: session.date_start,
      date_end: session.date_end,
    });
  } catch {
    return NextResponse.json(null);
  }
}
