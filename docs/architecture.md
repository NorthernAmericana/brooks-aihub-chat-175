# Architecture Overview

## High-level components

- **Next.js App Router**: The application is structured around the App Router, with route handlers and server components coordinating UI, API endpoints, and server-side logic in one place.
- **AI SDK**: Model calls are made through the AI SDK layer, which abstracts the provider (via Vercel AI Gateway for hosted deployments) and streams tokens to the UI.
- **Data stores**:
  - **Postgres** for durable data (chat metadata, messages, users, etc.).
  - **Redis** for caching/session-like data and fast lookups when needed.
  - **Blob storage** for file and asset persistence.
- **Auth**: Application authentication relies on a shared secret and integrates with the App Router for session/identity checks.

## Primary request flows

### Chat request → model call → persistence

1. **Client UI** sends a chat prompt to a Next.js App Router route handler.
2. The **route handler** validates the request and authenticates the user/session.
3. The **AI SDK** forwards the request to the configured model provider (via the AI Gateway).
4. The **response stream** is returned to the client while server-side logic persists the chat data in **Postgres** (and optionally caches metadata in Redis).
5. Any uploaded or generated files are stored in **Blob** storage and linked from the persisted records.

## Storage touchpoints

The following environment keys in `.env.example` define storage/auth connections and are referenced by runtime configuration:

- `POSTGRES_URL` — Postgres connection string for the primary database.
- `REDIS_URL` — Redis connection string for cache or ephemeral data.
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob read/write token for file persistence.
- `AUTH_SECRET` — Secret used by the auth layer for signing or verifying sessions.
- `AI_GATEWAY_API_KEY` — API key for the AI Gateway in non-Vercel deployments.
- `ELEVENLABS_API_KEY` — API key used to generate text-to-speech audio via ElevenLabs.

Database schema and migration configuration is defined in `drizzle.config.ts`, which points to the schema in `./lib/db/schema.ts` and uses `POSTGRES_URL` as the database credential for the Drizzle CLI.

## Minimal ASCII diagram

```
[Browser/UI]
     |
     v
[Next.js App Router]
     |  \----------------------.
     |                         \
     v                          v
[Auth checks]             [AI SDK]
     |                          |
     v                          v
[Postgres] <------persist----- [Model Provider]
     |
     v
[Blob Storage]

[Redis] (optional cache for sessions/metadata)
```
