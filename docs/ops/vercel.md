# Vercel deployment guide

## Required environment variables

Review the required environment variables in [`.env.example`](../../.env.example). Keep this file as your single source of truth for everything you need to configure before deploying.

**Metadata base URL:** Production metadata uses the deployment URL provided by Vercel (`VERCEL_URL` or `VERCEL_PROJECT_PRODUCTION_URL`). Ensure the project is deployed on Vercel so these values are injected automatically. For non-Vercel deployments, set `NEXT_PUBLIC_SITE_URL` to the full `https://` URL so metadata can resolve canonical links.

## Vercel configuration files

- [`vercel.json`](../../vercel.json) configures runtime settings for this repository, including build and routing behavior that Vercel applies to every deployment.
- [`vercel-template.json`](../../vercel-template.json) powers the Vercel “Deploy” button flow by defining the template metadata, required environment variables, and the onboarding copy shown during project creation.

## Minimal deployment checklist

- **Environment variables**: Load every variable listed in `.env.example` into your Vercel project.
- **Database**: Provision Postgres (recommended: Neon) and apply migrations before traffic.
- **Blob storage**: Enable Vercel Blob and provide the required blob credentials.
- **Redis**: Configure your Redis provider and set the matching connection URL.
- **AI gateway**: Confirm AI Gateway credentials or OIDC access so model requests resolve.

## Post-deploy verification checklist (Vercel)

Run these checks against the production URL **https://chat.vercel.ai/** after each deploy.

1. **Lighthouse PWA audit**
   - **URL**: https://chat.vercel.ai/
   - **How**: Chrome DevTools → Lighthouse → select **Progressive Web App** → Analyze.
   - **Expected outcome**: PWA audit completes successfully with no critical failures (installable, service worker detected).
2. **Service worker registration**
   - **URL**: https://chat.vercel.ai/
   - **How**: Chrome DevTools → Application → Service Workers.
   - **Expected outcome**: A service worker is registered for the site, is active, and controls the page.
3. **Install prompt on Android/Chrome**
   - **URL**: https://chat.vercel.ai/
   - **How**: Open the site in Chrome on Android, wait for eligibility, and check for the install banner or "Add to Home screen" from the menu.
   - **Expected outcome**: The install prompt appears and the app can be added to the home screen.
4. **Offline fallback**
   - **URL**: https://chat.vercel.ai/
   - **How**: Chrome DevTools → Application → Service Workers → check **Offline**, then refresh.
   - **Expected outcome**: The app serves a cached/offline experience instead of a network error.
5. **PWA manifest/installability script**
   - **How**: Run the repo check with the production base URL to validate manifest settings and confirm `/welcome` does not redirect or fail.
   - **Command**: `PWA_CHECK_BASE_URL=https://chat.vercel.ai pnpm check:pwa`
   - **Expected outcome**: Script exits successfully with "PWA installability checks passed."

## Mobile installability notes

- **iOS (Safari/Chrome/Edge)**: iOS browsers do not support the native PWA install prompt. Users must use Safari → Share → **Add to Home Screen**. This is a platform limitation, not a configuration issue.
- **Android (Chrome)**: If the install banner does not appear, confirm the manifest loads without redirects, the service worker is active, and the site is served over HTTPS. Run the Lighthouse PWA audit above to verify eligibility.

## Next step: publish a Trusted Web Activity (TWA)

If native Android install is required (Play Store or full-screen app shell), ship a TWA wrapper around the deployed web app.

1. **Verify the PWA is eligible**
   - Run the Lighthouse PWA audit and fix any blocking issues (manifest fetch, service worker, HTTPS).
2. **Generate Android project**
   - Use Bubblewrap (`bubblewrap`) to create a TWA project pointing at the production URL.
   - Example: `npx @bubblewrap/cli init --manifest=https://brooks-aihub-chat-175.vercel.app/manifest.webmanifest`
3. **Configure signing + Digital Asset Links**
   - Generate a signing key (keystore).
   - Host the `assetlinks.json` file at `https://brooks-aihub-chat-175.vercel.app/.well-known/assetlinks.json`.
   - The file must include the app package name and the signing certificate fingerprint.
4. **Build & test on device**
   - Build an APK/AAB, install on an Android device, and confirm it launches the PWA in full-screen mode.
5. **Publish**
   - Upload the AAB to the Play Console and complete the store listing flow.
