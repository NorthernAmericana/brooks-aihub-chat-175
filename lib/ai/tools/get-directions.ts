import { tool } from "ai";
import { z } from "zod";

type DirectionsDuration = {
  text: string;
  value: number;
};

type DirectionsDistance = {
  text: string;
  value: number;
};

const directionsModeSchema = z.enum(["driving", "walking", "transit"]);

type DepartureTime = string | number;

const buildDepartureTime = (departureTime: DepartureTime): string | null => {
  if (typeof departureTime === "number") {
    return Number.isFinite(departureTime)
      ? Math.floor(departureTime).toString()
      : null;
  }

  const trimmed = departureTime.trim();
  if (trimmed.toLowerCase() === "now") {
    return "now";
  }

  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return Math.floor(parsed / 1000).toString();
};

export const getDirections = tool({
  description:
    "Get directions between two locations using the Google Maps Directions API.",
  inputSchema: z.object({
    origin: z
      .string()
      .describe("Starting location (address, place name, or lat,lng)."),
    destination: z
      .string()
      .describe("Ending location (address, place name, or lat,lng)."),
    mode: directionsModeSchema
      .optional()
      .describe("Travel mode: driving, walking, or transit."),
    departureTime: z
      .union([z.string(), z.number()])
      .optional()
      .describe(
        "Optional departure time as 'now', an ISO string, or a Unix timestamp (seconds)."
      ),
  }),
  needsApproval: true,
  execute: async ({ origin, destination, mode, departureTime }) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return {
        error: "Missing GOOGLE_MAPS_API_KEY environment variable.",
      };
    }

    const travelMode = mode ?? "driving";
    const params = new URLSearchParams({
      origin,
      destination,
      key: apiKey,
      mode: travelMode,
    });

    if (departureTime !== undefined) {
      const formattedDepartureTime = buildDepartureTime(departureTime);
      if (!formattedDepartureTime) {
        return {
          error:
            "Invalid departureTime. Use 'now', a valid ISO date string, or a Unix timestamp.",
        };
      }
      params.set("departure_time", formattedDepartureTime);
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`
    );

    if (!response.ok) {
      return {
        error: `Google Maps Directions API error: ${response.status} ${response.statusText}`,
      };
    }

    const data = (await response.json()) as {
      status?: string;
      error_message?: string;
      routes?: Array<{
        summary?: string;
        legs?: Array<{
          distance?: DirectionsDistance;
          duration?: DirectionsDuration;
          duration_in_traffic?: DirectionsDuration;
        }>;
      }>;
    };

    if (data.status && data.status !== "OK") {
      return {
        error: data.error_message
          ? `Google Maps Directions API error: ${data.error_message}`
          : `Google Maps Directions API status: ${data.status}`,
      };
    }

    const route = data.routes?.[0];
    const leg = route?.legs?.[0];

    if (!route || !leg || !leg.distance || !leg.duration) {
      return {
        error: "No route found for the provided origin and destination.",
      };
    }

    const duration =
      travelMode === "driving" &&
      departureTime !== undefined &&
      leg.duration_in_traffic
        ? leg.duration_in_traffic
        : leg.duration;

    const mapsUrlParams = new URLSearchParams({
      api: "1",
      origin,
      destination,
      travelmode: travelMode,
    });

    return {
      summary: route.summary || "Route",
      distance: leg.distance,
      duration,
      mapsUrl: `https://www.google.com/maps/dir/?${mapsUrlParams.toString()}`,
    };
  },
});
