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
