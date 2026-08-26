#!/usr/bin/env python3
"""라운드/세션 리뷰 글을 커뮤니티에 게시한다.

사용법:
  python3 scripts/post-review.py <markdown-file> --round 1 --key fp1 [--base https://f1.324.ing]

- 제목: 마크다운 첫 `# ` 헤딩 (본문에서는 제거됨 — 커뮤니티가 title을 따로 렌더링)
- 슬러그: r{round}-{key}-review  (key: fp1|fp2|fp3|sq|sprint|qualifying|race|round)
- 인증: ADMIN_COOKIE_SECRET 환경변수 또는 .env.local
- 같은 슬러그 글이 이미 있으면 건너뜀 (중복 게시 방지). --update 시 기존 글을 PATCH.
"""
import argparse
import json
import os
import re
import sys
import urllib.request

VALID_KEYS = ["fp1", "fp2", "fp3", "sq", "sprint", "qualifying", "race", "round"]


def load_secret() -> str:
    secret = os.environ.get("ADMIN_COOKIE_SECRET")
    if secret:
        return secret
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env.local")
    with open(env_path) as f:
        for line in f:
            m = re.match(r"^ADMIN_COOKIE_SECRET=(.+)$", line.strip())
            if m:
                return m.group(1).strip().strip('"')
    sys.exit("ADMIN_COOKIE_SECRET not found (env or .env.local)")


def find_post_id(base: str, slug: str) -> str | None:
    # /community/{slug} 는 slug 미존재 시 404 — 인덱스 불필요한 존재 확인.
    # 존재하면 canonical 링크(https://.../community/{id})에서 문서 ID 추출.
    # (참고: /api/posts?round=N 은 복합 인덱스 부재로 500)
    try:
        with urllib.request.urlopen(f"{base}/community/{slug}", timeout=30) as r:
            html = r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise
    m = re.search(r'rel="canonical"\s+href="[^"]*/community/([^"/]+)"', html)
    if not m:
        sys.exit(f"post exists but canonical id not found for {slug}")
    return m.group(1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file")
    ap.add_argument("--round", type=int, required=True)
    ap.add_argument("--key", choices=VALID_KEYS, required=True)
    ap.add_argument("--base", default="https://f1.324.ing")
    ap.add_argument("--update", action="store_true", help="기존 글이 있으면 PATCH로 갱신")
    args = ap.parse_args()

    text = open(args.file, encoding="utf-8").read().strip()
    m = re.match(r"^#\s+(.+)\n+", text)
    if not m:
        sys.exit("markdown must start with a `# title` heading")
    title = m.group(1).strip()
    body = text[m.end():].strip()

    slug = f"r{args.round}-{args.key}-review"
    existing_id = find_post_id(args.base, slug)
    if existing_id and not args.update:
        print(f"skip: {slug} already exists (id {existing_id}); use --update to overwrite")
        return

    # 첫 본문 문단을 meta description으로
    first_para = next(
        (p.strip().replace("\n", " ") for p in body.split("\n\n")
         if p.strip() and not p.strip().startswith(("#", "|", ">", "-"))),
        "",
    )[:160]

    payload = {
        "category": "레이스 토론",
        "title": title,
        "body": body,
        "roundTag": args.round,
        "seo": {
            "metaTitle": title,
            "metaDescription": first_para,
            "primaryKeyword": None,
            "secondaryKeywords": None,
            "slug": slug,
        },
    }

    if existing_id:
        url, method = f"{args.base}/api/posts/{existing_id}", "PATCH"
    else:
        url, method = f"{args.base}/api/posts", "POST"

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={
            "Content-Type": "application/json",
            "Cookie": f"pitlane_admin={load_secret()}",
        },
        method=method,
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        res = json.loads(r.read())
    post_id = existing_id or res["id"]
    verb = "updated" if existing_id else "posted"
    print(f"{verb}: {slug} -> {args.base}/community/{post_id} (slug URL: {args.base}/community/{slug})")


if __name__ == "__main__":
    main()
