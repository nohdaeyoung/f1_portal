#!/usr/bin/env python3
"""
F1 레이스 결과 폴링 스크립트
- Jolpica API에서 2026 Round 1 결과를 감지
- f1-data.ts 업데이트 (standings + calendar)
- Vercel 빌드 & 배포
- 텔레그램 알림 발송
"""

import urllib.request
import json
import sys
import os
import subprocess
import re

# ─── 설정 ──────────────────────────────────────────────────────

TELEGRAM_BOT_TOKEN = "8604511383:AAGOe4Jfo9RkAMpN9-d-6-4jJvBRctHEkNE"
TELEGRAM_CHANNEL_ID = "@f1324ing"
F1_ROOT = "/Volumes/Dev/f1"
F1_DATA_PATH = f"{F1_ROOT}/src/data/f1-data.ts"
FLAG_FILE = "/tmp/f1-2026-round1-updated.flag"

# ─── ID 매핑 ───────────────────────────────────────────────────

DRIVER_MAP = {
    "max_verstappen": "verstappen", "isack_hadjar": "hadjar",
    "lando_norris": "norris", "oscar_piastri": "piastri",
    "lewis_hamilton": "hamilton", "charles_leclerc": "leclerc",
    "george_russell": "russell",
    "andrea_kimi_antonelli": "antonelli", "kimi_antonelli": "antonelli",
    "fernando_alonso": "alonso", "lance_stroll": "stroll",
    "pierre_gasly": "gasly", "franco_colapinto": "colapinto",
    "carlos_sainz": "sainz", "alexander_albon": "albon",
    "liam_lawson": "lawson", "arvid_lindblad": "lindblad",
    "yuki_tsunoda": "lawson",
    "esteban_ocon": "ocon", "oliver_bearman": "bearman",
    "nico_hulkenberg": "hulkenberg", "gabriel_bortoleto": "bortoleto",
    "valtteri_bottas": "bottas", "sergio_perez": "perez",
}

TEAM_MAP = {
    "red_bull": "red-bull", "mclaren": "mclaren", "ferrari": "ferrari",
    "mercedes": "mercedes", "aston_martin": "aston-martin", "alpine": "alpine",
    "williams": "williams", "rb": "rb", "racing_bulls": "rb",
    "haas": "haas", "sauber": "sauber", "kick_sauber": "sauber",
    "audi": "sauber", "cadillac": "cadillac",
}

# ─── 헬퍼 ──────────────────────────────────────────────────────

def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "F1-Monitor/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())

def send_telegram(message):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    data = json.dumps({
        "chat_id": TELEGRAM_CHANNEL_ID,
        "text": message,
        "parse_mode": "HTML",
        "disable_web_page_preview": False,
    }).encode()
    req = urllib.request.Request(url, data=data,
                                  headers={"Content-Type": "application/json"})
    urllib.request.urlopen(req, timeout=10)
    print("✅ 텔레그램 발송 완료")

def log(msg):
    from datetime import datetime
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}")

# ─── 메인 ──────────────────────────────────────────────────────

def main():
    if os.path.exists(FLAG_FILE):
        log("이미 업데이트 완료 (flag 파일 존재). 종료.")
        return 0

    log("Jolpica API → 2026 Round 1 결과 확인 중...")

    try:
        data = fetch_json("https://api.jolpi.ca/ergast/f1/2026/1/results.json?limit=30")
    except Exception as e:
        log(f"API 요청 실패: {e}")
        return 1

    races = data["MRData"]["RaceTable"]["Races"]
    if not races or not races[0].get("Results"):
        log("결과 아직 없음. 나중에 다시 시도.")
        return 0

    race = races[0]
    results = race["Results"]
    winner = results[0]["Driver"]
    winner_name = f"{winner['givenName']} {winner['familyName']}"
    winner_constructor = results[0]["Constructor"]["name"]
    log(f"우승자 감지: {winner_name} ({winner_constructor})")

    # ── Driver Standings ──
    log("드라이버 스탠딩 조회 중...")
    try:
        ds_data = fetch_json("https://api.jolpi.ca/ergast/f1/2026/driverstandings.json")
        ds_lists = ds_data["MRData"]["StandingsTable"]["StandingsLists"]
        driver_standings = ds_lists[0]["DriverStandings"] if ds_lists else []
    except Exception as e:
        log(f"드라이버 스탠딩 실패: {e}")
        driver_standings = []

    # ── Constructor Standings (from dedicated endpoint, fall back to race results) ──
    log("컨스트럭터 스탠딩 조회 중...")
    constructor_standings = []
    try:
        cs_data = fetch_json("https://api.jolpi.ca/ergast/f1/2026/constructorstandings.json")
        cs_lists = cs_data["MRData"]["StandingsTable"]["StandingsLists"]
        if cs_lists:
            constructor_standings = cs_lists[0]["ConstructorStandings"]
    except Exception as e:
        log(f"컨스트럭터 스탠딩 엔드포인트 실패: {e}")

    # If dedicated endpoint returned nothing, calculate from all race results so far
    if not constructor_standings:
        log("컨스트럭터 스탠딩 없음 → 레이스 결과에서 계산 중...")
        try:
            all_data = fetch_json("https://api.jolpi.ca/ergast/f1/2026/results.json?limit=1000")
            all_races = all_data["MRData"]["RaceTable"]["Races"]
            team_pts: dict = {}
            team_wins: dict = {}
            for r in all_races:
                for res in r.get("Results", []):
                    cid = res["Constructor"]["constructorId"]
                    pts = float(res.get("points", 0))
                    team_pts[cid] = team_pts.get(cid, 0) + pts
                    if res.get("position") == "1":
                        team_wins[cid] = team_wins.get(cid, 0) + 1
            # Sort by points descending
            sorted_teams = sorted(team_pts.keys(), key=lambda c: team_pts[c], reverse=True)
            constructor_standings = [
                {
                    "position": str(i + 1),
                    "Constructor": {"constructorId": cid},
                    "points": str(int(team_pts[cid])),
                    "wins": str(team_wins.get(cid, 0)),
                }
                for i, cid in enumerate(sorted_teams)
            ]
            log(f"레이스 결과에서 {len(constructor_standings)}팀 계산 완료")
        except Exception as e:
            log(f"컨스트럭터 계산 실패: {e}")

    # ── f1-data.ts 수정 ──
    with open(F1_DATA_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # 1) driverStandings 교체
    if driver_standings:
        lines = []
        for idx, s in enumerate(driver_standings):
            jid = s["Driver"]["driverId"]
            local_id = DRIVER_MAP.get(jid, jid)
            pos = int(s.get("position") or str(idx + 1))
            pts = int(float(s.get("points", 0)))
            wins = int(s.get("wins", 0))
            lines.append(f'  {{ position: {pos}, driverId: "{local_id}", points: {pts}, wins: {wins} }},')
        new_ds = "export const driverStandings: Standing[] = [\n" + "\n".join(lines) + "\n];"
        content = re.sub(
            r"export const driverStandings: Standing\[\] = \[[\s\S]*?\];",
            new_ds, content, count=1
        )
        log(f"driverStandings 업데이트 ({len(driver_standings)}명)")

    # 2) constructorStandings 교체
    if constructor_standings:
        lines = []
        seen_teams = set()
        for idx, s in enumerate(constructor_standings):
            jid = s["Constructor"]["constructorId"]
            local_id = TEAM_MAP.get(jid, jid)
            pos = int(s.get("position") or str(idx + 1))
            pts = int(float(s.get("points", 0)))
            wins = int(s.get("wins", 0))
            seen_teams.add(local_id)
            lines.append(f'  {{ position: {pos}, teamId: "{local_id}", points: {pts}, wins: {wins} }},')
        # Cadillac이 없으면 마지막에 추가
        if "cadillac" not in seen_teams:
            lines.append(f'  {{ position: {len(lines)+1}, teamId: "cadillac", points: 0, wins: 0 }},')
        new_cs = "export const constructorStandings: ConstructorStanding[] = [\n" + "\n".join(lines) + "\n];"
        content = re.sub(
            r"export const constructorStandings: ConstructorStanding\[\] = \[[\s\S]*?\];",
            new_cs, content, count=1
        )
        log(f"constructorStandings 업데이트 ({len(constructor_standings)}팀)")

    # 3) Round 1 calendar 업데이트 (status + winner)
    content = re.sub(
        r'(\{ round: 1,.*?circuitId: "albert-park",.*?date: "2026-03-08", status: ")[^"]*(")',
        rf'\g<1>completed\g<2>',
        content
    )
    # winner 필드 추가 (이미 있으면 교체)
    content = re.sub(
        r'(\{ round: 1,.*?date: "2026-03-08", status: "completed")(, winner: "[^"]*")? \}',
        rf'\g<1>, winner: "{winner_name}" }}',
        content
    )
    log(f"calendar Round 1 → completed, winner: {winner_name}")

    with open(F1_DATA_PATH, "w", encoding="utf-8") as f:
        f.write(content)
    log("f1-data.ts 저장 완료")

    # ── 빌드 & 배포 ──
    log("빌드 시작...")
    build = subprocess.run(
        ["npm", "run", "build"], cwd=F1_ROOT,
        capture_output=True, text=True
    )
    if build.returncode != 0:
        log(f"빌드 실패!\n{build.stderr[-500:]}")
        send_telegram("❌ F1 결과 업데이트 빌드 실패\n" + build.stderr[-200:])
        return 1
    log("빌드 성공")

    log("Vercel 배포 중...")
    deploy = subprocess.run(
        ["npx", "vercel", "--prod", "--yes"], cwd=F1_ROOT,
        capture_output=True, text=True
    )
    if deploy.returncode != 0:
        log(f"배포 실패!\n{deploy.stderr[-300:]}")
        send_telegram("❌ F1 결과 업데이트 배포 실패\n" + deploy.stderr[-200:])
        return 1
    log("배포 성공")

    # ── 완료 플래그 ──
    with open(FLAG_FILE, "w") as f:
        f.write(f"updated: {winner_name}")

    # ── 텔레그램 알림 ──
    medals = ["🥇", "🥈", "🥉"]
    top3_lines = ""
    for i, r in enumerate(results[:3]):
        name = f"{r['Driver']['givenName']} {r['Driver']['familyName']}"
        team = r["Constructor"]["name"]
        pts = r["points"]
        top3_lines += f"{medals[i]} {name} ({team}) +{pts}pts\n"

    # FL 기록자
    fl_driver = next(
        (f"{r['Driver']['givenName']} {r['Driver']['familyName']}"
         for r in results if r.get("FastestLap", {}).get("rank") == "1"),
        "—"
    )
    fl_time = next(
        (r["FastestLap"]["Time"]["time"]
         for r in results if r.get("FastestLap", {}).get("rank") == "1"),
        "—"
    )

    msg = (
        f"🏁 <b>2026 호주 GP — 데이터 자동 반영 완료</b>\n\n"
        f"{top3_lines}\n"
        f"⚡ 패스티스트랩: {fl_driver} ({fl_time})\n\n"
        f"📊 드라이버 순위 · 컨스트럭터 순위 · 캘린더 업데이트 완료\n"
        f"🌐 <a href=\"https://f1.324.ing/season\">f1.324.ing/season</a>"
    )
    send_telegram(msg)

    log("모든 작업 완료!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
