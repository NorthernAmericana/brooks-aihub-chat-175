# Release checklist

Use this checklist before promoting a new release to production.

## Environment variable verification

- [ ] Confirm every variable in [`.env.example`](../../.env.example) is configured in the hosting provider.
- [ ] Validate `NEXT_PUBLIC_SITE_URL` is set for **Production** and matches the canonical `https://` URL.
- [ ] Verify any secrets (AI gateway keys, Redis URLs, blob storage credentials) are loaded for both Preview and Production.

## Database migrations

- [ ] Confirm the target Postgres database is reachable from the build environment.
- [ ] Confirm `POSTGRES_URL`/`DATABASE_URL` point to the intended Preview or Production database before running migrations.
- [ ] Run migrations against the target environment: `pnpm db:migrate`.
- [ ] Validate critical schema expectations (for example: `SELECT COUNT(*) FROM public."Chat" WHERE "sessionType" IS NULL;` returns `0`).

## Vercel deployment steps

- [ ] Trigger a new Production deployment in Vercel.
- [ ] Confirm the build logs show `build:vercel` (including `pnpm db:migrate`) ran successfully.
- [ ] Verify the deployment URL is live and `VERCEL_URL` is populated in the environment.
- [ ] Test on Vercel after deployment (open the production URL and confirm the app loads).

## Post-deploy smoke checks

- [ ] `GET /` loads without errors and core UI renders.
- [ ] `GET /api/health/chat-schema` returns `200` and reports no missing store tables/columns (including `namc_install_gate_state` verification fields).
- [ ] `GET /api/health/spotify-schema` returns `200` and reports `public.spotify_accounts` present (confirms migration `0045_spotify_accounts` on target DB).
- [ ] If either schema health endpoint (`/api/health/chat-schema` or `/api/health/spotify-schema`) is non-200, run `pnpm db:migrate` against the target database and verify `POSTGRES_URL`/`DATABASE_URL` point at the intended instance, then redeploy and re-check.
- [ ] `GET /manifest.webmanifest` returns `200` with a valid manifest.
- [ ] `GET /sw.js` returns `200` and registers a service worker.
- [ ] Run the PWA check: `PWA_CHECK_BASE_URL=https://www.brooksaihub.app pnpm check:pwa`.
- [ ] Spot-check key flows (login, chat, any critical user journey).

## Early Release readiness checks

- [ ] Verify `NEXT_PUBLIC_EARLY_RELEASE_START_AT` and `NEXT_PUBLIC_EARLY_RELEASE_TZ` are set correctly for production.
- [ ] Verify `NEXT_PUBLIC_ENABLE_FUTURE_TIERS=false` unless a future-tier launch is explicitly approved.
- [ ] Verify pricing copy shows **Founders Access at $4.99/month** as the only paid option.
- [ ] Verify Stripe checkout uses the configured Founders price ID (`STRIPE_FOUNDERS_PRICE_ID` / `NEXT_PUBLIC_FOUNDERS_STRIPE_PRICE_ID`).
- [ ] Verify production Stripe webhook endpoint receives events and signature verification passes.
- [ ] Verify entitlement sync appears in UI for test users (`pay → unlock`, `cancel → relock`).
- [ ] Re-confirm `GET /manifest.webmanifest` and `GET /sw.js` return `200` after launch-day deploys.
