"""
로컬 디스크 캐시의 텔레메트리 파일을 Cloudflare R2에 업로드하는 스크립트.

로컬 경로: /tmp/f1-diskcache/telemetry/{year}/{gp}/{session}/{driver}/{fps}fps.json.gz
R2 키:     telemetry/{year}/{gp}/{session}/{driver}/{fps}fps.json.gz
"""

import os
import sys
import boto3
from pathlib import Path
from botocore.exceptions import ClientError

# ── R2 설정 ──────────────────────────────────────────────────────────────────
R2_ACCOUNT_ID  = "0b1b9a73d21cc9095a9b3d5618cc359d"
R2_ACCESS_KEY  = "6d1ad0c9c7f616f9702aae0edfe4baf2"
R2_SECRET_KEY  = "fab81fe49fc1c7df29fc0aeac97aea4f2810cdd4174d7f21e7163b8fa19ecbad"
R2_BUCKET      = "f1-cashe"
LOCAL_ROOT     = Path("/tmp/f1-diskcache/telemetry")

r2 = boto3.client(
    "s3",
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    region_name="auto",
)

def r2_key(local_path: Path) -> str:
    """로컬 경로 → R2 키 변환"""
    rel = local_path.relative_to(LOCAL_ROOT)
    return f"telemetry/{rel}"

def already_in_r2(key: str) -> bool:
    try:
        r2.head_object(Bucket=R2_BUCKET, Key=key)
        return True
    except ClientError as e:
        if e.response["Error"]["Code"] == "404":
            return False
        raise

def upload(local_path: Path, key: str) -> None:
    r2.upload_file(
        str(local_path), R2_BUCKET, key,
        ExtraArgs={"ContentType": "application/json", "ContentEncoding": "gzip"},
    )

# ── 업로드 ────────────────────────────────────────────────────────────────────
files = sorted(LOCAL_ROOT.rglob("*.json.gz"))
total = len(files)
print(f"총 {total}개 파일 발견")

skipped = uploaded = failed = 0

for i, f in enumerate(files, 1):
    key = r2_key(f)
    try:
        if already_in_r2(key):
            skipped += 1
            if i % 100 == 0:
                print(f"[{i}/{total}] {skipped} skip / {uploaded} up / {failed} fail")
            continue
        upload(f, key)
        uploaded += 1
        print(f"[{i}/{total}] ✅ {key} ({f.stat().st_size // 1024}KB)")
    except Exception as e:
        failed += 1
        print(f"[{i}/{total}] ❌ {key}: {e}", file=sys.stderr)

print(f"\n완료: 업로드 {uploaded} / 스킵(이미있음) {skipped} / 실패 {failed} / 전체 {total}")
