# Plan: live-session-display

## Feature Overview
F1 PitLane 메인 페이지에 세션 진행 중 실시간/준실시간 데이터 표시 및 세션 시작 카운트다운 기능 추가

## Goals
1. 세션 시작 24시간 이내: D-Day 숫자 대신 HH:MM:SS 카운트다운 표시 (매초 갱신)
2. 세션 진행 중: OpenF1 API를 통한 실시간/준실시간 데이터 대시보드 표시

## User Requirements
- 세션 진행 중일 때 실시간/준실시간 데이터 모두 표기
- 세션 시작까지 남은 시간이 24시간 이하일 경우 시:분:초로 표시

## Data Sources
### OpenF1 API (실시간, 4초)
- 순위 (positions): 각 드라이버 레이스 포지션
- 갭/인터벌 (intervals): 리더 대비 시간 차이
- 레이스 컨트롤 (race_control): 깃발 상태, SC, 공식 메시지

### OpenF1 API (준실시간, 10~30초)
- 랩 타임 (laps): 섹터별 시간, 최고속도
- 피트스톱 (pit): 최근 피트 활동
- 스틴트/타이어 (stints): 컴파운드, 나이
- 날씨 (weather): 기온, 트랙온도, 강우

## Technical Approach
- **카운트다운**: Client Component (`CountdownTimer`) — useEffect + setInterval (1초)
- **라이브 데이터**: Client Component (`LiveSessionDashboard`) — OpenF1 직접 호출 (CORS 지원)
- **세션 키 조회**: Next.js API Route (`/api/live/session`) — `getLatestSession()` 래핑
- **폴링**: 각 데이터 그룹별 interval (실시간: 4초, 준실시간: 10~30초)

## Files to Create/Modify
### New
- `src/components/live/CountdownTimer.tsx` — 카운트다운 클라이언트 컴포넌트
- `src/components/live/LiveSessionDashboard.tsx` — 라이브 세션 대시보드
- `src/app/api/live/session/route.ts` — 현재 세션 키 조회 API

### Modified
- `src/app/page.tsx` — CountdownTimer, LiveSessionDashboard 통합

## UI Layout (세션 진행 중)

```
┌─────────────────────────────────────────────┐
│  RACE WEEK ● Round N                        │
│  레이스명                                    │
│  [다음 세션: FP2 | 14:00]                   │
│  [세션 타임테이블]                           │
└─────────────────────────────────────────────┘
┌──────────────┬──────────────┬──────────────┐
│  🏁 순위     │  ⏱ 인터벌   │  🚦 RC 메시지│
│  실시간(4s)  │  실시간(4s)  │  실시간(4s)  │
└──────────────┴──────────────┴──────────────┘
┌──────────────┬──────────────┬──────────────┐
│  🔄 랩/섹터  │  🛞 타이어   │  🌤 날씨     │
│  준실시간(10s)│ 준실시간(10s)│ 준실시간(30s)│
└──────────────┴──────────────┴──────────────┘
```

## UI Layout (24h 카운트다운)

```
┌────────────────────────────────────────┐
│  Next Race · Round N                   │
│  레이스명                 [02:34:51]   │  ← HH:MM:SS (< 24h)
│  [세션 타임테이블]                      │
└────────────────────────────────────────┘
```

## Acceptance Criteria
- [ ] 24시간 이내: NextRaceHero에 HH:MM:SS 카운트다운 표시 (1초마다 갱신)
- [ ] 세션 진행 중: LiveSessionDashboard 렌더링
- [ ] 실시간 패널 (4초): 순위, 인터벌, 레이스 컨트롤
- [ ] 준실시간 패널 (10~30초): 랩타임, 타이어, 날씨
- [ ] 드라이버 이름은 로컬 data와 매핑 (driver_number → driverId)
- [ ] OpenF1 세션 없을 시 graceful fallback (패널 미표시)
- [ ] 서버 컴포넌트 구조 유지 (client 컴포넌트는 최소 범위만 적용)
