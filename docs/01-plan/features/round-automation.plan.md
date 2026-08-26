# Plan: F1 라운드 자동화 (round-automation)

**작성일**: 2026-03-08
**Feature**: round-automation
**Phase**: Plan

---

## 1. 배경 및 목적

Round 1 (호주 GP) 자동화에서 학습한 내용을 바탕으로, **매 라운드마다 재사용 가능한 범용 자동화 파이프라인**을 구축한다.

현재 `check-f1-results.py`는 Round 1 + 호주 GP에 하드코딩되어 있어, Round 2부터는 수동으로 스크립트를 수정해야 한다.

---

## 2. 문제 정의

### 현재 한계 (Round 1 스크립트)
| 항목 | 현재 상태 | 문제 |
|------|-----------|------|
| 라운드 번호 | `2026/1/results.json` 하드코딩 | 매 라운드마다 수정 필요 |
| 서킷 ID | `"albert-park"` 하드코딩 | 매 라운드마다 수정 필요 |
| 날짜 | `"2026-03-08"` 하드코딩 | 매 라운드마다 수정 필요 |
| 텔레그램 메시지 | `"2026 호주 GP"` 하드코딩 | 매 라운드마다 수정 필요 |
| Flag 파일 | `/tmp/f1-2026-round1-updated.flag` 하드코딩 | 라운드별 구분 불가 |
| 크론 | Claude 세션 의존 (3일 만료) | 세션 종료 시 폴링 중단 |

### Known Issues (Round 1에서 발견)
1. Jolpica `position` 키 누락 — 일부 드라이버 스탠딩 항목에 `position` 없음
2. Constructor Standings endpoint 비어있음 → 레이스 결과에서 계산 필요
3. 크론이 Claude 세션에 종속 → 영구 크론 필요

---

## 3. 목표

### Round 2+ 적용 목표
1. **범용화**: 라운드 번호만 인자로 받아 어느 라운드든 동작
2. **자동 라운드 감지**: 캘린더에서 다음 레이스 라운드/날짜/서킷 자동 추출
3. **영구 크론**: `launchd` (macOS) plist로 세션 독립적 실행
4. **다중 라운드 지원**: `f1-data.ts`의 모든 라운드 calendar status 업데이트
5. **에러 복구**: 빌드/배포 실패 시 텔레그램으로 오류 알림 + 재시도 로직

---

## 4. 범위 (Scope)

### In-scope
- `check-f1-results.py` → `update-f1-round.py` 로 리팩토링 (라운드 번호 파라미터화)
- `launchd` plist 파일 생성 (`com.f1.roundcheck.plist`) — 레이스 주간에만 활성화
- `f1-data.ts` calendar regex 범용화 (round: N 동적 패턴)
- 텔레그램 메시지 동적 포맷 (라운드명 + 서킷명 자동)

### Out-of-scope
- OpenF1 실시간 데이터 자동화 (별도 태스크)
- 스프린트 라운드 별도 처리
- 웹훅 기반 이벤트 드리븐 방식 (현재 폴링 유지)

---

## 5. 구현 계획

### Phase 1: 스크립트 범용화
```
update-f1-round.py [--round N] [--season YYYY]
  - round: 없으면 캘린더에서 가장 최근 "next" 라운드 자동 감지
  - season: 없으면 2026 기본값
  - flag: /tmp/f1-{season}-round{N}-updated.flag
```

### Phase 2: launchd 영구 크론
```
~/Library/LaunchAgents/com.f1.roundcheck.plist
  - 레이스 당일 및 다음날: 15분 간격 실행
  - 평소: 비활성화 (또는 3시간 간격)
  - 로그: /tmp/f1-roundcheck.log
```

### Phase 3: calendar regex 범용화
```python
# Before (Round 1 하드코딩)
r'(\{ round: 1,.*?date: "2026-03-08", status: ")[^"]*(")'

# After (동적)
r'(\{ round: ' + str(round_num) + r',.*?date: "' + race_date + r'", status: ")[^"]*(")'
```

---

## 6. 성공 기준

- [ ] `python3 update-f1-round.py --round 2` 실행 시 Round 2 데이터 자동 업데이트
- [ ] launchd plist 등록 후 Claude 세션 종료해도 폴링 계속 동작
- [ ] Round 2 (사우디 GP, 2026-03-22) 레이스 결과 자동 반영
- [ ] 텔레그램 메시지에 정확한 라운드/서킷명 표시

---

## 7. 참고

- **현재 스크립트**: `/Volumes/Dev/f1/scripts/check-f1-results.py`
- **데이터 파일**: `/Volumes/Dev/f1/src/data/f1-data.ts`
- **Jolpica API**: `https://api.jolpi.ca/ergast/f1/2026/{round}/results.json`
- **Round 2**: 중국 GP, `shanghai`, **2026-03-15**
- **Round 3**: 일본 GP, `suzuka`, 2026-03-29
