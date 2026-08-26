# Plan: F1 사이트 페이지 구조 재편

## 개요
현재 32개 페이지가 존재하며, 네비게이션 복잡도가 높고 방문자가 원하는 정보를 빠르게 찾기 어려운 구조.
핵심 콘텐츠 중심으로 페이지를 통합·정리하여 UX를 개선한다.

---

## 현재 페이지 구조 (32페이지)

### 홈
- `/` — 홈 대시보드

### 시즌 (6페이지)
- `/season` — 시즌 개요
- `/season/archive` — 역대 시즌
- `/season/race/[round]` — 레이스 상세
- `/season/race/[round]/[session]` — 세션 (FP/Q/R)
- `/season/race/[round]/analysis` — 분석
- `/season/race/[round]/replay` — 리플레이

### 드라이버 / 팀 / 서킷 (6페이지)
- `/drivers`, `/drivers/[id]`
- `/teams`, `/teams/[id]`
- `/circuits`, `/circuits/[id]`

### 콘텐츠 (11페이지)
- `/compare` — 드라이버 비교
- `/news` — 뉴스 + AI 브리핑
- `/info` — 정보
- `/info/regulations` — 규정
- `/info/regulations/section/[id]` — 규정 섹션
- `/history` — 역사
- `/history/era/[slug]` — 시대별
- `/fantasy` — 판타지
- `/devlog` — 개발 로그
- `/community`, `/community/new`, `/community/[postId]`, `/community/[postId]/edit`

### 어드민 (2페이지)
- `/admin`, `/admin/dashboard`

---

## 문제 정의

1. **콘텐츠 분산**: `/info`, `/history`, `/devlog` 등 저트래픽 페이지가 상단 네비에 자리를 차지
2. **중복성**: `/season/race/[round]/analysis`와 `/compare`가 유사한 분석 기능 제공
3. **네비게이션 과부하**: 사용자가 실제로 자주 방문하는 페이지(레이스, 뉴스, 드라이버)와 희귀 방문 페이지가 동등한 위치
4. **`/fantasy`**: 실제 운영 여부 불분명

---

## 재편 방향 (검토 필요)

### 옵션 A: 네비게이션 간소화 (코드 변경 최소)
- 상단 네비를 핵심 6개로 줄임: 홈 / 시즌 / 드라이버&팀 / 서킷 / 뉴스 / 커뮤니티
- `/info`, `/history`, `/devlog`는 푸터로 이동
- 페이지 자체는 유지, 진입 경로만 조정

### 옵션 B: 페이지 통합 (중간 규모 변경)
- `/info` + `/history` → `/guide` 또는 `/about` 으로 통합
- `/season/race/[round]/analysis` + `/compare` → 분석 기능 통합 검토
- `/devlog` → 외부 링크 또는 푸터 전용

### 옵션 C: 전면 재설계 (대규모 변경)
- 홈을 허브로 재설계 (뉴스, 다음 레이스, AI 브리핑 모두 홈에서)
- `/news` 페이지 독립 제거, 홈에 흡수
- 메뉴: 시즌 / 드라이버 / 팀 / 서킷 (4개)

---

## 결정 필요 사항

> **작업 시작 전 확인이 필요합니다:**

1. 어떤 옵션(A/B/C) 또는 커스텀 방향으로 진행할지
2. `/fantasy` 페이지 유지 여부
3. `/devlog` 처리 방향 (유지/제거/푸터 이동)
4. 현재 네비게이션 메뉴 항목 (어떤 항목이 상단에 있는지 확인 필요)
5. 모바일 네비게이션 변경 범위

---

## 예상 작업 범위

| 옵션 | 예상 변경 파일 수 | 난이도 |
|------|:-----------:|:----:|
| A (네비 간소화) | 1~3개 | 낮음 |
| B (페이지 통합) | 5~15개 | 중간 |
| C (전면 재설계) | 15~30개 | 높음 |

---

## 완료 기준

- [ ] 선택한 옵션 기준 네비게이션 변경 완료
- [ ] 모든 내부 링크 정상 작동 확인
- [ ] 모바일 뷰 정상 확인
- [ ] `npm run build` 통과
