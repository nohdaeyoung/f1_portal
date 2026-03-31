"""
FastF1 API Server
Serves F1 telemetry and session data to the Next.js frontend.
"""

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, RedirectResponse
from typing import Optional
from concurrent.futures import ThreadPoolExecutor
import asyncio
import fastf1
import pandas as pd
import numpy as np
import os
import logging
import gzip
import json
import base64

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastF1 cache directory (telemetry download cache)
CACHE_DIR = os.path.join(os.path.dirname(__file__), ".cache")
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)

# ─── Disk Cache (Railway Volume / local) ──────────────────────────────────────
# Replay and telemetry frames are persisted to DISK_CACHE_DIR (gzip JSON).
# Default: /data (Railway Volume mount path). Falls back to local .diskcache/.
DISK_CACHE_DIR = os.environ.get("DISK_CACHE_DIR", "/data")
try:
    os.makedirs(DISK_CACHE_DIR, exist_ok=True)
    # Verify write permission
    _test = os.path.join(DISK_CACHE_DIR, ".writetest")
    open(_test, "w").close()
    os.remove(_test)
    logger.info(f"[disk-cache] Enabled: {DISK_CACHE_DIR}")
except Exception as _e:
    DISK_CACHE_DIR = os.path.join(os.path.dirname(__file__), ".diskcache")
    os.makedirs(DISK_CACHE_DIR, exist_ok=True)
    logger.warning(f"[disk-cache] /data not writable, fallback: {DISK_CACHE_DIR}")

# ─── Cloudflare R2 Cache ───────────────────────────────────────────────────────
_r2_client = None
R2_BUCKET = os.environ.get("R2_BUCKET", "f1-cache")

def _get_r2():
    global _r2_client
    if _r2_client is not None:
        return _r2_client
    account_id = os.environ.get("R2_ACCOUNT_ID", "")
    access_key = os.environ.get("R2_ACCESS_KEY_ID", "")
    secret_key = os.environ.get("R2_SECRET_ACCESS_KEY", "")
    if not all([account_id, access_key, secret_key]):
        return None
    try:
        import boto3
        _r2_client = boto3.client(
            "s3",
            endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name="auto",
        )
        logger.info(f"[r2] Connected: bucket={R2_BUCKET}")
    except Exception as e:
        logger.warning(f"[r2] Init failed: {e}")
    return _r2_client


def _r2_replay_key(year: int, gp: str, session: str, fps: int) -> str:
    safe = gp.replace(" ", "_").replace("/", "-")
    return f"replay/{year}/{safe}/{session}/{fps}fps.json.gz"


def _r2_telemetry_key(year: int, gp: str, session: str, driver: str, fps: int) -> str:
    safe = gp.replace(" ", "_").replace("/", "-")
    return f"telemetry/{year}/{safe}/{session}/{driver}/{fps}fps.json.gz"


def _r2_load(key: str):
    r2 = _get_r2()
    if not r2:
        return None
    try:
        from botocore.exceptions import ClientError
        resp = r2.get_object(Bucket=R2_BUCKET, Key=key)
        data = json.loads(gzip.decompress(resp["Body"].read()).decode())
        logger.info(f"[r2] Cache hit: {key}")
        return data
    except Exception as e:
        err = getattr(getattr(e, "response", {}), "get", lambda k, d=None: d)
        code = e.response["Error"]["Code"] if hasattr(e, "response") else ""
        if code != "NoSuchKey":
            logger.warning(f"[r2] Load error {key}: {e}")
        return None


def _r2_presigned_url(key: str, expires: int = 3600) -> str | None:
    """Generate a presigned GET URL for R2 — client downloads directly from CDN."""
    r2 = _get_r2()
    if not r2:
        return None
    try:
        url = r2.generate_presigned_url(
            "get_object",
            Params={"Bucket": R2_BUCKET, "Key": key},
            ExpiresIn=expires,
        )
        logger.info(f"[r2] Presigned URL: {key}")
        return url
    except Exception as e:
        logger.warning(f"[r2] Presigned URL error {key}: {e}")
        return None


def _r2_save(key: str, data: dict):
    r2 = _get_r2()
    if not r2:
        return
    try:
        gz = gzip.compress(json.dumps(data).encode())
        r2.put_object(Bucket=R2_BUCKET, Key=key, Body=gz, ContentType="application/gzip")
        logger.info(f"[r2] Saved: {key} ({len(gz) // 1024}KB)")
    except Exception as e:
        logger.warning(f"[r2] Save error {key}: {e}")


app = FastAPI(title="FastF1 API", version="1.0.0")

# Background processing for long-running replay computation
executor = ThreadPoolExecutor(max_workers=2)
replay_cache: dict = {}  # key -> {"status": "processing"|"done"|"error", "result": ..., "error": ...}


def _replay_job_key(year: int, gp: str, session: str, fps: int) -> str:
    return f"{year}|{gp}|{session}|{fps}"


# ─── Firebase Storage Cache (optional) ────────────────────────────────────────
_fb_bucket = None

def _init_firebase():
    global _fb_bucket
    svc_b64 = os.environ.get("FIREBASE_SERVICE_ACCOUNT_B64", "")
    bucket_name = os.environ.get("FIREBASE_STORAGE_BUCKET", "")
    if not svc_b64 or not bucket_name:
        logger.info("[firebase] Storage cache disabled (env vars not set)")
        return
    try:
        import firebase_admin
        from firebase_admin import credentials, storage
        cred_dict = json.loads(base64.b64decode(svc_b64).decode())
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred, {"storageBucket": bucket_name})
        _fb_bucket = storage.bucket()
        logger.info(f"[firebase] Storage cache enabled: {bucket_name}")
    except Exception as e:
        logger.warning(f"[firebase] Init failed: {e}")

_init_firebase()


def _disk_replay_path(year: int, gp: str, session: str, fps: int) -> str:
    safe = gp.replace(" ", "_").replace("/", "-")
    return os.path.join(DISK_CACHE_DIR, "replay", str(year), safe, session, f"{fps}fps.json.gz")


def _disk_telemetry_path(year: int, gp: str, session: str, driver: str, fps: int) -> str:
    safe = gp.replace(" ", "_").replace("/", "-")
    return os.path.join(DISK_CACHE_DIR, "telemetry", str(year), safe, session, driver, f"{fps}fps.json.gz")


def _disk_load(path: str):
    try:
        if not os.path.exists(path):
            return None
        with open(path, "rb") as f:
            data = json.loads(gzip.decompress(f.read()).decode())
        logger.info(f"[disk-cache] Hit: {path}")
        return data
    except Exception as e:
        logger.warning(f"[disk-cache] Load error {path}: {e}")
        return None


def _disk_save(path: str, data: dict):
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        gz = gzip.compress(json.dumps(data).encode())
        with open(path, "wb") as f:
            f.write(gz)
        logger.info(f"[disk-cache] Saved: {path} ({len(gz) // 1024}KB)")
    except Exception as e:
        logger.warning(f"[disk-cache] Save error {path}: {e}")


def _fb_blob_key(year: int, gp: str, session: str, fps: int) -> str:
    safe_gp = gp.replace(" ", "_").replace("/", "-")
    return f"replay/{year}/{safe_gp}/{session}/{fps}fps.json.gz"


def _fb_telemetry_key(year: int, gp: str, session: str, driver: str, fps: int) -> str:
    safe_gp = gp.replace(" ", "_").replace("/", "-")
    return f"telemetry/{year}/{safe_gp}/{session}/{driver}/{fps}fps.json.gz"


def _load_from_firebase(year: int, gp: str, session: str, fps: int):
    if _fb_bucket is None:
        return None
    try:
        key = _fb_blob_key(year, gp, session, fps)
        blob = _fb_bucket.blob(key)
        if not blob.exists():
            return None
        data = json.loads(gzip.decompress(blob.download_as_bytes()).decode())
        logger.info(f"[firebase] Cache hit: {key}")
        return data
    except Exception as e:
        logger.warning(f"[firebase] Load error: {e}")
        return None


def _save_to_firebase(year: int, gp: str, session: str, fps: int, result: dict):
    if _fb_bucket is None:
        return
    try:
        key = _fb_blob_key(year, gp, session, fps)
        blob = _fb_bucket.blob(key)
        gz_bytes = gzip.compress(json.dumps(result).encode())
        blob.upload_from_string(gz_bytes, content_type="application/gzip")
        logger.info(f"[firebase] Saved: {key} ({len(gz_bytes) // 1024}KB)")
    except Exception as e:
        logger.warning(f"[firebase] Save error: {e}")


def _load_telemetry_from_firebase(year: int, gp: str, session: str, driver: str, fps: int):
    if _fb_bucket is None:
        return None
    try:
        key = _fb_telemetry_key(year, gp, session, driver, fps)
        blob = _fb_bucket.blob(key)
        if not blob.exists():
            return None
        data = json.loads(gzip.decompress(blob.download_as_bytes()).decode())
        logger.info(f"[firebase] Telemetry cache hit: {key}")
        return data
    except Exception as e:
        logger.warning(f"[firebase] Telemetry load error: {e}")
        return None


def _save_telemetry_to_firebase(year: int, gp: str, session: str, driver: str, fps: int, result: dict):
    if _fb_bucket is None:
        return
    try:
        key = _fb_telemetry_key(year, gp, session, driver, fps)
        blob = _fb_bucket.blob(key)
        gz_bytes = gzip.compress(json.dumps(result).encode())
        blob.upload_from_string(gz_bytes, content_type="application/gzip")
        logger.info(f"[firebase] Telemetry saved: {key} ({len(gz_bytes) // 1024}KB)")
    except Exception as e:
        logger.warning(f"[firebase] Telemetry save error: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:4000",
        "https://f1.324.ing",
        "https://*.vercel.app",
    ],
    allow_methods=["GET"],
    allow_headers=["*"],
)


def clean(val):
    """Convert numpy/pandas types to JSON-serializable Python types."""
    if val is None:
        return None
    try:
        if pd.isnull(val):
            return None
    except (TypeError, ValueError):
        pass
    if isinstance(val, (np.integer,)):
        return int(val)
    if isinstance(val, (np.floating,)):
        return float(val)
    if isinstance(val, pd.Timedelta):
        return val.total_seconds()
    if isinstance(val, bool):
        return bool(val)
    if isinstance(val, np.bool_):
        return bool(val)
    return val


def row_to_dict(row):
    return {k: clean(v) for k, v in row.items()}


def get_color_map(sess) -> dict:
    color_map = {}
    if sess.results is not None and not sess.results.empty:
        for _, row in sess.results.iterrows():
            abbr = str(row.get("Abbreviation", ""))
            color = str(row.get("TeamColor", "") or "64748B")
            color_map[abbr] = color if color else "64748B"
    return color_map


def load_session(year: int, gp: str, session_type: str):
    try:
        sess = fastf1.get_session(year, gp, session_type)
        sess.load()
        return sess
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Session not found: {e}")


# ─── Endpoints ────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "fastf1_version": fastf1.__version__, "disk_cache": DISK_CACHE_DIR}


# ─── Admin: Cache Upload ──────────────────────────────────────────────────────
_UPLOAD_SECRET = os.environ.get("CACHE_UPLOAD_SECRET", "")

@app.post("/admin/cache-upload")
async def cache_upload(
    path: str = Query(..., description="Relative path inside DISK_CACHE_DIR, e.g. replay/2025/Australian_Grand_Prix/R/5fps.json.gz"),
    secret: str = Query(..., description="CACHE_UPLOAD_SECRET"),
    request: "Request" = None,
):
    """Upload a gzip cache file directly to the disk cache (used by prewarm script)."""
    from fastapi import Request
    if not _UPLOAD_SECRET or secret != _UPLOAD_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret")
    full_path = os.path.join(DISK_CACHE_DIR, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    body = await request.body()
    with open(full_path, "wb") as f:
        f.write(body)
    size_kb = len(body) // 1024
    logger.info(f"[cache-upload] Saved: {full_path} ({size_kb}KB)")
    return {"ok": True, "path": full_path, "size_kb": size_kb}


@app.get("/schedule")
def get_schedule(year: int = Query(default=2025)):
    """Full season schedule."""
    try:
        sched = fastf1.get_event_schedule(year)
        cols = [
            "RoundNumber", "Country", "Location", "OfficialEventName",
            "EventName", "EventDate", "EventFormat",
            "Session1", "Session1Date", "Session1DateUtc",
            "Session2", "Session2Date", "Session2DateUtc",
            "Session3", "Session3Date", "Session3DateUtc",
            "Session4", "Session4Date", "Session4DateUtc",
            "Session5", "Session5Date", "Session5DateUtc",
        ]
        available = [c for c in cols if c in sched.columns]
        result = sched[available].to_dict(orient="records")
        return [row_to_dict(r) for r in result]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/results")
def get_results(
    year: int = Query(default=2025),
    gp: str = Query(..., description="GP name or round number, e.g. 'Bahrain' or '1'"),
    session: str = Query(default="R", description="R, Q, S, SS, FP1, FP2, FP3"),
):
    """Race/qualifying/sprint results."""
    sess = load_session(year, gp, session)
    results = sess.results
    if results is None or results.empty:
        return []
    cols = [
        "DriverNumber", "BroadcastName", "Abbreviation", "DriverId",
        "TeamName", "TeamColor", "FirstName", "LastName",
        "Position", "GridPosition", "Q1", "Q2", "Q3",
        "Time", "Status", "Points",
        "FastestLapTime", "FastestLapNumber",
    ]
    available = [c for c in cols if c in results.columns]
    return [row_to_dict(r) for r in results[available].to_dict(orient="records")]


@app.get("/laps")
def get_laps(
    year: int = Query(default=2025),
    gp: str = Query(...),
    session: str = Query(default="R"),
    driver: Optional[str] = Query(default=None, description="Driver abbreviation, e.g. 'VER'"),
):
    """All laps for a session, optionally filtered by driver."""
    sess = load_session(year, gp, session)
    laps = sess.laps
    if driver:
        laps = laps.pick_drivers(driver)
    cols = [
        "Driver", "DriverNumber", "LapNumber", "LapTime",
        "Sector1Time", "Sector2Time", "Sector3Time",
        "SpeedI1", "SpeedI2", "SpeedFL", "SpeedST",
        "Compound", "TyreLife", "FreshTyre", "Stint",
        "PitInTime", "PitOutTime", "IsAccurate", "IsPersonalBest",
    ]
    available = [c for c in cols if c in laps.columns]
    return [row_to_dict(r) for r in laps[available].to_dict(orient="records")]


@app.get("/fastest-lap")
def get_fastest_lap(
    year: int = Query(default=2025),
    gp: str = Query(...),
    session: str = Query(default="R"),
    driver: str = Query(..., description="Driver abbreviation, e.g. 'VER'"),
):
    """Telemetry for a driver's fastest lap — speed, throttle, brake, gear, DRS vs distance."""
    sess = load_session(year, gp, session)
    laps = sess.laps.pick_drivers(driver)
    fastest = laps.pick_fastest()
    if fastest is None or fastest.empty:
        raise HTTPException(status_code=404, detail="No fastest lap found")

    tel = fastest.get_telemetry()
    cols = ["Distance", "Speed", "Throttle", "Brake", "nGear", "DRS", "RPM", "Time"]
    available = [c for c in cols if c in tel.columns]
    return [row_to_dict(r) for r in tel[available].to_dict(orient="records")]


@app.get("/track-map")
def get_track_map(
    year: int = Query(default=2025),
    gp: str = Query(...),
    session: str = Query(default="R"),
    driver: str = Query(...),
):
    """X/Y coordinates of fastest lap for track minimap."""
    sess = load_session(year, gp, session)
    laps = sess.laps.pick_drivers(driver)
    fastest = laps.pick_fastest()
    if fastest is None or fastest.empty:
        raise HTTPException(status_code=404, detail="No lap found")

    pos = fastest.get_pos_data()
    if pos is None or pos.empty:
        raise HTTPException(status_code=404, detail="No position data")

    cols = ["X", "Y", "Z", "Time"]
    available = [c for c in cols if c in pos.columns]
    return [row_to_dict(r) for r in pos[available].to_dict(orient="records")]


@app.get("/stints")
def get_stints(
    year: int = Query(default=2025),
    gp: str = Query(...),
    session: str = Query(default="R"),
):
    """Tyre stint summary per driver."""
    sess = load_session(year, gp, session)
    laps = sess.laps
    stints = (
        laps.groupby(["Driver", "Stint", "Compound"])
        .agg(
            LapStart=("LapNumber", "min"),
            LapEnd=("LapNumber", "max"),
            TyreLife=("TyreLife", "max"),
            FreshTyre=("FreshTyre", "first"),
        )
        .reset_index()
    )
    return [row_to_dict(r) for r in stints.to_dict(orient="records")]


@app.get("/weather")
def get_weather(
    year: int = Query(default=2025),
    gp: str = Query(...),
    session: str = Query(default="R"),
):
    """Weather data over the session."""
    sess = load_session(year, gp, session)
    wx = sess.weather_data
    if wx is None or wx.empty:
        return []
    cols = ["Time", "AirTemp", "Humidity", "Pressure", "Rainfall", "TrackTemp", "WindDirection", "WindSpeed"]
    available = [c for c in cols if c in wx.columns]
    return [row_to_dict(r) for r in wx[available].to_dict(orient="records")]


@app.get("/lap-comparison")
def get_lap_comparison(
    year: int = Query(default=2025),
    gp: str = Query(...),
    session: str = Query(default="R"),
    drivers: str = Query(..., description="Comma-separated abbreviations, e.g. 'VER,NOR'"),
):
    """Fastest lap telemetry comparison between multiple drivers."""
    sess = load_session(year, gp, session)
    driver_list = [d.strip() for d in drivers.split(",")]
    result = {}
    for drv in driver_list:
        try:
            laps = sess.laps.pick_drivers(drv).pick_fastest()
            tel = laps.get_telemetry()
            cols = ["Distance", "Speed", "Throttle", "Brake", "nGear", "DRS"]
            available = [c for c in cols if c in tel.columns]
            result[drv] = [row_to_dict(r) for r in tel[available].to_dict(orient="records")]
        except Exception:
            result[drv] = []
    return result


@app.get("/lap-times-all")
def get_lap_times_all(
    year: int = Query(default=2025),
    gp: str = Query(...),
    session: str = Query(default="R"),
):
    """All lap times for all drivers — for scatter/degradation charts."""
    sess = load_session(year, gp, session)
    color_map = get_color_map(sess)
    laps = sess.laps
    cols = ["Driver", "LapNumber", "LapTime", "Sector1Time", "Sector2Time", "Sector3Time",
            "Compound", "TyreLife", "Stint", "IsAccurate", "IsPersonalBest",
            "PitInTime", "PitOutTime"]
    available = [c for c in cols if c in laps.columns]
    result = []
    for _, row in laps[available].iterrows():
        d = row_to_dict(row)
        d["team_color"] = color_map.get(str(row.get("Driver", "")), "64748B")
        result.append(d)
    return result


@app.get("/sector-best")
def get_sector_best(
    year: int = Query(default=2025),
    gp: str = Query(...),
    session: str = Query(default="R"),
):
    """Best sector times per driver + theoretical best lap."""
    sess = load_session(year, gp, session)
    color_map = get_color_map(sess)
    laps = sess.laps.pick_accurate()
    result = []
    for drv in laps["Driver"].unique():
        drv_laps = laps[laps["Driver"] == drv]
        s1 = drv_laps["Sector1Time"].dropna().min() if "Sector1Time" in drv_laps else None
        s2 = drv_laps["Sector2Time"].dropna().min() if "Sector2Time" in drv_laps else None
        s3 = drv_laps["Sector3Time"].dropna().min() if "Sector3Time" in drv_laps else None
        fl = drv_laps["LapTime"].dropna().min() if "LapTime" in drv_laps else None
        s1c, s2c, s3c = clean(s1), clean(s2), clean(s3)
        theoretical = (s1c + s2c + s3c) if all(v is not None for v in [s1c, s2c, s3c]) else None
        result.append({
            "driver": drv,
            "team_color": color_map.get(drv, "64748B"),
            "s1_best": s1c,
            "s2_best": s2c,
            "s3_best": s3c,
            "fastest_lap": clean(fl),
            "theoretical": theoretical,
        })
    result.sort(key=lambda x: x["fastest_lap"] or 999)
    return result


@app.get("/position-history")
def get_position_history(
    year: int = Query(default=2025),
    gp: str = Query(...),
    session: str = Query(default="R"),
):
    """Lap-by-lap race positions computed from cumulative lap times."""
    sess = load_session(year, gp, session)
    color_map = get_color_map(sess)
    laps = sess.laps

    valid = laps[["Driver", "LapNumber", "LapTime"]].copy()
    valid = valid[valid["LapTime"].notna()].copy()
    valid["sec"] = valid["LapTime"].apply(lambda x: x.total_seconds() if hasattr(x, "total_seconds") else float(x))
    valid = valid.sort_values(["Driver", "LapNumber"])
    valid["cum"] = valid.groupby("Driver")["sec"].cumsum()

    max_lap = int(valid["LapNumber"].max())
    driver_positions: dict = {}

    for lap_n in range(1, max_lap + 1):
        lap_data = valid[valid["LapNumber"] == lap_n][["Driver", "cum"]].sort_values("cum")
        for pos, (_, row) in enumerate(lap_data.iterrows(), 1):
            drv = row["Driver"]
            if drv not in driver_positions:
                driver_positions[drv] = []
            driver_positions[drv].append({"lap": lap_n, "pos": pos})

    return [
        {"driver": drv, "team_color": color_map.get(drv, "64748B"), "positions": pts}
        for drv, pts in driver_positions.items()
    ]


@app.get("/pit-timeline")
def get_pit_timeline_data(
    year: int = Query(default=2025),
    gp: str = Query(...),
    session: str = Query(default="R"),
):
    """Tyre strategy (stints) + pit stop events for strategy chart."""
    sess = load_session(year, gp, session)
    color_map = get_color_map(sess)
    laps = sess.laps

    # Tyre stints per driver
    stint_cols = ["Driver", "LapNumber", "Compound", "Stint", "TyreLife", "PitInTime"]
    available = [c for c in stint_cols if c in laps.columns]
    stint_df = laps[available].copy()

    stints = (
        stint_df.groupby(["Driver", "Stint", "Compound"])
        .agg(lap_start=("LapNumber", "min"), lap_end=("LapNumber", "max"))
        .reset_index()
    )

    # Pit stop laps
    pit_laps = []
    if "PitInTime" in laps.columns:
        pit_rows = laps[laps["PitInTime"].notna()][["Driver", "LapNumber"]].copy()
        pit_laps = [{"driver": r["Driver"], "lap": int(r["LapNumber"])} for _, r in pit_rows.iterrows()]

    # Driver order by final position
    driver_order = []
    if sess.results is not None and not sess.results.empty:
        driver_order = list(sess.results.sort_values("Position")["Abbreviation"].dropna())

    max_lap = int(laps["LapNumber"].max()) if not laps.empty else 0

    return {
        "stints": [row_to_dict(r) for r in stints.to_dict(orient="records")],
        "pits": pit_laps,
        "driver_order": driver_order,
        "color_map": color_map,
        "max_lap": max_lap,
    }


@app.get("/speed-map")
def get_speed_map_data(
    year: int = Query(default=2025),
    gp: str = Query(...),
    session: str = Query(default="R"),
    driver: str = Query(...),
):
    """Fastest lap X/Y coordinates with speed — for speed heatmap."""
    sess = load_session(year, gp, session)
    laps = sess.laps.pick_drivers(driver).pick_fastest()
    if laps is None or laps.empty:
        raise HTTPException(status_code=404, detail="No lap found")

    tel = laps.get_telemetry()
    cols = ["X", "Y", "Speed"]
    available = [c for c in cols if c in tel.columns]
    if "X" not in available or "Speed" not in available:
        raise HTTPException(status_code=404, detail="No position/speed data")

    # Downsample every 3rd point to reduce payload
    sampled = tel[available].iloc[::3]
    return [row_to_dict(r) for r in sampled.to_dict(orient="records")]


def _compute_replay_frames(year: int, gp: str, session: str, fps: int) -> dict:
    """Synchronous replay frame computation — runs in thread pool."""
    try:
        sess = fastf1.get_session(year, gp, session)
        sess.load(laps=True, telemetry=True, weather=False, messages=False)
    except Exception as e:
        raise ValueError(f"레이스 데이터 없음: {e}")

    color_map = get_color_map(sess)
    track_points = []
    laps = sess.laps
    total_laps = int(laps["LapNumber"].max()) if not laps.empty else 0
    dt = 1.0 / fps

    driver_series: dict = {}
    compound_map: dict = {}

    for drv in sess.drivers:
        try:
            abbr = sess.get_driver(drv)["Abbreviation"]
            drv_laps = laps.pick_drivers(drv)
            if drv_laps.empty:
                continue
            pos_data = sess.pos_data.get(drv)
            if pos_data is None or pos_data.empty:
                continue
            if "X" not in pos_data.columns or "Y" not in pos_data.columns:
                continue
            t_sec = pos_data.index.total_seconds() if hasattr(pos_data.index, "total_seconds") else \
                    pos_data["SessionTime"].dt.total_seconds()
            x_arr = pos_data["X"].to_numpy(dtype=float)
            y_arr = pos_data["Y"].to_numpy(dtype=float)
            driver_series[abbr] = {"t": t_sec, "x": x_arr, "y": y_arr}
            if "Compound" in drv_laps.columns and "LapNumber" in drv_laps.columns:
                compound_map[abbr] = {
                    int(r["LapNumber"]): str(r["Compound"])
                    for _, r in drv_laps[["LapNumber", "Compound"]].dropna().iterrows()
                }
            if not track_points:
                track_points = [{"x": clean(r["X"]), "y": clean(r["Y"])}
                                for _, r in pos_data[["X", "Y"]].iloc[::4].iterrows()]
        except Exception:
            continue

    if not driver_series:
        raise ValueError("No position data available for this session")

    all_x = np.concatenate([v["x"] for v in driver_series.values()])
    all_y = np.concatenate([v["y"] for v in driver_series.values()])
    min_x, max_x = float(np.nanmin(all_x)), float(np.nanmax(all_x))
    min_y, max_y = float(np.nanmin(all_y)), float(np.nanmax(all_y))
    rx = max_x - min_x or 1.0
    ry = max_y - min_y or 1.0

    def norm_x(v): return (v - min_x) / rx
    def norm_y(v): return 1.0 - (v - min_y) / ry

    track_norm = [{"x": round(norm_x(p["x"]), 4), "y": round(norm_y(p["y"]), 4)}
                  for p in track_points]

    pit_laps_set: dict = {}
    dnf_laps: dict = {}
    if sess.results is not None and not sess.results.empty:
        for _, row in sess.results.iterrows():
            abbr = str(row.get("Abbreviation", ""))
            status = str(row.get("Status", ""))
            if status not in ("Finished", "+1 Lap", "+2 Laps", "+3 Laps", "+4 Laps",
                               "+5 Laps", "+6 Laps", "+7 Laps") and abbr:
                dnf_laps[abbr] = total_laps

    if "PitInTime" in laps.columns:
        for _, row in laps[laps["PitInTime"].notna()].iterrows():
            abbr = str(row.get("Driver", ""))
            lap = int(row.get("LapNumber", 0))
            if abbr not in pit_laps_set:
                pit_laps_set[abbr] = set()
            pit_laps_set[abbr].add(lap)

    drv_lap_t: dict = {}
    for drv in sess.drivers:
        try:
            abbr = sess.get_driver(drv)["Abbreviation"]
            drv_laps = laps.pick_drivers(drv)
            if drv_laps.empty or "LapStartTime" not in drv_laps.columns:
                continue
            lap_starts = drv_laps[["LapNumber", "LapStartTime"]].dropna()
            t_arr = lap_starts["LapStartTime"].dt.total_seconds().to_numpy()
            l_arr = lap_starts["LapNumber"].to_numpy(dtype=int)
            drv_lap_t[abbr] = (t_arr, l_arr)
        except Exception:
            continue

    all_t_min = min(float(v["t"].min()) for v in driver_series.values() if len(v["t"]) > 0)
    all_t_max = max(float(v["t"].max()) for v in driver_series.values() if len(v["t"]) > 0)
    time_grid = np.arange(all_t_min, all_t_max, dt)

    interp_data: dict = {}
    for abbr, sv in driver_series.items():
        t_arr = sv["t"].to_numpy() if hasattr(sv["t"], "to_numpy") else np.array(sv["t"])
        xi = np.interp(time_grid, t_arr, sv["x"])
        yi = np.interp(time_grid, t_arr, sv["y"])
        interp_data[abbr] = {"x": xi, "y": yi}

    leaderboard_interval = max(1, fps)
    last_leaderboard: list = []
    frames = []

    for i, t in enumerate(time_grid):
        positions = []
        driver_laps_now: dict = {}

        for abbr, idata in interp_data.items():
            nx = round(norm_x(idata["x"][i]), 4)
            ny = round(norm_y(idata["y"][i]), 4)
            lap_now = 1
            if abbr in drv_lap_t:
                t_arr, l_arr = drv_lap_t[abbr]
                idx = np.searchsorted(t_arr, t, side="right") - 1
                if 0 <= idx < len(l_arr):
                    lap_now = int(l_arr[idx])
            driver_laps_now[abbr] = lap_now
            status = "on_track"
            if abbr in pit_laps_set and lap_now in pit_laps_set[abbr]:
                status = "pit"
            if abbr in dnf_laps and lap_now >= dnf_laps[abbr]:
                status = "out"
            comp = "UNKNOWN"
            if abbr in compound_map and lap_now in compound_map[abbr]:
                comp = compound_map[abbr][lap_now]
            positions.append({"d": abbr, "x": nx, "y": ny, "status": status, "compound": comp})

        if i % leaderboard_interval == 0:
            sorted_drvs = sorted(driver_laps_now.items(), key=lambda kv: -kv[1])
            last_leaderboard = [
                {"pos": pos + 1, "d": abbr, "gap": None,
                 "compound": compound_map.get(abbr, {}).get(driver_laps_now.get(abbr, 1), "UNKNOWN")}
                for pos, (abbr, _) in enumerate(sorted_drvs)
            ]

        current_lap = max(driver_laps_now.values()) if driver_laps_now else 1
        frames.append({
            "lap": current_lap,
            "t": round(float(t), 2),
            "positions": positions,
            "leaderboard": last_leaderboard,
        })

    return {
        "total_laps": total_laps,
        "total_frames": len(frames),
        "fps": fps,
        "track": track_norm,
        "bounds": {"min_x": min_x, "max_x": max_x, "min_y": min_y, "max_y": max_y},
        "drivers": list(interp_data.keys()),
        "colors": color_map,
        "compounds": {abbr: list(lmap.values()) for abbr, lmap in compound_map.items()},
        "frames": frames,
    }


@app.get("/replay-frames")
async def get_replay_frames(
    year: int = Query(default=2026),
    gp: str = Query(..., description="Round number or GP name, e.g. '1' or 'Australian'"),
    session: str = Query(default="R", description="R or S (Sprint)"),
    fps: int = Query(default=5, ge=1, le=10, description="Frames per second (1-10)"),
):
    """
    Frame-by-frame driver positions for race replay.
    Returns 202 {"status":"processing"} while computing in background,
    returns full data once ready. Poll until non-202 response.
    """
    # Normalize session name: "Race" → "R", "Sprint" → "S"
    _SESSION_MAP = {"Race": "R", "Sprint": "S", "Qualifying": "Q",
                    "Practice 1": "FP1", "Practice 2": "FP2", "Practice 3": "FP3"}
    session = _SESSION_MAP.get(session, session)
    key = _replay_job_key(year, gp, session, fps)

    # 1. In-memory cache (fastest — survives within the same process)
    if key in replay_cache:
        entry = replay_cache[key]
        if entry["status"] == "done":
            return entry["result"]
        if entry["status"] == "error":
            raise HTTPException(status_code=404, detail=entry["error"])
        return JSONResponse({"status": "processing"}, status_code=202)

    # 2. Disk cache (local speed cache)
    disk_path = _disk_replay_path(year, gp, session, fps)
    cached = _disk_load(disk_path)
    if cached:
        replay_cache[key] = {"status": "done", "result": cached, "error": None}
        return cached

    # 3. Cloudflare R2 cache — redirect client directly to CDN (no Railway bandwidth)
    r2_key = _r2_replay_key(year, gp, session, fps)
    presigned = _r2_presigned_url(r2_key)
    if presigned:
        return RedirectResponse(url=presigned, status_code=307)

    # 4. Firebase Storage cache (optional fallback)
    cached = _load_from_firebase(year, gp, session, fps)
    if cached:
        replay_cache[key] = {"status": "done", "result": cached, "error": None}
        return cached

    # 5. OOM 방지: DISABLE_COMPUTE=true이면 계산 금지 (Railway 환경)
    if os.environ.get("DISABLE_COMPUTE", "").lower() == "true":
        raise HTTPException(status_code=503, detail="Replay computation disabled on this instance. Data not yet cached.")

    # 6. Compute in background thread
    replay_cache[key] = {"status": "processing", "result": None, "error": None}
    loop = asyncio.get_event_loop()

    def run():
        try:
            logger.info(f"[replay] Computing: {key}")
            result = _compute_replay_frames(year, gp, session, fps)
            _disk_save(disk_path, result)
            _r2_save(r2_key, result)
            _save_to_firebase(year, gp, session, fps, result)
            replay_cache[key] = {"status": "done", "result": result, "error": None}
            logger.info(f"[replay] Done: {key}")
        except Exception as e:
            logger.error(f"[replay] Error: {key} — {e}")
            replay_cache[key] = {"status": "error", "result": None, "error": str(e)}

    loop.run_in_executor(executor, run)
    return JSONResponse({"status": "processing"}, status_code=202)


@app.get("/driver-telemetry")
async def driver_telemetry(
    year: int,
    gp: str,
    session: str = "R",
    driver: str = "",
    fps: int = 5,
):
    """Return per-frame telemetry arrays for a single driver (speed/gear/throttle/brake/drs/tyre_life).
    The frame indices match those of /replay-frames called with the same year/gp/session/fps.
    """
    if not driver:
        raise HTTPException(status_code=400, detail="driver parameter required")

    # 1. Disk cache (local speed cache)
    tel_disk_path = _disk_telemetry_path(year, gp, session, driver, fps)
    cached = _disk_load(tel_disk_path)
    if cached:
        return cached

    # 2. Cloudflare R2 cache (persistent)
    tel_r2_key = _r2_telemetry_key(year, gp, session, driver, fps)
    cached = _r2_load(tel_r2_key)
    if cached:
        _disk_save(tel_disk_path, cached)
        return cached

    # 3. Firebase cache check
    cached = _load_telemetry_from_firebase(year, gp, session, driver, fps)
    if cached:
        return cached

    # OOM 방지: DISABLE_COMPUTE=true이면 계산 금지 (Railway 환경)
    # sess.load()가 22명 전체 데이터를 로드하므로 메모리 사용량이 replay-frames와 동일
    if os.environ.get("DISABLE_COMPUTE", "").lower() == "true":
        raise HTTPException(status_code=503, detail="Telemetry computation disabled on this instance. Data not yet cached.")

    sess = fastf1.get_session(year, gp, session)
    sess.load(telemetry=True, laps=True)

    # Resolve abbreviation -> driver number
    drv_num = None
    for d in sess.drivers:
        try:
            if sess.get_driver(d)["Abbreviation"] == driver:
                drv_num = d
                break
        except Exception:
            continue

    if drv_num is None:
        raise HTTPException(status_code=404, detail=f"Driver '{driver}' not found in session")

    # Build global time grid (same logic as /replay-frames)
    dt = 1.0 / fps
    t_mins, t_maxs = [], []
    for d in sess.drivers:
        pd_d = sess.pos_data.get(d)
        if pd_d is None or pd_d.empty:
            continue
        t = pd_d.index.total_seconds() if hasattr(pd_d.index, "total_seconds") else pd_d["SessionTime"].dt.total_seconds()
        t = np.array(t)
        t_mins.append(float(t.min()))
        t_maxs.append(float(t.max()))

    if not t_mins:
        raise HTTPException(status_code=404, detail="No position data for session")

    time_grid = np.arange(min(t_mins), max(t_maxs), dt)
    n = len(time_grid)

    # Car telemetry
    car_data = sess.car_data.get(drv_num)
    speed = gear = throttle = brake = drs = None

    if car_data is not None and not car_data.empty:
        tel_t = np.array(
            car_data.index.total_seconds() if hasattr(car_data.index, "total_seconds")
            else car_data["SessionTime"].dt.total_seconds()
        )
        def _interp(col):
            if col in car_data.columns:
                return np.interp(time_grid, tel_t, car_data[col].to_numpy(dtype=float))
            return None

        sp = _interp("Speed")
        if sp is not None:
            speed = sp.round(0).astype(int).tolist()
        ge = _interp("nGear")
        if ge is not None:
            gear = ge.round(0).astype(int).tolist()
        th = _interp("Throttle")
        if th is not None:
            throttle = th.round(0).astype(int).tolist()
        br = _interp("Brake")
        if br is not None:
            brake = (br > 0.5).astype(int).tolist()
        dr = _interp("DRS")
        if dr is not None:
            drs_int = dr.round(0).astype(int)
            drs = np.isin(drs_int, [10, 12, 14]).astype(int).tolist()

    # Tyre life from laps
    laps = sess.laps
    drv_laps = laps.pick_drivers(drv_num)
    tyre_life = [0] * n

    if "TyreLife" in drv_laps.columns and "LapStartTime" in drv_laps.columns:
        lap_data = drv_laps[["LapStartTime", "TyreLife"]].dropna()
        if not lap_data.empty:
            lap_t = lap_data["LapStartTime"].dt.total_seconds().to_numpy()
            lap_tl = lap_data["TyreLife"].to_numpy(dtype=float)
            for j, t in enumerate(time_grid):
                idx = int(np.searchsorted(lap_t, t, side="right")) - 1
                if 0 <= idx < len(lap_tl):
                    tyre_life[j] = int(lap_tl[idx])

    result = {
        "driver": driver,
        "total_frames": n,
        "fps": fps,
        "speed": speed,
        "gear": gear,
        "throttle": throttle,
        "brake": brake,
        "drs": drs,
        "tyre_life": tyre_life,
    }
    _disk_save(tel_disk_path, result)
    _r2_save(tel_r2_key, result)
    _save_telemetry_to_firebase(year, gp, session, driver, fps, result)
    return result


# ─── Corner Insights ─────────────────────────────────────────

@app.get("/corner-insights")
def get_corner_insights(
    year: int = Query(default=2025),
    gp: str = Query(...),
    session: str = Query(default="R"),
    driver: str = Query(...),
):
    """Corner-by-corner speed stats from fastest lap telemetry."""
    sess = load_session(year, gp, session)
    laps = sess.laps.pick_drivers(driver).pick_fastest()
    if laps is None or laps.empty:
        raise HTTPException(status_code=404, detail="No fastest lap found")

    tel = laps.get_telemetry()
    if tel is None or tel.empty:
        raise HTTPException(status_code=404, detail="No telemetry data")

    tel = tel.dropna(subset=["Distance", "Speed"])
    speeds = tel["Speed"].to_numpy(dtype=float)
    distances = tel["Distance"].to_numpy(dtype=float)
    brakes_raw = tel["Brake"].to_numpy(dtype=float) if "Brake" in tel.columns else np.zeros(len(speeds))

    n = len(speeds)
    if n < 20:
        return []

    # Smooth speeds to reduce sensor noise
    window = max(5, min(11, n // 20))
    kernel = np.ones(window) / window
    smoothed = np.convolve(speeds, kernel, mode="same")

    MIN_GAP_M = 180       # min 180m between detected corners
    MIN_DROP_KMH = 18     # min speed drop (km/h) for a corner to count

    # Collect all local minima
    raw_minima = [i for i in range(1, n - 1) if smoothed[i] <= smoothed[i - 1] and smoothed[i] <= smoothed[i + 1]]

    # Filter by prominence and spatial distance
    filtered: list[int] = []
    last_dist = -MIN_GAP_M

    for i in raw_minima:
        if distances[i] - last_dist < MIN_GAP_M:
            if filtered and smoothed[i] < smoothed[filtered[-1]]:
                filtered[-1] = i
                last_dist = distances[filtered[-1]]
            continue
        before = smoothed[max(0, i - 60):i]
        after = smoothed[i + 1:min(n, i + 60)]
        if not len(before) or not len(after):
            continue
        max_surround = min(float(before.max()), float(after.max()))
        if max_surround - smoothed[i] >= MIN_DROP_KMH:
            filtered.append(i)
            last_dist = distances[i]

    # Build per-corner stats
    corners = []
    for idx, apex_i in enumerate(filtered):
        entry_i = max(0, apex_i - 40)
        exit_i = min(n - 1, apex_i + 40)

        # Find braking start before apex
        brake_start_i = apex_i
        for j in range(apex_i - 1, max(0, apex_i - 100), -1):
            if brakes_raw[j] > 0.5:
                brake_start_i = j
                break
        brake_dist = max(0.0, float(distances[apex_i] - distances[brake_start_i]))

        corners.append({
            "num": idx + 1,
            "distance": round(float(distances[apex_i]), 0),
            "entry_speed": round(float(speeds[entry_i]), 0),
            "apex_speed": round(float(speeds[apex_i]), 0),
            "exit_speed": round(float(speeds[exit_i]), 0),
            "brake_distance": round(brake_dist, 0),
        })

    return corners


# ─── In-memory cache for lap trend (per GP) ──────────────────
_lap_trend_cache: dict = {}


@app.get("/lap-record-trend")
def get_lap_record_trend(
    gp: str = Query(..., description="GP name, e.g. 'Australian Grand Prix'"),
):
    """Fastest race lap per year (2018–present) for a given GP."""
    if gp in _lap_trend_cache:
        return _lap_trend_cache[gp]

    from datetime import datetime
    current_year = datetime.now().year
    results = []

    for year in range(2018, current_year + 1):
        try:
            sess = fastf1.get_session(year, gp, "R")
            sess.load(laps=True, telemetry=False, weather=False, messages=False)
            fastest = sess.laps.pick_fastest()
            if fastest is None or fastest.empty:
                continue
            lap_time = fastest.get("LapTime")
            if lap_time is None or pd.isna(lap_time):
                continue
            lap_sec = lap_time.total_seconds() if hasattr(lap_time, "total_seconds") else float(lap_time)
            driver = str(fastest.get("Driver", ""))
            team_color = "64748B"
            if sess.results is not None and not sess.results.empty:
                match = sess.results[sess.results["Abbreviation"] == driver]
                if not match.empty:
                    tc = str(match.iloc[0].get("TeamColor", "") or "")
                    team_color = tc if tc else "64748B"
            results.append({
                "year": year,
                "driver": driver,
                "team_color": team_color,
                "time": round(lap_sec, 3),
            })
        except Exception as e:
            logger.info(f"[lap-trend] {year}/{gp}: {e}")
            continue

    _lap_trend_cache[gp] = results
    return results


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
