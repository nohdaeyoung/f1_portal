# Design: 관리자 레이스 결과 수동 입력 (admin-race-input)

**작성일**: 2026-03-08
**Feature**: admin-race-input

---

## 1. 파일 구조

```
src/
├── app/
│   ├── admin/dashboard/
│   │   └── AdminDashboardClient.tsx    ← "레이스 결과" 탭 추가
│   └── api/admin/
│       └── race-result/
│           └── route.ts                ← 신규 API 엔드포인트
└── lib/
    └── f1-points.ts                    ← 포인트 계산 유틸 (신규)
```

---

## 2. UI 설계

### 2-1. 탭 추가

`AdminDashboardClient.tsx`의 `Section` 타입과 `sections` 배열에 `"race"` 추가.

```typescript
type Section = "analytics" | "nav" | "circuit" | "race";

const sections = [
  { id: "analytics", label: "코드 삽입" },
  { id: "nav",       label: "메뉴 관리" },
  { id: "circuit",   label: "서킷 코너" },
  { id: "race",      label: "레이스 결과" },  // 신규
];
```

### 2-2. 레이스 결과 탭 레이아웃

```
┌─────────────────────────────────────────────────────┐
│ 레이스 결과 입력                                     │
├─────────────────────────────────────────────────────┤
│ 라운드  [드롭다운: Round 2 — 중국 GP ▼]             │
│ 스프린트 주말? [체크박스]                            │
├─────────────────────────────────────────────────────┤
│ 퀄리파잉                                             │
│   폴 포지션  [드라이버 선택 ▼]                       │
├─────────────────────────────────────────────────────┤
│ 레이스 결과                                          │
│   P1   [드라이버 ▼]  [상태: Finished ▼]             │
│   P2   [드라이버 ▼]  [상태: Finished ▼]             │
│   ...                                               │
│   P20  [드라이버 ▼]  [상태: DNF ▼]                  │
│   패스티스트랩  [드라이버 ▼]  랩타임 [___________]  │
├─────────────────────────────────────────────────────┤
│ 포인트 미리보기                                      │
│   Russell    +25  │ Mercedes +43                    │
│   Norris     +18  │ McLaren  +30                    │
│   ...                                               │
├─────────────────────────────────────────────────────┤
│                          [저장 & 배포]              │
└─────────────────────────────────────────────────────┘
```

### 2-3. 상태 관리 (Client Component)

```typescript
interface RaceInputState {
  round: number;                          // 선택된 라운드
  isSprint: boolean;                      // 스프린트 주말 여부
  pole: string;                           // driverId
  results: {
    position: number;                     // 1~22
    driverId: string;
    status: "Finished" | "DNF" | "DSQ" | "DNS";
  }[];
  fastestLap: { driverId: string; time: string };
  submitting: boolean;
  submitResult: "idle" | "success" | "error";
  previewPoints: PointPreview[];          // 실시간 계산
}

interface PointPreview {
  driverId: string;
  points: number;
  teamId: string;
}
```

---

## 3. 포인트 계산 유틸 (`src/lib/f1-points.ts`)

```typescript
// F1 표준 배점
const RACE_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1];
const FL_BONUS = 1; // 10위 이내 완주 시

export function calcRacePoints(results, fastestLapDriverId, isSprint) { ... }
// → { [driverId]: points }

export function calcTeamPoints(driverPoints, drivers) { ... }
// → { [teamId]: points }
```

---

## 4. API 엔드포인트

**파일**: `src/app/api/admin/race-result/route.ts`

### Request

```typescript
POST /api/admin/race-result
Cookie: pitlane_admin=authenticated

Body: {
  season: 2026,
  round: 2,
  isSprint: false,
  qualifying: { pole: "norris" },
  results: [
    { position: 1, driverId: "norris",   status: "Finished" },
    { position: 2, driverId: "piastri",  status: "Finished" },
    ...
    { position: 20, driverId: "stroll", status: "DNF" },
  ],
  fastestLap: { driverId: "norris", time: "1:20.235" }
}
```

### Response

```typescript
{ ok: true, message: "Round 2 업데이트 완료. 빌드 시작..." }
{ ok: false, error: "인증 실패" | "빌드 실패: ..." }
```

### 처리 순서

```
1. 쿠키 인증 확인
2. 입력값 검증 (라운드 중복 여부, 드라이버 중복 여부)
3. f1-data.ts 읽기
4. 포인트 계산 (f1-points.ts 활용)
5. 아래 순서로 f1-data.ts 수정:
   a. calendar[round]: status → "completed", winner → P1 드라이버명
   b. driverStandings: 기존 포인트 + 이번 라운드 포인트 → 재정렬
   c. constructorStandings: 팀별 합산 → 재정렬
   d. drivers[]: wins/podiums/poles/points 누계
   e. teams[]: wins/podiums/poles 누계
6. f1-data.ts 저장
7. flag 파일 생성 (/tmp/f1-{season}-round{N}-updated.flag)
   → 자동화 스크립트 중복 실행 방지
8. 텔레그램 알림 (fetch to Telegram API)
9. 빌드는 백그라운드 실행 (응답 후 비동기)
   → execFile("npm", ["run", "build"]) then vercel deploy
```

> **비동기 빌드**: Next.js route handler는 응답 후 백그라운드 작업 불가 →
> Vercel에서는 `waitUntil()` 또는 별도 cron trigger 사용.
> **로컬 환경 기준**: `child_process.execFile` 비동기로 실행 후 응답.

---

## 5. f1-data.ts 수정 로직

### 5-1. 드라이버 스탠딩 재계산

```typescript
// 기존 standings에 이번 라운드 포인트 누적
const updated = driverStandings.map(s => ({
  ...s,
  points: s.points + (newPoints[s.driverId] ?? 0),
  wins: s.wins + (results.find(r => r.driverId === s.driverId)?.position === 1 ? 1 : 0),
}));
// 포인트 내림차순 정렬 후 position 재부여
updated.sort((a, b) => b.points - a.points);
updated.forEach((s, i) => s.position = i + 1);
```

### 5-2. 드라이버 경력 누계 업데이트

```typescript
// drivers 배열에서 해당 드라이버 찾아 업데이트
// wins: +1 if position === 1
// podiums: +1 if position <= 3
// poles: +1 if driverId === qualifying.pole
// points: + race points
```

### 5-3. 팀 경력 누계 업데이트

```typescript
// teams 배열에서 해당 팀 찾아 업데이트
// wins: +1 if any driver position === 1
// podiums: count of team drivers in top 3
// poles: +1 if pole driver belongs to this team
```

### 5-4. 정규식 교체 패턴 (TypeScript 코드 수정)

기존 `update-f1-round.py`와 동일한 접근:
- `driverStandings` 블록 전체 교체
- `constructorStandings` 블록 전체 교체
- `calendar` 특정 라운드 라인 부분 교체
- `drivers` 배열 개별 항목 부분 교체
- `teams` 배열 개별 항목 부분 교체

> **구현 방식**: Node.js `fs.readFileSync` / `writeFileSync` + 정규식

---

## 6. 라운드 선택 목록 (드롭다운)

미완료 라운드만 표시:
```typescript
// page.tsx (서버 컴포넌트)에서 calendar 읽어서 client에 전달
const pendingRounds = calendar
  .filter(r => r.status !== "completed")
  .map(r => ({ round: r.round, label: `Round ${r.round} — ${r.koreanName}` }));
```

---

## 7. 드라이버 목록 (드롭다운)

`drivers` 배열에서 `{ id, firstName, lastName, teamId }` 22명 전달.

---

## 8. 파일별 변경 범위

| 파일 | 변경 내용 |
|------|-----------|
| `AdminDashboardClient.tsx` | `"race"` 탭 추가, `RaceInputSection` 컴포넌트 렌더링 |
| `admin/dashboard/page.tsx` | `calendar`, `drivers` 데이터 읽어 client에 전달 |
| `api/admin/race-result/route.ts` | **신규** — 전체 처리 로직 |
| `lib/f1-points.ts` | **신규** — 포인트 계산 유틸 |

---

## 9. 구현 순서

1. `src/lib/f1-points.ts` — 포인트 계산 유틸
2. `src/app/api/admin/race-result/route.ts` — API (f1-data.ts 수정 + flag + 텔레그램)
3. `src/app/admin/dashboard/page.tsx` — calendar/drivers 데이터 전달
4. `AdminDashboardClient.tsx` — "레이스 결과" 탭 UI + 포인트 미리보기
