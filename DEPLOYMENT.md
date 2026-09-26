# Coregenisis 2.0 — Cloudflare deployment checklist

This branch is intentionally **not** production-ready until the existing Cloudflare resource IDs and email sender are connected.

## 1. Keep production unchanged
Do not merge `coregenisis-v2` into `main` yet. Use a separate Cloudflare preview Worker/route first.

## 2. Create the real Wrangler config
Copy `wrangler.template.jsonc` to `wrangler.jsonc`.

Replace:
- `REPLACE_WITH_EXISTING_D1_DATABASE_ID` with the ID of the existing Coregenisis D1 database.
- `REPLACE_WITH_PRODUCTION_ORIGIN` with the exact future site origin, for example `https://example.com`.

The template serves `./public` as static assets and sends only `/api/*` through the Worker first.

## 3. Apply the existing-database migration
For the existing D1 database, run the migration in:

`migrations/001_coregenisis_v2.sql`

Do **not** run `schema.sql` against an existing production database as a substitute for the migration.

## 4. Configure email before accepting alert subscriptions
The old MailChannels no-key path is obsolete. V2 expects:

- Secret: `RESEND_API_KEY`
- Variable: `ALERT_FROM_EMAIL` (must use a verified sender/domain)

Until both are configured, `POST /api/track` deliberately returns 503 and does not collect a subscriber email address.

## 5. Cron
The template includes:

`0 10 * * *`

Cloudflare Cron Triggers run in UTC. This is one daily change-check run. Adjust only after testing.

## 6. Preview tests before production
Verify:
- `GET /api/health`
- BOP register-number search
- BOP first + last name search
- a no-result search
- BOP upstream outage behavior
- D1 migration
- alert subscription with a test email
- alert change detection
- unsubscribe/delete tracking request
- EN/ES switching
- Federal Register source links
- mobile layout

## 7. Production switch
Only after the preview tests pass:
1. attach the production custom domain/route,
2. set `ALLOWED_ORIGIN` to that exact origin,
3. verify D1 and secrets on the production Worker,
4. verify one scheduled event,
5. then retire the old deployment.

No live deployment should be replaced until these checks are complete.
