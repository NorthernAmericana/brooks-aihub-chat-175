export const redirectSourceSummary = [
  {
    source: "next.config.ts",
    findings: [
      "Custom redirects() exists for legacy path aliases.",
      "No trailingSlash/basePath/i18n redirect settings found.",
      "No rewrites() block found.",
    ],
  },
  {
    source: "proxy.ts",
    findings: [
      "Host canonicalization redirect is implemented in proxy middleware.",
      "Auth redirects route unauthenticated users to /api/auth/guest.",
      "Loop guard and redirect bypass now supported with noredirect=1 or x-redirect-debug header.",
    ],
  },
  {
    source: "vercel.json",
    findings: [
      "No explicit redirects/rewrites in vercel.json.",
      "Vercel dashboard domain redirect settings may still apply (outside repository).",
    ],
  },
  {
    source: "app/(auth)/api/auth/guest/route.ts",
    findings: [
      "Guest auth endpoint can redirect authenticated users to '/'.",
      "Misconfigured guards can cause auth redirect loops if login endpoints are also guarded.",
    ],
  },
] as const;
