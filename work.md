# F1 by 324.ing — 전체 작업 기록

> 프로젝트 시작: 2026-03-05
> 최종 업데이트: 2026-03-15
> 배포 URL: https://f1.324.ing
> 스택: Next.js 16 App Router · TypeScript · Tailwind v4 · Firebase · Vercel

---

## Phase 1 — 프로젝트 초기 구축 (2026-03-05~06)

### 기반 설정
- Next.js 16 App Router + TypeScript + Tailwind v4 프로젝트 생성
- F1 2026 시즌 데이터 설계 및 모킹 (`src/data/f1-data.ts`)
  - Driver, Team, Circuit, RaceCalendar, SessionSchedule 인터페이스 정의
  - 20명 드라이버, 10개 팀, 24개 서킷 데이터
  - 24라운드 캘린더, 세션 스케줄 (FP1~Race, 스프린트 주말 지원)

### 페이지 구축
| 페이지 | 경로 |
|--------|------|
| 홈 | `/` |
| 시즌 트래커 | `/season` |
| GP 상세 | `/season/race/[round]` |
| 세션 결과 | `/season/race/[round]/[session]` |
| 리플레이 | `/season/race/[round]/replay` |
| 랩 분석 | `/season/race/[round]/analysis` |
| 드라이버 목록 | `/drivers` |
| 드라이버 상세 | `/drivers/[id]` |
| 팀 목록 | `/teams` |
| 팀 상세 | `/teams/[id]` |
| 서킷 목록 | `/circuits` |
| 서킷 상세 | `/circuits/[id]` |
| F1 역사 | `/history` |
| 시대별 이야기 | `/history/era/[slug]` |
| 규정 | `/info/regulations` |
| 커뮤니티 | `/community` |
| 뉴스 | `/news` |
| 개발 노트 | `/devlog` |

### 데이터 레이어
- **Jolpica API** (Ergast 대체): 드라이버/컨스트럭터 순위, 레이스·예선·스프린트 결과
- **OpenF1 API**: 실시간 세션 감지, 드라이버 헤드샷
- **FastF1 Python FastAPI**: 랩 타임, 코너 인사이트, 리플레이 프레임 (`/Volumes/Dev/f1/fastf1-api/`)
- ISR (`unstable_cache`, `revalidateTag`) + 폴백 구조

---

## Phase 2 — AI 다이제스트 (2026-03-06)

### 기능
- **Claude API** (`claude-sonnet-4-6`)로 매일 F1 뉴스 브리핑 자동 생성
- KST 01:00, 12:00 이중 갱신 크론 (UTC 16:00, 03:00)
- 구조화된 JSON 응답: `headline`, `editorNote`, `watchPoints[]`, `hotTopics[]`, `communityBuzz`

### 파일
- `src/lib/api/ai-digest.ts` — 생성 로직, `unstable_cache` 캐싱
- `src/app/api/revalidate-digest/route.ts` — 01시 크론
- `src/app/api/revalidate-digest-noon/route.ts` — 12시 크론
- `src/app/api/warm-digest/route.ts` — 캐시 프리워밍 + Telegram 발송

### 주요 디버깅 이력
- `max_tokens` 2048 → 4096 (JSON 잘림 방지)
- Claude 응답 파싱: 정규식으로 JSON 객체 추출
- `unstable_cache` 모듈 레벨 이동 + KST 날짜 인자로 일별 캐시 분리
- 홈·뉴스 페이지 `force-dynamic` → ISR `revalidate:300` (빌드 시 Claude API 실패 방지)
- 크론→warm-digest 분리 호출로 `revalidateTag` 순서 문제 해결

---

## Phase 3 — 디자인 시스템 (2026-03-06)

### CSS 토큰 시스템 (Phase A)
- 30개 디자인 토큰 (`src/app/globals.css`)
- `--color-bg`, `--color-surface`, `--color-border`, `--color-text-*`, `--color-accent` 등

### UI 컴포넌트 (Phase A)
```
src/components/ui/
  Button.tsx       — primary / ghost / outline / danger variants
  Card.tsx         — 기본 카드 컨테이너
  SectionHeader.tsx — 섹션 제목 + 링크
  Badge.tsx        — 상태/카테고리 배지
  Table.tsx        — shadcn 패턴 Table (7개 서브컴포넌트)
```

### F1 전용 컴포넌트 (Phase B)
```
src/components/f1/
  PodiumBadge.tsx   — 1·2·3위 금·은·동 배지
  CompoundBadge.tsx — 타이어 컴파운드 배지
  TeamColorBar.tsx  — 팀 컬러 사이드바
```

### 홈 컴포넌트 분리 (Phase C)
기존 `page.tsx` 712줄 → 8개 컴포넌트로 분리:
```
src/components/home/
  NextRaceHero.tsx        — 다음 레이스 카운트다운
  RaceWeekendHero.tsx     — 레이스 주말 히어로
  ChampionshipsSection.tsx — 드라이버/컨스트럭터 순위
  RecentResultsSection.tsx — 최근 레이스 결과
  AiDigestPreview.tsx     — AI 다이제스트 프리뷰
  NewsFeedSection.tsx     — 뉴스 피드
  SeasonCalendar.tsx      — 시즌 캘린더 그리드
  SessionTimetable.tsx    — 세션 타임테이블
```

### 성능 최적화
- 홈 `force-dynamic` → ISR `revalidate:300` (CDN 캐시 활용)
- `fetchCalendar` / `fetchDriverStandings` / `fetchConstructorStandings`: `unstable_cache` 적용
- 완료된 세션 페이지 `revalidate:86400` (기존 60s)
- `next.config.ts`: AVIF/WebP 이미지 포맷, `minimumCacheTTL:86400`
- `layout.tsx`: `readFileSync` 모듈 레벨 캐시 (`_analyticsCfg`)

---

## Phase 4 — 라이브 세션 / 실시간 기능 (2026-03-06)

### 라이브 세션 대시보드
- `src/components/live/LiveSessionDashboard.tsx`
- OpenF1 API로 현재 진행 중인 세션 감지
- 실시간 타이머, 드라이버 포지션, 섹터 타임 표시

### 세션 감지 로직
- `date_end` 기준으로 세션 종료 판단 (기존 `date_start` → 수정)
- 홈에서 레이스 주말 여부 감지: FP1 시작 ~ 레이스+6h

### 세션 결과 페이지
- FP 결과 페이지 데이터 보강
- 완료된 세션 → 결과 링크, 진행 전 → 일정 표시

---

## Phase 5 — 커뮤니티 & Firebase (2026-03-06~07)

### Firebase 설정
- Firestore 컬렉션: `posts`, `comments`, `likes`
- Firebase Admin SDK (서버 전용 크론/API)
- 클라이언트 SDK (사용자 액션)

### 커뮤니티 기능
- 게시글 CRUD (`src/lib/community/posts.ts`)
- 댓글 (`src/lib/community/comments.ts`)
- 좋아요 토글 (denormalized counter)
- 카테고리 필터: 레이스 토론 / 드라이버 & 팀 / 기술 & 규정 / 잡담
- 커서 기반 페이지네이션

### AI 봇 커뮤니티 포스트
- `src/app/api/cron/community-bots/route.ts`
- 4개 봇 페르소나 (`src/lib/community/bots.ts`)
- 최신 레이스 결과 기반 Claude Haiku로 자동 게시
- Vercel Cron: 일요일 13:00 KST (04:00 UTC)

### SEO Machine 연동
- `POST /api/admin/seo-publish` — 외부 SEO 도구에서 게시글 자동 작성
- Bearer CRON_SECRET 인증

---

## Phase 6 — Telegram 알림 (2026-03-07)

### 설정
- 봇: `@dyno_notifications_bot`
- 채널: `@f1324ing`
- 환경변수: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNEL_ID`

### 동작
- `warm-digest` 호출 시마다 다이제스트 내용을 Telegram 채널에 자동 발송
- HTML parse mode, 에디터 노트 + 주요 포인트 + 핫 토픽 포맷

```ts
// src/app/api/warm-digest/route.ts
async function sendTelegram(digest: AiDigest) { ... }
```

---

## Phase 7 — SEO / GEO 최적화 (2026-03-06~07)

### JSON-LD 구조화 데이터
- `src/lib/jsonld.ts`: `websiteSchema`, `organizationSchema`, `sportsEventSchema`, `breadcrumbSchema`
- 홈, GP 상세, 드라이버, 팀 페이지에 적용

### 메타데이터
- 모든 페이지 `metadata` 객체 완비 (title, description, openGraph, twitter)
- `alternates.canonical` URL 설정
- `sitemap.ts`, `robots.ts` 자동 생성

### GEO 최적화
- 헤더/바디 커스텀 코드 지원 (어드민에서 주입)
- Naver 사이트 인증 코드 지원

---

## Phase 8 — 어드민 대시보드 (2026-03-07)

### 기능
- `pitlane_admin` 쿠키 기반 인증 (`/admin` 로그인)
- Analytics 설정 (GTM ID, GA ID, Naver 코드, 헤드/바디 커스텀 코드)
- Nav 링크 관리
- `src/data/admin-config.json` 파일 기반 설정 저장

### API
- `GET/POST /api/admin/config` — 설정 읽기/저장
- `GET /api/admin/check` — 어드민 여부 확인
- `POST /api/admin/logout` — 로그아웃

---

## Phase 9 — 버그 수정 및 개선 (2026-03-08)

### Table 컴포넌트 적용
shadcn 패턴 `Table` 컴포넌트를 시즌·역사 페이지에 적용:
- `src/app/season/page.tsx` — 드라이버/컨스트럭터 순위표
- `src/app/history/page.tsx` — 역대 챔피언 (2000–2024, 1950–1999)

### 게시글 삭제 오류 수정
**원인**: 클라이언트 SDK `deleteDoc` → Firestore 보안 규칙 차단
**해결**: `DELETE /api/posts/[id]` API 신설 → 서버에서 쿠키 검증 + Admin SDK 삭제
- `src/app/api/posts/[id]/route.ts`
- `src/components/community/PostEditActions.tsx`

### 레이스 캘린더 날짜 범위 표시
FP1 ~ 레이스 당일 기간으로 변경 (`"03.13~15"` 형식)
- `src/components/home/SeasonCalendar.tsx`
- `src/app/season/page.tsx`

### 레이스 결과 데이터 누락 수정
Jolpica API `limit=100` 추가 (기본값 제한으로 일부 드라이버 누락):
- `src/lib/api/jolpica.ts` — `getRaceResults`, `getQualifying`, `getSprintResults`

### 레이스 결과 정렬 수정
- 완주자 먼저 (position 오름차순)
- DNF / DNS / DSQ 드라이버를 하단으로 (`positionText`로 판별)
- `src/lib/data/live.ts` — `sortResults` 함수

### Jolpica 드라이버 ID 수정 (이전 세션)
잘못된 ID 3개 수정:
- `hadjar` → `isack_hadjar`
- `antonelli` → `andrea_kimi_antonelli`
- `lindblad` → `arvid_lindblad`

### FastF1 API 수정 (이전 세션)
- CORS origins에 `https://f1.324.ing` 추가
- `/replay-frames`에서 qualifying 세션 로드 제거 (30~60초 지연 원인)

### AdminDashboardClient 타입 오류 수정
`Props` 인터페이스에 `pendingRounds`, `driverList` 누락 → 빌드 실패 수정

---

---

## Phase 10 — R2 캐시 & Railway OOM 대응 (2026-03-08~12)

### Cloudflare R2 캐시 시스템
- **버킷**: `f1-cashe` (Cloudflare R2 S3-compatible)
- 리플레이·텔레메트리 데이터를 R2에 저장, Railway 연산 없이 직접 서빙
- Next.js 프록시 (`/api/fastf1/[...path]/route.ts`)에서 `gunzipSync` 디컴프레스 처리
- R2 캐시 히트 시 presigned URL로 클라이언트 직접 리다이렉트 (Railway 대역폭 절감)

### Railway OOM 해결
- `DISABLE_COMPUTE=true` 환경변수: `/replay-frames`, `/driver-telemetry` 엔드포인트에서 `sess.load()` 차단
- `sess.load()`는 단일 드라이버 요청에도 22명 전체 로드 → ~500MB RAM 소모
- 로컬 캐시 → R2 강제 업로드 스크립트 (`scripts/upload_telemetry_to_r2.py`)
  - 2,953개 파일, 34개 신규 업로드, 2,919개 스킵 (이미 존재), 0개 실패

### 세션 이름 정규화
- `Race` → `R`, `Sprint` → `S` 변환 (`replay-frames` 라우트)

---

## Phase 11 — 보안 강화 (2026-03-12~13)

### 취약점 감사 결과 (14건)

| 등급 | 건수 | 처리 |
|------|------|------|
| Critical | 2 | ✅ 수정 완료 |
| High | 4 | ✅ 수정 완료 |
| Medium | 5 | 미처리 |
| Low | 3 | 미처리 |

### C-1: 하드코딩 관리자 비밀번호 제거
- 기존: `ADMIN_ID ?? "dynoworld"`, `ADMIN_PW ?? "!dstory4863"` 하드코딩 폴백
- 수정: 환경변수 미설정 시 503 반환 (fail-safe)
- 파일: `src/app/api/admin/login/route.ts`

### C-2: 쿠키 위조 방어
- 기존: 쿠키 값 `"authenticated"` 고정 문자열 비교
- 수정: `ADMIN_COOKIE_SECRET` 랜덤 해시값으로 비교
- 파일: `src/middleware.ts`, `src/app/admin/dashboard/page.tsx`

### H-3: warm-digest API 인증 추가
- `CRON_SECRET` Bearer 토큰 없이 누구나 호출 가능했던 문제 수정
- 내부 재귀 호출도 인증 헤더 포함하도록 수정
- 파일: `src/app/api/warm-digest/route.ts`, `src/app/api/revalidate-digest/route.ts`

### H-4: Firestore 좋아요·댓글수 조작 방지
- `likes`, `commentCount` 업데이트 시 로그인 필수 + 델타 ±1 제한
- `firestore.rules` Firebase 배포

### 일일 보안·QA 자동 모니터링
- `src/app/api/cron/security-qa/route.ts` 신설
- 매일 09:00 KST (00:00 UTC) Vercel Cron 실행
- S1~S4 보안 점검 + Q1~Q6 가용성 점검 → Telegram 리포트

---

## Phase 12 — 어드민 Google 로그인 (2026-03-13~15)

### Google OAuth 로그인 추가
- Firebase `signInWithPopup(auth, GoogleAuthProvider)` → ID token 획득
- `POST /api/admin/google-login`: Firebase Admin SDK로 토큰 검증
- `ADMIN_GOOGLE_EMAIL` 환경변수와 이메일 일치 시 `pitlane_admin` 쿠키 발급
- 미들웨어에 `google-login` 공개 예외 추가

### 어드민 로그인 페이지 개선
- Google 로그인 버튼 + ID/PW 로그인 OR 구분 레이아웃
- 파일: `src/app/admin/page.tsx`

### 대시보드 Google 계정 섹션
- 현재 연동된 Google 이메일 표시
- 변경 방법 가이드 (Vercel env 수정)
- 파일: `src/app/admin/dashboard/AdminDashboardClient.tsx`

### 환경변수 추가
- `ADMIN_ID`, `ADMIN_PW`, `ADMIN_COOKIE_SECRET` (Vercel Production)
- `ADMIN_GOOGLE_EMAIL=dynoworld@gmail.com` (Vercel Production)

---

## Vercel Cron 스케줄

| 엔드포인트 | 스케줄 | 목적 |
|-----------|--------|------|
| `/api/revalidate-digest` | `0 16 * * *` (01:00 KST) | AI 다이제스트 새벽 갱신 |
| `/api/revalidate-digest-noon` | `0 3 * * *` (12:00 KST) | AI 다이제스트 낮 갱신 |
| `/api/cron/devlog` | `0 13 * * *` (22:00 KST) | 개발 노트 크론 |
| `/api/cron/community-bots` | `0 4 * * 0` (일 13:00 KST) | AI 봇 커뮤니티 포스트 |
| `/api/cron/race-result` | `0 6 * * 0` (일 15:00 KST) | 레이스 결과 갱신 |
| `/api/cron/security-qa` | `0 0 * * *` (09:00 KST) | 보안·QA 모니터링 → Telegram |

---

## 환경변수 목록

| 변수 | 용도 |
|------|------|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase 클라이언트 |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Firebase Admin SDK |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Firebase Admin SDK |
| `ANTHROPIC_API_KEY` | Claude AI |
| `CRON_SECRET` | 크론 인증 |
| `TELEGRAM_BOT_TOKEN` | Telegram 봇 |
| `TELEGRAM_CHANNEL_ID` | Telegram 채널 (`@f1324ing`) |
| `ADMIN_ID` | 어드민 ID |
| `ADMIN_PW` | 어드민 비밀번호 |
| `ADMIN_COOKIE_SECRET` | 어드민 쿠키 서명 값 (랜덤 해시) |
| `ADMIN_GOOGLE_EMAIL` | Google 로그인 허용 이메일 |

---

## 주요 파일 구조

```
src/
├── app/
│   ├── page.tsx                    홈
│   ├── season/page.tsx             시즌 트래커
│   ├── season/race/[round]/        GP 상세·세션·리플레이·분석
│   ├── drivers/, teams/, circuits/ 드라이버/팀/서킷
│   ├── history/                    F1 역사
│   ├── community/                  커뮤니티
│   ├── news/, devlog/, info/       뉴스·개발노트·규정
│   ├── admin/                      어드민
│   └── api/
│       ├── posts/[id]/             게시글 CRUD (Admin SDK DELETE)
│       ├── warm-digest/            AI 다이제스트 + Telegram
│       ├── revalidate-digest*/     캐시 갱신 크론
│       ├── cron/community-bots/    AI 봇 포스트
│       ├── cron/race-result/       레이스 결과 크론
│       └── admin/                  어드민 API
├── components/
│   ├── ui/                         Button, Card, Badge, Table, SectionHeader
│   ├── f1/                         PodiumBadge, CompoundBadge, TeamColorBar
│   ├── home/                       홈 섹션 8개 컴포넌트
│   ├── community/                  커뮤니티 컴포넌트
│   └── live/                       라이브 세션 대시보드
├── data/
│   ├── f1-data.ts                  드라이버·팀·서킷·캘린더 목 데이터
│   ├── f1-champions.ts             역대 챔피언
│   ├── f1-eras.ts                  시대별 이야기
│   └── admin-config.json           어드민 설정
└── lib/
    ├── data/live.ts                Jolpica+OpenF1 데이터 레이어
    ├── api/jolpica.ts              Jolpica API 클라이언트
    ├── api/openf1.ts               OpenF1 API 클라이언트
    ├── api/ai-digest.ts            Claude AI 다이제스트
    ├── api/news.ts                 뉴스 피드
    ├── community/posts.ts          게시글 CRUD
    ├── community/bots.ts           봇 페르소나
    ├── firebase.ts                 Firebase 클라이언트
    └── jsonld.ts                   JSON-LD 구조화 데이터
```
