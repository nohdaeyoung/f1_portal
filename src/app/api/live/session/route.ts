import { NextResponse } from "next/server";
import { type OF1Session } from "@/lib/api/openf1";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const year = new Date().getFullYear();
    const res = await fetch(
      `https://api.openf1.org/v1/sessions?year=${year}`,
      { cache: "no-store" }
    );
    if (!res.ok) return NextResponse.json(null);

    const sessions: OF1Session[] = await res.json();
    if (!sessions.length) return NextResponse.json(null);

    const now = Date.now();

    // 1순위: 현재 진행 중인 세션
    const active = sessions.find((s) => {
      const start = new Date(s.date_start).getTime();
      const end = new Date(s.date_end).getTime();
      return start <= now && now <= end;
    });

    // 2순위: 가장 최근에 시작한 세션
    const recent = sessions
      .filter((s) => new Date(s.date_start).getTime() <= now)
      .sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime())[0];

    const session = active ?? recent ?? sessions[sessions.length - 1];
    if (!session) return NextResponse.json(null);

    return NextResponse.json({
      session_key: session.session_key,
      meeting_key: session.meeting_key,
      session_name: session.session_name,
      session_type: session.session_type,
      date_start: session.date_start,
      date_end: session.date_end,
      is_active: !!active,
    });
  } catch {
    return NextResponse.json(null);
  }
}
