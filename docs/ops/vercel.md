# Vercel deployment guide

## Required environment variables

Review the required environment variables in [`.env.example`](../../.env.example). Keep this file as your single source of truth for everything you need to configure before deploying.

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
