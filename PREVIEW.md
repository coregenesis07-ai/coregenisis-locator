# Coregenisis 2.0 Preview Deployment

The preview must remain isolated from the current production deployment.

## Safety rules
- Do not attach the production custom domain.
- Do not use the production D1 database.
- Do not merge `coregenisis-v2` into `main`.
- Use a separate preview D1 database.
- Keep real alert enrollment disabled until a verified preview sender is configured.
- Test with non-sensitive/public test queries only.

## Preview resources
Use:
- Worker name: `coregenisis-v2-preview`
- Static assets: `./public`
- Preview D1 database: `coregenisis-v2-preview-db`
- Default Workers preview hostname during testing
- Separate environment variables/secrets from production

## Setup
1. Copy `wrangler.preview.template.jsonc` to `wrangler.preview.jsonc`.
2. Create a separate Cloudflare D1 database named `coregenisis-v2-preview-db`.
3. Put that preview database ID in `wrangler.preview.jsonc`.
4. Apply `schema.sql` to the **preview** database.
5. Set the preview origin in both `ALLOWED_ORIGIN` and `PUBLIC_SITE_URL`.
6. Add `ADMIN_TOKEN` as a Cloudflare Worker secret for the protected manual source refresh endpoint.
7. Add `RESEND_API_KEY` only if email confirmation is ready to test.
8. Set `ALERT_FROM_EMAIL` to a verified sender.
9. Deploy the preview Worker.
10. Run `BASE_URL=https://<preview-host> npm run smoke`.

### Optional immediate source refresh
After deployment, the protected endpoint `POST /api/admin/refresh` can populate/refresh facilities, BOP policies, and regulatory documents immediately instead of waiting for the weekly cron. Send `Authorization: Bearer <ADMIN_TOKEN>`. Never store the token in the repository or frontend.

## Required preview checks
The smoke test checks:
- health endpoint
- source/data status
- facility search
- BOP policy search
- regulatory records
- deadline tracker
- unified knowledge search
- input validation on inmate lookup

After those pass, manually test:
- mobile navigation
- EN/ES switching
- official-source links
- inmate lookup with a known public BOP number
- alert verification email
- unsubscribe flow
- legal/privacy pages

Only after the preview passes should production migration be considered.


## Preview indexing protection
The preview config sets `PREVIEW_MODE=1` and routes preview page requests through the Worker. Static preview responses receive `X-Robots-Tag: noindex, nofollow, noarchive` so the temporary Workers preview hostname is not intended for search indexing. Production does not use `PREVIEW_MODE`.
