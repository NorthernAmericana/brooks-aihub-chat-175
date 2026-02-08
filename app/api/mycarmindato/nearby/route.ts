import { readFile } from "node:fs/promises";
import path from "node:path";

type BusinessEntry = {
  name?: string;
  location?: {
    city?: string;
    state?: string;
    area?: string;
    neighborhood?: string;
  };
  description?: string;
  google_maps_url?: string;
};

type CityRecord = {
  city?: string;
  business_directory?: Record<string, BusinessEntry[]>;
};

type BusinessListing = {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  location?: {
    city?: string | null;
    state?: string | null;
    area?: string | null;
    neighborhood?: string | null;
    address?: string | null;
  } | null;
  googleMapsUrl?: string | null;
  source: "business-directory" | "google-places";
};

type GooglePlacesResult = {
  place_id: string;
  name?: string;
  vicinity?: string;
  types?: string[];
};

const CITIES_FILE_PATH = path.join(
  process.cwd(),
  "data",
  "mycarmindato",
  "season-1-cities.json"
);

let cachedBusinessListings: BusinessListing[] | null = null;

const normalizeId = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const normalizeQuery = (value: string | null) => value?.trim().toLowerCase();

const parseCityState = (city: string) => {
  const parts = city.split(",").map((part) => part.trim());
  if (parts.length === 1) {
    return { cityName: city.trim(), stateName: "" };
  }
  const stateToken = parts.pop() ?? "";
  const cityName = parts.join(", ").trim() || city.trim();
  return { cityName, stateName: stateToken };
};

const formatCategoryLabel = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const loadBusinessDirectory = async (): Promise<BusinessListing[]> => {
  if (cachedBusinessListings) {
    return cachedBusinessListings;
  }

  const fileContents = await readFile(CITIES_FILE_PATH, "utf8");
  const parsed = JSON.parse(fileContents) as CityRecord[];
  const listings: BusinessListing[] = [];

  parsed.forEach((cityRecord) => {
    const cityLabel = cityRecord.city?.trim() ?? "";
    const { cityName, stateName } = parseCityState(cityLabel);
    const directory = cityRecord.business_directory ?? {};

    Object.entries(directory).forEach(([category, entries]) => {
      if (!Array.isArray(entries)) {
        return;
      }

      const categoryLabel = formatCategoryLabel(category);

      entries.forEach((entry, index) => {
        if (!entry.name) {
          return;
        }

        const location = entry.location ?? {};
        const resolvedCity = location.city ?? cityName;
        const resolvedState = location.state ?? stateName;
        const idBase = `${resolvedCity}-${category}-${entry.name}-${index}`;

        listings.push({
          id: normalizeId(idBase),
          name: entry.name,
          category: categoryLabel,
          description: entry.description ?? null,
          location: {
            city: resolvedCity || null,
            state: resolvedState || null,
            area: location.area ?? null,
            neighborhood: location.neighborhood ?? null,
          },
          googleMapsUrl: entry.google_maps_url ?? null,
          source: "business-directory",
        });
      });
    });
  });

  cachedBusinessListings = listings;
  return listings;
};

const fetchGooglePlaces = async ({
  latitude,
  longitude,
  keyword,
  limit,
}: {
  latitude: number;
  longitude: number;
  keyword?: string;
  limit: number;
}): Promise<BusinessListing[]> => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return [];
  }

  const params = new URLSearchParams({
    location: `${latitude},${longitude}`,
    radius: "15000",
    key: apiKey,
  });

  if (keyword) {
    params.set("keyword", keyword);
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`
  );

  if (!response.ok) {
    throw new Error("Failed to reach Google Places.");
  }

  const data = (await response.json()) as { results?: GooglePlacesResult[] };
  const results = data.results ?? [];

  return results.slice(0, limit).map((result) => ({
    id: result.place_id,
    name: result.name ?? "Unknown place",
    category:
      result.types?.[0]
        ?.replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase()) ?? "Local spot",
    description: null,
    location: {
      address: result.vicinity ?? null,
    },
    googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${result.place_id}`,
    source: "google-places",
  }));
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = normalizeQuery(searchParams.get("text")) ?? "";
  const query = normalizeQuery(searchParams.get("query")) ?? "";
  const limit = Number(searchParams.get("limit") ?? "12");
  const safeLimit = Number.isFinite(limit)
    ? Math.min(Math.max(limit, 1), 24)
    : 12;

  const latitude = searchParams.get("lat");
  const longitude = searchParams.get("lng");

  if (latitude && longitude) {
    const parsedLat = Number(latitude);
    const parsedLng = Number(longitude);

    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
      return Response.json(
        { error: "Invalid latitude or longitude." },
        { status: 400 }
      );
    }

    if (process.env.GOOGLE_PLACES_API_KEY) {
      try {
        const googleResults = await fetchGooglePlaces({
          latitude: parsedLat,
          longitude: parsedLng,
          keyword: query || undefined,
          limit: safeLimit,
        });
        return Response.json({
          source: "google-places",
          results: googleResults,
        });
      } catch (error) {
        return Response.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Unable to fetch Google Places.",
          },
          { status: 502 }
        );
      }
    }
  }

  const listings = await loadBusinessDirectory();
  const filtered = listings.filter((listing) => {
    const locationText = [
      listing.location?.city,
      listing.location?.state,
      listing.location?.area,
      listing.location?.neighborhood,
    ]
      .filter((value) => value && value.trim())
      .join(" ")
      .toLowerCase();
    const queryText = [listing.name, listing.category, listing.description]
      .filter((value) => value && value.trim())
      .join(" ")
      .toLowerCase();

    const matchesLocation = text ? locationText.includes(text) : true;
    const matchesQuery = query ? queryText.includes(query) : true;

    return matchesLocation && matchesQuery;
  });

  return Response.json({
    source: "business-directory",
    results: filtered.slice(0, safeLimit),
  });
}
