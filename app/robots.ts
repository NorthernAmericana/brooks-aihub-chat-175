import type { MetadataRoute } from "next";
import { DEFAULT_CANONICAL_HOST } from "@/lib/redirect-debug";

export default function robots(): MetadataRoute.Robots {
  const origin = `https://${DEFAULT_CANONICAL_HOST}`;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
