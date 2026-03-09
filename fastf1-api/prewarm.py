"""
FastF1 데이터 프리워밍 스크립트

로컬 FastF1 서버에서 데이터를 생성한 후, Railway 서비스의 디스크 캐시에 업로드합니다.

사용법:
    # 1단계: 로컬 서버 실행 (fastf1-api 디렉토리에서)
    #   DISK_CACHE_DIR=/tmp/f1-diskcache uvicorn main:app --port 8001
    #
    # 2단계: 프리워밍 실행
    python prewarm.py                                    # 전체 실행 (2018~2025)
    python prewarm.py --year 2024                        # 특정 연도만
    python prewarm.py --year 2024 --gp Monaco            # 특정 GP만
    python prewarm.py --skip-telemetry                   # 리플레이만
    python prewarm.py --upload-to https://railway.url \\
                      --upload-secret SECRET              # Railway에 자동 업로드
"""

import requests
import time
import os
import gzip
import json
import argparse

RAILWAY_URL = "https://f1-production-f075.up.railway.app"
LOCAL_URL = "http://localhost:8001"
YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]
FPS = 5
POLL_INTERVAL = 10   # 202 응답 시 재시도 간격 (초)
POLL_TIMEOUT = 600   # 최대 대기 시간 (초)
REQ_TIMEOUT = 120    # 단일 요청 타임아웃 (초)

BASE_URL = LOCAL_URL   # main() 에서 오버라이드 가능
UPLOAD_URL = None      # Railway HTTP 업로드 타겟 (옵션)
UPLOAD_SECRET = ""
_r2 = None
R2_BUCKET = ""


def log(msg: str):
    print(msg, flush=True)


def _init_r2(account_id: str, access_key: str, secret_key: str, bucket: str):
    global _r2, R2_BUCKET
    try:
        import boto3
        _r2 = boto3.client(
            "s3",
            endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name="auto",
        )
        R2_BUCKET = bucket
        log(f"[r2] 연결됨: bucket={bucket}")
    except Exception as e:
        log(f"[r2] 초기화 실패: {e}")


def _r2_upload(local_path: str, r2_key: str):
    if _r2 is None:
        return
    try:
        with open(local_path, "rb") as f:
            data = f.read()
        _r2.put_object(Bucket=R2_BUCKET, Key=r2_key, Body=data, ContentType="application/gzip")
        log(f"      ↑ R2 업로드: {r2_key} ({len(data)//1024}KB)")
    except Exception as e:
        log(f"      ↑ R2 업로드 실패: {e}")


def _r2_key_replay(year: int, gp: str, fps: int) -> str:
    safe = gp.replace(" ", "_").replace("/", "-")
    return f"replay/{year}/{safe}/R/{fps}fps.json.gz"


def _r2_key_telemetry(year: int, gp: str, driver: str, fps: int) -> str:
    safe = gp.replace(" ", "_").replace("/", "-")
    return f"telemetry/{year}/{safe}/R/{driver}/{fps}fps.json.gz"


def safe_gp(gp: str) -> str:
    return gp.replace(" ", "_").replace("/", "-")


def disk_replay_path(local_cache: str, year: int, gp: str, fps: int) -> str:
    return os.path.join(local_cache, "replay", str(year), safe_gp(gp), "R", f"{fps}fps.json.gz")


def disk_telemetry_path(local_cache: str, year: int, gp: str, driver: str, fps: int) -> str:
    return os.path.join(local_cache, "telemetry", str(year), safe_gp(gp), "R", driver, f"{fps}fps.json.gz")


def upload_to_railway(local_path: str, rel_path: str):
    """로컬 gzip 파일을 Railway 캐시 업로드 엔드포인트로 전송."""
    if not UPLOAD_URL or not UPLOAD_SECRET:
        return
    try:
        with open(local_path, "rb") as f:
            data = f.read()
        resp = requests.post(
            f"{UPLOAD_URL}/admin/cache-upload",
            params={"path": rel_path, "secret": UPLOAD_SECRET},
            data=data,
            headers={"Content-Type": "application/octet-stream"},
            timeout=60,
        )
        if resp.status_code == 200:
            log(f"      ↑ Railway 업로드 완료: {rel_path}")
        else:
            log(f"      ↑ Railway 업로드 실패 {resp.status_code}: {rel_path}")
    except Exception as e:
        log(f"      ↑ Railway 업로드 오류: {e}")


def get_schedule(year: int) -> list[dict]:
    """해당 연도의 레이스 일정 반환."""
    try:
        resp = requests.get(f"{BASE_URL}/schedule", params={"year": year}, timeout=REQ_TIMEOUT)
        if resp.status_code != 200:
            log(f"  [!] 일정 조회 실패 ({resp.status_code}): {year}")
            return []
        return [e for e in resp.json() if e.get("RoundNumber", 0) > 0]
    except Exception as e:
        log(f"  [!] 일정 조회 오류: {e}")
        return []


def prewarm_replay(year: int, gp: str, local_cache: str) -> list[str]:
    """replay-frames 요청 후 완료될 때까지 폴링. 반환값: 드라이버 목록."""
    url = f"{BASE_URL}/replay-frames"
    params = {"year": year, "gp": gp, "session": "R", "fps": FPS}
    start = time.time()

    # 이미 로컬 캐시에 있으면 스킵
    path = disk_replay_path(local_cache, year, gp, FPS)
    if os.path.exists(path):
        log(f"    ⚡ 캐시 히트 (로컬): {gp} {year}")
        # 드라이버 목록을 로컬 파일에서 추출
        import gzip, json
        try:
            with open(path, "rb") as f:
                d = json.loads(gzip.decompress(f.read()))
            return d.get("drivers", [])
        except Exception:
            pass

    while True:
        try:
            resp = requests.get(url, params=params, timeout=REQ_TIMEOUT)
        except Exception as e:
            log(f"    [!] 요청 오류: {e}")
            return []

        if resp.status_code == 200:
            data = resp.json()
            drivers = data.get("drivers", [])
            frames = data.get("total_frames", 0)
            log(f"    ✅ 리플레이 완료: {frames}프레임, {len(drivers)}명")
            if os.path.exists(path):
                rel = os.path.relpath(path, local_cache)
                upload_to_railway(path, rel)
                _r2_upload(path, _r2_key_replay(year, gp, FPS))
            return drivers

        if resp.status_code == 202:
            elapsed = time.time() - start
            if elapsed > POLL_TIMEOUT:
                log(f"    ⏰ 타임아웃 ({POLL_TIMEOUT}s 초과)")
                return []
            log(f"    ⏳ 처리 중... ({elapsed:.0f}s)")
            time.sleep(POLL_INTERVAL)
            continue

        log(f"    ❌ 오류 {resp.status_code}: {resp.text[:100]}")
        return []


def prewarm_telemetry(year: int, gp: str, drivers: list[str], local_cache: str):
    """각 드라이버의 텔레메트리 데이터를 순차 요청."""
    url = f"{BASE_URL}/driver-telemetry"
    for driver in drivers:
        path = disk_telemetry_path(local_cache, year, gp, driver, FPS)

        if os.path.exists(path):
            log(f"    ⚡ 텔레메트리 캐시 히트 (로컬): {driver}")
            if UPLOAD_URL:
                rel = os.path.relpath(path, local_cache)
                upload_to_railway(path, rel)
            _r2_upload(path, _r2_key_telemetry(year, gp, driver, FPS))
            continue

        params = {"year": year, "gp": gp, "session": "R", "driver": driver, "fps": FPS}
        try:
            resp = requests.get(url, params=params, timeout=REQ_TIMEOUT)
            if resp.status_code == 200:
                frames = resp.json().get("total_frames", 0)
                log(f"    ✅ 텔레메트리 {driver}: {frames}프레임")
                if os.path.exists(path):
                    rel = os.path.relpath(path, local_cache)
                    upload_to_railway(path, rel)
                    _r2_upload(path, _r2_key_telemetry(year, gp, driver, FPS))
            else:
                log(f"    ❌ 텔레메트리 {driver}: {resp.status_code}")
        except Exception as e:
            log(f"    [!] 텔레메트리 {driver} 오류: {e}")


def main():
    global BASE_URL, UPLOAD_URL, UPLOAD_SECRET

    parser = argparse.ArgumentParser(description="FastF1 데이터 프리워밍")
    parser.add_argument("--year", type=int, help="특정 연도만 처리")
    parser.add_argument("--gp", type=str, help="특정 GP 이름 필터 (부분 일치)")
    parser.add_argument("--skip-telemetry", action="store_true", help="텔레메트리 프리워밍 건너뜀")
    parser.add_argument(
        "--base-url", type=str, default=LOCAL_URL,
        help=f"FastF1 서비스 URL (기본값: {LOCAL_URL})",
    )
    parser.add_argument(
        "--local-cache", type=str, default="/tmp/f1-diskcache",
        help="로컬 디스크 캐시 경로 (기본값: /tmp/f1-diskcache)",
    )
    parser.add_argument("--upload-to", type=str, default="", help="Railway HTTP 업로드 URL")
    parser.add_argument("--upload-secret", type=str, default="", help="CACHE_UPLOAD_SECRET")
    parser.add_argument("--r2-account-id", type=str, default=os.environ.get("R2_ACCOUNT_ID", ""), help="Cloudflare Account ID")
    parser.add_argument("--r2-access-key", type=str, default=os.environ.get("R2_ACCESS_KEY_ID", ""), help="R2 Access Key ID")
    parser.add_argument("--r2-secret-key", type=str, default=os.environ.get("R2_SECRET_ACCESS_KEY", ""), help="R2 Secret Access Key")
    parser.add_argument("--r2-bucket", type=str, default=os.environ.get("R2_BUCKET", "f1-cache"), help="R2 버킷명")
    args = parser.parse_args()

    BASE_URL = args.base_url.rstrip("/")
    UPLOAD_URL = args.upload_to.rstrip("/") if args.upload_to else None
    UPLOAD_SECRET = args.upload_secret

    if args.r2_account_id and args.r2_access_key and args.r2_secret_key:
        _init_r2(args.r2_account_id, args.r2_access_key, args.r2_secret_key, args.r2_bucket)

    local_cache = args.local_cache
    os.makedirs(local_cache, exist_ok=True)

    years = [args.year] if args.year else YEARS

    log(f"=== FastF1 프리워밍 시작 ===")
    log(f"대상 연도: {years}")
    log(f"소스 서버: {BASE_URL}")
    log(f"로컬 캐시: {local_cache}")
    log(f"Railway 업로드: {UPLOAD_URL or '없음'}")
    log(f"텔레메트리: {'건너뜀' if args.skip_telemetry else '포함'}")
    log("")

    total_gps = 0
    total_ok = 0

    for year in years:
        log(f"[{year}] 일정 조회 중...")
        schedule = get_schedule(year)
        if not schedule:
            log(f"[{year}] 일정 없음, 건너뜀\n")
            continue

        gps = [(e["RoundNumber"], e["EventName"]) for e in schedule]
        if args.gp:
            gps = [(r, n) for r, n in gps if args.gp.lower() in n.lower()]

        log(f"[{year}] {len(gps)}개 GP 처리 예정\n")

        for round_num, gp_name in gps:
            total_gps += 1
            log(f"[{year}] Round {round_num}: {gp_name}")

            drivers = prewarm_replay(year, gp_name, local_cache)
            if not drivers:
                log(f"    ⚠️  리플레이 실패, 건너뜀\n")
                continue

            if not args.skip_telemetry:
                log(f"    → 텔레메트리 프리워밍 ({len(drivers)}명)...")
                prewarm_telemetry(year, gp_name, drivers, local_cache)

            total_ok += 1
            log("")

    log(f"=== 완료: {total_ok}/{total_gps} GP 처리 ===")


if __name__ == "__main__":
    main()
