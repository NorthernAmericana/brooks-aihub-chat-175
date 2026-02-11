import type { NextRequest } from "next/server";

export const DEFAULT_CANONICAL_HOST =
  process.env.NEXT_PUBLIC_CANONICAL_HOST || "www.brooksaihub.app";

export const NEVER_REDIRECT_PATH_PREFIXES = [
  "/api/diag/redirect-trace",
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
  "/_next/",
  "/diag/redirect-sources",
] as const;

export const REDIRECT_LOOP_COOKIE = "redirect_loop_count";
export const REDIRECT_LOOP_LIMIT = 3;

export function getForwardedContext(request: NextRequest) {
  return {
    host: request.headers.get("host") || null,
    forwardedProto: request.headers.get("x-forwarded-proto") || null,
    forwardedHost: request.headers.get("x-forwarded-host") || null,
    forwardedFor: request.headers.get("x-forwarded-for") || null,
  };
}

export function deriveCanonicalHost(request: NextRequest) {
  const { forwardedHost } = getForwardedContext(request);
  const candidateHost = (
    forwardedHost ||
    request.nextUrl.hostname ||
    ""
  ).toLowerCase();

  if (
    candidateHost === "www.brooksaihub.app" ||
    candidateHost === "brooksaihub.app"
  ) {
    return "www.brooksaihub.app";
  }

  return DEFAULT_CANONICAL_HOST;
}

export function isNeverRedirectPath(pathname: string) {
  return NEVER_REDIRECT_PATH_PREFIXES.some((prefix) => {
    if (prefix.endsWith("/")) {
      return pathname.startsWith(prefix);
    }
    return pathname === prefix;
  });
}

export function hasRedirectBypass(request: NextRequest) {
  return (
    request.headers.has("x-redirect-debug") ||
    request.nextUrl.searchParams.get("noredirect") === "1"
  );
}

export function getLoopCount(request: NextRequest) {
  const fromCookie = Number(
    request.cookies.get(REDIRECT_LOOP_COOKIE)?.value || "0"
  );
  const fromSubrequest = Number(
    request.headers.get("x-middleware-subrequest") || "0"
  );

  return Number.isFinite(Math.max(fromCookie, fromSubrequest))
    ? Math.max(fromCookie, fromSubrequest)
    : 0;
}

export type RedirectDecision = {
  wouldRedirect: boolean;
  reasons: string[];
  canonicalHost: string;
};

export function evaluateRedirectRisk(request: NextRequest): RedirectDecision {
  const reasons: string[] = [];
  const canonicalHost = deriveCanonicalHost(request);
  const loopCount = getLoopCount(request);

  if (isNeverRedirectPath(request.nextUrl.pathname)) {
    reasons.push("never-redirect-path");
    return { wouldRedirect: false, reasons, canonicalHost };
  }

  if (hasRedirectBypass(request)) {
    reasons.push("debug-bypass");
    return { wouldRedirect: false, reasons, canonicalHost };
  }

  if (loopCount >= REDIRECT_LOOP_LIMIT) {
    reasons.push("loop-guard-threshold-reached");
    return { wouldRedirect: false, reasons, canonicalHost };
  }

  const hostname = request.nextUrl.hostname.toLowerCase();
  if (
    hostname !== canonicalHost &&
    !["localhost", "127.0.0.1", "::1"].includes(hostname)
  ) {
    reasons.push(`host-canonicalization:${hostname}->${canonicalHost}`);
    return { wouldRedirect: true, reasons, canonicalHost };
  }

  return { wouldRedirect: false, reasons, canonicalHost };
}

export function getRedirectRecommendations(
  request: NextRequest,
  reasons: string[]
) {
  const recommendations: string[] = [];
  const host = request.nextUrl.hostname.toLowerCase();
  const forwardedHost = request.headers.get("x-forwarded-host")?.toLowerCase();

  if (
    (host === "www.brooksaihub.app" && forwardedHost === "brooksaihub.app") ||
    (host === "brooksaihub.app" && forwardedHost === "www.brooksaihub.app")
  ) {
    recommendations.push(
      "Potential www/non-www conflict detected. Keep only ONE canonical host redirect (prefer Vercel primary domain) and remove the opposite redirect from app middleware/config."
    );
  }

  if (reasons.some((reason) => reason.startsWith("host-canonicalization:"))) {
    recommendations.push(
      "Host canonicalization redirect is active in proxy middleware. Confirm it matches Vercel domain redirect settings to avoid ping-pong loops."
    );
  }

  if (!request.nextUrl.pathname.startsWith("/api/auth")) {
    recommendations.push(
      "If requests bounce to /api/auth/guest repeatedly, verify auth cookie domain/path and avoid redirecting login/guest endpoints back into auth guards."
    );
  }

  recommendations.push(
    "If trailingSlash/basePath/i18n redirects are configured in next.config, ensure they do not conflict with host/protocol redirects."
  );

  return recommendations;
}
