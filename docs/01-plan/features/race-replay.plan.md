# Plan: 레이스 리플레이 시각화 (race-replay)

> **참고 프로젝트**: `f1-race-replay-main` (Python/Arcade 데스크톱 앱)
> **목표**: 웹 기반 레이스 리플레이를 f1 포털에 통합

---

## 1. 기능 개요

레이스 세션의 드라이버 위치 데이터를 프레임 단위로 재생하는 인터랙티브 트랙 리플레이 뷰어를 f1 포털에 추가한다.
- 접근 경로: `/season/race/[round]/replay`
- 기존 분석 페이지(`/analysis`)의 탭 또는 별도 페이지로 제공
- 로컬 FastF1 Python 서버 (`fastf1-api/main.py`) 를 통해 데이터 제공

---

## 2. 배경 및 필요성

| 현황 | 문제점 |
|------|--------|
| `/analysis` 페이지에 랩 분석, 속도맵, 전략 탭 있음 | 레이스 전개 과정을 시간 순으로 볼 수 없음 |
| `fastf1-api/main.py`에 `/track-map`, `/position-history` 엔드포인트 있음 | 드라이버 실시간 위치 스트림 엔드포인트 없음 |
| `f1-race-replay-main` 에 프레임 생성 로직 완성됨 | 데스크톱 전용 (Arcade), 웹에서 사용 불가 |

---

## 3. 범위

### In Scope

- **FastF1 API 확장**: `/replay-frames` 엔드포인트 추가
  - 레이스 세션의 모든 드라이버 위치 데이터를 프레임 배열로 반환
  - f1-race-replay의 `f1_data.py` `get_race_telemetry()` 로직 참고
- **웹 리플레이 플레이어 UI** (`/season/race/[round]/replay`)
  - HTML5 Canvas 기반 트랙 렌더링 (SVG 대신 Canvas — 퍼포먼스)
  - 드라이버 도트 + 팀 컬러 + 약어 표시
  - 재생/일시정지/되감기/배속(0.5x/1x/2x/4x) 컨트롤
  - 리더보드 (현재 순위, 현재 랩, 타이어 화합물)
  - 진행률 바 (랩 기준)
- **분석 페이지 연동**: 기존 `/analysis` 에 "리플레이" 탭 추가

### Out of Scope

- 퀄리파잉/스프린트 리플레이 (Phase 2)
- 실시간 라이브 세션 리플레이 (OpenF1 연동 별도 기능)
- 텔레메트리 오버레이 (속도/DRS 등 드라이버별 상세 패널) — Phase 2
- Vercel 배포 (로컬 FastF1 서버 필요 → 로컬 전용 기능)

---

## 4. 기술 접근

### 데이터 흐름

```
FastF1 Python API          Next.js Frontend
─────────────────          ─────────────────
GET /replay-frames    →    ReplayClient.tsx
  ?year=2026              (Canvas rendering)
  &gp=1                   useReplayPlayer()
  &session=R              → requestAnimationFrame
                              loop
```

### `/replay-frames` 응답 구조

```json
{
  "total_laps": 57,
  "total_frames": 3420,
  "fps": 10,
  "track": [{"x": 123.4, "y": 567.8}, ...],
  "drivers": ["VER", "NOR", "HAM", ...],
  "colors": {"VER": "3671C6", "NOR": "FF8000", ...},
  "frames": [
    {
      "lap": 1,
      "t": 0.0,
      "positions": [
        {"d": "VER", "x": 123.4, "y": 567.8, "status": "on_track"},
        ...
      ]
    },
    ...
  ]
}
```

### 핵심 구현 참고 (f1-race-replay → 웹 변환)

| f1-race-replay | 웹 구현 |
|---------------|---------|
| `get_race_telemetry()` `f1_data.py` | `/replay-frames` FastAPI 엔드포인트 |
| Arcade Window + `on_draw()` | `<canvas>` + `requestAnimationFrame` |
| Arcade Sprite 드라이버 도트 | Canvas `fillArc` + 팀 컬러 |
| `playback_speed` 변수 | `useRef` playbackRate |
| Leaderboard 컴포넌트 | React 리더보드 패널 |

---

## 5. 구현 순서

1. **FastF1 API** — `/replay-frames` 엔드포인트 구현 (Python)
2. **데이터 페칭** — `src/lib/api/fastf1.ts` 에 `fetchReplayFrames()` 추가
3. **ReplayPlayer 컴포넌트** — Canvas 렌더링 + 재생 루프
4. **컨트롤 UI** — 재생/일시정지/배속/되감기 버튼
5. **리더보드** — 현재 순위 패널
6. **분석 페이지 탭 연동** — "리플레이" 탭 추가

---

## 6. 성공 기준

- [ ] 2026 Australian GP Race 기준 전체 57랩 재생 가능
- [ ] 배속 0.5x/1x/2x/4x 전환 시 끊김 없이 동작
- [ ] 드라이버 20명 위치 모두 표시, 팀 컬러 정확
- [ ] 리더보드가 랩 변경 시 실시간 업데이트
- [ ] Canvas FPS 30 이상 유지

---

## 7. 리스크

| 리스크 | 대응 |
|--------|------|
| 프레임 데이터 용량 과대 (수MB) | 다운샘플링 (10fps), 압축 응답, 청크 로딩 |
| FastF1 로컬 서버 미실행 시 | "로컬 서버 필요" 안내 UI (현재 analysis 탭과 동일 처리) |
| 위치 데이터 정밀도 부족 | f1-race-replay 방식 참고 (position_data 보간) |

---

## 8. 시즌/라운드별 페이지 적용 범위

### 적용 대상 페이지 전체 목록

| 페이지 경로 | 적용 내용 | 조건 |
|-----------|---------|------|
| `/season` | 캘린더 각 라운드 카드에 "리플레이" 링크 추가 | 완료된 레이스만 |
| `/season/race/[round]` | 히어로 섹션에 "리플레이 보기" 버튼 추가 | 완료된 레이스만 |
| `/season/race/[round]/analysis` | 기존 탭(랩/속도/전략)에 "리플레이" 탭 추가 | 항상 표시, 서버 필요 안내 |
| `/season/race/[round]/replay` | **신규** 리플레이 전용 풀스크린 페이지 | 신규 생성 |

### 페이지별 상세 변경 내용

#### `/season/page.tsx` (시즌 캘린더)
- 완료된 라운드 카드 하단에 아이콘 링크 행 추가
  - `분석 →` (기존) / `리플레이 →` (신규)
- 미완료 라운드는 리플레이 링크 숨김

#### `/season/race/[round]/page.tsx` (라운드 상세)
- 세션 일정 섹션 또는 히어로 섹션에 "리플레이" CTA 버튼
- 레이스 완료 여부 확인 후 조건부 렌더링
  - 완료: `href="/season/race/[round]/replay"` 버튼 표시
  - 미완료: 버튼 숨김

#### `/season/race/[round]/analysis/TelemetryClient.tsx` (분석 탭)
- 기존 탭 배열에 `{ key: "replay", label: "리플레이" }` 추가
- 탭 선택 시 `ReplayTab.tsx` 렌더링
- FastF1 서버 미연결 시 기존 탭과 동일한 "서버 미연결" 안내 표시

#### `/season/race/[round]/replay/page.tsx` (신규)
- 풀스크린 리플레이 전용 페이지
- `generateStaticParams` — 24라운드 전체 정적 경로 생성
- 완료되지 않은 라운드는 "리플레이 준비 중" 안내

---

## 9. 관련 파일

**참고 (f1-race-replay-main)**
- `src/f1_data.py` — 프레임 생성 핵심 로직
- `src/interfaces/race_replay.py` — 리플레이 인터페이스
- `src/ui_components.py` — 리더보드, 컨트롤 UI

**수정 대상 (f1 포털)**
- `fastf1-api/main.py` — `/replay-frames` 엔드포인트 추가
- `src/lib/api/fastf1.ts` — `fetchReplayFrames()` 추가
- `src/app/season/page.tsx` — 라운드 카드에 리플레이 링크
- `src/app/season/race/[round]/page.tsx` — 리플레이 CTA 버튼
- `src/app/season/race/[round]/analysis/TelemetryClient.tsx` — 리플레이 탭
- `src/app/season/race/[round]/analysis/tabs/` — `ReplayTab.tsx` 신규

**신규 생성 (f1 포털)**
- `src/app/season/race/[round]/replay/page.tsx` — 리플레이 전용 페이지
- `src/app/season/race/[round]/replay/ReplayClient.tsx` — Canvas 리플레이 플레이어
- `src/components/replay/ReplayPlayer.tsx` — 재사용 가능한 플레이어 컴포넌트
- `src/components/replay/ReplayControls.tsx` — 재생 컨트롤 UI
- `src/components/replay/ReplayLeaderboard.tsx` — 실시간 리더보드

---

*Created: 2026-03-07 | Updated: 2026-03-07 | Feature: race-replay | Phase: Plan*
