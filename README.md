# Coregenisis Federal Information Center

## V2 development branch

This branch (`coregenisis-v2`) is the safe rebuild of the existing Coregenisis federal inmate locator. The production/default branch remains `main` until V2 is tested and intentionally deployed.

### Goals
- Mobile-first federal inmate search interface
- First Step Act / Time Credits information center
- Federal rule summaries with official-source verification
- Facility resource center
- English / Spanish interface
- Tracking-alert enrollment UI
- Clear independent-service and legal-information disclaimers

### Architecture
- Static frontend: `index.html`, `styles.css`, `app.js`
- Cloudflare Worker API: `worker.js`
- Cloudflare D1 schema: `schema.sql`
- No frontend build step is required for this V2 foundation

### Current backend endpoints
- `GET /api/bop-search`
- `POST /api/track`

The existing Worker and D1 code should be reviewed and tested against the current BOP public response format before production alert claims are enabled.

### Source-first rule
Coregenisis is independent and not affiliated with BOP, DOJ, NARA, FederalRegister.gov, or any government agency. Regulatory and custody information should link users back to the controlling official source.


### V2 Worker configuration
Required Cloudflare bindings/secrets before production alerts are enabled:

- `DB` — Cloudflare D1 database binding
- `ALLOWED_ORIGIN` — production site origin, recommended for POST/DELETE protection
- `RESEND_API_KEY` — email provider secret
- `ALERT_FROM_EMAIL` — verified sender, for example `Coregenisis <alerts@example.com>`
- Cron Trigger — schedule for the Worker's `scheduled()` handler

The Worker deliberately refuses to collect alert email addresses when the email provider is not configured. This prevents the UI from promising alerts that cannot be delivered.


### Current V2 information services
- Public BOP inmate lookup proxy
- Searchable BOP facility directory with scheduled official-source refresh
- Searchable BOP policy index sourced from the official BOP policy search endpoint
- Federal Register / BOP regulatory feed with official PDF links
- Regulatory deadline tracker for indexed effective dates and comment deadlines
- Unified knowledge search across facilities, BOP policies, and regulatory documents
- Recent official-source updates feed
- Public data freshness/status endpoint
- Double-opt-in email alert design with tokenized unsubscribe
- English / Spanish frontend
- Privacy, lawful-use, disclaimer, and copyright pages

### Public API routes
- `GET /api/health`
- `GET /api/data-status`
- `GET /api/updates`
- `GET /api/search?q=...`
- `GET /api/bop-search?q=...`
- `GET /api/facilities?q=...`
- `GET /api/policies?q=...&series=...&type=...`
- `GET /api/rules`
- `GET /api/deadlines`
- `POST /api/track`
- `GET /api/verify?token=...`
- `GET /api/unsubscribe?token=...`
- `DELETE /api/track`
- `POST /api/admin/refresh` (Bearer-protected)


### FSA & Second Chance center
The V2 public-information center now includes a source-linked timeline for:
- 2026 First Step Act Time Credits revisions (91 FR 55740 / 2026-17752)
- Program Statement 5405.01 (May 7, 2026)
- BOP updated Time Credit Application Program (August 1, 2025)
- BOP home-confinement expansion directive (May 28, 2025)
- BOP rescission of the proposed 60-day SCA placement limit (April 10, 2025)

The page explicitly separates FSA Time Credits from Second Chance Act prerelease-placement planning and avoids representing conditional dates as guaranteed release dates.

### Planned monetization
Coregenisis keeps basic public inmate search and official-source access free. The V2 interface includes non-functional, clearly labeled planned tiers:
- Free
- Family Plus — planned at $9.99/month
- Reentry Planner — planned at $14.99/month

No checkout or payment processing is active. The paid-value proposition is convenience, monitoring, organization, and reentry planning—not resale of public records.


### Commerce/account-ready foundation
V2 now includes a provider-agnostic database foundation for:
- public plan definitions
- external-auth customer accounts (no password storage in Coregenisis)
- account entitlements/subscription state
- private family profiles
- private reentry plans
- payment event IDs/status tracking only

Coregenisis does **not** store card numbers or bank credentials. A future payment provider should host or tokenize payment collection. A future identity provider should supply a validated external subject identifier before private account APIs are enabled.

Public plan endpoint:
- `GET /api/plans`

Planned commercial structure:
- Free — $0
- Family Plus — $9.99/month
- Reentry Planner — $14.99/month
- Optional one-time organization/formatting services displayed as planned offerings

The current preview does not activate checkout or collect payment information.


### Elderly/terminally ill pilot caution
The FSA/Second Chance center explicitly flags the current official-source inconsistency around the elderly/terminally ill home-confinement pilot:
- current 34 U.S.C. § 60541 still states fiscal years 2019–2023,
- BOP's June 2024 FSA annual report states referral authority expired at the end of FY2023,
- BOP's public FAQ still describes the pilot and application path.

Coregenisis links all three rather than presenting the pilot as unquestionably available.
