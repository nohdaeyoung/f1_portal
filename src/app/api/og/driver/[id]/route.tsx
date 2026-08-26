import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";
import { getDriver } from "@/data/f1-data";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const driver = getDriver(id);

  const name = driver ? `${driver.firstName} ${driver.lastName}` : "Driver";
  const number = driver?.number ?? "";
  const team = driver?.team ?? "Formula 1";
  const color = driver?.teamColor ?? "#E8002D";
  const flag = driver?.flag ?? "🏁";
  const championships = driver?.championships ?? 0;
  const wins = driver?.wins ?? 0;
  const poles = driver?.poles ?? 0;
  const podiums = driver?.podiums ?? 0;

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
        {/* Top color bar */}
        <div style={{ width: "100%", height: "4px", background: color, display: "flex" }} />

        {/* Background number watermark */}
        <div style={{
          position: "absolute",
          right: "-20px",
          top: "40px",
          fontSize: "320px",
          fontWeight: 900,
          color: color,
          opacity: 0.04,
          lineHeight: 1,
          display: "flex",
          userSelect: "none",
        }}>
          {number}
        </div>

        {/* Background circle glow */}
        <div style={{
          position: "absolute",
          top: "-80px",
          right: "-80px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
          display: "flex",
        }} />

        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "40px 60px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "40px" }}>
            <div style={{
              background: "#E8002D",
              borderRadius: "8px",
              padding: "6px 14px",
              fontSize: "13px",
              fontWeight: 900,
              color: "white",
              letterSpacing: "2px",
              display: "flex",
            }}>
              F1
            </div>
            <span style={{ fontSize: "13px", color: "#475569" }}>f1.324.ing</span>
          </div>

          {/* Driver info */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "32px", flex: 1 }}>

            {/* Left: name + team */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              {/* Flag + number */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
                <span style={{ fontSize: "52px", lineHeight: 1 }}>{flag}</span>
                <div style={{
                  background: `${color}20`,
                  border: `2px solid ${color}60`,
                  borderRadius: "10px",
                  padding: "4px 14px",
                  fontSize: "22px",
                  fontWeight: 900,
                  color: color,
                  display: "flex",
                }}>
                  #{number}
                </div>
              </div>

              {/* Name */}
              <div style={{ display: "flex", flexDirection: "column", marginBottom: "16px" }}>
                <span style={{ fontSize: "24px", color: "#94A3B8", fontWeight: 600 }}>
                  {driver?.firstName ?? ""}
                </span>
                <span style={{ fontSize: "64px", fontWeight: 900, color: "white", lineHeight: 1 }}>
                  {driver?.lastName ?? name}
                </span>
              </div>

              {/* Team */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "4px", height: "20px", background: color, borderRadius: "2px", display: "flex" }} />
                <span style={{ fontSize: "20px", color, fontWeight: 700 }}>{team}</span>
              </div>

              {/* Championships badge */}
              {championships > 0 && (
                <div style={{ display: "flex", marginTop: "20px" }}>
                  <div style={{
                    background: "rgba(252,211,77,0.12)",
                    border: "1px solid rgba(252,211,77,0.3)",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}>
                    <span style={{ fontSize: "20px" }}>🏆</span>
                    <span style={{ fontSize: "16px", color: "#FCD34D", fontWeight: 700 }}>
                      {championships}× 월드 챔피언
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: stats */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: "220px" }}>
              {[
                { label: "우승", value: wins },
                { label: "폴 포지션", value: poles },
                { label: "포디움", value: podiums },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "12px",
                    padding: "16px 24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <span style={{ fontSize: "36px", fontWeight: 900, color, lineHeight: 1 }}>
                    {s.value}
                  </span>
                  <span style={{ fontSize: "12px", color: "#64748B", letterSpacing: "1px" }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
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
    { width: 1200, height: 630 }
  );
}
