# Design: race-result-automation

> Plan 참조: `docs/01-plan/features/race-result-automation.plan.md`

---

## 아키텍처 개요

```
Vercel Cron (일 15:00 KST)
    │
    ▼
GET /api/cron/race-result
    │
    ├─ 1. 인증 (CRON_SECRET)
    ├─ 2. Firestore 중복 체크 (race_result + roundTag)
    ├─ 3. Jolpica API → 레이스 결과 조회
    ├─ 4. Claude Haiku → 마크다운 게시글 생성
    └─ 5. Firestore Admin SDK → posts 컬렉션에 직접 저장
```

> **설계 결정**: `seo-publish` API를 경유하지 않고 Firestore에 직접 저장.
> `seo-publish`를 내부에서 fetch 호출하면 타임아웃 리스크가 있고, Firebase Admin SDK가 이미 초기화되어 있으므로 직접 저장이 더 단순하고 안정적.

---

## 파일 구조

### 새 파일
```
src/app/api/cron/race-result/route.ts
```

### 수정 파일
```
vercel.json  ← crons 배열에 항목 추가
```

---

## route.ts 상세 설계

### 엔드포인트
```
GET /api/cron/race-result
Authorization: Bearer {CRON_SECRET}
```

### 처리 흐름

#### Step 1: 인증
```typescript
const authHeader = request.headers.get("authorization");
if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return 401
}
```

#### Step 2: Firebase Admin 초기화
`community-bots/route.ts`와 동일한 `getAdminDb()` 패턴 재사용.

#### Step 3: 중복 체크
```typescript
// Firestore 쿼리: 같은 라운드의 race_result 봇 게시글 존재 여부
const existing = await db.collection("posts")
  .where("botPersonaId", "==", "race_result")
  .where("roundTag", "==", roundNumber)
  .limit(1)
  .get();

if (!existing.empty) {
  return { skipped: true, reason: "Already posted for this round" }
}
```

#### Step 4: Jolpica API 조회
```
GET https://api.jolpi.ca/ergast/f1/current/last/results.json
```

응답에서 추출할 데이터:
| 필드 | 경로 |
|------|------|
| 레이스명 | `race.raceName` |
| 시즌 | `race.season` |
| 라운드 | `race.round` |
| 서킷명 | `race.Circuit.circuitName` |
| 전체 결과 | `race.Results[]` |
| 포지션 | `r.position` / `r.positionText` |
| 드라이버 | `r.Driver.givenName + familyName` |
| 팀 | `r.Constructor.name` |
| 포인트 | `r.points` |
| 상태 | `r.status` (Finished / Lapped / DNF 사유) |
| 패스티스트 랩 | `r.FastestLap.rank === "1"` |
| 그리드 | `r.grid` |

#### Step 5: Claude로 게시글 생성

**System Prompt**:
```
당신은 F1 커뮤니티의 공식 레이스 결과 정리 봇입니다.
레이스 데이터를 바탕으로 팬들이 읽기 좋은 마크다운 형식의 결과 요약 게시글을 작성하세요.
```

**User Message** (구조화된 레이스 데이터):
```
레이스: {raceName} ({season} 시즌, 라운드 {round})
서킷: {circuitName}

## 결과
1위 러셀 (메르세데스) - 25pts - Finished ⚡FL
2위 안토넬리 (메르세데스) - 18pts - Finished
...
20위 콜라핀토 (알핀) - 0pts - DNF: Collision

패스티스트 랩: 러셀 (1:18.123)

위 데이터를 바탕으로 800~1200자 마크다운 게시글을 작성하세요.
형식:
- ## 제목 없이 바로 본문 시작
- ### 섹션 구분 사용 가능
- 결과표는 마크다운 테이블로
- 레이스 하이라이트, DNF 사유 코멘트 포함
- 팬 커뮤니티 말투 (공식적이지 않게)
```

**모델**: `claude-haiku-4-5-20251001`
**max_tokens**: 800

#### Step 6: Firestore에 저장

```typescript
await db.collection("posts").add({
  authorId: "seo_machine",
  authorNickname: "📊 SEO Machine",
  authorAvatarUrl: null,
  category: "레이스 토론",
  title: `${race.season} ${race.raceName} — 공식 레이스 결과`,
  body,                          // Claude 생성 마크다운
  imageUrl: null,
  roundTag: Number(race.round),
  teamTag: null,
  likes: 0,
  commentCount: 0,
  isBot: true,
  botPersonaId: "race_result",   // 중복 체크 키
  seo: {
    metaTitle: `${race.season} F1 ${race.raceName} 레이스 결과`,
    metaDescription: `${winnerName} 우승, ${race.raceName} 공식 레이스 결과와 드라이버 순위`,
    primaryKeyword: `${race.season} F1 ${race.raceName}`,
  },
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: null,
});
```

---

## vercel.json 변경

```json
{
  "crons": [
    { "path": "/api/revalidate-digest", "schedule": "0 * * * *" },
    { "path": "/api/cron/devlog",        "schedule": "0 22 * * *" },
    { "path": "/api/cron/community-bots","schedule": "0 4 * * 0" },
    { "path": "/api/cron/race-result",   "schedule": "0 6 * * 0" }
  ]
}
```

> 일요일 06:00 UTC = 15:00 KST. 레이스는 보통 14:00~15:00 KST 종료.

---

## 타입 정의

```typescript
interface JolpicaResult {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: {
    driverId: string;
    givenName: string;
    familyName: string;
    nationality: string;
  };
  Constructor: {
    constructorId: string;
    name: string;
  };
  grid: string;
  laps: string;
  status: string;          // "Finished" | "Lapped" | "+1 Lap" | "Engine" | "Collision" ...
  Time?: { time: string };
  FastestLap?: {
    rank: string;          // "1" = 패스티스트 랩 보유자
    lap: string;
    Time: { time: string };
  };
}

interface JolpicaRace {
  season: string;
  round: string;
  raceName: string;
  Circuit: { circuitId: string; circuitName: string };
  date: string;
  Results: JolpicaResult[];
}
```

---

## 에러 처리

| 상황 | 처리 |
|------|------|
| `CRON_SECRET` 불일치 | 401 반환 |
| Firebase Admin 미설정 | `{ skipped: true }` 반환 |
| Jolpica API 결과 없음 | `{ skipped: true, reason: "No recent race" }` |
| 중복 게시글 존재 | `{ skipped: true, reason: "Already posted" }` |
| Claude API 오류 | 500 반환 + 에러 로그 |
| Firestore 저장 오류 | 500 반환 + 에러 로그 |

---

## 완료 기준

- [ ] `GET /api/cron/race-result` 호출 시 커뮤니티에 레이스 결과 게시글 등록됨
- [ ] 동일 라운드 중복 호출 시 두 번째부터 스킵
- [ ] 게시글 본문에 상위 10명 결과표(마크다운 테이블) 포함
- [ ] DNF 드라이버와 사유 포함
- [ ] 패스티스트 랩 드라이버 표시
- [ ] vercel.json에 Cron 스케줄 추가됨
