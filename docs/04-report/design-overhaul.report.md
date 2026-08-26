# PitLane F1 디자인 오버홀 제안서

> **작성일**: 2026-03-06
> **작성**: Product Manager + Frontend Architect 공동 검토
> **대상**: 개발팀 전체
> **버전**: v1.0

---

## 요약 (Executive Summary)

PitLane은 OpenF1 API 기반의 한국어 F1 통계 포털로, 세션 결과·챔피언십 순위·레이스 캘린더 등 데이터 집약적 콘텐츠를 제공한다. 현재 구현은 기능적으로 완성도가 높지만, **디자인 토큰 미완성·테이블 가독성 부족·모바일 내비게이션 부재** 등 세 가지 핵심 문제로 인해 사용자 경험이 저하되고 있다.

본 제안서는 Product Manager와 Frontend Architect의 공동 분석을 통해 도출한 개선 방향과 구체적 실행 계획을 담는다.

**목표**: 기존 F1 다크 테마 아이덴티티를 유지하면서, 데이터 가독성을 최우선으로 한 디자인 시스템 재구축.

---

## 1. 현황 진단

### 1.1 사이트 구성

| 페이지 | 경로 | 주요 콘텐츠 |
|--------|------|------------|
| 홈 | `/` | 레이스 히어로, 챔피언십 현황, AI 브리핑, 뉴스, 캘린더 |
| 세션 결과 | `/season/race/[round]/[session]` | 결과 테이블, 섹터 타임, 타이어 전략, 레이스 컨트롤 |
| 드라이버 | `/drivers` | 드라이버 카드 그리드, 통계 |
| 팀 | `/teams` | 팀 카드, 드라이버 라인업, 팀 통계 |

**기술 스택**: Next.js 16, React 19, Tailwind CSS v4, TypeScript
**색상 기조**: 다크 테마 (`#0A0A0F` 배경, `#E8002D` F1 레드 액센트)

---

### 1.2 핵심 문제 진단

#### 문제 1: 디자인 토큰 시스템 미완성 [심각도: 높음]

`globals.css`에 CSS 변수가 5개뿐이나, 실제 컴포넌트 전반에서 헥스 코드가 직접 인라인으로 사용된다.

```css
/* 현재 — 인라인 헥스가 50개 이상 산재 */
className="text-[#64748B]"     /* --muted 변수 존재하나 미사용 */
className="bg-[#141420]"       /* --surface 변수 존재하나 미사용 */
className="border-[#2D2D3A]"   /* --border 변수 존재하나 미사용 */
```

같은 의미의 색상이 파일마다 다른 투명도로 표현되어 일관성이 없다:
```
bg-[#E8002D]/10  (live 섹션)
bg-[#E8002D]/15  (배지)
bg-[#E8002D]/20  (하이라이트)
bg-[#E8002D]/25  (세션 카드)
```

#### 문제 2: 세션 결과 테이블 가독성 [심각도: 높음]

FP 결과 테이블은 최대 13개 컬럼을 단일 뷰에 나열하면서:
- 고정 헤더 없음 → 20행 스크롤 시 컬럼 맥락 소실
- 첫 번째 컬럼 고정 없음 → 가로 스크롤 시 드라이버 추적 불가
- 폰트 크기 5단계(`text-sm`, `text-xs`, `text-[11px]`, `text-[10px]`, `text-[9px]`) → 시각적 계층 흐릿
- 행 밀도 `py-3` → 20명 결과가 한 화면에 들어오지 않아 불필요한 스크롤 발생

#### 문제 3: 모바일 내비게이션 미완성 [심각도: 높음]

GNB에 7개 링크가 가로로 나열되며 햄버거 메뉴가 없다. 375px 이하 소형 기기에서 링크가 겹치거나 잘린다. 현재 활성 페이지 표시도 없어 사용자가 자신의 위치를 파악하기 어렵다.

#### 문제 4: 컴포넌트 비추출 [심각도: 중간]

`page.tsx` 763줄, 세션 페이지 738줄로 8개 이상 컴포넌트가 단일 파일 내에 정의된다. 동일 버튼 스타일 문자열이 최소 8회 복사-붙여넣기로 반복된다.

#### 문제 5: 접근성 경계 케이스 [심각도: 중간]

| 텍스트 색상 | 배경 | 예상 비율 | WCAG AA |
|------------|------|-----------|---------|
| `#64748B` (muted) | `#141420` (surface) | ~3.8:1 | **미달** (4.5:1 필요) |
| `#2D2D3A` (border dot) | `#141420` | ~1.5:1 | **심각** |

---

## 2. 제품 요구사항

### 2.1 사용자 방문 맥락

PitLane 사용자는 세 가지 방문 맥락을 가진다.

**① 평상시 방문자** — 챔피언십 순위, 최근 결과 복기, 뉴스 브라우징
→ 빠른 스캔 후 관심 항목 딥다이브 패턴. 스캔 가능한 정보 구조 필요

**② 레이스 주간 방문자** — 현재 세션 상태, 퀄리 결과, 즉시 레이스 결과 확인
→ 반복 방문·짧은 체류. 핵심 정보를 즉시 파악 가능해야 함

**③ 세션 심층 분석 사용자** — 랩타임 비교, 섹터 분석, 타이어 전략, 레이스 컨트롤 이벤트
→ 긴 체류, 데이터 테이블 가로 스크롤, 드라이버 간 비교

### 2.2 페이지별 정보 우선순위

**홈페이지**
```
L1 (즉시): 레이스 주간 여부 + 현재/다음 이벤트 상태
L2 (5초): 챔피언십 리더, 최근 우승자
L3 (스크롤): 뉴스, 캘린더
```

**세션 결과**
```
L1 (즉시): 1위 드라이버 + 베스트 랩
L2 (5초): Top 3 결과 + 갭
L3 (스크롤): 전체 순위표, 타이어 전략
L4 (선택): 섹터 시간, 속도 데이터, 레이스 컨트롤 로그
```

### 2.3 우선순위 (MoSCoW)

#### Must — 이번 이터레이션 필수

| ID | 요구사항 |
|----|----------|
| DR-01 | 완전한 디자인 토큰 시스템 (색상, 타이포그래피, 간격) |
| DR-02 | GNB 모바일 최적화 (햄버거 메뉴 + 활성 페이지 표시) |
| DR-03 | 세션 결과 테이블 정보 계층 재설계 (sticky header/col + 행 밀도) |
| DR-04 | 터치 타겟 최소 크기 보장 (44×44px, WCAG 2.5.5) |
| DR-05 | 드라이버/팀 카드 통계 타이포그래피 일관성 |

#### Should — 포함 목표

| ID | 요구사항 |
|----|----------|
| DR-06 | 세션 결과 테이블 모바일 카드 레이아웃 대안 |
| DR-07 | 레이스 컨트롤 로그 카테고리별 시각적 구분 |
| DR-08 | 타이어 컴파운드 시각화 일관성 |
| DR-09 | 스켈레톤 로딩 UI (OpenF1 API 지연 대응) |

#### Could — 다음 이터레이션

| ID | 요구사항 |
|----|----------|
| DR-10 | 세션 테이블 컬럼 토글 기능 (파워 유저) |
| DR-11 | 고대비 접근성 테마 |

#### Won't — 범위 외

- 라이트 모드 (F1 브랜드 아이덴티티 유지)
- 드라이버/팀별 커스텀 색상 테마

---

## 3. 디자인 시스템 제안

### 3.1 색상 토큰 체계

Tailwind CSS v4의 `@theme` 블록을 활용하여 토큰을 완전히 재정의한다. 기존 5개 변수를 확장하여 **30개 시맨틱 토큰**으로 구성한다.

```css
/* globals.css 개선안 */
@import "tailwindcss";

@theme inline {
  /* ── Brand ── */
  --color-f1-red:     #E8002D;
  --color-f1-red-dim: #CC0025;

  /* ── Background Scale ── */
  --color-bg-base:    #0A0A0F;   /* body */
  --color-bg-raised:  #111118;   /* subtle elevation */
  --color-bg-surface: #141420;   /* card, panel */
  --color-bg-overlay: #1A1A2A;   /* modal, elevated */

  /* ── Border Scale ── */
  --color-border-subtle:  #1E1E2A;
  --color-border-default: #2D2D3A;
  --color-border-strong:  #3D3D50;

  /* ── Text Scale ── */
  --color-text-primary:   #F1F5F9;
  --color-text-secondary: #94A3B8;
  --color-text-muted:     #64748B;
  --color-text-disabled:  #475569;  /* #2D2D3A → 대비 향상 */

  /* ── Semantic ── */
  --color-status-live:    #E8002D;
  --color-status-active:  #22C55E;
  --color-status-warning: #F59E0B;
  --color-status-info:    #3B82F6;
  --color-status-purple:  #A855F7;  /* FL (fastest lap) */

  /* ── Podium ── */
  --color-gold:   #FCD34D;
  --color-silver: #C0C0C0;
  --color-bronze: #CD7F32;

  /* ── Tire Compounds ── */
  --color-tire-soft:         #E8002D;
  --color-tire-medium:       #FCD34D;
  --color-tire-hard:         #E5E7EB;
  --color-tire-intermediate: #22C55E;
  --color-tire-wet:          #3B82F6;

  /* ── Typography ── */
  --font-sans: "Inter Variable", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;
}
```

### 3.2 타이포그래피 스케일

임의 크기(`text-[9px]`, `text-[10px]`, `text-[11px]`)를 제거하고 11단계 스케일로 통합한다.

| 역할 | 크기 | 가중치 | 용도 |
|------|------|--------|------|
| `display` | 48–64px | 900 | 히어로 레이스명, D-day |
| `h1` | 32–40px | 800 | 페이지 타이틀 |
| `h2` | 20–24px | 700 | 섹션 헤더 |
| `h3` | 16–18px | 600 | 카드 제목 |
| `body-lg` | 15px | 400 | 본문 (큰) |
| `body` | 14px | 400 | 일반 본문 |
| `body-sm` | 13px | 400 | 보조 텍스트 |
| `label` | 12px | 600 | 컬럼 헤더, 레이블 |
| `micro` | 11px | 500 | 배지, 태그 ← `text-[11px]` 대체 |
| `caption` | 10px | 400 | 단위 표시 (km/h) ← `text-[10px]` 대체 |
| `data` (mono) | 13–14px | 400–700 | 랩타임, 섹터, 속도 |

### 3.3 간격 시스템 (8px 기반)

```
4px   배지 내부 패딩, 아이콘 간격
8px   인라인 요소 간격
12px  버튼 수직 패딩, 테이블 행 패딩 ← py-3(12px) → py-2.5(10px)로 최적화
16px  카드 내부 패딩 기본
20px  카드 내부 패딩 여유
32px  섹션 간격 ← space-y-12(48px) → space-y-8(32px)으로 축소
```

---

## 4. 데이터 테이블 재설계

### 4.1 컬럼 우선순위 전략

4단계 컬럼 노출 체계를 명시적으로 정의한다.

**FP / 퀄리파잉 결과 테이블**

| 컬럼 | 모바일 | sm (640px+) | md (768px+) | lg (1024px+) | xl (1280px+) |
|------|:------:|:-----------:|:-----------:|:------------:|:------------:|
| # 순위 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 드라이버 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 베스트 랩 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 팀 | | ✓ | ✓ | ✓ | ✓ |
| 랩수 | | ✓ | ✓ | ✓ | ✓ |
| 타이어 | | | ✓ | ✓ | ✓ |
| 갭 | | | ✓ | ✓ | ✓ |
| S1 / S2 / S3 | | | | ✓ | ✓ |
| IS1 / IS2 / 탑스피드 | | | | | ✓ |

**레이스 결과 테이블**

| 컬럼 | 모바일 | sm | md | lg |
|------|:------:|:--:|:--:|:--:|
| # 순위 | ✓ | ✓ | ✓ | ✓ |
| 드라이버 | ✓ | ✓ | ✓ | ✓ |
| 갭 | ✓ | ✓ | ✓ | ✓ |
| 팀 | | ✓ | ✓ | ✓ |
| 그리드 | | | ✓ | ✓ |
| 랩수 | | | ✓ | ✓ |
| 베스트 랩 | | | | ✓ |

### 4.2 Sticky Header + First Column 구현

```tsx
<div className="overflow-x-auto">
  <table className="w-full border-collapse">
    <thead className="sticky top-0 z-10 bg-[--color-bg-surface]">
      <tr>
        {/* sticky 순위 컬럼 */}
        <th className="sticky left-0 z-20 bg-[--color-bg-surface] px-3 py-2.5 ...">
          #
        </th>
        {/* sticky 드라이버 컬럼 */}
        <th className="sticky left-10 z-20 bg-[--color-bg-surface] px-3 py-2.5 ...">
          드라이버
        </th>
      </tr>
    </thead>
    <tbody>
      {rows.map(row => (
        <tr className="border-b border-[--color-border-subtle] hover:bg-white/[0.04] transition-colors">
          <td className="sticky left-0 z-10 bg-[--color-bg-surface] ...">
            {/* position badge */}
          </td>
          <td className="sticky left-10 z-10 bg-[--color-bg-surface] ...">
            {/* driver */}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**행 호버 강도 조정**: 현재 `hover:bg-white/[0.02]` → `hover:bg-white/[0.04]` (인식 가능 수준으로 상향)

### 4.3 행 상태별 스타일

```tsx
const rowStyles = {
  default:   "hover:bg-white/[0.04] transition-colors",
  fastest:   "bg-[--color-status-purple]/[0.06] hover:bg-[--color-status-purple]/[0.10]",
  leader:    "bg-[--color-f1-red]/[0.06] hover:bg-[--color-f1-red]/[0.10]",
  dnf:       "opacity-50 hover:opacity-70",
};
```

### 4.4 스켈레톤 로딩

OpenF1 API 지연 시 CLS(Cumulative Layout Shift)를 방지하기 위해 `loading.tsx`를 추가한다.

```tsx
// src/app/season/race/[round]/[session]/loading.tsx
export default function SessionLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse">
      <div className="rounded-2xl bg-[--color-bg-surface] border border-[--color-border-default] p-8 mb-10">
        <div className="h-3 w-24 bg-[--color-border-strong] rounded mb-3" />
        <div className="h-9 w-80 bg-[--color-border-strong] rounded mb-2" />
        <div className="h-4 w-48 bg-[--color-border-default] rounded" />
      </div>
      <div className="rounded-xl bg-[--color-bg-surface] border border-[--color-border-default] overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-[--color-border-subtle]">
            <div className="w-7 h-7 rounded-full bg-[--color-border-default] shrink-0" />
            <div className="h-4 flex-1 bg-[--color-border-default] rounded" />
            <div className="h-4 w-20 bg-[--color-border-default] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 5. 컴포넌트 아키텍처

### 5.1 추출 대상 컴포넌트

현재 인라인 패턴을 재사용 가능한 컴포넌트로 추출한다.

```
src/components/
├── ui/
│   ├── Button.tsx          — variant: primary | ghost | outline
│   ├── Badge.tsx           — variant: live | status | compound | position | fl
│   ├── Card.tsx            — bg-surface + border 패턴 통합
│   ├── SectionHeader.tsx   — "제목 + 전체 보기" 패턴 통합
│   └── EmptyState.tsx      — upcoming | collecting | error 상태
├── f1/
│   ├── DriverRow.tsx       — 아바타 + 이름 + 팀 컬러 일관 표현
│   ├── CompoundBadge.tsx   — 타이어 컴파운드 원형 배지
│   ├── PodiumBadge.tsx     — 1/2/3 금/은/동 배지
│   ├── LapTime.tsx         — mono 폰트 + FL 배지 통합
│   └── TeamColorBar.tsx    — 1px 세로 팀 컬러 바
└── layout/
    ├── MobileNav.tsx       — 햄버거 메뉴
    └── PageContainer.tsx   — max-w 래퍼 통합
```

### 5.2 주요 컴포넌트 인터페이스

**Button**
```tsx
interface ButtonProps {
  variant: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  href?: string;
  children: React.ReactNode;
}
```

**Badge**
```tsx
interface BadgeProps {
  variant: "live" | "completed" | "upcoming"
         | "compound"   // SOFT | MEDIUM | HARD | INTERMEDIATE | WET
         | "position"   // 1–3 포디움 / 나머지
         | "fl"         // fastest lap
         | "status";    // DNF | DNS | DSQ
  label: string;
  pulse?: boolean;
}
```

### 5.3 현재 → 제안 매핑

| 현재 인라인 패턴 | 제안 컴포넌트 |
|-----------------|-------------|
| `px-5 py-2.5 bg-[#E8002D] ... rounded-lg` | `<Button variant="primary">` |
| `px-5 py-2.5 bg-white/10 ... rounded-lg` | `<Button variant="ghost">` |
| `text-xl font-bold mb-6` + "전체 보기" | `<SectionHeader>` |
| `bg-[#141420] border border-[#2D2D3A] rounded-xl` | `<Card>` |
| `text-[9px] font-black text-[#A855F7] bg-[#A855F7]/15 px-1 rounded` | `<Badge variant="fl">` |
| `w-7 h-7 rounded-full` + posColor() | `<PodiumBadge position={n}>` |
| `w-6 h-6 rounded-full border-2` + compound | `<CompoundBadge compound="SOFT">` |

---

## 6. 반응형 전략

### 6.1 내비게이션

```
Desktop (768px+)
  → 현재 방식 유지: 가로 링크 7개
  → 개선: 활성 페이지 색상/밑줄 표시 추가

Mobile (< 768px)
  → 햄버거 버튼 (로고 우측)
  → 풀스크린 드로어: 링크 목록 + 큼직한 터치 타겟 (min 44px)
```

### 6.2 홈페이지 레이아웃

```
Mobile        → 단일 컬럼. 챔피언십: Driver만, Constructor 탭으로
Tablet        → 2컬럼 Hero. 챔피언십 나란히. 결과 2–3 그리드
Desktop       → 전체 세션 타임테이블. 챔피언십 progress bar. 결과 3 그리드
```

### 6.3 섹션 간격 최적화

현재 `space-y-12` (48px) → `space-y-8` (32px) 변경. 스포츠 데이터 사이트 기준으로 48px는 과도하며 중요 콘텐츠로의 도달을 지연시킨다.

---

## 7. 접근성 개선

### 7.1 색상 대비 수정

| 요소 | 현재 색상 | 현재 비율 | 제안 색상 | 목표 비율 |
|------|----------|-----------|---------|-----------|
| muted 텍스트 (surface 위) | `#64748B` | ~3.8:1 ⚠️ | `#6B7A8D` | 4.5:1 ✓ |
| disabled 텍스트 | `#2D2D3A` | ~1.5:1 ❌ | `#475569` | 4.5:1 ✓ |
| 컬럼 헤더 (small text) | `#64748B` | 3.8:1 ⚠️ | `#7A8FA6` | 3.0:1 ✓ (large text 기준) |

### 7.2 터치 타겟

모든 인터랙티브 요소의 최소 크기 44×44px 보장 (현재 일부 `px-3 py-2` = 약 36px).

```css
/* globals.css 추가 */
@layer base {
  a, button {
    min-height: 44px;
    min-width: 44px;
  }
}
```

---

## 8. 구현 로드맵

### Phase A — 기반 작업 (1–2일)

1. `globals.css` 확장: 30개 CSS 토큰 완성, `font-sans`/`font-mono` 추가
2. `Button.tsx` 추출: 인라인 버튼 패턴 8개 위치 통합
3. `Card.tsx` 추출: 배경/테두리 패턴 통합
4. `SectionHeader.tsx` 추출: 반복 섹션 헤더 통합
5. GNB 활성 페이지 표시 추가 (`usePathname` 활용)

### Phase B — 핵심 재설계 (3–5일)

1. 세션 결과 테이블 → sticky header + sticky 첫 컬럼 적용
2. 행 밀도 최적화: `py-3` → `py-2.5` 통일
3. 모바일 내비게이션: 햄버거 메뉴 + 드로어
4. Inter Variable 폰트 도입 (`next/font/google`)
5. `loading.tsx` 스켈레톤 구현
6. `Badge.tsx` / `CompoundBadge.tsx` / `PodiumBadge.tsx` 추출

### Phase C — 폴리싱 (2–3일)

1. `page.tsx` 분리 → `src/components/home/` (8개 섹션 컴포넌트)
2. 세션 페이지 분리 → `src/components/session/`
3. 전체 하드코딩 헥스값 → CSS 토큰 교체
4. WCAG AA 대비 검증 및 muted 텍스트 조정
5. 드라이버/팀 카드 통계 타이포그래피 통일

---

## 9. 성공 지표

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| Lighthouse Accessibility | 95+ | axe DevTools + Lighthouse |
| 색상 대비 (본문) | WCAG AA (4.5:1) | Contrast Analyzer |
| 터치 타겟 위반 수 | 0 | Chrome DevTools |
| 인라인 헥스 코드 수 | 0 (전부 토큰화) | `grep text-\[# src/` |
| 파일당 라인 수 (page.tsx) | < 200줄 | 컴포넌트 분리 후 |
| 테이블 첫 화면 포함 드라이버 수 | 20명 전체 (데스크탑) | 시각 검증 |

---

## 10. 현재 플랜과의 관계

현재 `docs/01-plan/features/`에 존재하는 플랜들과의 역할 구분:

| 플랜 | 역할 | 디자인 오버홀과의 관계 |
|------|------|---------------------|
| `homepage-content-redesign` | 콘텐츠 구조/섹션 정의 (What) | 병렬 추진 — 콘텐츠 플랜이 섹션 구조를 정의하면 디자인 플랜이 시각적 표현 담당 |
| `live-session-display` | 실시간 세션 기능 (What) | 디자인 오버홀 완료 후 컴포넌트 위에 기능 레이어 추가 |
| **design-overhaul** | 시각적 표현 방식 (How) | 다른 플랜의 기반 레이어 |

---

## 결론

PitLane은 기능적으로 완성도 높은 F1 포털이나, **디자인 토큰 미완성·테이블 가독성·모바일 내비게이션** 세 영역에서 집중 개선이 필요하다.

제안된 Phase A→B→C 로드맵은 총 7–10일 작업으로, 기존 F1 다크 테마 아이덴티티를 유지하면서 데이터 밀집 사이트에 최적화된 가독성을 달성할 수 있다. **Phase A의 토큰 시스템 구축이 가장 중요**하며, 이후 모든 개선 작업의 기반이 된다.

다음 단계: `/pdca plan design-overhaul` 으로 실행 계획 문서 작성 후 `/pdca design design-overhaul` 으로 상세 명세 진행 권장.

---

*본 문서는 Product Manager + Frontend Architect 공동 분석을 기반으로 작성되었습니다.*
