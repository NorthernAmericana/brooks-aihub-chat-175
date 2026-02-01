import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable static page generation optimization for preview environments
  // to ensure fresh builds on every deployment
  generateBuildId: async () => {
    // Use timestamp + random string for preview builds to force fresh deployment
    return process.env.VERCEL_GIT_COMMIT_SHA || `build-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  },
  async redirects() {
    return [
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
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https: wss:; worker-src 'self'; manifest-src 'self';",
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
