import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { resolveAuthSecret } from "@/lib/auth/secret";
import { guestRegex, isDevelopmentEnvironment } from "./lib/constants";
import {
  deriveCanonicalHost,
  evaluateRedirectRisk,
  getLoopCount,
  hasRedirectBypass,
  isNeverRedirectPath,
  isPublicPath,
  REDIRECT_LOOP_COOKIE,
  REDIRECT_LOOP_LIMIT,
} from "./lib/redirect-debug";

const ALLOWED_DEV_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export async function proxy(request: NextRequest) {
  const hostname = request.nextUrl.hostname;
  const pathname = request.nextUrl.pathname;
  const loopCount = getLoopCount(request);

  if (isNeverRedirectPath(pathname)) {
    return NextResponse.next();
  }

  if (hasRedirectBypass(request)) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[redirect-debug] bypass enabled", {
        pathname,
        host: hostname,
      });
    }
    return NextResponse.next();
  }

  if (loopCount >= REDIRECT_LOOP_LIMIT) {
    console.warn("[redirect-debug] loop guard triggered", {
      pathname,
      host: hostname,
      loopCount,
      subrequest: request.headers.get("x-middleware-subrequest"),
    });
    return NextResponse.next();
  }

  const redirectRisk = evaluateRedirectRisk(request);

  if (
    redirectRisk.wouldRedirect &&
    redirectRisk.reasons.some((reason) =>
      reason.startsWith("host-canonicalization:")
    ) &&
    !ALLOWED_DEV_HOSTS.has(hostname)
  ) {
    const url = request.nextUrl.clone();
    url.hostname = deriveCanonicalHost(request);
    url.protocol = "https:";
    url.port = "";

    const response = NextResponse.redirect(url, 301);
    response.cookies.set(REDIRECT_LOOP_COOKIE, String(loopCount + 1), {
      httpOnly: true,
      maxAge: 60,
      path: "/",
      sameSite: "lax",
      secure: !isDevelopmentEnvironment,
    });

    if (process.env.NODE_ENV !== "production") {
      console.info("[redirect-debug] host redirect", {
        from: request.url,
        to: url.toString(),
        reasons: redirectRisk.reasons,
      });
    }

    return response;
  }

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Allow unauthenticated access to public paths (e.g., landing page, pricing, tutorial)
  // This prevents redirect loops for crawlers and allows indexing
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: resolveAuthSecret(),
    secureCookie: !isDevelopmentEnvironment,
  });

  if (!token) {
    const redirectUrl = encodeURIComponent(request.url);

    const response = NextResponse.redirect(
      new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url)
    );
    response.cookies.set(REDIRECT_LOOP_COOKIE, String(loopCount + 1), {
      httpOnly: true,
      maxAge: 60,
      path: "/",
      sameSite: "lax",
      secure: !isDevelopmentEnvironment,
    });

    if (process.env.NODE_ENV !== "production") {
      console.info("[redirect-debug] auth redirect", {
        pathname,
        host: hostname,
      });
    }

    return response;
  }

  const isGuest = guestRegex.test(token?.email ?? "");

  if (token && !isGuest && ["/login", "/register"].includes(pathname)) {
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set(REDIRECT_LOOP_COOKIE, String(loopCount + 1), {
      httpOnly: true,
      maxAge: 60,
      path: "/",
      sameSite: "lax",
      secure: !isDevelopmentEnvironment,
    });
    return response;
  }

  const response = NextResponse.next();
  if (request.cookies.has(REDIRECT_LOOP_COOKIE)) {
    response.cookies.delete(REDIRECT_LOOP_COOKIE);
  }
  return response;
}

export const config = {
  matcher: [
    "/",
    "/chat/:id",
    "/api/:path*",
    "/login",
    "/register",

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
