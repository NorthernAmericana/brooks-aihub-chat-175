<a href="https://www.brooksaihub.app/">
  <img alt="Brooks AI HUB conversational app." src="app/(chat)/opengraph-image.png">
  <h1 align="center">Brooks AI HUB - A Mobile AI Chat and Marketplace for apps and games and media</h1>
</a>

<p align="center">
    Brooks AI HUB - A Mobile AI Chat and Marketplace for apps and games and media
</p>

<p align="center">
  <a href="https://chat-sdk.dev"><strong>Read Docs</strong></a> ·
  <a href="docs/README.md"><strong>Master Docs</strong></a> ·
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Brooks AI HUB Editions (Two Repos, One Product)

<p align="center">
  Brooks AI HUB is one product ecosystem available in <strong>two separate repositories</strong> for different deployment scenarios.
</p>

### Mobile Edition (Primary)

This repository (`NorthernAmericana/brooks-aihub-chat-175`) is the **primary Mobile Edition** – an App Router-based conversational AI application designed for web and mobile deployments with modern chat UI, multi-provider model access, and cloud infrastructure.

### Console Edition

The **[Console Edition](https://github.com/NorthernAmericana/brooks-ai-hub-console175)** (`NorthernAmericana/brooks-ai-hub-console175`) is optimized for **Raspberry Pi and handheld kiosk** deployments. It features a fullscreen launcher interface with cloud sync capabilities, perfect for physical installations and embedded devices.

<p align="center">
  <strong>→</strong> Both editions share the same Brooks AI HUB vision and product goals <strong>←</strong>
</p>

<br/>

## Master Docs

Start with the [Master Docs landing page](docs/README.md) to navigate project scope, architecture context, and contributor setup.
Use the [hosting deployment guide](docs/ops/vercel.md) for production deployment steps.
See the [Stripe & Entitlements guide](docs/stripe-entitlements.md) for payment integration and access control.
Review [CONTRIBUTING.md](CONTRIBUTING.md) for contributor workflows and [SUPPORT.md](SUPPORT.md) for support channels.
Report vulnerabilities responsibly by following the [Security Policy](SECURITY.md).

## Routing model: agentic chat subroutes vs UI pages (ATO apps)

Brooks AI HUB uses **two different kinds of routes**, and it’s important to keep them conceptually separate:

### 1) Agentic chat subroutes (conversation “commands”)

These are the **slash-style routes** you see inside prompts (for example: `/BrooksBears/BenjaminBear/ ...`).
They’re used to **select an agent/persona/mode inside the chat system**.

- They typically live under `app/(chat)/...`
- UI “app” pages can forward into chat by constructing a query string that starts with one of these routes.

Example:
- The `/BrooksBears/` UI route can push the user into chat by routing a transcript to `/brooks-ai-hub/?query=/BrooksBears/BenjaminBear/ ...`

### 2) Normal page routes (UI pages)

These are standard App Router pages (for example: `/namc-app`, `/NAMC/`, `/MyCarMindATO/`).
They’re used to render **interactive UI surfaces**.

### ATO apps: “tiny apps inside one large app”

In practice, an **ATO app** should behave like a **single-page UI playground**:

- **App detail/description page** (store-like page): explains what the app is and lists the available slash routes.
  - Example: `/brooksbears-app`, `/mycarmindato-app`, `/namc-app`
- **App UI page**: a focused UI that can *optionally* launch chat interactions by generating a query that targets an agentic subroute.
  - Example: `/BrooksBears/` can route to `/BrooksBears/BenjaminBear/ ...`

This keeps Brooks AI HUB as the “big app,” while ATO pages act as lightweight, themed surfaces that **drive** agentic chat subroutes when needed.

## Features

- App Router framework
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions for server-side rendering and increased performance
- [AI SDK](https://ai-sdk.dev/docs/introduction)
  - Unified API for generating text, structured objects, and tool calls with LLMs
  - Hooks for building dynamic chat and generative user interfaces
  - Supports xAI (default), OpenAI, Fireworks, and other model providers
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility
- Data Persistence
  - [Neon Serverless Postgres](https://vercel.com/marketplace/neon) for saving chat history and user data
  - Managed blob storage for efficient file storage
- [Auth.js](https://authjs.dev)
  - Simple and secure authentication

## Model Providers

Brooks AI HUB uses a managed AI Gateway to access multiple AI models through a unified interface. The default configuration includes [xAI](https://x.ai) models (`grok-2-vision-1212`, `grok-3-mini`) routed through the gateway.

### AI Gateway Authentication

**For managed hosting deployments**: Authentication is handled automatically via OIDC tokens.

**For self-hosted or other deployments**: You need to provide an AI Gateway API key by setting the `AI_GATEWAY_API_KEY` environment variable in your `.env.local` file.

With the [AI SDK](https://ai-sdk.dev/docs/introduction), you can also switch to direct LLM providers like [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Cohere](https://cohere.com/), and [many more](https://ai-sdk.dev/providers/ai-sdk-providers) with just a few lines of code.

## Deploy Your Own

Deploy your own version of Brooks AI HUB using the production guide in [`docs/ops/vercel.md`](docs/ops/vercel.md).

**Production migrations:** Ensure `pnpm db:migrate` runs against your production database before the app starts. The Vercel build pipeline is configured to run migrations automatically, but self-hosted environments should run the command as part of their deploy/start process.

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Brooks AI HUB. A local `.env` file is sufficient for development.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various AI and authentication provider accounts.

### Required environment variables

- `DATABASE_URL`: Neon Postgres connection string for production or local development (used by `/api/myflower/upload` and the app database layer).
  - `POSTGRES_URL` is also supported when using Vercel Postgres; set either `DATABASE_URL` or `POSTGRES_URL`.
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob token for uploads (used by `/api/myflower/upload`).
  - If you use a different storage provider, set the provider-specific envs instead.

> Note: `/api/myflower/upload` stores only the uploaded asset URL and metadata (content type, byte size, dimensions) in Postgres, not the binary file.

```bash
pnpm install
pnpm db:migrate # Setup database or apply latest database changes
pnpm dev
```

Your app should now be running on [localhost:3000](http://localhost:3000).

## Progressive Web App (PWA)

Brooks AI HUB is a fully installable Progressive Web App that works offline and provides a native app-like experience.

### Features

- **Installable**: Add the app to your home screen on mobile or desktop
- **Offline Support**: Access cached content and see an offline page when disconnected
- **Fast Loading**: Service worker caching ensures quick load times
- **App-like Experience**: Runs in standalone mode without browser UI

### How It Works

The PWA functionality is implemented using:

1. **Service Worker** (`public/sw.js`): Handles caching strategies and offline fallback
   - Precaches critical resources (home page, offline page, icons)
   - Implements runtime caching for navigation, assets, and API requests
   - Automatic cache versioning and cleanup on updates

2. **Web App Manifest** (`app/manifest.ts`): Defines app metadata and install behavior
   - App name, icons, theme colors, and display mode
   - Served at `/manifest.webmanifest` via the framework metadata route

3. **Service Worker Registration** (`components/pwa-register.tsx`): Registers the service worker on client load

### TWA alignment

The Trusted Web Activity wrapper reads its navigation defaults from `android/twa-manifest.json`.
Keep the following values in sync with the web manifest so install behavior matches across PWA
and TWA builds:

- `app/manifest.ts`: `id`, `start_url`, and `scope`
- `android/twa-manifest.json`: `startUrl` and `scope`

The Android package name used for Digital Asset Links must also match the TWA package in
`public/.well-known/assetlinks.json` (currently `com.brooks.aihub.chat175`). If you change
the package in the Android wrapper, update the asset links file at the same time.

### Testing Installability

#### Using Chrome DevTools

1. Open the app in Chrome or a Chromium-based browser (must be served over HTTPS or localhost)
2. Open DevTools (F12) → Application tab
3. Check **Service Workers** section to verify registration
4. Check **Manifest** section to verify manifest is valid and installability criteria are met
5. Look for install button in the address bar or browser menu

#### Using Lighthouse

1. Open DevTools → Lighthouse tab
2. Select "Progressive Web App" category
3. Click "Generate report"
4. Review PWA installability checks and recommendations

#### Manual Testing

1. **Desktop**: Look for the install icon in the Chrome address bar
2. **Mobile**: Use "Add to Home Screen" from the browser menu
3. **Offline**: Disconnect from network and verify offline page appears when navigating

### Customization

To customize PWA settings:

- **App name/colors**: Edit `app/manifest.ts`
- **Cached resources**: Modify `PRECACHE_URLS` in `public/sw.js`
- **Offline page**: Customize `app/offline/page.tsx`
- **Cache strategy**: Adjust fetch handlers in `public/sw.js`

### Cache Versioning

When updating the service worker:

1. Increment `CACHE_VERSION` in `public/sw.js` (e.g., "v1" → "v2")
2. Old caches are automatically cleaned up on activation
3. Users will receive the updated service worker on next page load

## Redirect Loop Debugging

Use the built-in redirect diagnostics when investigating `ERR_TOO_MANY_REDIRECTS`.

### 1) Trace redirect decisions

Use the diagnostic endpoint (never redirected by proxy middleware):

```bash
curl -sS 'http://localhost:3000/api/diag/redirect-trace' | jq
```

You can emulate Vercel host/proto behavior with forwarded headers:

```bash
curl -sS 'http://localhost:3000/api/diag/redirect-trace' \
  -H 'host: brooksaihub.app' \
  -H 'x-forwarded-host: brooksaihub.app' \
  -H 'x-forwarded-proto: https' \
  -H 'x-forwarded-for: 203.0.113.10' | jq
```

To force proxy middleware to skip redirects during debugging:

```bash
curl -sS 'http://localhost:3000/api/diag/redirect-trace?noredirect=1' \
  -H 'x-redirect-debug: 1' | jq
```

### 2) Reproduce loop conditions locally

1. Start dev server:

```bash
pnpm dev
```

2. Follow redirects from the homepage:

```bash
curl -I -L --max-redirs 20 'http://localhost:3000/'
```

3. Compare with no-redirect debug mode:

```bash
curl -I 'http://localhost:3000/?noredirect=1'
```

4. Check diagnostics and metadata routes:

```bash
curl -I 'http://localhost:3000/api/diag/redirect-trace'
curl -I 'http://localhost:3000/robots.txt'
curl -I 'http://localhost:3000/sitemap.xml'
```

### 3) Resolution checklist

- Choose **one canonical host** (`www.brooksaihub.app` or `brooksaihub.app`) and keep it consistent.
- Ensure Vercel domain redirect settings and app-level host redirects do **not** fight each other.
- Avoid duplicate redirect logic across:
  - Vercel dashboard domain settings
  - `next.config.*` (`redirects`, `rewrites`, `trailingSlash`, `basePath`, i18n redirects)
  - proxy/middleware auth guards
- Ensure auth guard logic does not create login loops (`/login -> auth redirect -> /login`).
- Keep `/api/diag/redirect-trace`, `/robots.txt`, `/sitemap.xml`, `/favicon.ico`, and `/_next/*` out of middleware redirect flows.

## MyCarMindATO architecture + how to add a new city

### Architecture (MVP)

- **UI routes**: `/mycarmind` with subpages for Explore, Place Detail, Missions, Profile, and Leaderboard.
- **API routes**: `/api/mycarmind/*` for search, place reads, saves, visits, missions, leaderboard, and media attach flows.
- **Data source model**:
  1. Curated JSON registry in `data/mycarmind/season-1/us/{state}/{city}`
  2. Synced relational records in Neon Postgres (`mycarmind_*` tables)
  3. Place citations persisted in `mycarmind_place_sources`
- **Gamification**: points are awarded on visit events and mission progress updates (`visit=10`, `mission=100`, `city badge=250` config target).
- **Store integration**: app catalog references MyCarMindATO at `/mycarmind/install` and app entry `/mycarmind`.

### Add a new city

1. Create a city folder: `data/mycarmind/season-1/us/{state-slug}/{city-slug}/`
2. Add three files:
   - `city.json` (city metadata)
   - `places.json` (curated places + `sources` URLs)
   - `missions.json` (city/season mission templates)
3. Ensure each place includes stable `slug`, `name`, `city`, `state`, `category`, and source citations.
4. Run sync:
   ```bash
   pnpm mycarmind:sync
   ```
5. Validate via API:
   - `GET /api/mycarmind/places?city=...&state=...`
   - `GET /api/mycarmind/search?q=...`
