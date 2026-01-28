import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
