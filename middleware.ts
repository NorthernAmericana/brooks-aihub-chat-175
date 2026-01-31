import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_HOST = "www.brooksaihub.app";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

function isLocalHost(hostname: string) {
  return (
    LOCAL_HOSTNAMES.has(hostname) ||
    hostname.startsWith("localhost:") ||
    hostname.startsWith("127.0.0.1:") ||
    hostname.startsWith("0.0.0.0:")
  );
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host");

  if (!host) {
    return NextResponse.next();
  }

  if (host === CANONICAL_HOST || isLocalHost(host)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.host = CANONICAL_HOST;

  return NextResponse.redirect(url, 301);
}

export const config = {
  matcher: "/:path*",
};
