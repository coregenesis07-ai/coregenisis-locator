# Federal Custody Guide — Operations & Connection Map

Last verified: 2026-10-04

## Purpose
Read this file before changing deployment, DNS, GitHub Pages, Cloudflare, or production routing. It records the verified architecture so the project does not need to be rediscovered in future sessions.

## Canonical project
- Public site: https://federalcustodyguide.com
- GitHub repository: coregenesis07-ai/coregenisis-locator
- GitHub default branch: main
- IMPORTANT: production is NOT deployed from main.

## Production deployment — verified
GitHub Pages is the production host.
- Pages source: Deploy from branch
- Production branch: gh-pages
- Folder: /(root)
- Custom domain: federalcustodyguide.com

Do not change the GitHub Pages source, production branch, root folder, or custom domain unless intentionally redesigning the deployment architecture.

## Cloudflare — verified role
Cloudflare currently provides DNS for the custom domain. It is not the primary site deployment source.

DNS records verified:
- A @ -> 185.199.108.153
- A @ -> 185.199.109.153
- A @ -> 185.199.110.153
- A @ -> 185.199.111.153
- CNAME www -> coregenesis07-ai.github.io

These records point the domain to GitHub Pages. Do not replace them casually.

## Cloudflare Worker
Worker name:
- federalcustodyguide-search

workers.dev endpoint:
- https://federalcustodyguide-search.coregenesis07.workers.dev

Verified status:
- Worker exists on workers.dev.
- No Worker route is attached to federalcustodyguide.com.
- Do NOT attach the Worker to the custom domain without a deliberate architecture review.
- Do NOT change DNS merely to connect this Worker.

The Worker/backend has handled API functions such as BOP search/facility-related requests. Alert/email endpoints are intentionally disabled unless a verified privacy, consent, storage, and delivery workflow is established.

## Safe development workflow
1. Treat gh-pages as production.
2. Do not edit gh-pages directly for normal development.
3. Create/use a feature branch.
4. Make and inspect changes there.
5. Compare the feature branch against gh-pages.
6. Open a pull request into gh-pages.
7. Review checks and the exact diff before merge.
8. After merge, verify the live custom domain.

## Deployment history — 2026-10-04
- PR #6: `Improve bilingual family pathways and mobile guidance`
  - Merged into `gh-pages`
  - Merge commit: `a407afb5f70df28a89cf57e698701d372708db4a`
  - 8 commits; 7 changed files
  - Live mobile verification confirmed the four family pathways and independent-resource messaging.
- PR #7: `Fix policy navigation and bilingual inline display`
  - Merged into `gh-pages`
  - Merge commit: `466025eb3856b2db4906df100fca70b48d82da7e`
  - 5 commits; 5 changed files; 6 additions / 6 deletions
  - Removed stale `/#/policies` link in favor of `/updates-guides/`.
  - Corrected Spanish translated `span.lang-es` content to render inline.
- Cloudflare Pages preview checks succeeded on these PRs while the separate Cloudflare Workers build check failed. The Worker is not attached to the custom production domain; do not alter production DNS/Worker architecture merely to satisfy that preview check.

The former feature branches `improve-family-start-here` and `fix-policy-route-bilingual-display` are completed and may be deleted after production verification. They are not production branches.

## Current improvement package
Files deployed through PR #6:
- app.js
- styles.css
- family-checklist/index.html
- first-step-act/index.html
- reentry-resources/index.html
- bop-policies/index.html
- second-chance/index.html

Work includes:
- Four-path family Start Here experience
- Responsive 2x2 desktop / one-column mobile family pathway
- Persistent English/Español preference using localStorage key cg_lang
- Bilingual Family Checklist
- Expanded bilingual First Step Act guide
- Expanded bilingual Reentry Resources
- Expanded bilingual BOP policy verification guide
- Expanded bilingual Second Chance/prerelease guide
- Stronger official-source and independent-resource disclaimers

## Important production routes — preserve
Primary URLs:
- /federal-inmate-search/
- /first-step-act-calculator/
- /federal-prison-directory/
- /updates-guides/
- /family-checklist/
- /reentry-resources/
- /first-step-act/
- /second-chance/
- /bop-policies/
- /

SPA/hash routes include:
- /#/search
- /#/fsa
- /#/resources
- /#/privacy
- /#/terms
- /#/disclaimer
- /#/accuracy
- /#/calculator-disclaimer
- /#/refunds
- /#/copyright

Do not replace these with old-style .html routes.

## Post-deployment QA — 2026-10-04
- Production `gh-pages` contains the PR #6 and PR #7 changes.
- `bop-policies/index.html` no longer links to stale `/#/policies`; it links to `/updates-guides/`.
- Reentry interactive route `/#/reentry` is present in the app.
- FSA interactive route `/#/fsa` is present in the app.
- Search and facility routes are present in the app.
- All five bilingual static resource pages use `cg_lang` and the corrected inline Spanish span display.
- Main live mobile screenshot verification confirmed the four-path Start Here layout.
- Continue to preserve alerts/email as disabled until the backend/privacy/consent workflow is ready.

## Language architecture
- Main app stores language in localStorage key: cg_lang
- Supported values: en and es
- Standalone bilingual pages should reuse cg_lang so the language choice follows the visitor.
- Avoid duplicate English/Español controls on the same page.
- Make bilingual availability immediately understandable to visitors.

## Legal / trust safeguards
Federal Custody Guide should remain clearly described as:
- an independent educational/public-information resource
- not BOP, DOJ, a court, U.S. Probation, or a law firm
- not legal advice
- not an official eligibility, sentence, release-date, classification, placement, or credit determination

Official sources control. Important individual information should be verified against official records.

Never guarantee:
- FSA eligibility or credit application
- projected release dates
- RRC placement
- home confinement
- transfers/designations
- supervised-release outcomes
- custody/security classification outcomes

## Calculator safeguards
Preserve existing calculator warnings:
- educational planning tool, not an official BOP calculation
- does not determine eligibility
- does not replace the BOP Projected Release Date
- may not account for every individual factor
- inputs stay in the browser unless the user explicitly saves locally

## Email / alerts
Email collection and alerts remain intentionally disabled until a verified backend, privacy, consent, storage, and delivery workflow is connected. Do not enable them simply as a front-end feature.

## Before future infrastructure work
Read this file first. Then verify only the specific item that may have changed. Do not repeat the full GitHub/Cloudflare discovery unless evidence shows the architecture has changed.

When an infrastructure finding changes, update this file at the same time so it remains the single operational reference.
