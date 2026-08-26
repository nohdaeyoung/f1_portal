#!/usr/bin/env python3
"""라운드/세션 리뷰 글을 커뮤니티에 게시한다.

사용법:
  python3 scripts/post-review.py <markdown-file> --round 1 --key fp1 [--base https://f1.324.ing]

- 제목: 마크다운 첫 `# ` 헤딩 (본문에서는 제거됨 — 커뮤니티가 title을 따로 렌더링)
- 슬러그: r{round}-{key}-review  (key: fp1|fp2|fp3|sq|sprint|qualifying|race|round)
- 인증: ADMIN_COOKIE_SECRET 환경변수 또는 .env.local
- 같은 슬러그 글이 이미 있으면 건너뜀 (중복 게시 방지)
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


def slug_exists(base: str, round_no: int, slug: str) -> bool:
    # /community/{slug} 는 slug 미존재 시 404 — 인덱스 불필요한 존재 확인
    # (참고: /api/posts?round=N 은 복합 인덱스 부재로 500)
    try:
        with urllib.request.urlopen(f"{base}/community/{slug}", timeout=30) as r:
            return r.status == 200
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return False
        raise


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file")
    ap.add_argument("--round", type=int, required=True)
    ap.add_argument("--key", choices=VALID_KEYS, required=True)
    ap.add_argument("--base", default="https://f1.324.ing")
    args = ap.parse_args()

    text = open(args.file, encoding="utf-8").read().strip()
    m = re.match(r"^#\s+(.+)\n+", text)
    if not m:
        sys.exit("markdown must start with a `# title` heading")
    title = m.group(1).strip()
    body = text[m.end():].strip()

    slug = f"r{args.round}-{args.key}-review"
    if slug_exists(args.base, args.round, slug):
        print(f"skip: {slug} already exists")
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

    req = urllib.request.Request(
        f"{args.base}/api/posts",
        data=json.dumps(payload).encode(),
        headers={
            "Content-Type": "application/json",
            "Cookie": f"pitlane_admin={load_secret()}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        res = json.loads(r.read())
    print(f"posted: {slug} -> {args.base}/community/{res['id']} (slug URL: {args.base}/community/{slug})")


if __name__ == "__main__":
    main()
