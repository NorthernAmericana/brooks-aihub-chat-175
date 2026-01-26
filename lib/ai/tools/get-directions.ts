import { tool } from "ai";
import { z } from "zod";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const buildDirectionsUrl = (
  origin: string,
  destination: string,
  mode?: string
) => {
  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
  });

  if (mode) {
    params.set("travelmode", mode);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

export const getDirections = tool({
  description:
    "Get driving, walking, bicycling, or transit directions using Google Maps. Returns a canonical Google Maps URL.",
  inputSchema: z.object({
    origin: z.string().describe("Starting point address or place name"),
    destination: z.string().describe("Destination address or place name"),
    mode: z
      .enum(["driving", "walking", "bicycling", "transit"])
      .optional(),
    departureTime: z
      .string()
      .optional()
      .describe(
        "Departure time as 'now' or an RFC3339 timestamp for traffic-aware routes"
      ),
  }),
  needsApproval: true,
  execute: async ({ origin, destination, mode, departureTime }) => {
    if (!GOOGLE_MAPS_API_KEY) {
      return { error: "Missing GOOGLE_MAPS_API_KEY environment variable." };
    }

    const params = new URLSearchParams({
      origin,
      destination,
      key: GOOGLE_MAPS_API_KEY,
    });

    if (mode) {
      params.set("mode", mode);
    }

    if (departureTime) {
      params.set("departure_time", departureTime === "now" ? "now" : departureTime);
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`
    );

    if (!response.ok) {
      return { error: "Google Maps Directions API request failed." };
    }

    const data = await response.json();

    if (data.status !== "OK") {
      return { error: data.error_message ?? "No route found.", status: data.status };
    }

    const routes = (data.routes ?? []).map((route: any) => {
      const leg = route.legs?.[0];
      return {
        summary: route.summary,
        distanceMeters: leg?.distance?.value,
        durationSeconds: leg?.duration?.value,
        durationInTrafficSeconds: leg?.duration_in_traffic?.value,
        startAddress: leg?.start_address,
        endAddress: leg?.end_address,
        steps:
          leg?.steps?.map((step: any) => ({
            instruction: step.html_instructions,
            distanceMeters: step.distance?.value,
            durationSeconds: step.duration?.value,
            travelMode: step.travel_mode,
          })) ?? [],
      };
    });

    return {
      origin,
      destination,
      mode: mode ?? "driving",
      departureTime: departureTime ?? null,
      googleMapsUrl: buildDirectionsUrl(origin, destination, mode),
      routes,
      status: data.status,
    };
  },
});
