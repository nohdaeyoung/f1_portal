# Homepage Content Redesign Planning Document

> **Summary**: 레퍼런스 사이트 기반으로 메인 페이지를 "평소 화면"과 "레이스 데이 화면"으로 구분해 더 풍부한 콘텐츠 구성
>
> **Project**: PitLane F1 Fan App
> **Version**: 0.1.0
> **Author**: Product Manager
> **Date**: 2026-03-05
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

현재 메인 페이지는 모든 시점에 동일한 화면을 보여주고 있다. F1 팬의 방문 목적은 레이스 주간과 평상시에 완전히 다르며, 레퍼런스 사이트(formula1.com, motorsport.com, the-race.com, autosport.com)도 레이스 주간에 콘텐츠를 전환한다. 이 플랜은 두 가지 컨텍스트에 맞는 최적화된 메인 페이지 콘텐츠 구조를 정의한다.

### 1.2 Background

현재 메인 페이지 구성:
1. 다음 레이스 카운트다운 (정적 정보만 표시)
2. 드라이버 챔피언십 Top 5 + 최근 결과 (2열 그리드)
3. 오늘의 F1 — AI 뉴스 브리핑 (프리뷰만)
4. 주목 서킷 (고정 4개)

문제점:
- 레이스 주간에도 동일한 정보 배치
- 보유한 풍부한 데이터(컨스트럭터 챔피언십, RSS 뉴스, OpenF1 실시간 데이터)를 미활용
- 팬이 "지금 F1에서 무슨 일이 일어나고 있는가"를 한눈에 파악하기 어려움

### 1.3 Related Documents

- 현재 구현: `src/app/page.tsx`
- 데이터 레이어: `src/lib/data/live.ts`, `src/lib/api/openf1.ts`
- 뉴스 데이터: `src/lib/api/news.ts`, `src/lib/api/ai-digest.ts`

---

## 2. 화면 컨텍스트 정의

### 2.1 평소 화면 (Normal Mode)

**조건**: 레이스 주간이 아닌 모든 날 (월~목, 이벤트 없음)
- 레이스 당일 기준 D+3 이후 ~ 다음 레이스 D-3 이전
- FP1이 시작되지 않은 상태

**팬의 방문 목적**:
- 챔피언십 현황 파악
- 최근 레이스 결과 복기
- F1 뉴스 브라우징
- 드라이버/팀/서킷 탐색

### 2.2 레이스 데이 화면 (Race Weekend Mode)

**조건**: GP 주말 (금요일 FP1 시작 ~ 일요일 레이스 종료)
- 스프린트 주말: 목요일 FP1부터
- 다음 레이스의 `sessions.fp1` 시작 시각 기준으로 감지

**팬의 방문 목적**:
- 지금 진행 중인 세션 현황
- 세션 타임테이블 확인
- 날씨/트랙 컨디션 파악
- 퀄리파잉 결과 / 레이스 결과 즉시 확인

---

## 3. 평소 화면 구성 (Normal Mode)

### 섹션 순서 및 상세 기획

#### Section 1: 다음 레이스 히어로 배너 (Hero Banner)
**우선순위**: Must
**목적**: 방문 즉시 "다음 이벤트"에 대한 기대감 형성
**현재 데이터로 구현 가능**: 대부분 가능

콘텐츠:
- 레이스명 (한국어) + 국기 이모지
- 서킷명 (한국어)
- 레이스 날짜 + D-day 카운터 (예: "D-12")
- 세션 타임테이블 미니 뷰 (FP1/FP2/FP3 또는 FP1/SQ/Sprint/Q/Race)
- 서킷 특성 요약 (오버테이크 난이도, DRS 존 수, 서킷 타입)
- CTA: "서킷 상세 보기" + "전체 일정"

개선 포인트 (현재 대비):
- 단순 날짜 표시 → D-day 카운터 + 세션 타임테이블 추가
- 서킷 특성 정보 인라인 표시 (이미 Circuit 인터페이스에 데이터 있음)

#### Section 2: 챔피언십 현황 (Championship Snapshot)
**우선순위**: Must
**목적**: 시즌 맥락 제공 — 드라이버와 컨스트럭터 순위를 함께 보여줌
**현재 데이터로 구현 가능**: 컨스트럭터는 API 있으나 메인 페이지 미사용

콘텐츠 (2열 레이아웃):
- 왼쪽: 드라이버 챔피언십 Top 5 (현재와 유사, 포인트 바 그래프 유지)
- 오른쪽: 컨스트럭터 챔피언십 Top 5 (신규 — `fetchConstructorStandings()` 활용)
  - 팀 컬러 인디케이터 + 팀명 (한국어) + 포인트

개선 포인트:
- 컨스트럭터 챔피언십 추가로 시즌 전체 맥락 강화
- 팀 페이지로 바로 이동하는 링크

#### Section 3: 최근 레이스 결과 + 하이라이트 (Race Results)
**우선순위**: Must
**목적**: 최근 3경기 결과를 카드 형태로 빠르게 소화
**현재 데이터로 구현 가능**: 가능

콘텐츠 (가로 스크롤 카드 또는 3열 그리드):
- 최근 3경기 결과 카드 (현재는 리스트 형태)
- 각 카드: 레이스명, 서킷, 날짜, 우승자, 2·3위 (podium Top 3)
- 우승 드라이버 팀 컬러 강조

개선 포인트:
- 현재 우승자만 표시 → 포디움 Top 3 표시
- 리스트 → 카드 레이아웃으로 시각적 개선
- 신규 데이터 필요: 2·3위 결과 (Jolpica API `getAllResults()`에서 이미 받고 있으나 메인 페이지에 2·3위 미노출)

#### Section 4: 오늘의 F1 — AI 뉴스 브리핑 (AI Digest)
**우선순위**: Must
**목적**: 바쁜 팬을 위한 핵심 뉴스 요약, 깊은 독서로 유도
**현재 데이터로 구현 가능**: 가능 (현재 헤드라인+요약+태그만 노출)

콘텐츠 (확장):
- 헤드라인 (굵은 한 문장)
- 요약 (3~5문장)
- 주요 토픽 Bullet 3~4개 (각 제목 + 한 줄 요약 + 출처)
- 편집장 한마디 (editorNote)
- 관전 포인트 2~3개 (watchPoints)
- 키워드 태그 (hotTopics)
- CTA: "전체 다이제스트 보기" → /news

개선 포인트:
- 현재 헤드라인·요약·태그만 → bullets·editorNote·watchPoints 전부 노출
- 이미 AiDigest 인터페이스에 모든 필드 있음, 렌더링만 추가

#### Section 5: 최신 뉴스 피드 (News Feed Preview)
**우선순위**: Should
**목적**: AI 요약을 보완하는 실시간 뉴스 헤드라인 — 팬이 원하는 기사 직접 클릭
**현재 데이터로 구현 가능**: 가능 (`getF1News()` 활용)

콘텐츠:
- 최신 뉴스 기사 5~6개 (제목 + 출처 + 시간 + 이미지 썸네일 있으면 표시)
- 출처별 색상 태그 (Autosport, The Race, Sky Sports 등)
- 각 기사는 원문 링크 (외부)
- CTA: "뉴스 전체 보기" → /news

개선 포인트: 신규 섹션 (현재 메인 페이지에 없음)

#### Section 6: 이번 시즌의 서킷 여정 (Season Circuit Journey)
**우선순위**: Should
**목적**: "다음 레이스 서킷"에 집중하는 대신, 시즌 전체 서킷 여정을 타임라인으로 보여줌
**현재 데이터로 구현 가능**: 가능

콘텐츠 (수평 타임라인 또는 그리드):
- 완료 레이스: 국기 + 레이스명 + 우승자 (회색 처리)
- 다음 레이스: 강조 (빨간 테두리, 국기, 레이스명)
- 남은 레이스: 국기 + 레이스명 (미래)
- 현재 섹션에서 25개 서킷 4개 고정 표시 → 시즌 여정으로 대체

개선 포인트:
- 현재 "주목 서킷" 4개 고정 → 시즌 캘린더 기반 여정 타임라인으로 교체
- 완료/다음/예정 3가지 상태 시각화

#### Section 7: 드라이버 스포트라이트 (Driver Spotlight)
**우선순위**: Could
**목적**: 팬의 드라이버 탐색 유도, 풍부한 프로필 데이터 활용
**현재 데이터로 구현 가능**: 가능 (드라이버 22명 풀 프로필 보유)

콘텐츠:
- 랜덤 또는 주간 피처드 드라이버 1명
- 드라이버 헤드샷 + 이름 + 팀 + 현재 챔피언십 순위 + 포인트
- bio 한 문장 미리보기
- 강점(strengths) 태그 3개
- CTA: "프로필 전체 보기"

개선 포인트: 신규 섹션 (드라이버 페이지 트래픽 유도)

---

## 4. 레이스 데이 화면 구성 (Race Weekend Mode)

레이스 주간에는 기존 평소 화면 섹션을 일부 교체/추가하고, 최상단에 "레이스 위크 배너"가 자리잡는다.

### 섹션 순서 및 상세 기획

#### Section 1: 레이스 위크 라이브 배너 (Race Week Live Hero)
**우선순위**: Must
**목적**: "지금 레이스 주간임"을 즉시 인식, 현재 세션 상태 표시
**현재 데이터로 구현 가능**: 가능 (OpenF1 + 캘린더 데이터 활용)

콘텐츠:
- 레이스 주간 강조 배지: "LIVE WEEKEND" 또는 "GP 주간"
- 현재/다음 세션 이름 + 로컬 시각
- 세션 진행 중: 남은 시간 또는 "진행 중" 표시
- 세션 종료 후: 다음 세션까지 카운트다운
- 전체 세션 타임테이블 (현재 세션 강조)
- 날씨 정보: 기온/트랙 온도/강수 여부 (OpenF1 `/weather` API)

#### Section 2: 퀄리파잉 결과 / 스타팅 그리드 (Qualifying / Grid)
**우선순위**: Must (퀄리파잉 이후 토요일~일요일)
**목적**: 팬이 가장 원하는 정보 — 내일/오늘 레이스 그리드
**현재 데이터로 구현 가능**: OpenF1 `/starting_grid` API 사용 가능

콘텐츠:
- 퀄리파잉 완료 후 표시
- 스타팅 그리드 Top 10 (드라이버 이름 + 팀 컬러 + 랩타임)
- 폴 포지션 드라이버 강조
- 스프린트 주말: 스프린트 결과 카드 추가

#### Section 3: 챔피언십 현황 (평소와 동일)
**우선순위**: Must
**목적**: 레이스 결과가 챔피언십에 미칠 영향 맥락 제공

콘텐츠: 평소 화면 Section 2와 동일 (드라이버 + 컨스트럭터 Top 5)

#### Section 4: 레이스 결과 (Race Completed — 레이스 종료 후)
**우선순위**: Must (레이스 완료 후)
**목적**: 레이스 결과 최우선 노출

콘텐츠:
- 포디움 Top 3 카드 (1위·2위·3위)
- 각 카드: 드라이버명 + 팀 + 랩타임/간격
- 패스티스트 랩 드라이버
- "더 보기" → /season 레이스 상세

#### Section 5: 실시간 뉴스 (Race Week 특화)
**우선순위**: Must
**목적**: 레이스 주간에는 뉴스 빈도가 급증, 실시간 피드 강조

콘텐츠:
- 뉴스 피드 최신 8~10개 (평소보다 많이)
- "레이스 & 퀄리파잉" 토픽 우선 정렬
- 업데이트 시각 표시

#### Section 6: 서킷 정보 (Race Weekend 특화)
**우선순위**: Should
**목적**: 이번 GP 서킷 심층 정보 — 팬의 관전 포인트 제공

콘텐츠:
- 이번 GP 서킷 상세 카드 (현재 "주목 서킷"을 이번 서킷으로 교체)
- 서킷 설명, 특성, 하이라이트
- 역대 우승자 최근 5년 (Jolpica `getCircuitHistory()` 활용)
- 랩 레코드 드라이버/시간/연도

#### Section 7: AI 뉴스 브리핑 (레이스 주간 버전)
**우선순위**: Should
**목적**: 레이스 주간 특화 요약 (평소보다 아래에 위치)

콘텐츠: 평소 화면 Section 4와 동일하지만 레이스 주간 관련 뉴스 강조

---

## 5. Scope

### 5.1 In Scope

- [ ] 평소 화면 7개 섹션 정의 및 콘텐츠 명세
- [ ] 레이스 데이 화면 7개 섹션 정의 및 콘텐츠 명세
- [ ] 화면 전환 조건 로직 (`isRaceWeekend()` 함수)
- [ ] 현재 보유 데이터로 구현 가능한 섹션 vs 신규 데이터 필요 섹션 구분
- [ ] 각 섹션의 MoSCoW 우선순위

### 5.2 Out of Scope

- 실제 UI 구현 (Design 페이즈에서 다룸)
- OpenF1 실시간 WebSocket 스트리밍 (현재 SSR 기반 앱 구조상 복잡)
- 사용자 개인화 (즐겨찾는 드라이버/팀 설정)
- 푸시 알림 (레이스 시작 알림 등)

---

## 6. Requirements

### 6.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 현재 날짜/시각 기준으로 레이스 주간 여부를 자동 감지한다 | High | Pending |
| FR-02 | 평소 화면에 컨스트럭터 챔피언십 Top 5를 표시한다 | High | Pending |
| FR-03 | 평소 화면에 최근 3경기 포디움(1·2·3위) 카드를 표시한다 | High | Pending |
| FR-04 | 평소 화면 AI 브리핑 섹션에 bullets·editorNote·watchPoints를 전부 노출한다 | High | Pending |
| FR-05 | 평소 화면에 최신 뉴스 헤드라인 5~6개를 표시하고 원문 링크를 제공한다 | Medium | Pending |
| FR-06 | 평소 화면에 시즌 캘린더 타임라인(완료/다음/예정 상태)을 표시한다 | Medium | Pending |
| FR-07 | 레이스 주간 화면 최상단에 현재/다음 세션 정보 및 날씨를 표시한다 | High | Pending |
| FR-08 | 레이스 주간 퀄리파잉 완료 후 스타팅 그리드 Top 10을 표시한다 | High | Pending |
| FR-09 | 레이스 완료 후 포디움 Top 3 결과를 최우선으로 표시한다 | High | Pending |
| FR-10 | 레이스 주간 화면에 이번 GP 서킷 상세 정보 및 역대 우승자를 표시한다 | Medium | Pending |

### 6.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 메인 페이지 초기 로드 3초 이내 (SSR) | Lighthouse / Core Web Vitals |
| Freshness | 뉴스 피드 30분 주기 갱신 (현재 revalidate: 1800 유지) | Next.js ISR 로그 |
| Reliability | API 실패 시 mock 데이터로 graceful degradation | 수동 테스트 (API 차단) |
| Accessibility | WCAG 2.1 AA — 색상 대비, 스크린 리더 레이블 | axe DevTools |

---

## 7. 구현 우선순위 (MoSCoW)

### Must (현재 이터레이션 포함)

1. **FR-01** 레이스 주간 감지 로직 — 모든 화면 전환의 전제 조건
2. **FR-02** 컨스트럭터 챔피언십 추가 — `fetchConstructorStandings()`는 이미 구현됨
3. **FR-04** AI 브리핑 전체 필드 노출 — 데이터 이미 있음, 렌더링만 추가
4. **FR-07** 레이스 주간 세션 정보 + 날씨 배너
5. **FR-09** 레이스 결과 포디움 카드

### Should (이번 이터레이션 포함 목표)

6. **FR-03** 최근 레이스 포디움 Top 3 — Jolpica `getAllResults()`에서 데이터 확장 필요
7. **FR-05** 뉴스 피드 프리뷰 — `getF1News()` 이미 구현됨
8. **FR-08** 스타팅 그리드 — OpenF1 `/starting_grid` API 사용
9. **FR-10** 이번 GP 서킷 + 역대 우승자 — `fetchCircuitWinners()` 이미 구현됨

### Could (다음 이터레이션)

10. **FR-06** 시즌 캘린더 타임라인 — 기존 데이터로 가능하나 UI 복잡도 있음
11. 드라이버 스포트라이트 섹션

### Won't (현재 범위 외)

- 실시간 WebSocket 포지션 트래킹 (레이스 중 순위 변화)
- 개인화 (즐겨찾기 드라이버)
- 푸시 알림

---

## 8. 필요한 신규 데이터/API

### 8.1 기존 데이터로 즉시 구현 가능

| 섹션 | 활용 데이터 | 현재 상태 |
|------|------------|---------|
| 컨스트럭터 챔피언십 | `fetchConstructorStandings()` | 구현됨, 미사용 |
| AI 브리핑 전체 | `AiDigest.bullets`, `.editorNote`, `.watchPoints` | 구현됨, 미노출 |
| 뉴스 피드 | `getF1News()` | 구현됨, 미사용 |
| 이번 GP 서킷 역대 우승자 | `fetchCircuitWinners()` | 구현됨, 미사용 |
| 세션 타임테이블 | `SessionSchedule` (RaceCalendar) | 구현됨, 미노출 |

### 8.2 소규모 확장으로 구현 가능

| 섹션 | 필요 작업 | 난이도 |
|------|----------|------|
| 포디움 Top 3 | `getAllResults()`에서 Results[0~2] 추출 → `fetchCalendar()` 확장 | 낮음 |
| 스타팅 그리드 | OpenF1 `getStartingGrid(sessionKey)` 신규 호출 | 낮음 |
| 날씨 정보 | OpenF1 `getLatestWeather(sessionKey)` 신규 호출 | 낮음 |
| 레이스 주간 감지 | `isRaceWeekend()` 유틸 함수 작성 (캘린더 데이터 기반) | 낮음 |

### 8.3 새로 필요한 데이터 (현재 미구현)

| 항목 | 방법 | 우선순위 |
|------|------|--------|
| 현재 세션 진행 상태 | OpenF1 `getLatestSession()` + 시각 비교 로직 | High |
| 레이스 중 실시간 순위 | OpenF1 `getPositions()` (SSE/polling) | Low (Won't) |

---

## 9. 화면 전환 로직

```
isRaceWeekend():
  캘린더에서 status === "next" 레이스 조회
  → sessions.fp1이 존재하고 현재 시각이 fp1 시작 후 ~ race 종료 후 24h 이내
  → true (레이스 데이 화면)

  그 외 → false (평소 화면)

getCurrentSession():
  레이스 주간 중 현재 시각 기준
  → 진행 중인 세션 반환 (fp1/fp2/fp3/sq/sprint/qualifying/race)
  → 없으면 다음 세션 반환
```

---

## 10. Success Criteria

### 10.1 Definition of Done

- [ ] 평소 화면 Must 섹션 4개 구현 완료
- [ ] 레이스 데이 화면 Must 섹션 3개 구현 완료
- [ ] `isRaceWeekend()` 로직으로 자동 전환 동작
- [ ] 모든 API 실패 시 graceful fallback
- [ ] 모바일/태블릿/데스크탑 반응형 확인
- [ ] 한국어 콘텐츠 일관성 (드라이버/팀 공식 한국어 표기)

### 10.2 Quality Criteria

- [ ] Lighthouse Performance 점수 90 이상
- [ ] 빌드 에러 없음
- [ ] 린트 에러 없음

---

## 11. Architecture Considerations

### 11.1 Project Level

**Dynamic** — 기능 기반 모듈 구조 유지

### 11.2 Key Architectural Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| 화면 전환 | 서버 컴포넌트 내 조건부 렌더링 | SSR 유지, SEO 영향 없음 |
| 레이스 주간 감지 | 서버 사이드 (page.tsx) | 클라이언트 hydration 없이 올바른 화면 제공 |
| 날씨/그리드 데이터 | OpenF1 API (기존 클라이언트 활용) | 이미 타입 정의 완비 |
| 뉴스 피드 | 기존 `getF1News()` + ISR revalidate 1800s | 신규 인프라 불필요 |

### 11.3 Component Structure (예상)

```
src/app/page.tsx
  ├── isRaceWeekend() 감지
  ├── [평소] NormalModeLayout
  │   ├── HeroBanner (다음 레이스 + 세션 타임테이블)
  │   ├── ChampionshipSnapshot (드라이버 + 컨스트럭터)
  │   ├── RecentRaceResults (포디움 Top 3 카드)
  │   ├── AiDigestFull (전체 필드)
  │   ├── NewsFeedPreview (신규)
  │   └── SeasonTimeline (신규)
  └── [레이스 주간] RaceWeekendLayout
      ├── RaceWeekHero (세션 상태 + 날씨)
      ├── QualifyingGrid (조건부 — 퀄리파잉 후)
      ├── ChampionshipSnapshot (동일)
      ├── PodiumResults (조건부 — 레이스 후)
      ├── RaceWeekNews (뉴스 확장)
      └── CircuitDeepDive (이번 GP 서킷)
```

---

## 12. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| OpenF1 API 응답 지연 (레이스 주간 트래픽 급증) | High | Medium | revalidate 짧게 + 스켈레톤 UI, Suspense |
| 레이스 주간 감지 타이밍 오류 (시간대 문제) | Medium | Medium | UTC 기준으로 통일, KST 변환은 클라이언트에서만 |
| Jolpica API 포디움 데이터 미반환 | Medium | Low | `getAllResults()` 확장 + mock 폴백 |
| 뉴스 피드 이미지 CORS 문제 | Low | Medium | 이미지 없으면 텍스트만 표시 (graceful) |

---

## 13. Timeline

| Phase | 내용 | 예상 소요 |
|-------|------|--------|
| Design | 컴포넌트 구조 + 데이터 플로우 설계 | 0.5일 |
| Do (Must) | 레이스 주간 감지, 컨스트럭터 챔피언십, AI 브리핑 전체 노출 | 1일 |
| Do (Should) | 포디움 카드, 뉴스 피드, 스타팅 그리드, 날씨 | 1일 |
| Do (Could) | 시즌 타임라인, 드라이버 스포트라이트 | 0.5일 |
| Check | Gap 분석 + 버그 수정 | 0.5일 |
| Total | | 3.5일 |

---

## 14. Next Steps

1. [ ] CTO(팀 리드) 플랜 검토 및 승인
2. [ ] `homepage-content-redesign.design.md` 작성 (컴포넌트 구조, 데이터 플로우, UI 스펙)
3. [ ] 구현 시작 (`/pdca do homepage-content-redesign`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-05 | Initial draft | Product Manager |
