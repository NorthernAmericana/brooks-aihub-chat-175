<a href="https://chat.vercel.ai/">
  <img alt="Brooks AI HUB conversational app." src="app/(chat)/opengraph-image.png">
  <h1 align="center">Brooks AI HUB</h1>
</a>

<p align="center">
    Brooks AI HUB is a conversational AI experience built with Next.js and the AI SDK for fast, powerful chatbot applications.
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

This repository (`NorthernAmericana/brooks-aihub-chat-175`) is the **primary Mobile Edition** – a Next.js-based conversational AI application designed for web and mobile deployments with modern chat UI, multi-provider model access, and cloud infrastructure.

### Console Edition

The **[Console Edition](https://github.com/NorthernAmericana/brooks-ai-hub-console175)** (`NorthernAmericana/brooks-ai-hub-console175`) is optimized for **Raspberry Pi and handheld kiosk** deployments. It features a fullscreen launcher interface with cloud sync capabilities, perfect for physical installations and embedded devices.

<p align="center">
  <strong>→</strong> Both editions share the same Brooks AI HUB vision and product goals <strong>←</strong>
</p>

<br/>

## Master Docs

Start with the [Master Docs landing page](docs/README.md) to navigate project scope, architecture context, and contributor setup.
Use the [Vercel deployment guide](docs/ops/vercel.md) for production deployment steps.
See the [Stripe & Entitlements guide](docs/stripe-entitlements.md) for payment integration and access control.

## Features

- [Next.js](https://nextjs.org) App Router
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
  - [Vercel Blob](https://vercel.com/storage/blob) for efficient file storage
- [Auth.js](https://authjs.dev)
  - Simple and secure authentication

## Model Providers

Brooks AI HUB uses the [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) to access multiple AI models through a unified interface. The default configuration includes [xAI](https://x.ai) models (`grok-2-vision-1212`, `grok-3-mini`) routed through the gateway.

### AI Gateway Authentication

**For Vercel deployments**: Authentication is handled automatically via OIDC tokens.

**For non-Vercel deployments**: You need to provide an AI Gateway API key by setting the `AI_GATEWAY_API_KEY` environment variable in your `.env.local` file.

With the [AI SDK](https://ai-sdk.dev/docs/introduction), you can also switch to direct LLM providers like [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Cohere](https://cohere.com/), and [many more](https://ai-sdk.dev/providers/ai-sdk-providers) with just a few lines of code.

## Deploy Your Own

You can deploy your own version of Brooks AI HUB to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Brooks AI HUB. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various AI and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

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
   - Served at `/manifest.webmanifest` via Next.js metadata route

3. **Service Worker Registration** (`components/pwa-register.tsx`): Registers the service worker on client load

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
