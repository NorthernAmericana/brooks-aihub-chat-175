# Testing Plan for Vercel Preview Deployment Fix

## Objective
Verify that changes are now visible on Vercel preview environments after the fix has been deployed.

## Prerequisites
- A branch with this PR merged or cherry-picked
- Access to create pull requests in the repository
- Access to view Vercel preview deployments

## Test Cases

### Test Case 1: Verify Preview Deployment Shows Changes
**Purpose**: Confirm that code changes appear in preview deployments

**Steps**:
1. Create a new branch from the main branch (with the fix applied)
2. Make a visible change to a component, for example:
   - Edit `app/page.tsx` and change the text "Tap to Start" to "Tap to Start Testing"
   - Or change any other visible text on a page
3. Commit and push the change
4. Create a pull request
5. Wait for Vercel to create the preview deployment
6. Open the preview deployment URL
7. Navigate to the page where you made the change

**Expected Result**: 
- The change should be visible immediately on the preview deployment
- No hard refresh or cache clearing should be needed
- The changed text should display as expected

**Pass Criteria**: Changes are visible on first load of the preview URL

---

### Test Case 2: Verify Multiple Changes in Same Preview
**Purpose**: Confirm that subsequent changes to the same preview branch update correctly

**Steps**:
1. Using the same branch from Test Case 1
2. Make another visible change (e.g., change the text again to "Tap to Start Again")
3. Commit and push the change
4. Wait for Vercel to redeploy the preview
5. Open the preview deployment URL (use the same URL as before)
6. Check if the new change is visible

**Expected Result**: 
- The new change should replace the old change
- The preview should not show stale content from the first deployment
- Build ID should be different between deployments (check HTML source)

**Pass Criteria**: Second change is visible, first change is no longer visible

---

### Test Case 3: Verify Production Deployment Performance
**Purpose**: Confirm that production deployments still benefit from caching

**Steps**:
1. Merge the PR to the production branch
2. Wait for production deployment to complete
3. Access the production URL
4. Check browser DevTools Network tab for cache headers
5. Reload the page and check if content is served from cache

**Expected Result**:
- Production should have `Cache-Control` headers with appropriate values
- Subsequent page loads should be fast due to caching
- The production site should not have performance degradation

**Pass Criteria**: Production maintains good performance with appropriate caching

---

### Test Case 4: Verify Build ID Uniqueness
**Purpose**: Confirm that each deployment has a unique build ID

**Steps**:
1. Open a preview deployment
2. View the page source (right-click → View Page Source)
3. Search for "buildId" in the JSON data embedded in the page
4. Note the build ID
5. Make a small change and push to trigger a new preview deployment
6. View the page source of the new deployment
7. Compare the build IDs

**Expected Result**:
- Each deployment should have a different build ID
- Preview builds should use the commit SHA as the build ID
- No two deployments should share the same build ID

**Pass Criteria**: Build IDs are unique across deployments

---

### Test Case 5: Verify Local Development
**Purpose**: Confirm that local development still works correctly

**Steps**:
1. Clone the repository locally
2. Run `pnpm install`
3. Run `pnpm dev`
4. Make a change to a component
5. Check if hot reload works
6. Build the project with `pnpm build`
7. Verify the build completes successfully

**Expected Result**:
- Local development server starts without errors
- Hot reload works as expected
- Build completes successfully
- Build ID is "development" for local builds

**Pass Criteria**: Local development and builds work without issues

---

## Troubleshooting

### If changes are still not visible:

1. **Check Browser Cache**: Try opening in an incognito/private window
2. **Check Vercel Logs**: Review the build logs on Vercel dashboard for errors
3. **Verify Environment Variables**: Ensure `VERCEL_ENV` is set correctly on Vercel
4. **Check Build ID**: Verify that the build ID is changing between deployments
5. **Clear Vercel Cache**: In Vercel dashboard, try clearing the build cache

### If production is slow:

1. **Check Revalidation**: Verify that `revalidate = 3600` for production
2. **Check Cache Headers**: Use browser DevTools to inspect response headers
3. **Monitor Performance**: Use Vercel Analytics to monitor performance metrics

## Success Criteria

The fix is considered successful if:
- ✅ All test cases pass
- ✅ Preview deployments show changes immediately
- ✅ Production maintains good performance
- ✅ No security vulnerabilities introduced
- ✅ Local development works correctly
- ✅ Build IDs are unique per deployment

## Rollback Plan

If issues are discovered after deployment:

1. Revert the changes in `next.config.ts`, `app/layout.tsx`, and `app/(chat)/layout.tsx`
2. Restore the minimal `vercel.json` configuration
3. Push the revert commit
4. Investigate the issue further before attempting another fix
