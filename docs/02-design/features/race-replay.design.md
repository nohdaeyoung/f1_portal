# Design: 레이스 리플레이 시각화 (race-replay)

> Plan: `docs/01-plan/features/race-replay.plan.md`
> Phase: Design

---

## 1. 아키텍처 개요

```
[FastF1 Python API]         [Next.js Frontend]
 fastf1-api/main.py
  GET /replay-frames   →     ReplayClient.tsx
  GET /track-map             useReplayPlayer() hook
  GET /results               requestAnimationFrame loop
                              │
                              ├─ ReplayPlayer (Canvas)
                              ├─ ReplayControls (재생 UI)
                              └─ ReplayLeaderboard (순위)
```

---

## 2. 백엔드: FastF1 API 확장

### 2-1. 새 엔드포인트: `GET /replay-frames`

**파일**: `fastf1-api/main.py`

**파라미터**
| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `year` | int | 2026 | 시즌 연도 |
| `gp` | str | - | 라운드 번호 또는 GP명 |
| `session` | str | "R" | 세션 타입 (R/S) |
| `fps` | int | 5 | 초당 프레임 수 (최대 10) |

**응답 구조**
```python
{
  "total_laps": int,
  "total_frames": int,
  "fps": int,
  "track": [{"x": float, "y": float}],        # 트랙 윤곽 좌표
  "bounds": {"min_x": float, "max_x": float,  # 정규화용 바운드
             "min_y": float, "max_y": float},
  "drivers": ["VER", "NOR", ...],              # 참가 드라이버 목록
  "colors": {"VER": "3671C6", ...},            # 팀 컬러 hex
  "compounds": {"VER": ["SOFT", "HARD", ...]}, # 스틴트별 타이어
  "frames": [
    {
      "lap": int,
      "t": float,                              # 세션 내 경과 시간(초)
      "positions": [
        {"d": "VER", "x": float, "y": float,
         "status": "on_track"|"pit"|"out",
         "compound": "SOFT"|"MEDIUM"|"HARD"|"INTER"|"WET"},
        ...
      ],
      "leaderboard": [                         # 해당 프레임 순위
        {"pos": int, "d": str, "gap": float|null, "compound": str}
      ]
    }
  ]
}
```

**구현 방식** (`f1_data.py` 참고):
1. `sess.pos_data` → 드라이버별 X/Y 좌표 시계열 로드
2. `sess.laps` → 스틴트/타이어/순위 정보
3. 0.2초(fps=5) 또는 0.1초(fps=10) 간격으로 리샘플링
4. 좌표 보간: `pandas.resample` + `interpolate(method='linear')`
5. 트랙 윤곽: 가장 빠른 드라이버 qualifying lap `pos_data` 사용
6. 응답 압축: `fps=5` 기준 약 2~4MB (전체 레이스)

---

## 3. 프론트엔드 타입 정의

**파일**: `src/lib/api/fastf1.ts` 에 추가

```typescript
export interface FF1ReplayPosition {
  d: string;          // driver abbreviation
  x: number;          // normalized 0-1
  y: number;          // normalized 0-1
  status: "on_track" | "pit" | "out";
  compound: string;
}

export interface FF1ReplayLeaderRow {
  pos: number;
  d: string;
  gap: number | null;  // seconds behind leader
  compound: string;
}

export interface FF1ReplayFrame {
  lap: number;
  t: number;
  positions: FF1ReplayPosition[];
  leaderboard: FF1ReplayLeaderRow[];
}

export interface FF1ReplayData {
  total_laps: number;
  total_frames: number;
  fps: number;
  track: { x: number; y: number }[];
  bounds: { min_x: number; max_x: number; min_y: number; max_y: number };
  drivers: string[];
  colors: Record<string, string>;
  compounds: Record<string, string[]>;
  frames: FF1ReplayFrame[];
}

// API 함수
export async function getFF1ReplayFrames(
  year: number,
  gp: string,
  session = "R",
  fps = 5
): Promise<FF1ReplayData> {
  return ff1Fetch<FF1ReplayData>("/replay-frames", { year, gp, session, fps });
}
```

---

## 4. 컴포넌트 설계

### 4-1. `useReplayPlayer` hook

**파일**: `src/hooks/useReplayPlayer.ts`

```typescript
interface ReplayPlayerState {
  isPlaying: boolean;
  currentFrame: number;
  currentLap: number;
  playbackRate: number;  // 0.5 | 1 | 2 | 4
  totalFrames: number;
}

interface ReplayPlayerActions {
  play: () => void;
  pause: () => void;
  seek: (frame: number) => void;
  setPlaybackRate: (rate: number) => void;
  rewind: (seconds: number) => void;
}
```

**동작**:
- `requestAnimationFrame` 루프로 `currentFrame` 증가
- `playbackRate` × fps 기준 실제 진행 속도 계산
- `isPlaying=false` 시 rAF 취소, unmount 시 cleanup

### 4-2. `ReplayPlayer` 컴포넌트

**파일**: `src/components/replay/ReplayPlayer.tsx`

**Canvas 렌더링 순서**:
1. 배경 (`fillRect` 검은색)
2. 트랙 윤곽 (polyline, `#2D2D3A` stroke)
3. 피트레인 표시 (선택)
4. 드라이버 도트: `fillArc` (반지름 6px) + 팀 컬러
5. 드라이버 레이블: abbreviation (10px Inter font, 흰색)

**좌표 변환**:
```typescript
// API 응답 x/y (0~1 정규화) → Canvas 픽셀
const toCanvas = (x: number, y: number, canvas: HTMLCanvasElement) => ({
  cx: PADDING + x * (canvas.width - PADDING * 2),
  cy: PADDING + y * (canvas.height - PADDING * 2),
});
```

**Props**:
```typescript
interface ReplayPlayerProps {
  data: FF1ReplayData;
  currentFrame: number;
  width?: number;
  height?: number;
  highlightDrivers?: string[];  // 선택 드라이버 강조
}
```

### 4-3. `ReplayControls` 컴포넌트

**파일**: `src/components/replay/ReplayControls.tsx`

**UI 구성**:
```
[◀◀ -10s] [▶/⏸] [현재 랩: N/총 N]  [━━━━●━━━━ 진행바] [0.5x][1x][2x][4x]
```

- 진행바: `<input type="range">` → `seek(frame)`
- 배속 버튼: 클릭 시 토글 (현재 배속 강조)
- 키보드: Space=재생/일시정지, ←=되감기, →=빠르게, 1~4=배속

### 4-4. `ReplayLeaderboard` 컴포넌트

**파일**: `src/components/replay/ReplayLeaderboard.tsx`

**표시 내용** (현재 프레임의 `leaderboard` 배열 기준):
```
P1  VER  ■ SOFT   leader
P2  NOR  ■ HARD   +2.4s
P3  HAM  ■ MED    +5.1s
...
```

- 팀 컬러 바 (3px 좌측 border)
- 타이어 화합물 색상 뱃지 (기존 `CompoundBadge` 컴포넌트 재사용)
- 피트인 드라이버: 🔧 아이콘 + 행 dimmed
- 은퇴 드라이버: "OUT" 텍스트 + 행 strike-through

---

## 5. 페이지별 통합 설계

### 5-1. `TelemetryClient.tsx` 탭 추가

**변경**: `TABS` 배열에 항목 추가 + 탭 컨텐츠 분기

```typescript
const TABS = [
  { key: "telemetry", label: "텔레메트리" },
  { key: "laps",      label: "랩 분석" },
  { key: "strategy",  label: "레이스 전략" },
  { key: "speedmap",  label: "속도맵" },
  { key: "replay",    label: "리플레이" },  // 신규
];
```

탭 컨텐츠:
```tsx
{activeTab === "replay" && (
  <ReplayTab year={year} gp={gp} session={session} />
)}
```

**`ReplayTab.tsx`** (`src/app/season/race/[round]/analysis/tabs/`):
- `getFF1ReplayFrames()` 호출 (로딩 표시 포함)
- `useReplayPlayer` hook 사용
- `ReplayPlayer` + `ReplayControls` + `ReplayLeaderboard` 조합

### 5-2. `/season/race/[round]/replay/page.tsx` (신규)

```
/season/race/[round]/replay
  ├── page.tsx (Server Component)
  │     generateStaticParams: 24라운드
  │     완료 여부 체크: 미완료 → 안내 UI
  └── ReplayClient.tsx (Client Component)
        풀스크린 레이아웃
        ReplayPlayer (대형 Canvas)
        ReplayControls
        ReplayLeaderboard (사이드 패널)
```

**레이아웃**:
```
┌─────────────────────────────────────────┐
│  [← 레이스 페이지]  [분석]  Round N · GP명  │
├─────────────────────────────────────────┤
│                        │ P1 VER ■ SOFT  │
│      Canvas             │ P2 NOR ■ HARD  │
│    (트랙 리플레이)      │ P3 HAM ■ MED   │
│                        │ ...             │
├─────────────────────────────────────────┤
│  [◀◀] [▶] Lap 24/57 ━━━●━━ [0.5x][1x][2x][4x] │
└─────────────────────────────────────────┘
```

### 5-3. `/season/race/[round]/page.tsx` 변경

히어로 또는 세션 섹션 하단에 버튼 행 추가:
```tsx
{race.isCompleted && (
  <div className="flex gap-2 mt-4">
    <Link href={`/season/race/${round}/analysis`} ...>분석</Link>
    <Link href={`/season/race/${round}/replay`} ...>리플레이</Link>
  </div>
)}
```

### 5-4. `/season/page.tsx` 변경

캘린더 라운드 카드 링크 행에 리플레이 링크 추가:
```tsx
{race.isCompleted && (
  <Link href={`/season/race/${race.round}/replay`}>리플레이 →</Link>
)}
```

---

## 6. 데이터 흐름 다이어그램

```
사용자 접근 /season/race/1/replay
    │
    ▼
page.tsx (SSR)
  - fetchCalendar() → race 정보
  - isCompleted 확인
    │
    ▼
ReplayClient.tsx (Client, 마운트)
  - fetch /api/fastf1/replay-frames?year=2026&gp=1&session=R&fps=5
      │
      ▼
  Next.js /api/fastf1/[...path]/route.ts (프록시)
      │
      ▼
  FastF1 Python API :8000/replay-frames
    - fastf1.get_session(2026, 1, 'R').load()
    - pos_data 리샘플링 → frames 배열
    - 응답 JSON
      │
      ▼
  ReplayClient: data 저장
  useReplayPlayer: rAF 루프 시작
  ReplayPlayer: Canvas 렌더링
```

---

## 7. 레이스 완료 여부 판단 로직

`race.isCompleted` 기준:
```typescript
// src/lib/data/live.ts 또는 f1-data.ts 확장
const isCompleted = race.date < new Date().toISOString();
```
- 단순 날짜 비교 (레이스 날짜가 오늘 이전이면 완료)
- 이미 `/season/race/[round]/page.tsx`에서 사용 중인 패턴과 동일

---

## 8. 성능 고려사항

| 항목 | 전략 |
|------|------|
| 데이터 로딩 | fps=5로 제한 → 레이스 기준 약 3,000프레임, ~3MB |
| Canvas 렌더링 | 20명 드라이버 도트: fillArc ×20 = 매우 빠름 |
| rAF 루프 | `useEffect` cleanup으로 unmount 시 반드시 취소 |
| 재로딩 방지 | `useRef`에 data 저장, 탭 전환 시 재fetch 없음 |
| 메모리 | frames 배열 (~3MB) → unmount 시 GC 자동 처리 |

---

## 9. 구현 순서 (Do Phase 기준)

1. `fastf1-api/main.py` — `/replay-frames` 엔드포인트 구현
2. `src/lib/api/fastf1.ts` — `FF1ReplayData` 타입 + `getFF1ReplayFrames()` 추가
3. `src/hooks/useReplayPlayer.ts` — rAF 기반 재생 hook
4. `src/components/replay/ReplayPlayer.tsx` — Canvas 렌더러
5. `src/components/replay/ReplayControls.tsx` — 컨트롤 UI
6. `src/components/replay/ReplayLeaderboard.tsx` — 리더보드
7. `src/app/season/race/[round]/analysis/tabs/ReplayTab.tsx` — 탭 래퍼
8. `TelemetryClient.tsx` — TABS에 "리플레이" 추가
9. `src/app/season/race/[round]/replay/` — 전용 페이지
10. `/season/page.tsx`, `/season/race/[round]/page.tsx` — 링크 추가

---

*Created: 2026-03-07 | Feature: race-replay | Phase: Design*
