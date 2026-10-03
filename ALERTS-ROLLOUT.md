# Federal Custody Guide — Alert Rollout Gates

Alert enrollment remains paused until every item below is verified.

1. Back up the D1 database and apply `migrations/2026-10-03-verified-alert-controls.sql`.
2. Confirm existing rows are `legacy_paused`; do not silently opt legacy records into the new service.
3. Implement verified-email enrollment. Store token hashes only, not raw verification/manage tokens.
4. Present the current privacy notice and consent text before enrollment; record the consent version and timestamp.
5. Implement a management URL that lets the subscriber stop tracking and delete the alert record without signing in.
6. On opt-out, stop future sends immediately and store only the minimum suppression value needed to honor the request.
7. Add rate limiting and bot/abuse protection to enrollment and verification endpoints.
8. Keep SMS disabled until a separately reviewed SMS consent and STOP/suppression flow exists.
9. Configure and verify the production sender domain and email authentication. Do not place secrets in client code or this repository.
10. Test with controlled test records: enroll -> verify -> daily check -> alert -> unsubscribe/delete -> confirm no future sends.
11. Reconcile the final privacy notice with Cloudflare, email-provider, logging, retention, and production settings.
12. Only then change the site CTA from “Alerts Temporarily Paused” and enable enrollment.

## Retention decision still required

Counsel/operator should approve the retention period before launch. The schema supports `expires_at` so the service can automatically stop stale subscriptions rather than retain them indefinitely.
