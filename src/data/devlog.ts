/**
 * PitLane 개발 노트 — 정적 히스토리 엔트리
 * GitHub 커밋 추적 이전 또는 커밋 외 주요 결정사항을 기록
 */

export interface DevlogEntry {
  date: string;       // YYYY-MM-DD
  type: "feature" | "fix" | "design" | "data" | "infra" | "init";
  title: string;
  items: string[];
}

export const devlogHistory: DevlogEntry[] = [
  {
    date: "2026-03-05",
    type: "init",
    title: "프로젝트 초기 설정",
    items: [
      "Next.js 15 App Router 기반 프로젝트 생성 (create-next-app)",
      "TypeScript + Tailwind CSS v4 환경 구성",
      "프로젝트명 PitLane — 2026 F1 종합 포털로 방향 설정",
      "Vercel 배포 파이프라인 연결 (nohdaeyoung/f1_portal)",
      "Jolpica F1 API (Ergast 호환) 및 OpenF1 API 클라이언트 설계",
    ],
  },
  {
    date: "2026-03-06",
    type: "feature",
    title: "핵심 페이지 & 기능 전체 구현",
    items: [
      "메인 홈 페이지: 다음 레이스 히어로, 챔피언십 순위, AI 브리핑, 뉴스 피드, 시즌 캘린더",
      "드라이버 페이지: 22명 전체 아카이브, 개인 상세 페이지 (커리어 통계, 시즌 결과)",
      "팀 페이지: 11개 팀 (캐딜락 포함) 목록 및 상세 (역대 순위, 챔피언십 기록)",
      "서킷 페이지: 24개 서킷 목록 및 상세 (사양, 랩 레코드, 역대 우승자, 트랙 맵)",
      "시즌 트래커: 드라이버/컨스트럭터 챔피언십 표, 레이스 캘린더, 다음 레이스 세션 일정",
      "뉴스 허브: 실시간 F1 뉴스 피드 (RSS 집계), AI 데일리 브리핑",
      "정보 허브 (info): 2026 주요 변경사항 카드 + FIA 공식 규정 전문 한국어 번역",
    ],
  },
  {
    date: "2026-03-06",
    type: "data",
    title: "2026 F1 공식 규정 전문 한국어 번역 완료",
    items: [
      "Section A: 기술 규정 일반사항 (T0 기준 원문 전문)",
      "Section B: 파워유닛 기술 규정 (PU 구조, MGU-K, 배터리, 연료 시스템)",
      "Section C: 차량 기술 규정 (공기역학, 차체 치수, 언더바디, 서스펜션)",
      "Section D: 재정 규정 (코스트 캡 $135M, 감사 절차, 제재 체계)",
      "Section F: 운영 규정 (공장 가동 중단, 공기역학 시험 제한, ATR·RWTT·RCFD)",
      "FIA 공식 HTML 원문 파싱 → TypeScript 데이터 구조 변환 (RegArticle 인터페이스)",
    ],
  },
  {
    date: "2026-03-06",
    type: "design",
    title: "정보 허브 페이지 리디자인 — 주요 변경사항 카드",
    items: [
      "2026 주요 변경사항 8→9개 항목으로 확장 (오버테이크 모드 & 부스트 버튼 추가)",
      "각 항목에 초보자용 한국어 설명(beginner) 필드 신규 추가",
      "핵심 변경사항(impact:high) 4건 → 글로우 효과 대형 카드 (2열 그리드)",
      "추가 변경사항(impact:medium) 5건 → 컴팩트 카드 (3열 그리드)",
      "카드별 컬러 테마, 주요 수치(stat), '💡 쉽게 말하면' 설명 박스",
      "주요 변경사항 섹션을 페이지 최상단으로 이동, 규정 전문은 하단 배치",
    ],
  },
  {
    date: "2026-03-06",
    type: "feature",
    title: "GP 개별 상세 페이지 신설 (/season/race/[round])",
    items: [
      "라운드별 GP 상세 페이지: 24개 라운드 정적 생성 (generateStaticParams)",
      "히어로 섹션: GP명, 서킷 스펙 요약 4종, 우승자(완료)/D-day 카운트다운(예정)",
      "세션 일정 (KST): FP1~3·스프린트·퀄리파잉·레이스 전체, 완료 상태 표시",
      "결승 결과 테이블: 순위, 드라이버, 팀, 그리드, 기록/상태(DNF 빨간색), 포인트, FL 뱃지",
      "퀄리파잉 결과 테이블: 순위, Q1/Q2/Q3 타임",
      "스프린트 결과 테이블: 스프린트 주말 한정 표시",
      "live.ts에 fetchRaceResult·fetchQualifyingResult·fetchSprintResult 추가",
      "시즌 캘린더 및 홈 캘린더 링크 → /season/race/[round] 로 변경",
    ],
  },
  {
    date: "2026-03-06",
    type: "infra",
    title: "GitHub 배포 및 Vercel 프로덕션 배포",
    items: [
      "GitHub 저장소 nohdaeyoung/f1_portal 원격 연결 및 초기 push",
      "Vercel CLI로 프로덕션 배포 완료 (f1-delta-flame.vercel.app)",
      "Vercel ↔ GitHub 자동 배포 파이프라인 연결 — 이후 push 시 자동 재배포",
      "Next.js 16.1.6 (Turbopack) 빌드 성공, 전체 페이지 정적 생성 확인",
    ],
  },
  {
    date: "2026-03-06",
    type: "feature",
    title: "라이브 세션 대시보드 & AI 다이제스트 자동 갱신",
    items: [
      "라이브 세션 대시보드 신설 (/api/live/session → LiveSessionDashboard 컴포넌트)",
      "카운트다운 타이머: 다음 세션까지 실시간 D-day/H:M:S 표시",
      "홈 페이지 라이브 세션 인디케이터 및 세션 종료 후 결과 데이터 자동 표시",
      "홈 세션 타임테이블 → 완료 세션은 결과 페이지로 링크 연결",
      "OpenF1 date_end 기반 라이브 세션 감지 로직 수정 (종료 후 유령 live 상태 방지)",
      "AI 다이제스트 크론 KST 01시·12시 이중 갱신 (UTC 16:00·03:00) — 별도 엔드포인트 분리",
      "Claude max_tokens 2048→4096 (JSON 잘림 방지), 응답 파싱 regex 추출 방식으로 개선",
      "크론→warm-digest 분리 호출 구조로 revalidateTag 순서 문제 해결",
    ],
  },
  {
    date: "2026-03-06",
    type: "feature",
    title: "SEO/GEO 최적화 & FastF1 텔레메트리 분석 페이지",
    items: [
      "sitemap.ts, robots.ts 추가 (250+ URL 자동 생성)",
      "전체 페이지 Open Graph + Twitter Card 메타데이터 적용",
      "JSON-LD 구조화 데이터 추가 (홈, 드라이버, 팀, 서킷, 레이스) — lib/jsonld.ts",
      "layout.tsx metadataBase + title.template 전역 설정",
      "FastF1 Python 서버 연동 → /api/fastf1/[...path] 프록시 API 라우트",
      "텔레메트리 분석 페이지 신설 (/season/race/[round]/analysis): 랩 분석, 속도맵, 전략 탭",
      "FP1~3 결과 상세화: 헤드샷, 섹터 타임, 타이어 화합물, 속도 트랩 컬럼 추가",
      "F1 역사 시대별 상세 페이지 신설 (/history/era/[slug]) — 시대 카드에서 링크 연결",
      "예정 세션 페이지 404 수정 → 미리보기 UI(세션 일정 안내) 표시로 변경",
      "메인 메뉴 '정보' → '규정' 레이블 변경, dev 서버 포트 4000으로 통일",
    ],
  },
  {
    date: "2026-03-08",
    type: "feature",
    title: "관리자 대시보드 — 레이스 결과 수동 입력 & 메타태그 관리",
    items: [
      "관리자 대시보드 신설 (/admin/dashboard): 코드 삽입·메뉴 관리·메타태그·서킷 코너·레이스 결과 5개 섹션",
      "레이스 결과 수동 입력: 스프린트/메인 레이스 독립 폼, Jolpica API 미업데이트 시 즉시 반영 가능",
      "스프린트 주말 지원: 스프린트·메인 레이스 서브탭으로 분리, 각각 독립 API 호출 (isSprint 플래그)",
      "F1 포인트 계산 유틸 (f1-points.ts): 레이스 25-18-15...+FL보너스, 스프린트 8-7-6-5-4-3-2-1",
      "f1-data.ts 자동 업데이트: 드라이버·컨스트럭터 스탠딩, 캘린더 completed+winner, 커리어 통계 regex 치환",
      "Telegram 알림 + 비동기 빌드·배포 (exec npm run build && vercel --prod)",
      "메타태그 관리 탭 추가: 사이트 타이틀, 타이틀 템플릿, description, OG Title/Description/Image, 키워드",
      "layout.tsx generateMetadata와 admin-config.json meta 필드 연동 — 빈 값 시 기본값 fallback",
    ],
  },
  {
    date: "2026-03-06",
    type: "design",
    title: "디자인 시스템 전면 개편 (Phase A-C) & 성능 최적화",
    items: [
      "Phase A: CSS 디자인 토큰 30개 정의, UI 공통 컴포넌트 (Button, Card, SectionHeader, Badge) 신설, GNB 현재 페이지 활성 인디케이터",
      "Phase B: Inter 폰트 적용, 모바일 햄버거 드로어 메뉴, F1 전용 컴포넌트 (PodiumBadge, CompoundBadge, TeamColorBar) 추가",
      "Phase B: 세션 결과 테이블 — 헤더/좌측 컬럼 sticky, 스켈레톤 로딩 UI",
      "Phase C: 홈 page.tsx → 8개 독립 컴포넌트 분리 (NextRaceHero, RaceWeekendHero, ChampionshipsSection 등)",
      "Phase C: 전체 페이지 CSS 토큰 마이그레이션, WCAG 명도 대비 수정",
      "성능: 홈 force-dynamic → ISR revalidate:300 (CDN 캐시 활용)",
      "성능: fetchCalendar/fetchDriverStandings/fetchConstructorStandings unstable_cache 적용",
      "성능: 완료 세션 페이지 revalidate:86400 (기존 60s에서 개선)",
      "GNB 개발노트 항목 제거, 푸터 GitHub 링크 정리",
    ],
  },
];

/** 날짜 레이블 (3월 5일 (목) 형식) */
export function formatDevlogDate(dateStr: string): string {
  return new Date(dateStr + "T09:00:00+09:00").toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export const TYPE_META: Record<
  DevlogEntry["type"],
  { label: string; color: string; bg: string }
> = {
  init:    { label: "초기화",  color: "#64748B", bg: "#64748B15" },
  feature: { label: "기능",    color: "#0EA5E9", bg: "#0EA5E915" },
  fix:     { label: "수정",    color: "#22C55E", bg: "#22C55E15" },
  design:  { label: "디자인",  color: "#A855F7", bg: "#A855F715" },
  data:    { label: "데이터",  color: "#F59E0B", bg: "#F59E0B15" },
  infra:   { label: "인프라",  color: "#E8002D", bg: "#E8002D15" },
};
