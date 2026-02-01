# Vercel Preview Deployment Fix

## Problem
Changes were not visible on Vercel preview environments, only showing after full deployment to production. This was caused by aggressive caching of build artifacts between deployments.

## Root Cause
1. **Build Cache Persistence**: Vercel caches the `.next` directory and build artifacts between deployments to speed up builds. This can cause stale builds in preview environments.
2. **Build ID Reuse**: Without unique build IDs, Vercel may serve cached builds instead of fresh deployments.

## Solution
The fix uses a **unique build ID per deployment** to ensure each preview deployment is treated as distinct:

### Build ID Generation (`next.config.ts`)
```typescript
generateBuildId: async () => {
  return process.env.VERCEL_GIT_COMMIT_SHA || "development";
}
```
- Uses the Git commit SHA on Vercel deployments for unique build identification
- Each deployment gets a unique build ID, preventing build cache reuse
- Falls back to "development" for local builds (stable for local dev)

This approach forces Next.js to recognize each deployment as distinct, ensuring:
- Preview deployments always reflect the latest code changes
- No stale build artifacts are served
- Each commit gets its own unique build

### Enhanced Vercel Configuration (`vercel.json`)
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

## Why Not Use `revalidate` Config?

**Note**: An earlier approach attempted to use environment-specific `revalidate` exports:
```typescript
// ❌ This doesn't work - causes build failure
export const revalidate = process.env.VERCEL_ENV === "preview" ? 0 : 3600;
```

This approach **fails** because Next.js requires route segment config exports (like `revalidate`, `dynamic`, etc.) to be **statically analyzable** at build time. They must be literal values, not computed expressions using environment variables.

The `generateBuildId` approach is cleaner and sufficient:
- It ensures each deployment has a unique identity
- No need for environment-specific revalidation
- Avoids build-time configuration issues
- Works consistently across all environments

## How It Works

### Preview Deployments
1. Each preview deployment gets a unique build ID based on the commit SHA
2. Vercel treats it as a completely new build
3. Fresh content is served on every deployment
4. Changes are immediately visible on preview URLs

### Production Deployments
1. Production deployment gets a unique build ID based on the production commit
2. Standard Next.js caching applies (ISR, API routes, etc.)
3. Optimal performance maintained

## Environment Variables
The fix automatically detects the deployment environment using Vercel's built-in environment variables:
- `VERCEL_GIT_COMMIT_SHA`: The commit SHA of the deployed branch (used as build ID)

No additional environment variable configuration is required.

## Testing the Fix
To verify the fix is working:

1. **Make a change** to any visible component (e.g., update text on a page)
2. **Push to a branch** and create a pull request
3. **Check the Vercel preview link** - changes should be immediately visible
4. **Verify build ID**: View page source and check that each deployment has a unique build ID

## Trade-offs
- **Minimal impact**: Only adds unique build ID generation
- **No performance cost**: Build ID generation is instant
- **Clean solution**: No environment-specific configuration needed
- **Consistent behavior**: Works the same across all environments

## References
- [Next.js generateBuildId Documentation](https://nextjs.org/docs/app/api-reference/next-config-js/generateBuildId)
- [Next.js Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables/system-environment-variables)

## Related Issue
Resolves issue #258: Changes not visible on Vercel preview environments
