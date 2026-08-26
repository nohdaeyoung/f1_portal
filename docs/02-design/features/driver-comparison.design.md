# Design: 드라이버 간 직접 비교 (driver-comparison)

**작성일**: 2026-03-11
**Feature**: driver-comparison
**Phase**: Design
**참조 Plan**: `docs/01-plan/features/driver-comparison.plan.md`

---

## 1. 파일 구조

```
src/app/compare/
  ├── page.tsx                  # 서버 컴포넌트 (metadata + Suspense)
  └── CompareClient.tsx         # 클라이언트 컴포넌트 (전체 UI)

src/components/compare/
  ├── DriverPicker.tsx          # 드라이버 검색 드롭다운 (A/B 공용)
  ├── CompareCareerChart.tsx    # 커리어 포인트 트렌드 SVG (두 라인)
  ├── CompareCareerTable.tsx    # 시즌별 통계 비교 테이블
  └── TelemetryCompareChart.tsx # 패스티스트랩 Speed/Throttle/Brake SVG

src/components/layout/
  └── NavLinks.tsx              # "비교" 링크 추가 (기존 파일 수정)
```

---

## 2. 라우팅 & URL

```
/compare                        → 초기 화면 (드라이버 미선택)
/compare?a=verstappen&b=norris  → 비교 화면 (커리어 탭)
```

- `useSearchParams()`로 `a`, `b` 파라미터 읽기
- 드라이버 선택 시 `router.push` or `router.replace`로 URL 업데이트
- 페이지 진입 시 파라미터 자동 복원

---

## 3. 데이터 흐름

### 3-1. 커리어 비교 (클라이언트 fetch)

```
CompareClient
  → fetchDriverCareerStats(driverIdA)  // 기존 live.ts 함수 재사용
  → fetchDriverCareerStats(driverIdB)
  → CompareCareerChart (두 시즌 통계 배열 전달)
  → CompareCareerTable
```

`fetchDriverCareerStats`는 `src/lib/data/live.ts`에 이미 존재.
클라이언트에서 직접 호출하지 않고, **Next.js Route Handler**로 래핑:

```
GET /api/career?driver=verstappen
→ fetchDriverCareerStats("verstappen")
→ JSON 반환
```

이유: `unstable_cache` 적용 가능, 클라이언트 번들에 서버 의존성 포함 방지.

### 3-2. 랩 텔레메트리 (클라이언트 fetch)

기존 `/api/fastf1/[...path]` 프록시 라우트 재사용:

```
CompareClient
  → /api/fastf1/fastest-lap?year=2026&gp=1&session=R&driver=VER
  → /api/fastf1/fastest-lap?year=2026&gp=1&session=R&driver=NOR
  → TelemetryCompareChart (두 TelPoint[] 배열)
```

레이스 목록은 `/api/fastf1/races?year=2026` 또는 기존 캘린더 데이터(`RaceCalendar`) 활용.

---

## 4. 컴포넌트 상세

### 4-1. page.tsx

```typescript
export const metadata: Metadata = {
  title: "드라이버 비교",
  description: "두 F1 드라이버의 커리어 통계와 랩 텔레메트리를 직접 비교하세요.",
};

export default function ComparePage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <CompareClient />
    </Suspense>
  );
}
```

### 4-2. CompareClient.tsx (핵심 상태)

```typescript
type Tab = "career" | "telemetry";

const [driverA, setDriverA] = useState<string | null>(null);  // 로컬 id
const [driverB, setDriverB] = useState<string | null>(null);
const [tab, setTab] = useState<Tab>("career");

// 커리어 데이터
const [statsA, setStatsA] = useState<DriverSeasonStat[]>([]);
const [statsB, setStatsB] = useState<DriverSeasonStat[]>([]);

// 텔레메트리 데이터
const [telYear, setTelYear] = useState<number>(2026);
const [telGp, setTelGp] = useState<number | null>(null);
const [telSession, setTelSession] = useState<"R" | "Q">("R");
const [telA, setTelA] = useState<TelPoint[]>([]);
const [telB, setTelB] = useState<TelPoint[]>([]);
const [telLoading, setTelLoading] = useState(false);
```

**드라이버 변경 → 커리어 데이터 즉시 fetch**
**텔레메트리 탭 + 레이스 선택 시 → `/api/fastf1/fastest-lap` fetch (병렬)**

### 4-3. DriverPicker.tsx

```typescript
interface Props {
  label: "A" | "B";
  value: string | null;
  exclude: string | null;   // 반대편 드라이버 제외
  onChange: (id: string) => void;
}
```

- `drivers` 배열(from `f1-data.ts`)을 검색 필터링
- 선택된 드라이버 이름 + 팀 컬러 원형 뱃지 표시
- `exclude` prop으로 같은 드라이버 선택 방지

### 4-4. CompareCareerChart.tsx

`DriverCareerChart`(단일 드라이버) 패턴 확장.
두 개의 `<polyline>`을 동일 SVG에 렌더링.

```
입력: statsA[], statsB[], colorA, colorB
- X축: 연도 (두 배열 합집합 범위)
- Y축: 포인트 (두 배열 최대값 기준)
- 두 polyline + 각각 gradient 면적
- 공통 시즌(둘 다 출전)에 배경 하이라이트
- 레전드: 드라이버명 + 팀 컬러
```

### 4-5. CompareCareerTable.tsx

```
연도 | 팀A       | 순위A | 승A | 폴A | 포인트A | vs | 포인트B | 폴B | 승B | 순위B | 팀B
2023 | Red Bull  |  1위  |  19 |  12 |   575  | > |   205  |  3  |  2  |  2위  | McLaren
```

- 포인트 우위 쪽 배경 살짝 강조 (팀 컬러 5% opacity)
- 챔피언 시즌 별 아이콘

### 4-6. TelemetryCompareChart.tsx

기존 `TelemetryClient.tsx`의 `SpeedTrace` SVG 컴포넌트 패턴 그대로 사용.

```
입력: telA[], telB[], colorA, colorB
차트 구성:
  1. Speed vs Distance    (H=140, 메인)
  2. Throttle vs Distance (H=60, 서브, 토글)
  3. Brake vs Distance    (H=60, 서브, 토글)

공통 X축: max(maxDistA, maxDistB)
```

FastF1 초기 로드 안내:
```tsx
{telLoading && (
  <div>
    ⏳ FastF1 데이터 로딩 중... 처음 요청은 최대 2분 소요될 수 있습니다.
  </div>
)}
```

---

## 5. API Route: /api/career

```
src/app/api/career/route.ts

GET /api/career?driver=verstappen
→ fetchDriverCareerStats("verstappen")
→ Response.json(stats)
```

캐싱: `{ next: { revalidate: 3600 } }` (1시간)

---

## 6. FastF1 드라이버 약어 매핑

텔레메트리 호출에는 3자 약어 필요 (VER, NOR 등).
`f1-data.ts`의 `Driver` 인터페이스에 `abbreviation` 필드가 없으면 별도 매핑 추가:

```typescript
// CompareClient.tsx 내부 상수
const DRIVER_ABBR: Record<string, string> = {
  verstappen: "VER", norris: "NOR", hamilton: "HAM", leclerc: "LEC",
  piastri: "PIA", russell: "RUS", antonelli: "ANT", alonso: "ALO",
  stroll: "STR", gasly: "GAS", colapinto: "COL", sainz: "SAI",
  albon: "ALB", lawson: "LAW", lindblad: "LIN", ocon: "OCO",
  bearman: "BEA", hulkenberg: "HUL", bortoleto: "BOR", hadjar: "HAD",
};
```

---

## 7. 네비게이션

`src/components/layout/NavLinks.tsx`에 추가:

```typescript
{ href: "/compare", label: "비교" },
```

"판타지" 링크 앞에 삽입.

---

## 8. 구현 순서

1. `/api/career` Route Handler 생성
2. `DriverPicker.tsx` 컴포넌트
3. `CompareCareerChart.tsx` (SVG 이중 라인)
4. `CompareCareerTable.tsx`
5. `TelemetryCompareChart.tsx` (SpeedTrace 패턴 재활용)
6. `CompareClient.tsx` (상태 관리 + 탭 UI)
7. `compare/page.tsx` (metadata + Suspense)
8. `NavLinks.tsx` 링크 추가

---

## 9. 성공 기준 (검증 포인트)

| 항목 | 기준 |
|------|------|
| 커리어 데이터 로드 | 두 드라이버 선택 후 3초 내 표시 |
| URL 공유 | `?a=&b=` 파라미터로 동일 화면 재현 |
| 텔레메트리 캐시 히트 | 5초 내 표시 |
| 텔레메트리 캐시 미스 | 로딩 안내 표시 + 2분 내 완료 |
| 같은 드라이버 방지 | A=VER 선택 시 B에서 VER 비활성화 |
| 모바일 | 테이블 가로 스크롤, 차트 full-width |
