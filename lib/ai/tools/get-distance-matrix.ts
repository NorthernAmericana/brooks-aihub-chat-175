import { tool } from "ai";
import { z } from "zod";

const getGoogleMapsApiKey = () =>
  typeof process !== "undefined" ? process.env.GOOGLE_MAPS_API_KEY : undefined;

const toPipeList = (values: string[]) => values.join("|");

export const getDistanceMatrix = tool({
  description:
    "Get distance and travel time between origins and destinations using Google Maps Distance Matrix API. Returns a canonical Google Maps URL for the first origin/destination pair.",
  inputSchema: z.object({
    origins: z
      .array(z.string())
      .min(1)
      .describe("List of origin addresses or place names"),
    destinations: z
      .array(z.string())
      .min(1)
      .describe("List of destination addresses or place names"),
    mode: z
      .enum(["driving", "walking", "bicycling", "transit"])
      .optional(),
    departureTime: z
      .string()
      .optional()
      .describe("Departure time as 'now' or RFC3339 timestamp"),
  }),
  needsApproval: true,
  execute: async ({ origins, destinations, mode, departureTime }) => {
    const googleMapsApiKey = getGoogleMapsApiKey();
    if (!googleMapsApiKey) {
      return { error: "Missing GOOGLE_MAPS_API_KEY environment variable." };
    }

    const params = new URLSearchParams({
      origins: toPipeList(origins),
      destinations: toPipeList(destinations),
      key: googleMapsApiKey,
    });

    if (mode) {
      params.set("mode", mode);
    }

    if (departureTime) {
      params.set("departure_time", departureTime === "now" ? "now" : departureTime);
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`
    );

    if (!response.ok) {
      return { error: "Google Maps Distance Matrix API request failed." };
    }

    const data = await response.json();

    if (data.status !== "OK") {
      return { error: data.error_message ?? "Distance matrix failed.", status: data.status };
    }

    const rows = (data.rows ?? []).map((row: any) => ({
      elements: (row.elements ?? []).map((element: any) => ({
        status: element.status,
        distanceMeters: element.distance?.value,
        durationSeconds: element.duration?.value,
        durationInTrafficSeconds: element.duration_in_traffic?.value,
      })),
    }));

    const [firstOrigin] = origins;
    const [firstDestination] = destinations;
    const urlParams = new URLSearchParams({
      api: "1",
      origin: firstOrigin,
      destination: firstDestination,
    });
    if (mode) {
      urlParams.set("travelmode", mode);
    }

    return {
      origins,
      destinations,
      mode: mode ?? "driving",
      departureTime: departureTime ?? null,
      googleMapsUrl: `https://www.google.com/maps/dir/?${urlParams.toString()}`,
      rows,
      originAddresses: data.origin_addresses,
      destinationAddresses: data.destination_addresses,
      status: data.status,
    };
  },
});
