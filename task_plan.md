# Federal Custody Guide / Locator — Task Plan

## Goal
Improve reliability of search, calculator, bilingual navigation, and public-information presentation while keeping user-facing claims accurate.

## Current phase
Feature verification and public-release hardening.

## Current
- Verify name / register-number search behavior.
- Verify calculator inputs, outputs, and explanatory text.
- Verify bilingual EN/ES navigation without loops.
- Verify facility/directory navigation and home links.
- Check mobile layout and accessibility.
- Verify disclaimers, privacy, and educational-information boundaries.

## Remaining
- Fix any blank-screen or zero-result failure paths.
- Confirm loading, no-result, and error states are understandable.
- Validate public-source freshness where factual data is shown.
- Confirm SEO/indexing essentials after functional verification.

## Release gates
- [ ] Search works for valid test cases
- [ ] No-result state is clear and safe
- [ ] Calculator behavior verified
- [ ] EN/ES navigation verified
- [ ] Mobile layout checked
- [ ] Public-information disclaimers present
- [ ] No unsupported legal outcome claims
- [ ] Error handling verified
- [ ] Release candidate identified before deployment

## Rule
Accuracy and clarity outrank feature count. Do not publish a feature whose result cannot be explained or verified.
