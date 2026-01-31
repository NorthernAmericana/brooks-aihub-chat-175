import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "brooksaihub.app" }],
        destination: "https://www.brooksaihub.app/:path*",
        permanent: true,
      },
      {
        source: "/Brooks AI HUB",
        destination: "/brooks-ai-hub/",
        permanent: false,
      },
      {
        source: "/Brooks AI HUB/",
        destination: "/brooks-ai-hub/",
        permanent: false,
      },
      {
        source: "/Brooks%20AI%20HUB",
        destination: "/brooks-ai-hub/",
        permanent: false,
      },
      {
        source: "/Brooks%20AI%20HUB/",
        destination: "/brooks-ai-hub/",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:; manifest-src 'self'; worker-src 'self' blob:;",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        hostname: "avatar.vercel.sh",
      },
      {
        protocol: "https",
        //https://nextjs.org/docs/messages/next-image-unconfigured-host
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net",
      },
    ],
  },
};

export default nextConfig;
