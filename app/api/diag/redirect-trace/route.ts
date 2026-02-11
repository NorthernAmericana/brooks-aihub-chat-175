import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { guestRegex, isDevelopmentEnvironment } from "@/lib/constants";
import {
  deriveCanonicalHost,
  evaluateRedirectRisk,
  getForwardedContext,
  getRedirectRecommendations,
  isNeverRedirectPath,
} from "@/lib/redirect-debug";
import { redirectSourceSummary } from "@/lib/redirect-sources";

export async function GET(request: NextRequest) {
  const forwarded = getForwardedContext(request);
  const risk = evaluateRedirectRisk(request);
  const pathname = request.nextUrl.pathname;

  let authAssessment = "not-checked";
  let authDetails = "";

  if (!isNeverRedirectPath(pathname) && !pathname.startsWith("/api/auth")) {
    try {
      const token = await getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
        secureCookie: !isDevelopmentEnvironment,
      });

      if (!token) {
        authAssessment = "would-redirect-to-guest-auth";
        authDetails =
          "No auth token detected for a path guarded by proxy middleware.";
      } else if (
        token &&
        !guestRegex.test(token?.email ?? "") &&
        ["/login", "/register"].includes(pathname)
      ) {
        authAssessment =
          "would-redirect-authenticated-user-away-from-auth-pages";
        authDetails =
          "Authenticated non-guest user cannot access /login or /register.";
      } else {
        authAssessment = "no-auth-redirect";
      }
    } catch (error) {
      authAssessment = "token-check-error";
      authDetails =
        error instanceof Error ? error.message : "Unknown token-check error";
    }
  }

  const reasons = [...risk.reasons];
  if (authAssessment.startsWith("would-redirect")) {
    reasons.push(authAssessment);
  }

  const recommendations = getRedirectRecommendations(request, reasons);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    request: {
      url: request.url,
      headers: {
        host: forwarded.host,
        "x-forwarded-proto": forwarded.forwardedProto,
        "x-forwarded-host": forwarded.forwardedHost,
        "x-forwarded-for": forwarded.forwardedFor,
      },
    },
    nextUrl: {
      pathname,
      origin: request.nextUrl.origin,
    },
    canonicalHost: deriveCanonicalHost(request),
    middlewareDecision: {
      wouldRedirect:
        risk.wouldRedirect || authAssessment.startsWith("would-redirect"),
      reasons,
      authAssessment,
      authDetails,
    },
    redirectSourceSummary,
    recommendations,
  });
}
