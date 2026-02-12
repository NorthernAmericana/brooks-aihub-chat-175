# Launch readiness matrix

This matrix summarizes what users can count on today vs what is still in-flight.
It is seeded from:

- [`docs/master-scope.md`](../master-scope.md)
- [`docs/ops/release-checklist.md`](../ops/release-checklist.md)
- [`docs/stripe-entitlements.md`](../stripe-entitlements.md)

| Feature area | Status | User-visible capability | Dependencies | Risk / unknowns |
| --- | --- | --- | --- | --- |
| Paid Access subscription checkout | Live | Signed-in users can upgrade to Paid Access through Stripe Checkout at `$4.99/month`. | Stripe product + price configuration, authenticated user session, `POST /api/stripe/checkout`. | Checkout depends on correctly configured Stripe keys and price ID in each environment. |
| Subscription entitlement lifecycle | Beta | Founders Access is granted/revoked from Stripe webhook events and reflected in product access. | `POST /api/stripe/webhook`, webhook secret verification, entitlement persistence in Postgres. | Webhook misconfiguration or delayed delivery can create temporary entitlement mismatches. |
| Founders perks in product UI | Live | Pricing and in-app surfaces show perk details and locked/unlocked states for members. | Entitlement checks, perks configuration, pricing/store/greeting UI surfaces. | If entitlement polling fails, users may briefly see stale perk states. |
| Code redemption for product access | Beta | Users can enter redemption codes from the account menu to unlock eligible products without checkout. | `POST /api/redeem-code`, RedemptionCode + Redemption tables, entitlement write path. | Admin code-generation UI is not shipped yet; operations currently rely on scripts/admin tooling. |
| Slash-router ATO navigation model | Beta | Users can navigate and launch distinct ATO experiences via slash-style routes and app pages. | App Router route map, ATO routing conventions, orchestration plumbing. | Route sprawl and naming consistency can impact discoverability and handoff quality. |
| Voice companion experience (BrooksBears/Benjamin Bear) | Planned | Warm, voice-first companion interactions with constrained tools and memory controls. | STT/TTS integrations, official ATO guardrails, memory permission controls. | Current developer notes call out Whisper, voice selection, and ElevenLabs playback issues. |
| MyCarMind driving assistant flows | Planned | Car mode interactions for trip notes, lightweight drafts, and timeline-style recall. | Voice input reliability, route-specific UI, memory and sync architecture. | Safety UX, low-distraction interaction patterns, and reliability under motion remain validation items. |
| Offline-first + sync behavior (PWA baseline) | Beta | App can install as a PWA, register a service worker, and provide offline fallback behavior. | `manifest.webmanifest`, `sw.js`, cache strategy, deploy smoke checks. | Offline correctness and sync conflict handling still need ongoing real-device verification. |
| Release quality gate on Vercel | Live | Production releases run migrations, deploy, and pass smoke checks before promotion. | Vercel env parity, `pnpm db:migrate`, health endpoints, PWA checks. | Missing env vars or migration failures can block release or cause runtime regressions. |
| Transparency controls (memory + receipts) | Planned | Users should be able to inspect what is remembered, why, and which agent/tool performed actions. | Memory schema, receipt/logging surfaces, policy and export/delete controls. | Full end-user receipt UX and complete controls are defined in scope but not fully productized yet. |
