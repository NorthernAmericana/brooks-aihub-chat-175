# Vercel Preview Deployment Fix

## Problem
Changes were not visible on Vercel preview environments, only showing after full deployment to production. This was caused by aggressive caching of build artifacts and static pages between deployments.

## Root Cause
1. **Build Cache Persistence**: Vercel caches the `.next` directory and build artifacts between deployments to speed up builds. This can cause stale builds in preview environments.
2. **Static Page Caching**: Pages generated at build time were being cached without proper revalidation strategies.
3. **No Environment-Specific Configuration**: The minimal `vercel.json` configuration didn't differentiate between production and preview environments.

## Solution
The fix implements a multi-layered approach to ensure preview deployments always reflect the latest code changes:

### 1. Build ID Generation (`next.config.ts`)
```typescript
generateBuildId: async () => {
  return process.env.VERCEL_GIT_COMMIT_SHA || `build-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}
```
- Uses the Git commit SHA on Vercel deployments for unique build identification
- Falls back to a timestamp + random string for local builds
- Forces Next.js to recognize each deployment as a distinct build, preventing cache reuse

### 2. Environment-Specific Revalidation (`app/layout.tsx` and `app/(chat)/layout.tsx`)
```typescript
export const revalidate = process.env.VERCEL_ENV === "preview" ? 0 : 3600;
```
- Sets revalidation to 0 seconds for preview environments (no caching)
- Sets revalidation to 1 hour (3600 seconds) for production (optimal performance)
- Ensures preview deployments always serve fresh content

### 3. Enhanced Vercel Configuration (`vercel.json`)
```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "github": {
    "silent": false
  }
}
```
- Explicitly defines build and install commands for consistency
- Enables GitHub notifications for deployment status
- Maintains minimal configuration following Vercel best practices

## How It Works

### Preview Deployments
1. Each preview deployment gets a unique build ID based on the commit SHA
2. All pages have `revalidate = 0`, disabling ISR caching
3. Fresh content is served on every request
4. Changes are immediately visible on preview URLs

### Production Deployments
1. Production deployment gets a unique build ID based on the production commit
2. Pages cache for 1 hour (`revalidate = 3600`) for optimal performance
3. Balances freshness with performance for live users

## Environment Variables
The fix automatically detects the deployment environment using Vercel's built-in environment variables:
- `VERCEL_ENV`: Set to "preview", "production", or "development"
- `VERCEL_GIT_COMMIT_SHA`: The commit SHA of the deployed branch

No additional environment variable configuration is required.

## Testing the Fix
To verify the fix is working:

1. **Make a change** to any visible component (e.g., update text on a page)
2. **Push to a branch** and create a pull request
3. **Check the Vercel preview link** - changes should be immediately visible
4. **Hard refresh** (Ctrl+Shift+R or Cmd+Shift+R) if needed to clear browser cache

## Trade-offs
- **Preview environments**: Slightly slower page loads due to no caching (acceptable for testing)
- **Production**: Maintains optimal performance with 1-hour cache revalidation
- **Build times**: No impact on build performance as build ID generation is instant

## References
- [Vercel Data Cache Documentation](https://vercel.com/docs/data-cache)
- [Next.js revalidate Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#revalidate)
- [Next.js generateBuildId Documentation](https://nextjs.org/docs/app/api-reference/next-config-js/generateBuildId)

## Related Issue
Resolves issue #258: Changes not visible on Vercel preview environments
