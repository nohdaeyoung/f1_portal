import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { exec } from "child_process";
import { calcRacePoints, calcTeamPoints, type RaceResultEntry } from "@/lib/f1-points";
import { drivers as allDrivers } from "@/data/f1-data";

const F1_DATA_PATH = join(process.cwd(), "src/data/f1-data.ts");
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID ?? "";

interface RequestBody {
  season: number;
  round: number;
  isSprint: boolean;
  qualifying: { pole: string };
  results: RaceResultEntry[];
  fastestLap: { driverId: string; time: string };
}

// ─── Parsers ──────────────────────────────────────────────────

function parseDriverStandings(content: string) {
  const block =
    content.match(
      /export const driverStandings: Standing\[\] = \[([\s\S]*?)\];/
    )?.[1] ?? "";
  const entries: { position: number; driverId: string; points: number; wins: number }[] = [];
  const re = /\{ position: (\d+), driverId: "([^"]+)", points: (\d+), wins: (\d+)\s*\}/g;
  let m;
  while ((m = re.exec(block)) !== null) {
    entries.push({
      position: parseInt(m[1]),
      driverId: m[2],
      points: parseInt(m[3]),
      wins: parseInt(m[4]),
    });
  }
  return entries;
}

function parseConstructorStandings(content: string) {
  const block =
    content.match(
      /export const constructorStandings: ConstructorStanding\[\] = \[([\s\S]*?)\];/
    )?.[1] ?? "";
  const entries: { position: number; teamId: string; points: number; wins: number }[] = [];
  const re = /\{ position: (\d+), teamId: "([^"]+)", points: (\d+), wins: (\d+)\s*\}/g;
  let m;
  while ((m = re.exec(block)) !== null) {
    entries.push({
      position: parseInt(m[1]),
      teamId: m[2],
      points: parseInt(m[3]),
      wins: parseInt(m[4]),
    });
  }
  return entries;
}

// ─── Writers ──────────────────────────────────────────────────

function replaceDriverStandings(
  content: string,
  standings: { position: number; driverId: string; points: number; wins: number }[]
): string {
  const lines = standings.map(
    (s) =>
      `  { position: ${s.position}, driverId: "${s.driverId}", points: ${s.points}, wins: ${s.wins} },`
  );
  const newBlock = `export const driverStandings: Standing[] = [\n${lines.join("\n")}\n];`;
  return content.replace(
    /export const driverStandings: Standing\[\] = \[[\s\S]*?\];/,
    newBlock
  );
}

function replaceConstructorStandings(
  content: string,
  standings: { position: number; teamId: string; points: number; wins: number }[]
): string {
  const lines = standings.map(
    (s) =>
      `  { position: ${s.position}, teamId: "${s.teamId}", points: ${s.points}, wins: ${s.wins} },`
  );
  const newBlock = `export const constructorStandings: ConstructorStanding[] = [\n${lines.join("\n")}\n];`;
  return content.replace(
    /export const constructorStandings: ConstructorStanding\[\] = \[[\s\S]*?\];/,
    newBlock
  );
}

/** Increment a numeric field inside a driver object (career stats) */
function updateDriverField(
  content: string,
  driverId: string,
  field: string,
  delta: number
): string {
  if (delta === 0) return content;
  // Driver objects: id: "X", firstName: ... on same line → unique pattern
  const re = new RegExp(
    `(id: "${driverId}", firstName:[\\s\\S]*?)(${field}: )(\\d+)`
  );
  return content.replace(re, (_, before, fieldStr, val) => {
    return `${before}${fieldStr}${parseInt(val) + delta}`;
  });
}

/** Increment a numeric field inside a team object (career stats) */
function updateTeamField(
  content: string,
  teamId: string,
  field: string,
  delta: number
): string {
  if (delta === 0) return content;
  // Team objects: id: "X",\n    name: on next line → unique pattern
  const re = new RegExp(
    `(id: "${teamId}",\\n    name:[\\s\\S]*?)(${field}: )(\\d+)`
  );
  return content.replace(re, (_, before, fieldStr, val) => {
    return `${before}${fieldStr}${parseInt(val) + delta}`;
  });
}

// ─── Telegram ─────────────────────────────────────────────────

async function sendTelegram(message: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) return;
  try {
    await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHANNEL_ID,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: false,
        }),
      }
    );
  } catch {
    /* silent */
  }
}

// ─── Handler ──────────────────────────────────────────────────

export async function POST(req: Request) {
  // CORS: 허용된 오리진에서만 요청 수락
  const origin = req.headers.get("origin");
  if (origin && !origin.includes("f1.324.ing") && !origin.includes("localhost")) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  // Auth
  const cookieStore = await cookies();
  if (!process.env.ADMIN_COOKIE_SECRET || cookieStore.get("pitlane_admin")?.value !== process.env.ADMIN_COOKIE_SECRET) {
    return NextResponse.json({ ok: false, error: "인증 실패" }, { status: 401 });
  }

  const body: RequestBody = await req.json();
  const { season, round, isSprint, qualifying, results, fastestLap } = body;

  // Validation
  if (!round || !results?.length) {
    return NextResponse.json(
      { ok: false, error: "필수 입력값이 누락되었습니다." },
      { status: 400 }
    );
  }

  const filledResults = results.filter((r) => r.driverId);
  const positions = filledResults.map((r) => r.position);
  const driverIds = filledResults.map((r) => r.driverId);

  if (new Set(positions).size !== positions.length) {
    return NextResponse.json(
      { ok: false, error: "중복된 순위가 있습니다." },
      { status: 400 }
    );
  }
  if (new Set(driverIds).size !== driverIds.length) {
    return NextResponse.json(
      { ok: false, error: "중복된 드라이버가 있습니다." },
      { status: 400 }
    );
  }

  // 유효하지 않은 드라이버 ID 차단
  const validDriverIds = new Set(allDrivers.map((d) => d.id));
  const invalidDriver = driverIds.find((id) => !validDriverIds.has(id));
  if (invalidDriver) {
    return NextResponse.json(
      { ok: false, error: `유효하지 않은 드라이버 ID: ${invalidDriver}` },
      { status: 400 }
    );
  }

  // Read f1-data.ts
  let content: string;
  try {
    content = readFileSync(F1_DATA_PATH, "utf-8");
  } catch {
    return NextResponse.json(
      { ok: false, error: "f1-data.ts 읽기 실패" },
      { status: 500 }
    );
  }

  // Check if already completed (메인 레이스만 completed 상태 체크)
  if (!isSprint) {
    const alreadyCompleted = new RegExp(
      `round: ${round},[^\\n]*status: "completed"`
    ).test(content);
    if (alreadyCompleted) {
      return NextResponse.json(
        { ok: false, error: `Round ${round}는 이미 completed 상태입니다.` },
        { status: 400 }
      );
    }
  }

  // 스프린트 중복 입력 방지
  if (isSprint) {
    const sprintFlag = `/tmp/f1-${season}-round${round}-sprint-updated.flag`;
    try {
      const { existsSync } = await import("fs");
      if (existsSync(sprintFlag)) {
        return NextResponse.json(
          { ok: false, error: `Round ${round} 스프린트는 이미 입력되었습니다.` },
          { status: 400 }
        );
      }
    } catch { /* ignore */ }
  }

  // ── Points calculation ──
  const driverPoints = calcRacePoints(filledResults, fastestLap.driverId, isSprint);
  const teamPoints = calcTeamPoints(
    driverPoints,
    allDrivers.map((d) => ({ id: d.id, teamId: d.teamId }))
  );

  // P1 driver full name
  const p1Result = filledResults.find((r) => r.position === 1);
  if (!p1Result) {
    return NextResponse.json(
      { ok: false, error: "1위 드라이버가 없습니다." },
      { status: 400 }
    );
  }
  const p1Driver = allDrivers.find((d) => d.id === p1Result.driverId);
  const winnerName = p1Driver
    ? `${p1Driver.firstName} ${p1Driver.lastName}`
    : p1Result.driverId;

  // ── Parse current standings ──
  const currentDriverStandings = parseDriverStandings(content);
  const currentConstructorStandings = parseConstructorStandings(content);

  // ── New driver standings ──
  // Sprint: points only; Main race: points + wins
  const updatedDriverStandings = currentDriverStandings.map((s) => ({
    ...s,
    points: s.points + (driverPoints[s.driverId] ?? 0),
    wins: isSprint
      ? s.wins
      : s.wins +
        (filledResults.find((r) => r.driverId === s.driverId)?.position === 1 ? 1 : 0),
  }));
  for (const [driverId, pts] of Object.entries(driverPoints)) {
    if (!updatedDriverStandings.find((s) => s.driverId === driverId)) {
      updatedDriverStandings.push({ position: 99, driverId, points: pts, wins: 0 });
    }
  }
  updatedDriverStandings.sort((a, b) => b.points - a.points);
  updatedDriverStandings.forEach((s, i) => { s.position = i + 1; });

  // ── New constructor standings ──
  // Sprint: points only; Main race: points + wins
  const p1TeamId = allDrivers.find((d) => d.id === p1Result.driverId)?.teamId ?? "";
  const updatedConstructorStandings = currentConstructorStandings.map((s) => ({
    ...s,
    points: s.points + (teamPoints[s.teamId] ?? 0),
    wins: isSprint ? s.wins : s.wins + (s.teamId === p1TeamId ? 1 : 0),
  }));
  updatedConstructorStandings.sort((a, b) => b.points - a.points);
  updatedConstructorStandings.forEach((s, i) => { s.position = i + 1; });

  // ── Apply changes to content ──

  // 1. driverStandings block (always)
  content = replaceDriverStandings(content, updatedDriverStandings);

  // 2. constructorStandings block (always)
  content = replaceConstructorStandings(content, updatedConstructorStandings);

  if (!isSprint) {
    // 3. Calendar: status → completed + winner (main race only)
    content = content.replace(
      new RegExp(`(\\{ round: ${round},[^\\n]*?status: ")[^"]*(")`),
      `$1completed$2`
    );
    content = content.replace(
      new RegExp(
        `(\\{ round: ${round},[^\\n]*?status: "completed")(, winner: "[^"]*")? \\}`
      ),
      `$1, winner: "${winnerName}" }`
    );

    // 4. Driver career stats — full (wins, podiums, poles, points)
    for (const r of filledResults) {
      const isWin = r.position === 1;
      const isPodium = r.position <= 3 && r.status !== "DSQ" && r.status !== "DNS";
      const isPole = r.driverId === qualifying.pole;
      const dPts = driverPoints[r.driverId] ?? 0;

      if (isWin) content = updateDriverField(content, r.driverId, "wins", 1);
      if (isPodium) content = updateDriverField(content, r.driverId, "podiums", 1);
      if (isPole) content = updateDriverField(content, r.driverId, "poles", 1);
      if (dPts > 0) content = updateDriverField(content, r.driverId, "points", dPts);
    }

    // 5. Team career stats — full (wins, podiums, poles)
    if (p1TeamId) content = updateTeamField(content, p1TeamId, "wins", 1);

    const podiumsByTeam: Record<string, number> = {};
    for (const r of filledResults) {
      if (r.position <= 3 && r.status !== "DSQ" && r.status !== "DNS") {
        const teamId = allDrivers.find((d) => d.id === r.driverId)?.teamId;
        if (teamId) podiumsByTeam[teamId] = (podiumsByTeam[teamId] ?? 0) + 1;
      }
    }
    for (const [teamId, count] of Object.entries(podiumsByTeam)) {
      content = updateTeamField(content, teamId, "podiums", count);
    }
    if (qualifying.pole) {
      const poleTeamId = allDrivers.find((d) => d.id === qualifying.pole)?.teamId;
      if (poleTeamId) content = updateTeamField(content, poleTeamId, "poles", 1);
    }
  } else {
    // 4s. Driver career stats — sprint only updates points (wins/podiums/poles are main race only)
    for (const r of filledResults) {
      const dPts = driverPoints[r.driverId] ?? 0;
      if (dPts > 0) content = updateDriverField(content, r.driverId, "points", dPts);
    }
  }

  // ── Write file ──
  try {
    writeFileSync(F1_DATA_PATH, content, "utf-8");
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: `f1-data.ts 저장 실패: ${e}` },
      { status: 500 }
    );
  }

  // ── Flag file ──
  // Sprint: sprint-specific flag; Main race: standard flag (stops auto-script)
  const flagFile = isSprint
    ? `/tmp/f1-${season}-round${round}-sprint-updated.flag`
    : `/tmp/f1-${season}-round${round}-updated.flag`;
  try {
    writeFileSync(flagFile, `updated by admin: ${winnerName}`);
  } catch { /* ignore */ }

  // ── Telegram notification (fire-and-forget) ──
  const medals = ["🥇", "🥈", "🥉"];
  const top3 = filledResults
    .filter((r) => r.position <= 3)
    .sort((a, b) => a.position - b.position);
  let top3Lines = "";
  for (const r of top3) {
    const d = allDrivers.find((d) => d.id === r.driverId);
    const name = d ? `${d.firstName} ${d.lastName}` : r.driverId;
    top3Lines += `${medals[r.position - 1]} ${name} +${driverPoints[r.driverId] ?? 0}pts\n`;
  }

  const raceType = isSprint ? "스프린트" : "레이스";
  let msg = `🏁 <b>2026 Round ${round} ${raceType} — 수동 업데이트 완료</b>\n\n${top3Lines}\n`;
  if (!isSprint && fastestLap.driverId) {
    const flDriver = allDrivers.find((d) => d.id === fastestLap.driverId);
    const flName = flDriver ? `${flDriver.firstName} ${flDriver.lastName}` : fastestLap.driverId;
    msg += `⚡ 패스티스트랩: ${flName} (${fastestLap.time})\n\n`;
  }
  msg += `📊 스탠딩 · 드라이버 · 팀 통계 업데이트 완료\n🌐 <a href="https://f1.324.ing/season">f1.324.ing/season</a>`;

  sendTelegram(msg).catch(() => {});

  // ── Async build & deploy ──
  const cwd = process.cwd();
  exec(`npm run build && npx vercel --prod --yes`, { cwd }, (err) => {
    if (err) {
      sendTelegram(
        `❌ Round ${round} ${raceType} 빌드/배포 실패\n${err.message.slice(0, 200)}`
      ).catch(() => {});
    }
  });

  const label = isSprint ? `Round ${round} 스프린트` : `Round ${round} 메인 레이스`;
  return NextResponse.json({
    ok: true,
    message: `${label} 업데이트 완료. 빌드를 시작합니다...`,
  });
}
