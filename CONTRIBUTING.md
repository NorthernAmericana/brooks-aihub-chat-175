# Contributing to Brooks AI HUB

Thanks for your interest in improving Brooks AI HUB! This guide covers local setup, branching, linting, and PR expectations for the Mobile Edition repository.

## Local setup

Follow the **Running locally** instructions in [`README.md`](README.md#running-locally) for environment variables and the default dev workflow. The core commands are:

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

Additional tooling and scripts are listed in [`package.json`](package.json). Common tasks include:

- **Linting**: `pnpm lint`
- **Formatting**: `pnpm format`
- **Database**: `pnpm db:generate`, `pnpm db:push`, `pnpm db:pull`
- **Tests**: `pnpm test`
- **PWA checks**: `pnpm check:pwa`

## Branching

- Create feature branches off the default branch (typically `main`).
- Use clear, descriptive branch names (for example, `feature/support-docs` or `fix/pwa-cache`).
- Keep PRs focused on a single change set whenever possible.

## Linting and checks

Before opening a PR, run:

```bash
pnpm lint
```

If you make formatting-only changes, run:

```bash
pnpm format
```

For larger changes, consider running the relevant checks from `package.json` (tests, PWA checks, or database scripts) based on the area you touched.

## Pull request expectations

- **Describe the change**: Provide context, what changed, and why.
- **Link related issues**: Reference GitHub Issues or Discussions when applicable.
- **Screenshots for UI changes**: Include screenshots or screen recordings for visible UI updates.
- **Verify Vercel builds**: Ensure the Vercel preview deployment succeeds, and use `pnpm build:vercel` locally when you need to validate build-time behavior.
- **Data migrations**: Call out when database migrations are required and include steps to apply them.

If you are unsure where to ask for help, see [`SUPPORT.md`](SUPPORT.md).
