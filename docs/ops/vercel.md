# Managed hosting deployment guide

## Required environment variables

Review the required environment variables in [`.env.example`](../../.env.example). Keep this file as your single source of truth for everything you need to configure before deploying.

**Metadata base URL:** Production metadata uses the deployment URL provided by your hosting platform (`VERCEL_URL` or `VERCEL_PROJECT_PRODUCTION_URL` when available). Ensure the project is deployed on your platform so these values are injected automatically. For self-hosted or alternative deployments, set `NEXT_PUBLIC_SITE_URL` to the full `https://` URL so metadata can resolve canonical links.

**Production-only env check:** In your hosting platform, confirm `NEXT_PUBLIC_SITE_URL` is defined in the **Production** environment (not just Preview). After changing env vars, trigger a new production deploy so `/manifest.webmanifest` uses the correct origin.

## Hosting platform configuration files

- [`vercel.json`](../../vercel.json) configures runtime settings for this repository, including build and routing behavior that the hosting platform applies to every deployment.

## Minimal deployment checklist

- **Environment variables**: Load every variable listed in `.env.example` into your hosting project.
- **Database**: Provision Postgres (recommended: Neon) and apply migrations before traffic. The Vercel build command (`build:vercel`) runs `pnpm db:migrate`, so make sure `POSTGRES_URL` or `DATABASE_URL` is configured for the target environment during builds.
- **Blob storage**: Enable your blob storage provider and provide the required blob credentials.
- **Redis**: Configure your Redis provider and set the matching connection URL.
- **AI gateway**: Confirm AI Gateway credentials or OIDC access so model requests resolve.

- **Chat + store schema drift guard (Preview + Production)**: Confirm `POSTGRES_URL` (or `DATABASE_URL`) is set for the target environment and points at the expected database. Run `pnpm db:migrate` against that environment, then verify `public."Chat"` includes `sessionType` with no NULLs (for example: `SELECT COUNT(*) FROM public."Chat" WHERE "sessionType" IS NULL;` should return `0`). Confirm `GET /api/health/chat-schema` returns `200` in both Preview and Production and reports no missing store objects (including `namc_install_gate_state` verification columns). If this endpoint returns non-200, run migrations on the target database and re-check that `POSTGRES_URL`/`DATABASE_URL` point to the intended Preview/Production instance before redeploying.

For a full production release checklist, see [docs/ops/release-checklist.md](./release-checklist.md).

## Post-deploy verification checklist (managed hosting)

Run these checks against the production URL **https://www.brooksaihub.app/** after each deploy.

1. **Health endpoint (monitoring)**
   - **URL**: https://www.brooksaihub.app/api/health
   - **How**: Configure Vercel/StatusCake/other monitors to hit the endpoint at a regular interval.
   - **Expected outcome**: `200` response with JSON payload containing `status: "ok"`, plus `uptime`, `version`, and `timestamp` fields.
1. **Lighthouse PWA audit**
   - **URL**: https://www.brooksaihub.app/
   - **How**: Chrome DevTools → Lighthouse → select **Progressive Web App** → Analyze.
   - **Expected outcome**: PWA audit completes successfully with no critical failures (installable, service worker detected).
2. **Service worker registration**
   - **URL**: https://www.brooksaihub.app/
   - **How**: Chrome DevTools → Application → Service Workers.
   - **Expected outcome**: A service worker is registered for the site, is active, and controls the page.
3. **Install prompt on Android/Chrome**
   - **URL**: https://www.brooksaihub.app/
   - **How**: Open the site in Chrome on Android, wait for eligibility, and check for the install banner or "Add to Home screen" from the menu.
   - **Expected outcome**: The install prompt appears and the app can be added to the home screen.
4. **Offline fallback**
   - **URL**: https://www.brooksaihub.app/
   - **How**: Chrome DevTools → Application → Service Workers → check **Offline**, then refresh.
   - **Expected outcome**: The app serves a cached/offline experience instead of a network error.
5. **PWA manifest/installability script**
   - **How**: Run the repo check with the production base URL to validate manifest settings and confirm `/welcome` does not redirect or fail.
   - **Command**: `PWA_CHECK_BASE_URL=https://www.brooksaihub.app pnpm check:pwa`
   - **Expected outcome**: Script exits successfully with "PWA installability checks passed."
6. **Manifest + service worker endpoints**
   - **URL**: https://www.brooksaihub.app/manifest.webmanifest and https://www.brooksaihub.app/sw.js
   - **How**: Open each URL directly in a browser or use `curl -I`.
   - **Expected outcome**: Both return `200` in production with the correct `content-type` and no redirects.

## Mobile installability notes

- **iOS (Safari/Chrome/Edge)**: iOS browsers do not support the native PWA install prompt. Users must use Safari → Share → **Add to Home Screen**. This is a platform limitation, not a configuration issue.
- **Android (Chrome)**: If the install banner does not appear, confirm the manifest loads without redirects, the service worker is active, and the site is served over HTTPS. Run the Lighthouse PWA audit above to verify eligibility.

## Next step: publish a Trusted Web Activity (TWA)

If native Android install is required (Play Store or full-screen app shell), ship a TWA wrapper around the deployed web app.

1. **Verify the PWA is eligible**
   - Run the Lighthouse PWA audit and fix any blocking issues (manifest fetch, service worker, HTTPS).
2. **Generate Android project**
   - Use Bubblewrap (`bubblewrap`) to create a TWA project pointing at the production URL.
   - Example: `npx @bubblewrap/cli init --manifest=https://www.brooksaihub.app/manifest.webmanifest`
3. **Configure signing + Digital Asset Links**
   - Generate a signing key (keystore).
   - Host the `assetlinks.json` file at `https://www.brooksaihub.app/.well-known/assetlinks.json`.
   - The file must include the app package name and the signing certificate fingerprint.
4. **Build & test on device**
   - Build an APK/AAB, install on an Android device, and confirm it launches the PWA in full-screen mode.
5. **Publish**
   - Upload the AAB to the Play Console and complete the store listing flow.
