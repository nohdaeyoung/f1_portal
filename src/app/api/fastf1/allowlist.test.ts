import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * 프록시 허용목록이 실제 사용처와 어긋나지 않는지 검사한다.
 *
 * 화면에서 새 엔드포인트를 쓰기 시작했는데 허용목록에 안 넣으면 404 가 나는데,
 * 브라우저 네트워크 탭을 열기 전엔 원인이 안 보인다. 그 상황을 테스트가 먼저 잡는다.
 */

const SRC = path.resolve(process.cwd(), "src");
const ROUTE = path.join(SRC, "app/api/fastf1/[...path]/route.ts");

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

function allowedEndpoints(): Set<string> {
  const src = fs.readFileSync(ROUTE, "utf8");
  const block = src.match(/const ALLOWED_ENDPOINTS = new Set\(\[([\s\S]*?)\]\)/);
  if (!block) throw new Error("ALLOWED_ENDPOINTS 를 찾지 못했다");
  return new Set([...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]));
}

/** 클라이언트 코드가 프록시로 부르는 엔드포인트를 수집한다. */
function usedEndpoints(): Map<string, string[]> {
  const used = new Map<string, string[]>();
  const add = (ep: string, file: string) => {
    const rel = path.relative(SRC, file);
    used.set(ep, [...(used.get(ep) ?? []), rel]);
  };
  for (const file of walk(SRC)) {
    if (file.includes(path.join("api", "fastf1"))) continue; // 프록시 자신과 이 테스트 제외
    const t = fs.readFileSync(file, "utf8");
    for (const m of t.matchAll(/["'`]\/api\/fastf1\/([a-z0-9\-_]+)/gi)) add("/" + m[1], file);
    if (/const base = (?:process\.env\.NEXT_PUBLIC_FASTF1_API_URL \?\? )?["']\/api\/fastf1["']/.test(t)) {
      for (const m of t.matchAll(/\$\{base\}\/([a-z0-9\-_]+)/gi)) add("/" + m[1], file);
    }
  }
  return used;
}

describe("fastf1 프록시 허용목록", () => {
  it("코드가 부르는 엔드포인트는 전부 허용목록에 있다", () => {
    const allowed = allowedEndpoints();
    const missing = [...usedEndpoints().entries()]
      .filter(([ep]) => !allowed.has(ep))
      .map(([ep, files]) => `${ep} (${files.join(", ")})`);

    expect(missing, `허용목록에 없는 엔드포인트:\n${missing.join("\n")}`).toEqual([]);
  });

  it("관리·크론 경로는 허용하지 않는다", () => {
    const allowed = allowedEndpoints();
    for (const forbidden of ["/admin/cache-upload", "/cron/generate-replay", "/health"]) {
      expect(allowed.has(forbidden)).toBe(false);
    }
  });

  it("허용목록이 비어 있지 않다", () => {
    expect(allowedEndpoints().size).toBeGreaterThan(5);
  });
});
