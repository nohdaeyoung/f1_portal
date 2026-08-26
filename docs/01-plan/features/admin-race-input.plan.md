# Plan: 관리자 레이스 결과 수동 입력 (admin-race-input)

**작성일**: 2026-03-08
**Feature**: admin-race-input
**Phase**: Plan

---

## 1. 배경 및 목적

Jolpica API 업데이트 지연 시 레이스 결과를 수동으로 입력해 사이트를 즉시 갱신할 수 있는 관리자 기능.

현재 자동화 스크립트(`update-f1-round.py`)는 Jolpica API 반영 후 동작하므로, API가 수 시간~수일 늦을 경우 수동 대응이 불가능.

---

## 2. 갱신 대상 데이터 (라운드 결과 입력 시)

### 입력 항목

| 항목 | 설명 |
|------|------|
| 라운드 번호 | 1~24 (자동 감지 또는 선택) |
| 퀄리파잉 결과 | 폴 포지션 드라이버 (1위) |
| 레이스 결과 | 최종 순위 1~20위 + 각 드라이버별 완주/리타이어 상태 |
| 패스티스트랩 | 기록 드라이버 + 랩타임 |

### 자동 계산 항목

| 항목 | 계산 방법 |
|------|-----------|
| 레이스 포인트 | F1 표준 배점 (25-18-15-12-10-8-6-4-2-1) + FL 보너스 1pt |
| 스프린트 포인트 | 스프린트 주말 별도 배점 (8-7-6-5-4-3-2-1) |
| 드라이버 스탠딩 | 누적 포인트 재계산 → 순위 재정렬 |
| 컨스트럭터 스탠딩 | 소속 팀 드라이버 포인트 합산 → 순위 재정렬 |

### 갱신 페이지 및 필드

| 페이지 | 갱신 필드 |
|--------|-----------|
| **캘린더** (`f1-data.ts`) | `status: completed`, `winner: "이름"` |
| **드라이버 스탠딩** | `position`, `points`, `wins` |
| **컨스트럭터 스탠딩** | `position`, `points`, `wins` |
| **드라이버 프로필** (`drivers[].wins/podiums/poles/points`) | 경력 누계 +1 |
| **팀 프로필** (`teams[].wins/podiums/poles`) | 경력 누계 +1 |
| **서킷 페이지** | Jolpica 기반 자동 갱신 (winner는 캘린더에서 표시) |

---

## 3. 시스템 설계

### 3-1. UI 플로우

```
/admin/dashboard
  └─ [레이스 결과 입력] 탭
        ├─ 라운드 선택 (드롭다운 — 미완료 라운드만 표시)
        ├─ 퀄리파잉 섹션
        │    └─ 폴 포지션: 드라이버 선택
        ├─ 레이스 결과 섹션
        │    └─ 22명 드라이버 순위 입력 (드래그&드롭 or 드롭다운)
        │    └─ 각 드라이버: 완주/DNF/DSQ 상태
        │    └─ 패스티스트랩 드라이버 선택
        ├─ [포인트 미리보기] 자동 계산 표시
        └─ [저장 & 배포] 버튼
```

### 3-2. API 엔드포인트

```
POST /api/admin/race-result
  Body: {
    season: number,
    round: number,
    qualifying: { pole: driverId },
    results: [
      { position: 1, driverId: string, status: "Finished" | "DNF" | "DSQ" },
      ...
    ],
    fastestLap: { driverId: string, time: string }
  }
  → f1-data.ts 수정 + 빌드 트리거
```

### 3-3. 데이터 처리 흐름

```
1. 입력값 수신
2. F1 표준 배점으로 포인트 계산
3. f1-data.ts 읽기
4. 아래 항목 순서로 업데이트:
   a. calendar[round].status → "completed", winner
   b. driverStandings[] 재계산 (누적 포인트 + 순위 정렬)
   c. constructorStandings[] 재계산
   d. drivers[].wins / podiums / poles / points 경력 누계
   e. teams[].wins / podiums / poles 경력 누계
5. f1-data.ts 저장
6. `npm run build` 실행
7. `npx vercel --prod` 배포
8. 텔레그램 알림
```

---

## 4. 포인트 배점표

### 레이스 포인트

| 순위 | 포인트 |
|------|--------|
| 1 | 25 |
| 2 | 18 |
| 3 | 15 |
| 4 | 12 |
| 5 | 10 |
| 6 | 8 |
| 7 | 6 |
| 8 | 4 |
| 9 | 2 |
| 10 | 1 |
| 11+ | 0 |
| 패스티스트랩 (10위 이내 완주) | +1 |

### 스프린트 포인트

| 순위 | 포인트 |
|------|--------|
| 1 | 8 |
| 2 | 7 |
| 3 | 6 |
| 4 | 5 |
| 5 | 4 |
| 6 | 3 |
| 7 | 2 |
| 8 | 1 |
| 9+ | 0 |

---

## 5. 범위 (Scope)

### In-scope
- `/admin/dashboard` 내 "레이스 결과" 탭 신규 추가
- `POST /api/admin/race-result` API 엔드포인트
- f1-data.ts 자동 수정 (standings, calendar, driver/team 경력 누계)
- 포인트 자동 계산 (레이스 + FL 보너스)
- 저장 후 빌드 & Vercel 배포 자동 실행
- 텔레그램 알림

### Out-of-scope
- 퀄리파잉 전체 결과 입력 (폴만 입력)
- 스프린트 결과 별도 입력 (Phase 2)
- 실시간 레이스 진행 중 라이브 업데이트
- 과거 라운드 결과 수정 UI (직접 파일 수정으로 대응)

---

## 6. 기존 인프라 활용

- **인증**: 기존 `pitlane_admin` 쿠키 (ID: dynoworld) 재사용
- **미들웨어**: 기존 `/admin/*` 보호 그대로 활용
- **배포**: 기존 `subprocess.run(["npx", "vercel", ...])` 패턴 재사용
- **텔레그램**: 기존 bot token/channel 재사용

---

## 7. 성공 기준

- [ ] 관리자가 레이스 결과 입력 후 저장 시 5분 이내 사이트 전체 반영
- [ ] 드라이버/컨스트럭터 스탠딩 포인트가 정확히 계산되어 업데이트
- [ ] 드라이버 프로필(wins/podiums/poles) 경력 누계 자동 증가
- [ ] 팀 프로필(wins/podiums/poles) 경력 누계 자동 증가
- [ ] 캘린더 해당 라운드 `completed` + `winner` 반영
- [ ] Jolpica API와 중복 실행 방지 (flag 파일 연동)

---

## 8. 참고 파일

| 파일 | 역할 |
|------|------|
| `/Volumes/Dev/f1/src/data/f1-data.ts` | 수정 대상 데이터 파일 |
| `/Volumes/Dev/f1/src/app/admin/dashboard/page.tsx` | 기존 관리자 대시보드 |
| `/Volumes/Dev/f1/src/app/api/admin/` | 기존 admin API 디렉터리 |
| `/Volumes/Dev/f1/src/middleware.ts` | 인증 미들웨어 |
| `/Volumes/Dev/f1/scripts/update-f1-round.py` | 자동화 스크립트 (패턴 참고) |
