# MyFlowerAI Refactor Plan

## Current File Locations

- **MyFlowerAI route**: `app/(chat)/MyFlowerAI/page.tsx` (main hub) and subroutes in `app/(chat)/MyFlowerAI/` (e.g., `image-gen/`, `quiz/`, `strain-library/`).
- **Strain library UI**: `components/myflowerai/strain-library.tsx` with route at `app/(chat)/MyFlowerAI/strain-library/page.tsx`.
- **Agent workflow**: `lib/ai/agents/myflowerai-workflow.ts` and agent registry in `lib/ai/agents/registry.ts`.
- **Chat API**: `app/(chat)/api/chat/route.ts` (routes MyFlowerAI chat requests into the workflow).
- **Auth helper**: `app/(auth)/auth.ts` (exported `auth` used across routes).
- **DB schema/migrations**: `lib/db/schema.ts` and SQL migrations under `lib/db/migrations/`.

## Proposed New Files / Components

- **Dashboard cards**
  - `components/myflowerai/dashboard/daily-summary-card.tsx`
  - `components/myflowerai/dashboard/streak-card.tsx`
  - `components/myflowerai/dashboard/goal-progress-card.tsx`
- **Modals**
  - `components/myflowerai/modals/log-session-modal.tsx`
  - `components/myflowerai/modals/set-goal-modal.tsx`
  - `components/myflowerai/modals/upload-photo-modal.tsx`
- **API clients**
  - `lib/myflowerai/api/day.ts` (GET `/api/myflower/day`)
  - `lib/myflowerai/api/log.ts` (POST `/api/myflower/log`)
  - `lib/myflowerai/api/goal.ts` (GET/PUT `/api/myflower/goal`)
  - `lib/myflowerai/api/upload.ts` (POST `/api/myflower/upload`)
- **Upload handlers**
  - `app/api/myflower/upload/route.ts` (server handler)
  - `lib/myflowerai/uploads/validate-upload.ts`
  - `lib/myflowerai/uploads/process-media.ts`

## DB Migrations Needed

- **`myflower_daily_goals`**: store user goal targets and cadence.
- **`myflower_logs`**: store daily session logs, totals, and notes.
- **`media_assets`**: store uploaded photos with ownership + metadata.
- **`commons_posts`** *or* **`myflower_posts`**: store shared posts for the commons feed.

## Endpoints Needed

- `GET /api/myflower/day` (daily totals + summary)
- `POST /api/myflower/log` (create/edit daily log entry)
- `GET/PUT /api/myflower/goal` (read/update goal settings)
- `POST /api/myflower/upload` (photo upload + asset creation)

## Acceptance Criteria Checklist

- [ ] Real totals are computed from stored logs (no mocked values).
- [ ] Photo upload works end-to-end, including validation + media storage.
- [ ] Chat syncs with MyFlowerAI logs (new entries surface in chat context).
- [ ] Mobile UI displays dashboard cards and modals cleanly.
- [ ] Error states are handled with clear, user-friendly messaging.

