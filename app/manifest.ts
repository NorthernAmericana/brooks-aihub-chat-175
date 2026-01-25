import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Brooks AI HUB",
    short_name: "Brooks AI HUB",
    description: "Brooks AI HUB assistant experience.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "2048x2048",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "2048x2048",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "2048x2048",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "2048x2048",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/app-icon.png",
        sizes: "2048x2048",
        type: "image/png",
      },
      {
        src: "/brand/brooks-ai-hub-logo.png",
        sizes: "2816x1536",
        type: "image/png",
      },
    ],
  };
}
