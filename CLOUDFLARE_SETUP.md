# Cloudflare Preview — One-Time GitHub Setup

The repository now contains a manual workflow:

`.github/workflows/cloudflare-preview.yml`

It is designed to create or reuse an **isolated** D1 database named:

`coregenisis-v2-preview-db`

and deploy a separate Worker named:

`coregenisis-v2-preview`

It does not modify the production `main` branch, production D1 database, or production custom domain.

## GitHub secrets required

In the repository:

**Settings → Secrets and variables → Actions → New repository secret**

Add:

### CLOUDFLARE_API_TOKEN
A Cloudflare API token for this deployment workflow. It needs permissions sufficient to edit Workers and D1 resources in the intended Cloudflare account.

### CLOUDFLARE_ACCOUNT_ID
The Cloudflare account ID for the account that will host Coregenisis.

### COREGENISIS_ADMIN_TOKEN
Optional but recommended. Use a long random secret. It protects `POST /api/admin/refresh`.

Do not commit any of these values to the repository.

## What the workflow does

1. Authenticates Wrangler using the GitHub secrets.
2. Looks for `coregenisis-v2-preview-db`.
3. Creates it if it does not exist.
4. Generates a preview-only Wrangler config.
5. Applies `schema.sql` to the preview D1 database.
6. Adds the optional admin-refresh secret.
7. Deploys `coregenisis-v2-preview` to a workers.dev preview URL.
8. Leaves the production site unchanged.

## What remains after the first deployment

After the Worker is deployed:
- copy the generated workers.dev URL,
- set that URL as the preview origin if/when POST features are enabled,
- run the repository smoke tests against that URL,
- optionally configure email delivery for verified alerts,
- only after all preview tests pass should production migration be considered.

## Payments

This workflow does **not** configure payments. Commerce remains disabled until a payment provider is selected and webhook validation is implemented.
