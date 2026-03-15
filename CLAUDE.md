# F1 by 324.ing — Claude Code 가이드

## 프로젝트 개요
- **배포**: https://f1.324.ing
- **스택**: Next.js 16 App Router · TypeScript · Tailwind v4 · Firebase · Vercel
- **백엔드**: Railway FastAPI (FastF1 Python), Cloudflare R2 캐시

## 작업 규칙
- 수정 후 `npm run build`로 로컬 빌드 확인
- 배포(`npx vercel --prod`)는 "배포해" 명시 요청 시에만
- git 명령은 반드시 이 디렉토리(`/Volumes/Dev/f1`)에서 실행
- Python: `/opt/homebrew/bin/python3.13` 사용 (`python3` 금지 — Xcode 라이선스 오류)

## 핵심 아키텍처

### API 흐름
```
브라우저 → /api/fastf1/[...path] (Next.js 프록시) → Railway FastF1
                                                    ↓ (캐시 히트)
                                              Cloudflare R2 (presigned URL 리다이렉트)
```
- `NEXT_PUBLIC_FASTF1_API_URL` 삭제됨 — 클라이언트 직접 호출 금지 (CORS/gzip 오류)
- R2 캐시 히트 시 `x-cache: R2-HIT` 헤더로 확인 가능

### Railway 제약
- `DISABLE_COMPUTE=true`: `/replay-frames`, `/driver-telemetry` 연산 차단
- `sess.load()`는 22명 전체 로드 → ~500MB RAM → OOM 원인
- 모든 데이터는 R2에서 서빙 (2,954개 파일 캐시 완료)

### 어드민
- 경로: `/admin` → `/admin/dashboard`
- 인증: ID/PW 또는 Google OAuth (dynoworld@gmail.com)
- 쿠키: `pitlane_admin` = `ADMIN_COOKIE_SECRET` 값
- 미들웨어: `src/middleware.ts` (proxy.ts로 마이그레이션 필요 — deprecated 경고 있음)

### Firebase
- Firestore 보안 규칙: `firestore.rules` (배포: `firebase deploy --only firestore:rules`)
- likes/commentCount: 로그인 필수 + 델타 ±1 제한

## 주요 환경변수 (Vercel Production)
| 변수 | 용도 |
|------|------|
| `ADMIN_ID` / `ADMIN_PW` | 어드민 ID/PW |
| `ADMIN_COOKIE_SECRET` | 쿠키 서명 해시 |
| `ADMIN_GOOGLE_EMAIL` | Google 로그인 허용 이메일 |
| `CRON_SECRET` | Vercel Cron 인증 Bearer |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHANNEL_ID` | 텔레그램 봇 |
| `ANTHROPIC_API_KEY` | Claude AI (다이제스트) |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase 클라이언트 |
| `FIREBASE_ADMIN_CLIENT_EMAIL` / `FIREBASE_ADMIN_PRIVATE_KEY` | Firebase Admin SDK |

## 주요 스크립트
```bash
# 레이스 결과 업데이트 (Jolpica API 폴링)
/opt/homebrew/bin/python3.13 scripts/update-f1-round.py

# 텔레메트리 로컬 캐시 → R2 업로드
/opt/homebrew/bin/python3.13 scripts/upload_telemetry_to_r2.py

# FastF1 로컬 서버
/opt/homebrew/bin/python3.13 fastf1-api/main.py
```

## Vercel Cron
| 엔드포인트 | 시간 | 목적 |
|-----------|------|------|
| `/api/revalidate-digest` | 01:00 KST | AI 다이제스트 새벽 |
| `/api/revalidate-digest-noon` | 12:00 KST | AI 다이제스트 낮 |
| `/api/cron/community-bots` | 일 13:00 KST | AI 봇 포스트 |
| `/api/cron/race-result` | 일 15:00 KST | 레이스 결과 |
| `/api/cron/security-qa` | 09:00 KST | 보안·QA 점검 → Telegram |

## 알려진 이슈
- `middleware.ts` → `proxy.ts` 마이그레이션 권장 (Next.js 16 deprecated 경고)
- Firebase Storage (`f1-324.firebasestorage.app`) 버킷 없음 — 비차단 WARNING (R2가 primary)
- Medium 보안 취약점 5건 미처리 (M-1~M-5): 보안 헤더, XSS, rate limiting 등
