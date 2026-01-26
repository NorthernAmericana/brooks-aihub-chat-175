import { tool } from "ai";
import { z } from "zod";

const getGoogleMapsApiKey = () =>
  typeof process !== "undefined" ? process.env.GOOGLE_MAPS_API_KEY : undefined;

const buildPlaceUrl = (query: string) => {
  const params = new URLSearchParams({ api: "1", query });
  return `https://www.google.com/maps/search/?${params.toString()}`;
};

export const searchPlaces = tool({
  description:
    "Search for places using Google Maps Places API. Returns structured place data and canonical Google Maps URLs.",
  inputSchema: z.object({
    query: z.string().describe("Search query, e.g. 'coffee near downtown'"),
    location: z
      .object({
        latitude: z.number(),
        longitude: z.number(),
      })
      .optional(),
    radiusMeters: z
      .number()
      .optional()
      .describe("Optional search radius in meters"),
  }),
  needsApproval: true,
  execute: async ({ query, location, radiusMeters }) => {
    const googleMapsApiKey = getGoogleMapsApiKey();
    if (!googleMapsApiKey) {
      return { error: "Missing GOOGLE_MAPS_API_KEY environment variable." };
    }

    const params = new URLSearchParams({
      query,
      key: googleMapsApiKey,
    });

    if (location) {
      params.set("location", `${location.latitude},${location.longitude}`);
    }

    if (radiusMeters) {
      params.set("radius", radiusMeters.toString());
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`
    );

    if (!response.ok) {
      return { error: "Google Maps Places API request failed." };
    }

    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return { error: data.error_message ?? "Places search failed.", status: data.status };
    }

    const places = (data.results ?? []).map((place: any) => ({
      name: place.name,
      address: place.formatted_address,
      placeId: place.place_id,
      location: place.geometry?.location,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      googleMapsUrl: place.place_id
        ? `https://www.google.com/maps/search/?api=1&query_place_id=${place.place_id}`
        : buildPlaceUrl(place.formatted_address ?? place.name),
    }));

    return {
      query,
      location,
      radiusMeters: radiusMeters ?? null,
      googleMapsUrl: buildPlaceUrl(query),
      places,
      status: data.status,
    };
  },
});
