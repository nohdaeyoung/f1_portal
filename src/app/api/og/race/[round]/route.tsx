import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

const JOLPICA_BASE = "https://api.jolpi.ca/ergast/f1";

const TEAM_COLORS: Record<string, string> = {
  red_bull:       "#3671C6",
  mclaren:        "#FF8000",
  ferrari:        "#E8002D",
  mercedes:       "#27F4D2",
  aston_martin:   "#229971",
  alpine:         "#FF87BC",
  williams:       "#64C4FF",
  rb:             "#6692FF",
  racing_bulls:   "#6692FF",
  haas:           "#B6BABD",
  sauber:         "#52E252",
  kick_sauber:    "#52E252",
  audi:           "#52E252",
};

function getTeamColor(constructorId: string): string {
  return TEAM_COLORS[constructorId] ?? "#94A3B8";
}

function fmtTime(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface JolpicaResult {
  position: string;
  Driver: { familyName: string; givenName: string; driverId: string };
  Constructor: { constructorId: string; name: string };
  Time?: { time: string };
  status: string;
}

interface JolpicaRace {
  raceName: string;
  Circuit: { circuitName: string; Location: { country: string; locality: string } };
  date: string;
  Results?: JolpicaResult[];
}

const COUNTRY_FLAG: Record<string, string> = {
  Australia: "🇦🇺", Bahrain: "🇧🇭", "Saudi Arabia": "🇸🇦", Japan: "🇯🇵",
  China: "🇨🇳", USA: "🇺🇸", "United States": "🇺🇸", Miami: "🇺🇸",
  Monaco: "🇲🇨", Canada: "🇨🇦", Spain: "🇪🇸", Austria: "🇦🇹",
  "United Kingdom": "🇬🇧", Hungary: "🇭🇺", Belgium: "🇧🇪",
  Netherlands: "🇳🇱", Italy: "🇮🇹", Azerbaijan: "🇦🇿",
  Singapore: "🇸🇬", Brazil: "🇧🇷", Mexico: "🇲🇽",
  "Las Vegas": "🇺🇸", Qatar: "🇶🇦", "Abu Dhabi": "🇦🇪",
};

const PODIUM_MEDAL = ["🥇", "🥈", "🥉"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ round: string }> }
) {
  const { round } = await params;
  const year = new URL(req.url).searchParams.get("year") ?? new Date().getFullYear();

  let race: JolpicaRace | null = null;
  try {
    const res = await fetch(
      `${JOLPICA_BASE}/${year}/${round}/results.json?limit=3`,
      { next: { revalidate: 300 } }
    );
    if (res.ok) {
      const json = await res.json();
      race = json?.MRData?.RaceTable?.Races?.[0] ?? null;
    }
  } catch {
    // fallback to no-result state
  }

  const flag = race ? (COUNTRY_FLAG[race.Circuit.Location.country] ?? "🏁") : "🏁";
  const raceName = race?.raceName ?? `Round ${round}`;
  const raceDate = race?.date ? fmtTime(race.date) : "";
  const top3 = race?.Results?.slice(0, 3) ?? [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "linear-gradient(135deg, #0D0D14 0%, #141420 60%, #1a1a2e 100%)",
          display: "flex",
          flexDirection: "column",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Red accent bar top */}
        <div style={{ width: "100%", height: "4px", background: "#E8002D", display: "flex" }} />

        {/* Background circles */}
        <div style={{
          position: "absolute", top: "-100px", right: "-100px",
          width: "500px", height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,0,45,0.05) 0%, transparent 70%)",
          display: "flex",
        }} />

        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "40px 60px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{
                background: "#E8002D",
                borderRadius: "8px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 900,
                color: "white",
                letterSpacing: "2px",
              }}>
                F1
              </div>
              <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600, letterSpacing: "1px" }}>
                ROUND {round} · {year}
              </span>
            </div>
            <span style={{ fontSize: "13px", color: "#475569" }}>f1.324.ing</span>
          </div>

          {/* Race name */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "36px" }}>
            <span style={{ fontSize: "64px", lineHeight: 1 }}>{flag}</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "36px", fontWeight: 900, color: "white", lineHeight: 1.1 }}>
                {raceName}
              </span>
              {raceDate && (
                <span style={{ fontSize: "16px", color: "#64748B", marginTop: "8px" }}>
                  {raceDate} · KST 기준
                </span>
              )}
            </div>
          </div>

          {/* Podium */}
          {top3.length > 0 ? (
            <div style={{ display: "flex", gap: "16px", flex: 1, alignItems: "flex-end" }}>
              {top3.map((r, i) => {
                const color = getTeamColor(r.Constructor.constructorId);
                const gap = i === 0
                  ? (r.Time?.time ?? "")
                  : r.Time?.time ? `+${r.Time.time}` : r.status;

                return (
                  <div
                    key={r.position}
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${i === 0 ? "rgba(232,0,45,0.3)" : "rgba(255,255,255,0.06)"}`,
                      borderRadius: "16px",
                      padding: "24px 20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Team color bar */}
                    <div style={{
                      position: "absolute", top: 0, left: 0,
                      width: "100%", height: "3px",
                      background: color,
                      display: "flex",
                    }} />

                    <span style={{ fontSize: "28px" }}>{PODIUM_MEDAL[i]}</span>

                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{
                        fontSize: "22px", fontWeight: 900, color: "white",
                        lineHeight: 1.1,
                      }}>
                        {r.Driver.familyName}
                      </span>
                      <span style={{ fontSize: "13px", color: "#94A3B8" }}>
                        {r.Driver.givenName}
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "12px", color, fontWeight: 700 }}>
                        {r.Constructor.name}
                      </span>
                      {gap && (
                        <span style={{ fontSize: "13px", color: "#64748B", fontFamily: "monospace" }}>
                          {gap}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              color: "#475569", fontSize: "18px",
            }}>
              레이스 결과 집계 중...
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div style={{
          padding: "14px 60px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={{ fontSize: "12px", color: "#475569" }}>
            한국 F1 팬 커뮤니티 · 텔레메트리 분석 · 리플레이
          </span>
          <span style={{ fontSize: "12px", color: "#E8002D", fontWeight: 700 }}>
            f1.324.ing
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
