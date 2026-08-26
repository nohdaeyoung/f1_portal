# F1 Website Security Audit Report

**Date**: 2026-03-12
**Scope**: `/Volumes/Dev/f1/` (f1.324.ing)
**Auditor**: Security Architect Agent

---

## Executive Summary

| Severity | Count |
|----------|-------|
| **Critical** | 2 |
| **High** | 4 |
| **Medium** | 5 |
| **Low** | 3 |
| **Total** | 14 |

---

## Critical Issues

### C-1. Hardcoded Admin Credentials in Source Code

**File**: `/Volumes/Dev/f1/src/app/api/admin/login/route.ts` (line 4-5)
**OWASP**: A07 Identification and Authentication Failures

```typescript
const ADMIN_ID = process.env.ADMIN_ID ?? "dynoworld";
const ADMIN_PW = process.env.ADMIN_PW ?? "!dstory4863";
```

**Problem**: Admin ID/password are hardcoded as fallback defaults. If `ADMIN_ID` and `ADMIN_PW` environment variables are NOT set on the deployment server, anyone who reads this source code can log in as admin.

**Impact**: Full admin access to the site -- post CRUD, config changes, data migration, race result updates, source file modification, and production deployment trigger.

**Remediation**:
1. Remove hardcoded fallback values entirely. If env vars are missing, the login should FAIL, not fall back.
2. Change the current password immediately (it is now considered compromised since it was in source code).
3. Set `ADMIN_ID` and `ADMIN_PW` exclusively via Vercel environment variables.

```typescript
// Fix:
const ADMIN_ID = process.env.ADMIN_ID;
const ADMIN_PW = process.env.ADMIN_PW;

if (!ADMIN_ID || !ADMIN_PW) {
  return NextResponse.json({ error: "Admin not configured" }, { status: 503 });
}
```

---

### C-2. Weak Admin Session: Static Cookie Value Without Signature

**Files**:
- `/Volumes/Dev/f1/src/middleware.ts` (line 8)
- `/Volumes/Dev/f1/src/app/api/admin/login/route.ts` (line 7)

```typescript
const COOKIE_VALUE = "authenticated";
// ...
request.cookies.get(ADMIN_COOKIE)?.value === ADMIN_VALUE;
```

**Problem**: Admin authentication is determined by checking if cookie `pitlane_admin` equals the literal string `"authenticated"`. There is no cryptographic signature, no session ID, no token rotation, and no server-side session storage.

**Impact**: Any attacker who knows (or guesses) this pattern can forge the admin cookie:
```
Cookie: pitlane_admin=authenticated
```
This grants full admin access without ever logging in.

**Remediation**:
1. Use a signed JWT or a random session token stored server-side.
2. At minimum, use a cryptographically random value as the cookie and verify it against a server-side store.
3. Consider using a library like `jose` for signed cookies or `iron-session` for encrypted sessions.

---

## High Issues

### H-1. Secrets Exposed in .env.local (All API Keys, Private Keys, Tokens)

**File**: `/Volumes/Dev/f1/.env.local`

**Exposed secrets** (now considered compromised):
- `ANTHROPIC_API_KEY=sk-ant-api03-H9xA...`
- `FIREBASE_ADMIN_PRIVATE_KEY` (full RSA private key)
- `CRON_SECRET=57dc8d8e...`
- `TELEGRAM_BOT_TOKEN=8604511383:AAG...`
- `R2_ACCESS_KEY_ID` + `R2_SECRET_ACCESS_KEY`

**Mitigation already in place**: `.gitignore` contains `.env*`, so this file should NOT be in git history. However, the file is readable on the local machine and the secrets were displayed during this audit.

**Remediation**:
1. Verify `.env.local` has NEVER been committed to git: `git log --all -- .env.local`
2. Rotate ALL keys listed above as a precautionary measure.
3. Use Vercel's encrypted environment variable storage for production/preview.
4. Consider using a secrets manager (e.g., Doppler, 1Password CLI) for local development.

---

### H-2. Server-Side Command Execution via Admin API

**File**: `/Volumes/Dev/f1/src/app/api/admin/race-result/route.ts` (line 398)

```typescript
exec(`npm run build && npx vercel --prod --yes`, { cwd }, (err) => { ... });
```

**Problem**: The admin race-result endpoint executes shell commands (`npm run build && npx vercel --prod`) directly on the server. Although this is protected by admin cookie auth, the admin auth itself is weak (see C-1, C-2). Also, `exec` is generally dangerous in web servers.

**Impact**: If admin auth is bypassed, an attacker gains server-side command execution capability.

**Remediation**:
1. Move build/deploy to a CI/CD pipeline (GitHub Actions, Vercel hooks) instead of triggering it from the web server.
2. If keeping this pattern, at least add a secondary verification (e.g., confirm token, time-limited OTP).

---

### H-3. Unauthenticated Public Endpoints That Should Be Protected

**Files**:
- `/Volumes/Dev/f1/src/app/api/warm-digest/route.ts` -- NO authentication
- `/Volumes/Dev/f1/src/app/api/admin/circuit/[id]/route.ts` GET -- NO authentication

**Problem**:
- `warm-digest`: Can be called by anyone. The `?force=1` parameter triggers cache invalidation and a new Claude API call (consuming paid API credits). The `?diag=1` parameter leaks internal diagnostics including whether `ANTHROPIC_API_KEY` is set.
- `admin/circuit/[id]` GET: Although the middleware protects `/api/admin/*`, the GET handler does not double-check auth -- BUT this is actually protected by middleware. This is acceptable as defense-in-depth but inconsistent.

**Impact**: An attacker can repeatedly call `/api/warm-digest?force=1` to drain Anthropic API credits. The `?diag=1` endpoint leaks operational details.

**Remediation**:
1. Add CRON_SECRET authentication to `warm-digest`.
2. Remove the `diag` parameter or protect it behind authentication.
3. Add rate limiting to prevent abuse.

---

### H-4. Firestore `likes` Collection Has No Security Rules

**File**: `/Volumes/Dev/f1/firestore.rules`

The `likes` collection is used in `migrate-post-ids/route.ts` but has NO matching Firestore security rule. By Firestore default, collections without rules DENY all access -- which means client-side like functionality may be broken, OR there's an implicit wildcard rule not shown.

However, the `posts` update rule allows anyone to increment `likes` and `commentCount`:

```
allow update: if isOwner(resource.data.authorId)
  || request.resource.data.diff(resource.data).affectedKeys()
      .hasOnly(['likes', 'commentCount']);
```

**Problem**: Any authenticated user can set `likes` and `commentCount` to arbitrary values (not just increment by 1). They could set likes to 999999 or commentCount to 0.

**Remediation**:
1. Add numeric increment validation in Firestore rules.
2. Add a `likes` collection rule for client-side access if needed.
3. Use Cloud Functions or server-side logic for like/unlike operations to enforce proper counting.

---

## Medium Issues

### M-1. Cron Endpoints Bypass Authentication When CRON_SECRET Is Unset

**Files**:
- `community-bots/route.ts` (line 48)
- `race-result/route.ts` (line 101)
- `revalidate-digest/route.ts` (line 17)
- `revalidate-digest-noon/route.ts` (line 14)
- `seed-fp-posts/route.ts` (line 84)

```typescript
const cronSecret = process.env.CRON_SECRET;
if (cronSecret && authHeader !== `Bearer ${cronSecret}`) { ... }
```

**Problem**: If `CRON_SECRET` is not set, the auth check is skipped entirely (`if (cronSecret && ...)`). This means these endpoints become fully public.

**Contrast with**: `devlog/route.ts` and `telegram-digest/route.ts` which properly check without the conditional.

**Remediation**: Change all cron routes to fail when secret is missing:

```typescript
const cronSecret = process.env.CRON_SECRET;
if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

---

### M-2. No Security Headers Configured

**File**: `/Volumes/Dev/f1/next.config.ts`

The config only sets `poweredByHeader: false` and image optimization. Missing:
- `Strict-Transport-Security` (HSTS)
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Content-Security-Policy` (CSP)
- `Referrer-Policy`
- `Permissions-Policy`

**Remediation**: Add security headers to `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    }];
  },
  // ...existing config
};
```

---

### M-3. Stored XSS Risk via Admin `headCode`/`bodyCode` Injection

**Files**:
- `/Volumes/Dev/f1/src/app/layout.tsx` (lines 170, 173)
- `/Volumes/Dev/f1/src/app/api/admin/config/route.ts`

```tsx
{analytics.headCode && (
  <div dangerouslySetInnerHTML={{ __html: analytics.headCode }} />
)}
{analytics.bodyCode && (
  <div dangerouslySetInnerHTML={{ __html: analytics.bodyCode }} />
)}
```

**Problem**: Admin config allows arbitrary HTML/JS injection into every page. The config is stored in Firestore (`admin/config`) and also in a local JSON file. If admin auth is compromised (see C-1, C-2), an attacker can inject persistent XSS into every page of the site.

**Impact**: Site-wide stored XSS affecting all visitors.

**Remediation**:
1. This is an intentional admin feature (analytics injection), but given the weak admin auth, it is high risk.
2. Fix admin auth first (C-1, C-2).
3. Consider restricting to known analytics patterns (GTM/GA snippets only) or use CSP to limit script sources.

---

### M-4. FastF1 Proxy Endpoint Has No Authentication or Rate Limiting

**File**: `/Volumes/Dev/f1/src/app/api/fastf1/[...path]/route.ts`

**Problem**: The `/api/fastf1/*` proxy forwards any request to the Railway backend or R2 bucket without authentication. This is an open proxy for any data the FastF1 backend exposes.

**Impact**:
- Resource abuse (R2 presigned URL generation costs, Railway compute)
- Potential data scraping
- The `gp` parameter is used to construct R2 keys with only basic sanitization (space to underscore, slash to hyphen)

**Remediation**:
1. Add rate limiting (consider Vercel Edge Middleware or Upstash).
2. Validate that `year`, `gp`, `session` parameters match expected patterns.
3. Consider adding a referrer check or API key for non-browser clients.

---

### M-5. CORS Protection Is Inconsistent (Origin Check Bypass)

**Files**:
- `race-result/route.ts` (line 156)
- `admin/config/route.ts` (line 84)
- `admin/season-points/[year]/route.ts` (line 53)

```typescript
const origin = req.headers.get("origin");
if (origin && !origin.includes("f1.324.ing") && !origin.includes("localhost")) {
  return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
}
```

**Problem**:
1. `origin.includes()` is easily bypassed: a domain like `evil-f1.324.ing.attacker.com` would pass.
2. Requests without an `Origin` header (e.g., from curl, Postman, server-side) bypass the check entirely.
3. This is NOT a substitute for proper CORS headers via `Access-Control-Allow-Origin`.

**Remediation**:
1. Use exact origin matching instead of `includes()`.
2. This origin check is secondary to the cookie auth, so it provides minimal additional security. Consider removing it and relying on proper auth.

---

## Low Issues

### L-1. No Input Validation/Sanitization on Post Body

**File**: `/Volumes/Dev/f1/src/app/api/posts/route.ts` (line 134)

**Problem**: The POST handler for creating posts only checks if `bodyText?.trim()` is non-empty. There is no length limit, no content sanitization, and no schema validation (e.g., with zod).

**Remediation**: Add input validation with limits:
- Max body length (e.g., 10,000 characters)
- Max title length
- Validate category against allowed values
- Consider sanitizing HTML if markdown is rendered

---

### L-2. Error Messages Expose Internal Details in Some Cron Routes

**Files**:
- `community-bots/route.ts` (line 122): `{ error: String(e) }`
- `race-result/route.ts` (line 193): `{ error: String(e) }`
- `warm-digest/route.ts` (line 151): `{ ok: false, error: String(e) }`

**Problem**: Raw error messages (including stack traces) are returned to the client.

**Remediation**: Log detailed errors server-side, return generic messages to clients.

---

### L-3. `jsonLdScript` Uses `JSON.stringify` Without Sanitization

**File**: `/Volumes/Dev/f1/src/lib/jsonld.ts` (line 163)

**Problem**: `JSON.stringify()` is used to create JSON-LD content injected via `dangerouslySetInnerHTML`. While `JSON.stringify` is generally safe for JSON data, if any field contains a `</script>` string, it could break out of the script tag.

**Impact**: Low risk since the data comes from server-side static data, not user input.

**Remediation**: Sanitize the output by escaping `</script>` patterns:
```typescript
export function jsonLdScript(schema: object) {
  return JSON.stringify(schema).replace(/<\/script>/gi, '<\\/script>');
}
```

---

## Positive Findings

The following security practices are already implemented correctly:

1. **Firebase config as NEXT_PUBLIC_**: Firebase client config (API key, project ID, etc.) is correctly exposed as `NEXT_PUBLIC_*` -- these are meant to be public and are secured by Firestore rules.

2. **Firestore security rules**: Well-structured with owner checks, login requirements, and admin collection locked (`allow: if false`).

3. **Firebase Auth for community features**: Google OAuth with `verifyIdToken` for post creation.

4. **Admin cookie attributes**: `httpOnly: true, secure: true, sameSite: "strict"` (though the value is weak).

5. **`poweredByHeader: false`**: Prevents X-Powered-By header disclosure.

6. **`.env*` in .gitignore**: Prevents accidental secret commits.

7. **Server-side secrets**: `FIREBASE_ADMIN_PRIVATE_KEY`, `CRON_SECRET`, `ANTHROPIC_API_KEY`, R2 keys are NOT `NEXT_PUBLIC_` prefixed.

---

## Priority Remediation Plan

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 1 (NOW) | C-1: Remove hardcoded credentials | 10 min | Blocks admin takeover |
| 2 (NOW) | C-2: Implement signed sessions | 1-2 hours | Prevents cookie forgery |
| 3 (TODAY) | H-1: Rotate all secrets | 30 min | Limits exposure window |
| 4 (TODAY) | H-3: Auth for warm-digest | 15 min | Prevents credit drain |
| 5 (THIS WEEK) | M-1: Fix cron auth bypass | 15 min | Prevents public cron access |
| 6 (THIS WEEK) | M-2: Security headers | 15 min | Defense in depth |
| 7 (THIS WEEK) | H-2: Move deploy to CI/CD | 1-2 hours | Eliminates server exec |
| 8 (NEXT SPRINT) | M-4: Rate limiting | 2-3 hours | Prevents resource abuse |
| 9 (NEXT SPRINT) | H-4: Firestore likes validation | 1 hour | Prevents count manipulation |
| 10 (BACKLOG) | Remaining Low issues | Various | Defense in depth |

---

## Checklist Summary

### OWASP Top 10 Coverage

| # | Category | Status | Issues |
|---|----------|--------|--------|
| A01 | Broken Access Control | FAIL | C-2, H-3, H-4, M-1, M-5 |
| A02 | Cryptographic Failures | PASS | Secrets properly separated (server vs NEXT_PUBLIC) |
| A03 | Injection | WARN | M-3 (XSS via admin config), L-1 (no input validation) |
| A04 | Insecure Design | FAIL | C-1, C-2 (authentication design flaws) |
| A05 | Security Misconfiguration | WARN | M-2 (missing headers), M-1 (cron bypass) |
| A06 | Vulnerable Components | N/A | (dependency audit not performed) |
| A07 | Auth Failures | FAIL | C-1, C-2 |
| A08 | Software/Data Integrity | WARN | H-2 (exec in web server) |
| A09 | Logging/Monitoring | WARN | L-2 (error exposure), no centralized logging |
| A10 | SSRF | PASS | FastF1 proxy is a controlled forward, not user-controlled URL |
