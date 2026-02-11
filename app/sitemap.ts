import type { MetadataRoute } from "next";
import { DEFAULT_CANONICAL_HOST } from "@/lib/redirect-debug";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = `https://${DEFAULT_CANONICAL_HOST}`;

  return [
    {
      url: `${origin}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${origin}/brooks-ai-hub/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];
}
