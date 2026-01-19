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
