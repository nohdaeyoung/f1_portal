# Plan: race-result-automation

## 개요

레이스 종료 직후, Jolpica F1 API에서 최종 결과를 가져와 **SEO Machine 게시글** 형태로 커뮤니티에 자동 등록하는 Cron 기능.

기존 `community-bots` Cron(봇 4개 팬 글 생성)과 병행하되, 별도 엔드포인트로 **공식 결과 요약 게시글**을 추가로 게시한다.

---

## 목표 (Why)

- 레이스가 끝나면 사용자들이 결과를 커뮤니티에서 바로 확인 가능해야 함
- 현재 봇 게시글은 상위 5명 정보만 포함 — 정식 결과표(포인트, 패스티스트 랩, DNF 등)가 없음
- 관리자가 수동으로 게시하는 번거로움을 없애기 위해 Cron으로 자동화

---

## 요구사항 (What)

### 필수
- [ ] 레이스 결과 Cron 엔드포인트: `GET /api/cron/race-result`
- [ ] Jolpica API에서 최신 레이스 전체 결과 조회 (상위 20명 + DNF)
- [ ] Claude AI로 레이스 결과 요약 게시글 생성 (마크다운, 800~1200자)
- [ ] `/api/admin/seo-publish` 경유해 커뮤니티에 등록 (authorId: `seo_machine`)
- [ ] `vercel.json`에 Cron 스케줄 추가: 일요일 15:00 KST (06:00 UTC) — 레이스 종료 약 2시간 후
- [ ] 이미 같은 라운드 결과 게시글이 있으면 중복 등록 방지

### 선택
- [ ] 패스티스트 랩, 리타이어 드라이버 목록 포함
- [ ] 드라이버·컨스트럭터 챔피언십 현황 업데이트 포함

---

## 기술 스택 (How)

- **런타임**: Next.js Route Handler (Node.js runtime)
- **데이터 소스**: Jolpica F1 API (`/ergast/f1/current/last/results.json`)
- **AI**: Claude Haiku (요약 생성)
- **DB**: Firebase Admin SDK (Firestore 중복 체크)
- **인증**: `CRON_SECRET` Bearer 토큰 (기존 방식 동일)
- **배포**: Vercel Cron

---

## 구현 범위

### 새 파일
- `src/app/api/cron/race-result/route.ts` — 메인 Cron 엔드포인트

### 수정 파일
- `vercel.json` — Cron 스케줄 추가

### 재사용 (수정 없음)
- `src/app/api/admin/seo-publish/route.ts` — 게시글 등록 API
- Firebase Admin 초기화 패턴 (community-bots와 동일)
- `CRON_SECRET` 환경변수

---

## 중복 방지 로직

Firestore `posts` 컬렉션에서 `roundTag == currentRound && authorId == "seo_machine" && botPersonaId == "race_result"` 인 문서가 이미 존재하면 스킵.

---

## Cron 스케줄

| 엔드포인트 | 스케줄 | 목적 |
|---|---|---|
| `/api/cron/community-bots` | `0 4 * * 0` (일 13:00 KST) | 봇 팬 글 생성 |
| `/api/cron/race-result` | `0 6 * * 0` (일 15:00 KST) | 레이스 결과 요약 |

---

## 완료 기준 (Done)

- Vercel Cron이 트리거됐을 때 커뮤니티에 레이스 결과 게시글이 자동 등록됨
- 같은 라운드 결과 게시글이 두 번 이상 등록되지 않음
- 게시글 본문에 상위 10명 결과표 + DNF + 주요 포인트 포함
