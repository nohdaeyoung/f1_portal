# F1 Website Changelog

All notable changes to the F1 website project will be documented in this file.

## [Unreleased]

---

## [2026-03-12] - Security Hardening Complete

### Added
- Daily security & QA monitoring cron job (10 automated checks)
- Critical security fixes for admin authentication and session management
- High-severity vulnerability fixes (API auth, data validation)
- Telegram bot integration for security alerts
- R2 telemetry cache population script (2,953 files)
- Firestore security rules with input validation
- HMAC-SHA256 session cookie signing

### Changed
- Admin login now requires `ADMIN_ID` and `ADMIN_PW` environment variables
- Session cookies now include HMAC signature for tamper detection
- `/api/warm-digest` endpoint now requires `CRON_SECRET` authentication
- Firestore likes/commentCount fields protected with validation rules

### Fixed
- **C-1**: Removed hardcoded admin credentials fallback
- **C-2**: Implemented cryptographic session cookie signing
- **H-3**: Added Bearer token authentication to warm-digest endpoint
- **H-4**: Added delta validation to Firestore numeric fields
- Railway OOM crashes via `DISABLE_COMPUTE=true` environment variable

### Security
- Resolved 6 critical/high severity vulnerabilities
- Implemented 10-check daily security monitoring
- Added CRON_SECRET to all internal cron endpoints
- Deployed Firestore security rules with auth checks

### Monitored (Phase 2)
- M-1: Excessive logging (requires log aggregation)
- M-2: Missing rate limiting (requires Redis integration)
- M-3: Error message disclosure
- M-4: Cache control headers (CDN configuration)
- M-5: Sensitive data encryption (compliance requirement)

---

## [2026-03-07] - Community System Phase 1 Complete

### Added
- Community posts system with CRUD operations
- Comment system with nested replies support
- 11 AI bot personas for automatic engagement
- Post-race scheduled bot posting (Sunday 04:00 UTC)
- Real-time chat system using Firestore
- User reputation/prediction scoring system
- Cron job for automated community maintenance

### Changed
- Updated Firestore schema for community data
- Integrated Google OAuth for community authentication
- Added profile auto-creation on first OAuth login

### Fixed
- Bot transparency badge implementation
- Chat message ordering and pagination
- Comment count accuracy

### Verified
- Design match rate: 96% (goal 90% exceeded)
- 0 build errors, 0 warnings
- All 21 Phase 1 items delivered

---

## [2026-03-01] - Initial Deployment

### Added
- F1 race data integration via Railway FastF1 API
- Live session display (practice/qualifying/race)
- Driver comparison analysis view
- Race replays with telemetry visualization
- Cloudflare R2 cache for large dataset files
- Admin panel for race input automation
- User authentication via Google OAuth

### Infrastructure
- Next.js frontend on Vercel
- FastF1 Python API on Railway
- Firestore for real-time data
- Cloudflare R2 for cache storage
- Telegram bot for notifications

---

## Standards

- **Security**: All vulnerabilities tracked with CVSS severity
- **Status**: Complete, Partial, Cancelled, or Monitored
- **Phases**: Issues prioritized P0 (immediate), P1 (this sprint), P2+ (future)
- **References**: Link to detailed reports in `/docs/04-report/`

---

**Last Updated**: 2026-03-12
