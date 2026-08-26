#!/usr/bin/env python3
"""
F1 라운드 자동화 스크립트 (범용)
- Jolpica API에서 해당 라운드 결과 감지
- f1-data.ts 업데이트 (standings + calendar)
- Vercel 빌드 & 배포
- 텔레그램 알림 발송

사용법:
  python3 update-f1-round.py               # 캘린더에서 다음 라운드 자동 감지
  python3 update-f1-round.py --round 2     # 특정 라운드 지정
  python3 update-f1-round.py --round 2 --force  # flag 무시하고 강제 실행
"""

import urllib.request
import json
import sys
import os
import subprocess
import re
import argparse
from datetime import datetime
from typing import Optional

# ─── 설정 ──────────────────────────────────────────────────────

TELEGRAM_BOT_TOKEN = "8604511383:AAGOe4Jfo9RkAMpN9-d-6-4jJvBRctHEkNE"
TELEGRAM_CHANNEL_ID = "@f1324ing"
F1_ROOT = "/Volumes/Dev/f1"
F1_DATA_PATH = f"{F1_ROOT}/src/data/f1-data.ts"

# ─── ID 매핑 ───────────────────────────────────────────────────

DRIVER_MAP = {
    "max_verstappen": "verstappen", "isack_hadjar": "hadjar", "hadjar": "hadjar",
    "lando_norris": "norris", "oscar_piastri": "piastri",
    "lewis_hamilton": "hamilton", "charles_leclerc": "leclerc",
    "george_russell": "russell",
    "andrea_kimi_antonelli": "antonelli", "kimi_antonelli": "antonelli",
    "antonelli": "antonelli",
    "fernando_alonso": "alonso", "lance_stroll": "stroll",
    "pierre_gasly": "gasly", "franco_colapinto": "colapinto",
    "carlos_sainz": "sainz", "alexander_albon": "albon",
    "liam_lawson": "lawson", "arvid_lindblad": "lindblad",
    "yuki_tsunoda": "tsunoda",
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
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)

def detect_next_round(content: str) -> Optional[dict]:
    """
    업데이트 대상 라운드 자동 감지.
    우선순위:
      1) status == "next" 인 항목
      2) status == "upcoming" 중 레이스 날짜가 오늘 이전인 가장 최근 라운드
         (레이스가 치러졌지만 아직 캘린더가 갱신되지 않은 경우)
    """
    from datetime import date
    today = date.today()

    # 1순위: "next" 상태
    pattern_next = r'\{\s*round:\s*(\d+),\s*name:\s*"([^"]+)",\s*koreanName:\s*"([^"]+)",\s*circuitId:\s*"([^"]+)",\s*date:\s*"([^"]+)",\s*status:\s*"next"'
    match = re.search(pattern_next, content)
    if match:
        return {
            "round": int(match.group(1)),
            "name": match.group(2),
            "koreanName": match.group(3),
            "circuitId": match.group(4),
            "date": match.group(5),
        }

    # 2순위: "upcoming" 중 날짜가 오늘 이전인 가장 최근 라운드
    pattern_upcoming = r'\{\s*round:\s*(\d+),\s*name:\s*"([^"]+)",\s*koreanName:\s*"([^"]+)",\s*circuitId:\s*"([^"]+)",\s*date:\s*"([^"]+)",\s*status:\s*"upcoming"'
    candidates = []
    for m in re.finditer(pattern_upcoming, content):
        race_date = m.group(5)
        try:
            rd = date.fromisoformat(race_date)
        except ValueError:
            continue
        if rd <= today:
            candidates.append({
                "round": int(m.group(1)),
                "name": m.group(2),
                "koreanName": m.group(3),
                "circuitId": m.group(4),
                "date": race_date,
                "_rd": rd,
            })

    if candidates:
        # 가장 최근 날짜 (= 가장 큰 날짜)
        best = max(candidates, key=lambda x: x["_rd"])
        best.pop("_rd")
        return best

    return None

def get_round_info(content: str, round_num: int) -> Optional[dict]:
    """f1-data.ts 에서 특정 라운드 정보 추출"""
    pattern = rf'\{{\s*round:\s*{round_num},\s*name:\s*"([^"]+)",\s*koreanName:\s*"([^"]+)",\s*circuitId:\s*"([^"]+)",\s*date:\s*"([^"]+)"'
    match = re.search(pattern, content)
    if match:
        return {
            "round": round_num,
            "name": match.group(1),
            "koreanName": match.group(2),
            "circuitId": match.group(3),
            "date": match.group(4),
        }
    return None

# ─── 메인 ──────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="F1 라운드 결과 자동 업데이트")
    parser.add_argument("--round", type=int, default=None, help="라운드 번호 (생략 시 자동 감지)")
    parser.add_argument("--season", type=int, default=2026, help="시즌 연도 (기본값: 2026)")
    parser.add_argument("--force", action="store_true", help="flag 파일 무시하고 강제 실행")
    args = parser.parse_args()

    season = args.season

    # ── 캘린더에서 라운드 정보 읽기 ──
    with open(F1_DATA_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    if args.round:
        round_info = get_round_info(content, args.round)
        if not round_info:
            log(f"Round {args.round} 정보를 f1-data.ts에서 찾을 수 없습니다.")
            return 1
    else:
        round_info = detect_next_round(content)
        if not round_info:
            log("업데이트할 라운드 없음 (레이스 날짜가 아직 미래이거나 모든 라운드 완료).")
            return 0

    round_num = round_info["round"]
    race_date = round_info["date"]
    korean_name = round_info["koreanName"]
    circuit_id = round_info["circuitId"]

    flag_file = f"/tmp/f1-{season}-round{round_num}-updated.flag"
    poll_start_file = f"/tmp/f1-{season}-round{round_num}-polling-start.flag"
    POLL_WINDOW_HOURS = 4

    log(f"대상: {season} Round {round_num} — {korean_name} ({circuit_id}, {race_date})")

    # ── Flag 확인 ──
    if not args.force and os.path.exists(flag_file):
        log(f"이미 업데이트 완료 (flag: {flag_file}). 종료.")
        return 0

    # ── 4시간 폴링 윈도우 체크 ──
    if not args.force:
        now = datetime.now().timestamp()
        if not os.path.exists(poll_start_file):
            with open(poll_start_file, "w") as f:
                f.write(str(now))
            log(f"폴링 시작 기록 (최대 {POLL_WINDOW_HOURS}시간 동안 재시도).")
        else:
            with open(poll_start_file) as f:
                start_ts = float(f.read().strip())
            elapsed_hours = (now - start_ts) / 3600
            if elapsed_hours > POLL_WINDOW_HOURS:
                log(f"폴링 윈도우 {POLL_WINDOW_HOURS}시간 초과 ({elapsed_hours:.1f}h 경과). 종료.")
                return 0
            log(f"폴링 경과: {elapsed_hours:.1f}h / {POLL_WINDOW_HOURS}h")

    # ── 결과 조회 ──
    log(f"Jolpica API → {season}/Round {round_num} 결과 확인 중...")
    try:
        data = fetch_json(f"https://api.jolpi.ca/ergast/f1/{season}/{round_num}/results.json?limit=30")
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
    driver_standings = []
    try:
        ds_data = fetch_json(f"https://api.jolpi.ca/ergast/f1/{season}/driverstandings.json")
        ds_lists = ds_data["MRData"]["StandingsTable"]["StandingsLists"]
        driver_standings = ds_lists[0]["DriverStandings"] if ds_lists else []
    except Exception as e:
        log(f"드라이버 스탠딩 실패: {e}")

    # ── Constructor Standings ──
    log("컨스트럭터 스탠딩 조회 중...")
    constructor_standings = []
    try:
        cs_data = fetch_json(f"https://api.jolpi.ca/ergast/f1/{season}/constructorstandings.json")
        cs_lists = cs_data["MRData"]["StandingsTable"]["StandingsLists"]
        if cs_lists:
            constructor_standings = cs_lists[0]["ConstructorStandings"]
    except Exception as e:
        log(f"컨스트럭터 스탠딩 엔드포인트 실패: {e}")

    # 전용 엔드포인트가 비어있으면 레이스 결과에서 계산
    if not constructor_standings:
        log("컨스트럭터 스탠딩 없음 → 레이스 결과에서 계산 중...")
        try:
            all_data = fetch_json(f"https://api.jolpi.ca/ergast/f1/{season}/results.json?limit=1000")
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
        if "cadillac" not in seen_teams:
            lines.append(f'  {{ position: {len(lines)+1}, teamId: "cadillac", points: 0, wins: 0 }},')
        new_cs = "export const constructorStandings: ConstructorStanding[] = [\n" + "\n".join(lines) + "\n];"
        content = re.sub(
            r"export const constructorStandings: ConstructorStanding\[\] = \[[\s\S]*?\];",
            new_cs, content, count=1
        )
        log(f"constructorStandings 업데이트 ({len(constructor_standings)}팀)")

    # 3) calendar 업데이트 — status: completed + winner
    content = re.sub(
        rf'(\{{ round: {round_num},.*?date: "{race_date}", status: ")[^"]*(")',
        r'\g<1>completed\g<2>',
        content, flags=re.DOTALL
    )
    content = re.sub(
        rf'(\{{ round: {round_num},.*?date: "{race_date}", status: "completed")(, winner: "[^"]*")? \}}',
        rf'\g<1>, winner: "{winner_name}" }}',
        content, flags=re.DOTALL
    )
    log(f"calendar Round {round_num} → completed, winner: {winner_name}")

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
        send_telegram(f"❌ F1 {korean_name} 업데이트 빌드 실패\n" + build.stderr[-200:])
        return 1
    log("빌드 성공")

    log("Vercel 배포 중...")
    deploy = subprocess.run(
        ["npx", "vercel", "--prod", "--yes"], cwd=F1_ROOT,
        capture_output=True, text=True
    )
    if deploy.returncode != 0:
        log(f"배포 실패!\n{deploy.stderr[-300:]}")
        send_telegram(f"❌ F1 {korean_name} 배포 실패\n" + deploy.stderr[-200:])
        return 1
    log("배포 성공")

    # ── 완료 플래그 ──
    with open(flag_file, "w") as f:
        f.write(f"updated: {winner_name}")
    if os.path.exists(poll_start_file):
        os.remove(poll_start_file)

    # ── 텔레그램 알림 ──
    medals = ["🥇", "🥈", "🥉"]
    top3_lines = ""
    for i, r in enumerate(results[:3]):
        name = f"{r['Driver']['givenName']} {r['Driver']['familyName']}"
        team = r["Constructor"]["name"]
        pts = r["points"]
        top3_lines += f"{medals[i]} {name} ({team}) +{pts}pts\n"

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
        f"🏁 <b>{season} {korean_name} — 데이터 자동 반영 완료</b>\n\n"
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
