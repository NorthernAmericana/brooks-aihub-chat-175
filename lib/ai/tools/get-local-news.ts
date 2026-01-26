import { tool } from "ai";
import { z } from "zod";

const getNewsApiKey = () =>
  typeof process !== "undefined" ? process.env.NEWS_API_KEY : undefined;

const resolveCityFromCoords = async (latitude: number, longitude: number) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
    {
      headers: {
        "User-Agent": "brooks-aihub-chat/1.0",
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const address = data.address ?? {};
  return (
    address.city ||
    address.town ||
    address.village ||
    address.county ||
    null
  );
};

export const getLocalNews = tool({
  description:
    "Fetch location-aware local news. Provide a city or coordinates; returns articles and a canonical Google Maps URL for the location.",
  inputSchema: z.object({
    city: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    topic: z
      .string()
      .optional()
      .describe("Optional topic such as 'weather', 'events', or 'traffic'."),
  }),
  needsApproval: true,
  execute: async ({ city, latitude, longitude, topic }) => {
    const newsApiKey = getNewsApiKey();
    if (!newsApiKey) {
      return { error: "Missing NEWS_API_KEY environment variable." };
    }

    let resolvedCity = city?.trim();

    if (!resolvedCity && latitude !== undefined && longitude !== undefined) {
      resolvedCity = await resolveCityFromCoords(latitude, longitude) ?? undefined;
    }

    if (!resolvedCity) {
      return {
        error: "Please provide a city or latitude/longitude coordinates.",
      };
    }

    const query = topic
      ? `${resolvedCity} ${topic}`
      : `${resolvedCity} local news`;

    const params = new URLSearchParams({
      apiKey: newsApiKey,
      q: query,
      language: "en",
      sortBy: "publishedAt",
      pageSize: "5",
    });

    const response = await fetch(
      `https://newsapi.org/v2/everything?${params.toString()}`
    );

    if (!response.ok) {
      return { error: "News API request failed." };
    }

    const data = await response.json();

    if (data.status !== "ok") {
      return { error: data.message ?? "News API returned an error." };
    }

    return {
      city: resolvedCity,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      topic: topic ?? "local news",
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        resolvedCity
      )}`,
      articles: (data.articles ?? []).map((article: any) => ({
        title: article.title,
        description: article.description,
        source: article.source?.name,
        url: article.url,
        publishedAt: article.publishedAt,
      })),
    };
  },
});
