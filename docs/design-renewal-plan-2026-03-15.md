# F1.324.ing 디자인 리뉴얼 기획 보고서

> 작성일: 2026-03-15
> 담당: Claude (Frontend Design Architect)
> 대상: f1.324.ing (Next.js 16 App Router)

---

## 1. 현황 분석

### 1-1. 현재 디자인 문제점

| 영역 | 문제 | 심각도 |
|------|------|--------|
| **타이포그래피** | `Inter` 폰트 사용 — 전 세계 수백만 사이트와 동일. F1 전문 포털 정체성 없음 | 높음 |
| **모션/인터랙션** | 정적 UI. 랩타임 카운트업, 포지션 변화 애니메이션 없음. F1의 속도감·긴장감 전무 | 높음 |
| **접근성** | 아이콘 버튼 `aria-label` 20+ 누락, `<div onClick>` 2건, 탭 컴포넌트 ARIA 미구현 | 높음 |
| **데이터 시각화** | 숫자 컬럼 `tabular-nums` 미적용, 랩타임/갭 데이터가 텍스트 나열에 불과 | 중간 |
| **레이아웃** | 대칭적·예측 가능한 그리드. 섹션 간 시각적 위계 불명확 | 중간 |
| **배경/질감** | 단순 `#0A0A0F` 단색 배경. 깊이감·분위기 없음 | 낮음 |

### 1-2. 강점 (유지 대상)

- 색상 토큰 시스템 잘 구성됨 (`globals.css @theme`)
- F1 red `#E8002D` 브랜드 컬러 일관성
- `JetBrains Mono` 이미 적용됨 (데이터 영역 확장 가능)
- ISR + unstable_cache 성능 구조 탄탄함

---

## 2. 리뉴얼 비전

### 2-1. 방향: **Data Dashboard / Telemetry**

> "F1 피트월 모니터를 웹으로 옮긴 것 같은 경험"

F1 엔지니어가 실제로 보는 화면 — 타이밍 타워, 텔레메트리 패널, HUD 오버레이 — 을 레퍼런스로 삼는다.
정보는 치밀하고 정밀하게 표현되며, 움직임은 기계적 정확성을 가진다.

**핵심 차별화 포인트:**
- 모든 숫자는 모노스페이스 + tabular-nums으로 정렬된 타임시트처럼 표시
- 카드/섹션에 HUD 코너 브라켓 장식 (`◤ ◥` 스타일)
- 데이터 갱신 시 subtle scan-line sweep 애니메이션
- 포지션 변화: 슬라이드 인 + 컬러 플래시 트랜지션

---

## 3. 디자인 시스템 변경 계획

### 3-1. 타이포그래피

| 용도 | 현재 | 변경 후 | 이유 |
|------|------|---------|------|
| 헤딩/팀명 | Inter | **Barlow Condensed** | 군사·기술 느낌의 Condensed. GP 이름, 드라이버명에 최적 |
| UI/본문 | Inter | **DM Sans** | Inter보다 개성 있고 가독성 높음 |
| 숫자/데이터 | JetBrains Mono (일부) | **JetBrains Mono** (전체 데이터 영역) | 타임시트, 랩타임, 갭, 순위 전체 통일 |

```css
/* 변경 후 폰트 스택 */
--font-display: 'Barlow Condensed', 'Rajdhani', sans-serif;
--font-sans: 'DM Sans', 'Outfit', sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, monospace;
```

### 3-2. 컬러 팔레트 확장

```css
/* 기존 유지 */
--color-f1-red:     #E8002D;
--color-bg-base:    #0A0A0F;

/* 신규 추가 */
--color-data-teal:    #00D2BE;  /* 텔레메트리 하이라이트 (메르세데스 cyan) */
--color-data-yellow:  #FFD700;  /* 최고 랩타임 (보라색 섹터 대신) */
--color-grid-line:    rgba(255,255,255,0.04);  /* 배경 그리드 */
--color-hud-bracket:  rgba(232,0,45,0.6);     /* HUD 코너 장식 */
--color-scan-line:    rgba(255,255,255,0.015); /* 스캔라인 텍스처 */
```

### 3-3. 배경 질감

```css
/* 미세 그리드 + 스캔라인 오버레이 */
body::before {
  background-image:
    linear-gradient(var(--color-grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-grid-line) 1px, transparent 1px);
  background-size: 40px 40px;
}
body::after {
  background: repeating-linear-gradient(
    0deg, transparent, transparent 2px,
    var(--color-scan-line) 2px, var(--color-scan-line) 4px
  );
  pointer-events: none;
}
```

### 3-4. 컴포넌트 패턴

#### HUD 카드 (기존 Card 대체)
```
┌◤─────────────────────◥┐
│  DRIVER STANDINGS      │
│  ─────────────────── │
│  01  VER  RED BULL  372│
│  02  NOR  McLAREN   356│
└◣─────────────────────◢┘
```
- 코너 브라켓: `before/after` pseudo-element
- 내부 구분선: `--color-border-subtle` 점선

#### 데이터 테이블 (타이밍 타워 스타일)
```
POS  DRV  TEAM          TIME       GAP
 01  RUS  Mercedes   1:18.518     —
 02  ANT  Mercedes   1:18.811  +0.293
 03  HAD  Red Bull   1:19.303  +0.785
```
- 모든 숫자: `font-mono` + `tabular-nums`
- 포지션 변화 시 `translate-y` + opacity 트랜지션
- P1 행: `--color-data-teal` 왼쪽 보더

#### 모션 시스템
```
/* prefers-reduced-motion 준수 */
@media (prefers-reduced-motion: no-preference) {
  .data-refresh { animation: scanSweep 0.4s ease-out; }
  .position-change { transition: transform 0.3s, color 0.2s; }
  .lap-time { animation: countUp 0.6s ease-out; }
}
```

---

## 4. 페이지별 리뉴얼 계획

### 4-1. 네비게이션 (전 페이지 영향)

**현재 문제:** 평범한 수평 nav bar, dropdown 위치가 예측 가능

**변경 방향:**
- 로고 옆 `F1 · 324.ING` — Barlow Condensed Bold, 자간 넓게
- Nav 배경: `backdrop-blur` + 미세 grid 패턴 투과
- 현재 페이지 표시: 밑줄 대신 왼쪽 세로선 (`border-left: 2px solid var(--f1-red)`)
- 드롭다운: 패널 스타일 (HUD 코너 브라켓 포함)
- 모바일: 현재 오버레이 유지, 애니메이션 개선 (slide-in from top)
- **접근성**: `aria-expanded`, `role="menu"`, `role="menuitem"` 추가

### 4-2. 홈 (`/`)

**섹션별 리뉴얼:**

| 섹션 | 현재 | 변경 후 |
|------|------|---------|
| **Hero** | 다음 레이스 텍스트 | 전체 화면 타이밍 타워 스타일 카운트다운. 서킷 SVG outline 배경 |
| **챔피언십** | 카드 목록 | 타이밍 타워 그대로 재현. 포지션 번호 대형 display |
| **캘린더** | 그리드 | 타임라인 바 형태. 완료/진행/예정 상태 시각화 |
| **AI 다이제스트** | 텍스트 박스 | 터미널 스타일 카드. 깜빡이는 커서, 타이핑 인 애니메이션 |
| **최근 결과** | 테이블 | 포디움 3D 시각화 + 타이밍 타워 결합 |

### 4-3. 시즌/레이스 결과 (`/season`, `/season/race/[round]`)

- 레이스 결과 테이블: 타이밍 타워 컴포넌트 완전 적용
- 포지션 변화 인디케이터: ▲▼ + 컬러 (초록/빨강)
- 타이어 컴파운드: 원형 배지 → 실제 F1 타이어 심볼 근사치 SVG
- 헤더: `ROUND 01 — AUSTRALIAN GRAND PRIX` 형식, Barlow Condensed

### 4-4. 분석 페이지 (`/season/race/[round]/analysis`)

- **탭 UI**: 현재 버튼 → HUD 스타일 세그먼트 컨트롤
- **텔레메트리 차트**: 배경 그리드라인 강화, 데이터 포인트 호버 툴팁 개선
- **드라이버 선택**: 팀 컬러 원 + 드라이버 번호 (모노스페이스 대형)
- **랩 분석**: 섹터 컬러 (보라/초록/노랑) 더 선명하게

---

## 5. 접근성 수정 계획 (web-design-guidelines 결과 반영)

리뉴얼과 동시에 반드시 수정:

| 파일 | 수정 내용 |
|------|----------|
| `ReplayControls.tsx` | play/rewind/forward `aria-label` 추가 |
| `ReplayLeaderboard.tsx` | `<div onClick>` → `<button>` |
| `StandingsTabs.tsx` | `role="tablist"`, `role="tab"`, `aria-selected`, 화살표 키 네비게이션 |
| `CompareClient.tsx` | 동일 탭 패턴 수정 |
| `DriverPicker.tsx` | `aria-haspopup`, `aria-expanded` |
| `NavLinks.tsx` | `role="menu"`, `role="menuitem"` |
| `layout.tsx` | Skip link (`#main-content`) 추가 |
| `Button.tsx` | `focus-visible:ring-2 focus-visible:ring-f1-red` 기본 추가 |

---

## 6. 구현 로드맵

### Phase 1 — 디자인 시스템 기반 (1일)
1. `globals.css` 폰트·컬러 토큰 업데이트
2. Next.js `layout.tsx` Google Fonts (Barlow Condensed, DM Sans) 추가
3. 배경 질감 (grid + scanline) CSS 적용
4. `Button.tsx` focus-visible 기본 스타일 추가 + skip link

### Phase 2 — 공통 컴포넌트 (1일)
1. HUD Card 컴포넌트 신규 작성 (`HudCard.tsx`)
2. 타이밍 타워 테이블 컴포넌트 (`TimingTower.tsx`)
3. `NavLinks.tsx` 접근성 + 스타일 리뉴얼
4. 탭 컴포넌트 접근성 수정 (StandingsTabs, CompareClient)

### Phase 3 — 홈 페이지 (1일)
1. Hero 섹션 리뉴얼 (서킷 SVG 배경 + 카운트다운)
2. 챔피언십 섹션 → 타이밍 타워 스타일
3. AI 다이제스트 → 터미널 카드
4. 캘린더 → 타임라인 바

### Phase 4 — 시즌/분석 페이지 (1일)
1. 레이스 결과 테이블 타이밍 타워 적용
2. 분석 페이지 탭 + 드라이버 선택 UI
3. 포지션 변화 애니메이션
4. prefers-reduced-motion 전체 검증

---

## 7. 성공 지표

| 지표 | 현재 | 목표 |
|------|------|------|
| Web Interface Guidelines 통과율 | ~40% | 90%+ |
| 아이콘 버튼 aria-label | 0/5 | 5/5 |
| `<div onClick>` 건수 | 2건 | 0건 |
| 탭 컴포넌트 ARIA 완성도 | 0% | 100% |
| 폰트 독창성 | Inter (generic) | Barlow Condensed (F1 특화) |
| 모션 구현 | 0 | 5+ 핵심 인터랙션 |

---

*본 보고서는 2026-03-15 기획 논의 결과를 반영하며, Phase 1부터 순차 구현을 권장합니다.*
