# Plan: 드라이버 간 직접 비교 (driver-comparison)

**작성일**: 2026-03-11
**Feature**: driver-comparison
**Phase**: Plan

---

## 1. 배경 및 목적

두 드라이버를 선택해 시즌별 포인트·순위·승수·폴 포지션을 나란히 비교할 수 있는 페이지.

현재 드라이버 페이지(`/drivers/[id]`)는 단일 드라이버 커리어 통계만 보여준다.
팬들이 가장 자주 원하는 "해밀턴 vs 베르스타펜", "알론소 vs 슈마허" 등 직접 비교를 지원하지 않는다.

---

## 2. 핵심 기능

### 커리어 비교 (Jolpica 데이터)
| 기능 | 설명 |
|------|------|
| 드라이버 선택 | 검색 가능한 드롭다운으로 두 드라이버 선택 |
| 통계 비교 테이블 | 시즌별 팀·순위·승수·폴·포인트 양쪽 나란히 |
| 포인트 트렌드 차트 | 두 드라이버 라인을 같은 SVG에 겹쳐서 표시 |
| 공통 시즌 필터 | 두 드라이버 모두 출전한 시즌만 하이라이트 |
| URL 공유 | `/compare?a=hamilton&b=verstappen` 형태로 공유 가능 |

### 랩 텔레메트리 비교 (FastF1 Railway 서비스)
| 기능 | 설명 |
|------|------|
| 레이스 선택 | 연도 + 그랑프리 + 세션(R/Q) 선택 |
| 패스티스트랩 오버레이 | 두 드라이버의 Speed / Throttle / Brake를 Distance 기준으로 겹쳐서 표시 |
| 섹션별 우위 표시 | 구간별 어느 드라이버가 빠른지 색상으로 강조 |

---

## 3. 데이터 소스

| 데이터 | 소스 | 용도 |
|--------|------|------|
| 커리어 시즌 통계 | Jolpica API `/ergast/f1/drivers/{id}/driverStandings.json` | 포인트·순위·승수 |
| 드라이버 목록 | 기존 `src/data/drivers.ts` | 선택 UI |
| 랩 텔레메트리 | Railway FastF1 `/fastest-lap?year=&gp=&session=&driver=` | Speed/Throttle/Brake vs Distance |
| 레이스 목록 | Jolpica API `/ergast/f1/{year}/races.json` | 레이스 선택 드롭다운 |

---

## 4. 페이지 구조

```
/compare
  └─ CompareClient.tsx  (클라이언트 컴포넌트)
       ├─ DriverPicker (A/B 각각, 검색 필터링)
       ├─ [탭 1: 커리어 비교]
       │    ├─ CompareCareerChart (SVG, 두 포인트 라인 오버레이)
       │    └─ CompareCareerTable (시즌별 통계 테이블)
       └─ [탭 2: 랩 텔레메트리]
            ├─ RacePicker (연도 → 그랑프리 → 세션)
            └─ TelemetryChart (Speed/Throttle/Brake vs Distance, SVG 오버레이)
```

---

## 5. 구현 범위 (MVP)

### 커리어 비교
- [ ] `/compare` 페이지 라우트 생성
- [ ] 드라이버 선택 UI (검색 필터링 포함)
- [ ] Jolpica API 호출 → 시즌별 통계 파싱
- [ ] 두 드라이버 포인트 트렌드 SVG 차트 (각 팀 컬러)
- [ ] 시즌별 비교 테이블
- [ ] URL 파라미터 (`?a=&b=`) 동기화
- [ ] 네비게이션에 "비교" 링크 추가
- [ ] OG 메타데이터

### 랩 텔레메트리 비교
- [ ] 연도·그랑프리·세션 선택 UI
- [ ] Railway FastF1 `/fastest-lap` 호출 (드라이버 A, B 각각)
- [ ] Distance 기준 Speed 오버레이 SVG 차트
- [ ] Throttle / Brake 서브 차트 (토글 가능)
- [ ] 첫 요청 로딩 상태 표시 (FastF1 초기 로드 1~3분 소요 안내)

## 6. 제외 범위

- 3명 이상 동시 비교
- 레이스 랩별 페이스 추이 (replay-frames 필요, 별도 기능)
- 실시간 세션 텔레메트리

---

## 7. 기술 스택

- Next.js App Router (클라이언트 컴포넌트)
- SVG 기반 차트 (외부 라이브러리 없음 — 기존 `DriverCareerChart` 패턴 활용)
- Jolpica REST API (커리어 통계)
- Railway FastF1 API `https://f1-production-f075.up.railway.app/fastest-lap` (텔레메트리)
- URL SearchParams (`useSearchParams` + `useRouter`)

---

## 8. 성공 기준

- 두 드라이버 선택 후 3초 내 커리어 비교 화면 표시
- 텔레메트리: FastF1 캐시 히트 시 5초 내, 미스 시 로딩 안내 표시
- URL 공유로 동일 비교 화면 재현 가능
- 모바일 반응형 레이아웃 정상 동작
