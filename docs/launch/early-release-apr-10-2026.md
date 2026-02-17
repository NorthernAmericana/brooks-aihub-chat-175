# Early Release Plan — April 10, 2026

## Launch date + timezone (source of truth)

- **Early Release start:** `2026-04-10 00:00:00` in `America/Chicago`
- **UTC equivalent:** `2026-04-10T05:00:00Z`
- **Code source of truth:** `lib/launch-config.ts` via `NEXT_PUBLIC_EARLY_RELEASE_START_AT` and `NEXT_PUBLIC_EARLY_RELEASE_TZ`

## What “Early Release” means in this repo

Early Release is the first paid-access phase for Brooks AI HUB. It is intentionally scoped and avoids promises for unshipped roadmap items.

### Included in Early Release

- Free + Founders plan model is active.
- **Founders Access is the only paid tier, at `$4.99/month`.**
- Stripe checkout, webhook-driven entitlement sync, and UI-gated Founders routes/perks are in scope.
- PWA baseline checks (`/manifest.webmanifest`, `/sw.js`) remain required for launch readiness.

### Excluded from Early Release

- Additional paid tiers beyond Founders (for example, higher tiers up to `$24.99`) are **future** and not implemented in this phase.
- Any roadmap feature that is not already shipped in-product and documented as live.
- Voice/STT/TTS reliability guarantees (these remain experimental/known-issue areas).

## Release scope and pricing

- **Active paid product:** Founders Access only
- **Price:** `$4.99/month`
- **No tier expansion in this phase** (future tiers must stay behind feature flags and off by default)

## Testing plan

### Pre-launch (T-14 to T-1)

- Verify launch config env vars in preview and production.
- Validate pricing surfaces show Founders-only paid copy.
- Run Stripe checkout + webhook entitlement cycle with test users.
- Confirm Founders gated routes unlock/relock correctly after entitlement changes.
- Run PWA smoke checks and service worker validation.

### Launch day (T0)

- Confirm launch phase flips to `early_release` using production runtime clock.
- Confirm banner messaging updates to “LIVE” and countdown is removed.
- Confirm checkout still uses Founders-only Stripe price ID.
- Re-run webhook and entitlement sync checks.

### Post-launch week (T+1 to T+7)

- Monitor entitlement lag or mismatch reports.
- Audit pricing/gating copy for drift from Founders-only scope.
- Track known issues (especially voice/STT/TTS) and label as experimental until fixed.

## Rollback plan

If launch-day regressions occur:

1. Disable paid CTA entry points temporarily (UI-level fallback) while preserving user sessions.
2. Keep existing active entitlements readable so current Founders members remain unlocked.
3. Revert launch config env values only if phase messaging is incorrect; do not silently mutate plan pricing.
4. Redeploy last known-good release and re-run the release checklist smoke tests.

## Known-issues policy

- Do not market known unstable features as guaranteed launch functionality.
- Keep voice/STT/TTS labeled as experimental until reliability targets are met.
- Keep pricing FAQ and entitlement docs aligned with shipped behavior only.

## Related docs

- [`docs/ops/release-checklist.md`](../ops/release-checklist.md)
- [`docs/stripe-entitlements.md`](../stripe-entitlements.md)
- [`docs/launch/readiness-matrix.md`](./readiness-matrix.md)
