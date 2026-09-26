# Coregenisis Commerce & Accounts

## Principles
1. Public inmate search, public facility information, BOP policies, Federal Register documents, and basic FSA/Second Chance information remain free.
2. Revenue comes from optional convenience, monitoring, organization, and reentry tools.
3. Coregenisis never stores raw payment-card or bank-account credentials.
4. Private account data is not exposed through public APIs.
5. Paid features must not imply legal representation, guaranteed release, eligibility, or BOP outcomes.

## Planned plans
- Free — $0
- Family Plus — $9.99/month
- Reentry Planner — $14.99/month

## Planned one-time services
- Reentry Packet Organization — starting at $39
- Family Records Organizer — starting at $29
- Bilingual Document Formatting — starting at $25 depending on scope

These are planning prices only. No checkout is active.

## Authentication requirement
Private account APIs should not be enabled until an external identity provider is selected and server-side token validation is implemented. Coregenisis should store only the provider's stable subject ID plus the minimum profile information required.

## Payment requirement
The future payment integration should use hosted checkout or tokenized payment fields. Webhook events should update `account_entitlements`; do not trust a browser redirect alone to grant a paid plan.

## Data minimization
- Family notes and reentry-plan content are private account data.
- Alert tracking stores only what is needed to check the requested public record and deliver the verified notification.
- Unsubscribe/delete removes tracking data.
- No sale of personal data.
