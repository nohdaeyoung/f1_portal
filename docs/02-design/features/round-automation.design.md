# Design: round-automation

**작성일**: 2026-03-08
**Feature**: round-automation

---

## 1. 파일 구조

```
/Volumes/Dev/f1/scripts/
  check-f1-results.py          # 기존 (Round 1 전용) — 유지
  update-f1-round.py           # 신규 (범용화)

~/Library/LaunchAgents/
  com.f1.roundcheck.plist      # launchd 영구 크론
```

---

## 2. `update-f1-round.py` 설계

### 인터페이스
```
python3 update-f1-round.py [--round N] [--season YYYY] [--force]
  --round N     : 라운드 번호 (생략 시 캘린더에서 자동 감지)
  --season YYYY : 시즌 (기본값: 2026)
  --force       : flag 파일 무시하고 강제 재실행
```

### 자동 라운드 감지 로직
```
f1-data.ts 의 calendar 파싱 → status == "next" 인 라운드 추출
  → round 번호, circuitId, date, koreanName 획득
```

### Flag 파일 패턴
```
/tmp/f1-{season}-round{N}-updated.flag
예: /tmp/f1-2026-round2-updated.flag
```

### 데이터 흐름
```
1. flag 파일 존재? → 종료
2. Jolpica API → 해당 라운드 results 조회
3. 결과 없음? → 종료 (다음 폴링 대기)
4. 결과 있음?
   ├── driver standings 조회 (position 키 없을 수 있음 → enumerate 폴백)
   ├── constructor standings 조회 (비어있으면 results에서 계산)
   ├── f1-data.ts 업데이트
   │     ├── driverStandings[]
   │     ├── constructorStandings[]
   │     └── calendar[round N] → status: completed, winner
   ├── npm run build
   ├── npx vercel --prod
   ├── flag 파일 생성
   └── 텔레그램 알림
```

### calendar regex (동적)
```python
# status 업데이트
re.sub(
    rf'(\{{ round: {round_num},.*?date: "{race_date}", status: ")[^"]*(")',
    r'\g<1>completed\g<2>',
    content, flags=re.DOTALL
)

# winner 추가
re.sub(
    rf'(\{{ round: {round_num},.*?date: "{race_date}", status: "completed")(, winner: "[^"]*")? \}}',
    rf'\g<1>, winner: "{winner_name}" }}',
    content, flags=re.DOTALL
)
```

---

## 3. launchd plist 설계

**파일**: `~/Library/LaunchAgents/com.f1.roundcheck.plist`

```xml
<key>StartInterval</key>
<integer>900</integer>   <!-- 15분 = 900초 -->
```

- 로그: `/tmp/f1-roundcheck.log` (stdout + stderr)
- 로드 명령: `launchctl load ~/Library/LaunchAgents/com.f1.roundcheck.plist`
- 언로드: `launchctl unload ~/Library/LaunchAgents/com.f1.roundcheck.plist`

---

## 4. 텔레그램 메시지 (동적)

```
🏁 <b>2026 {koreanName} — 데이터 자동 반영 완료</b>

🥇 {name} ({team}) +{pts}pts
🥈 ...
🥉 ...

⚡ 패스티스트랩: {fl_driver} ({fl_time})

📊 드라이버 순위 · 컨스트럭터 순위 · 캘린더 업데이트 완료
🌐 <a href="https://f1.324.ing/season">f1.324.ing/season</a>
```
