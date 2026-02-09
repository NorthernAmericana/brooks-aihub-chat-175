# Release checklist

Use this checklist before promoting a new release to production.

## Environment variable verification

- [ ] Confirm every variable in [`.env.example`](../../.env.example) is configured in the hosting provider.
- [ ] Validate `NEXT_PUBLIC_SITE_URL` is set for **Production** and matches the canonical `https://` URL.
- [ ] Verify any secrets (AI gateway keys, Redis URLs, blob storage credentials) are loaded for both Preview and Production.

## Database migrations

- [ ] Confirm the target Postgres database is reachable from the build environment.
- [ ] Run migrations against the target environment: `pnpm db:migrate`.
- [ ] Validate critical schema expectations (for example: `SELECT COUNT(*) FROM public."Chat" WHERE "sessionType" IS NULL;` returns `0`).

## Vercel deployment steps

- [ ] Trigger a new Production deployment in Vercel.
- [ ] Confirm the build logs show `pnpm db:migrate` ran successfully.
- [ ] Verify the deployment URL is live and `VERCEL_URL` is populated in the environment.
- [ ] Test on Vercel after deployment (open the production URL and confirm the app loads).

## Post-deploy smoke checks

- [ ] `GET /` loads without errors and core UI renders.
- [ ] `GET /api/health/chat-schema` returns `200`.
- [ ] `GET /manifest.webmanifest` returns `200` with a valid manifest.
- [ ] `GET /sw.js` returns `200` and registers a service worker.
- [ ] Run the PWA check: `PWA_CHECK_BASE_URL=https://www.brooksaihub.app pnpm check:pwa`.
- [ ] Spot-check key flows (login, chat, any critical user journey).
