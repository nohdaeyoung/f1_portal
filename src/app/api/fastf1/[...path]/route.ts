import { NextRequest, NextResponse } from "next/server";
import { gunzipSync } from "zlib";
import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FF1_BASE = process.env.FASTF1_API_URL ?? "http://localhost:8000";

// ─── R2 설정 ──────────────────────────────────────────────────────────────────
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? "";
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID ?? "";
const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY ?? "";
const R2_BUCKET = process.env.R2_BUCKET ?? "f1-cashe";

let _r2: S3Client | null = null;
function getR2(): S3Client | null {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY || !R2_SECRET_KEY) return null;
  if (!_r2) {
    _r2 = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET_KEY },
    });
  }
  return _r2;
}

/**
 * R2 presigned URL → fetch → gzip 바이트 그대로 Content-Encoding: gzip으로 반환.
 * 브라우저/fetch가 자동 압축해제하므로 r.json()이 정상 동작.
 */
async function r2GzipResponse(key: string, cacheControl: string): Promise<Response | null> {
  const r2 = getR2();
  if (!r2) return null;
  try {
    const cmd = new GetObjectCommand({ Bucket: R2_BUCKET, Key: key });
    const presignedUrl = await getSignedUrl(r2, cmd, { expiresIn: 60 });
    const res = await fetch(presignedUrl, { cache: "no-store" });
    if (!res.ok) return null;
    const bytes = await res.arrayBuffer();
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Encoding": "gzip",
        "Cache-Control": cacheControl,
        "X-Cache": "R2-HIT",
      },
    });
  } catch {
    return null;
  }
}

function replayR2Key(year: string, gp: string, session: string, fps: string) {
  const safe = gp.replace(/ /g, "_").replace(/\//g, "-");
  return `replay/${year}/${safe}/${session}/${fps}fps.json.gz`;
}

function telemetryR2Key(year: string, gp: string, session: string, driver: string, fps: string) {
  const safe = gp.replace(/ /g, "_").replace(/\//g, "-");
  return `telemetry/${year}/${safe}/${session}/${driver}/${fps}fps.json.gz`;
}

// ─── Response helper (Railway에서 온 응답용) ──────────────────────────────────
async function parseResponse(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("gzip") || contentType.includes("octet-stream")) {
    const buf = Buffer.from(await res.arrayBuffer());
    return JSON.parse(gunzipSync(buf).toString("utf-8"));
  }
  return res.json();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = "/" + path.join("/");
  const search = req.nextUrl.searchParams;

  // ── 1. R2 직접 조회: replay-frames ─────────────────────────────────────────
  if (endpoint === "/replay-frames") {
    const year = search.get("year") ?? "";
    const gp = search.get("gp") ?? "";
    const session = search.get("session") ?? "R";
    const fps = search.get("fps") ?? "5";
    const key = replayR2Key(year, gp, session, fps);
    const r2res = await r2GzipResponse(key, "no-store");
    if (r2res) return r2res;
  }

  // ── 2. R2 직접 조회: driver-telemetry ──────────────────────────────────────
  if (endpoint === "/driver-telemetry") {
    const year = search.get("year") ?? "";
    const gp = search.get("gp") ?? "";
    const session = search.get("session") ?? "R";
    const driver = search.get("driver") ?? "";
    const fps = search.get("fps") ?? "5";
    if (driver) {
      const key = telemetryR2Key(year, gp, session, driver, fps);
      const r2res = await r2GzipResponse(key, "public, s-maxage=3600");
      if (r2res) return r2res;
    }
  }

  // ── 3. Railway 프록시 (R2 미스 또는 기타 엔드포인트) ───────────────────────
  const searchStr = search.toString();
  const url = `${FF1_BASE}${endpoint}${searchStr ? `?${searchStr}` : ""}`;

  try {
    const res = await fetch(url, { cache: "no-store" });

    if (res.status === 202) {
      const data = await res.json();
      return NextResponse.json(data, { status: 202 });
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `FastF1 service error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await parseResponse(res);
    const isReplay = endpoint.includes("replay-frames");
    return NextResponse.json(data, {
      headers: isReplay
        ? { "Cache-Control": "no-store" }
        : { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
    });
  } catch {
    return NextResponse.json(
      { error: "FastF1 service unavailable" },
      { status: 503 }
    );
  }
}
