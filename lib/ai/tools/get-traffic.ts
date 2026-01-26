import { tool } from "ai";
import { z } from "zod";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export const getTraffic = tool({
  description:
    "Get current traffic-aware travel times between two points using Google Maps Distance Matrix API. Returns a canonical Google Maps URL.",
  inputSchema: z.object({
    origin: z.string().describe("Starting point address or place name"),
    destination: z.string().describe("Destination address or place name"),
    trafficModel: z
      .enum(["best_guess", "pessimistic", "optimistic"])
      .optional(),
  }),
  needsApproval: true,
  execute: async ({ origin, destination, trafficModel }) => {
    if (!GOOGLE_MAPS_API_KEY) {
      return { error: "Missing GOOGLE_MAPS_API_KEY environment variable." };
    }

    const params = new URLSearchParams({
      origins: origin,
      destinations: destination,
      mode: "driving",
      departure_time: "now",
      key: GOOGLE_MAPS_API_KEY,
    });

    if (trafficModel) {
      params.set("traffic_model", trafficModel);
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`
    );

    if (!response.ok) {
      return { error: "Google Maps traffic request failed." };
    }

    const data = await response.json();

    if (data.status !== "OK") {
      return { error: data.error_message ?? "Traffic lookup failed.", status: data.status };
    }

    const element = data.rows?.[0]?.elements?.[0];

    return {
      origin,
      destination,
      trafficModel: trafficModel ?? "best_guess",
      distanceMeters: element?.distance?.value,
      durationSeconds: element?.duration?.value,
      durationInTrafficSeconds: element?.duration_in_traffic?.value,
      originAddress: data.origin_addresses?.[0],
      destinationAddress: data.destination_addresses?.[0],
      googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
        origin
      )}&destination=${encodeURIComponent(destination)}&travelmode=driving`,
      status: data.status,
    };
  },
});
