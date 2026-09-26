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
- Unified knowledge search across facilities, BOP policies, and regulatory documents
- Public data freshness/status endpoint
- Double-opt-in email alert design with tokenized unsubscribe
- English / Spanish frontend
- Privacy, lawful-use, disclaimer, and copyright pages

### Public API routes
- `GET /api/health`
- `GET /api/data-status`
- `GET /api/search?q=...`
- `GET /api/bop-search?q=...`
- `GET /api/facilities?q=...`
- `GET /api/policies?q=...&series=...&type=...`
- `GET /api/rules`
- `POST /api/track`
- `GET /api/verify?token=...`
- `GET /api/unsubscribe?token=...`
- `DELETE /api/track`
