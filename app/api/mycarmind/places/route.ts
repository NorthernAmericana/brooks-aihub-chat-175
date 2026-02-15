import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type PlaceRecord = {
  id: string;
  provider: "curated" | "google";
  name: string;
  category: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
  external_id?: string;
  slug?: string | null;
  description?: string | null;
  distance_miles?: number | null;
};

type CuratedRow = {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  category: string | null;
  lat: number | null;
  lng: number | null;
  external_id: string | null;
};

type GoogleTextSearchResult = {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  types?: string[];
  geometry?: {
    location?: {
      lat?: number;
      lng?: number;
    };
  };
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const distanceMiles = (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
) => {
  const earthRadiusMi = 3958.8;
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMi * c;
};

const normalizeName = (value: string) => value.trim().toLowerCase();

const parseNumberParam = (value: string | null) => {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
};

const parseLimit = (value: string | null) => {
  const parsed = Number(value ?? "50");
  if (!Number.isFinite(parsed)) {
    return 50;
  }
  return Math.min(Math.max(Math.floor(parsed), 1), 200);
};

const getRelevanceScore = (place: PlaceRecord, q: string | null) => {
  if (!q) {
    return 0;
  }

  const query = q.toLowerCase();
  let score = 0;

  if (place.name.toLowerCase().includes(query)) {
    score += 3;
  }
  if ((place.category ?? "").toLowerCase().includes(query)) {
    score += 2;
  }
  if ((place.address ?? "").toLowerCase().includes(query)) {
    score += 1;
  }
  if ((place.city ?? "").toLowerCase().includes(query)) {
    score += 1;
  }
  if ((place.state ?? "").toLowerCase().includes(query)) {
    score += 1;
  }

  return score;
};

const parseGoogleAddressLocation = (formattedAddress: string | null) => {
  if (!formattedAddress) {
    return {
      city: null,
      state: null,
    };
  }

  const tokens = formattedAddress
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  const city = tokens.at(-3) ?? null;
  const stateSegment = tokens.at(-2) ?? null;
  const stateMatch = stateSegment?.match(/\b([A-Z]{2})\b/);
  const state = stateMatch?.[1] ?? stateSegment ?? null;

  return {
    city,
    state,
  };
};

async function fetchGooglePlacesTextSearch({
  q,
  city,
  state,
  lat,
  lng,
  limit,
}: {
  q: string | null;
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
  limit: number;
}): Promise<PlaceRecord[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return [];
  }

  const queryParts = [q, city, state].filter((part): part is string =>
    Boolean(part?.trim())
  );

  if (queryParts.length === 0) {
    return [];
  }

  const params = new URLSearchParams({
    key: apiKey,
    query: queryParts.join(" "),
  });

  if (lat !== null && lng !== null) {
    params.set("location", `${lat},${lng}`);
    params.set("radius", "30000");
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    console.warn("[mycarmind/places] Google Places HTTP error", {
      httpStatus: response.status,
      httpStatusText: response.statusText,
    });
    return [];
  }

  const data = (await response.json()) as {
    status?: string;
    error_message?: string;
    results?: GoogleTextSearchResult[];
  };

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    console.warn("[mycarmind/places] Google Places API status error", {
      status: data.status,
      errorMessage: data.error_message,
    });
    return [];
  }

  const results = data.results ?? [];

  return results.slice(0, limit).map((result, index) => {
    const address = result.formatted_address ?? null;
    const location = parseGoogleAddressLocation(address);

    return {
      id: result.place_id
        ? `google:${result.place_id}`
        : `google:result-${index}`,
      provider: "google",
      name: result.name ?? "Unknown place",
      category:
        result.types?.[0]
          ?.replace(/_/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase()) ?? null,
      address,
      city: location.city,
      state: location.state,
      lat: result.geometry?.location?.lat ?? null,
      lng: result.geometry?.location?.lng ?? null,
      external_id: result.place_id,
      slug: null,
      description: null,
    };
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city")?.trim() || null;
  const state = searchParams.get("state")?.trim() || null;
  const q = searchParams.get("q")?.trim() || null;
  const lat = parseNumberParam(searchParams.get("lat"));
  const lng = parseNumberParam(searchParams.get("lng"));
  const limit = parseLimit(searchParams.get("limit"));

  const hasCoords = lat !== null && lng !== null;

  const curatedRows = await db.execute<CuratedRow>(sql`
    SELECT
      id,
      slug,
      name,
      description,
      city,
      state,
      address,
      category,
      lat,
      lng,
      metadata->>'external_id' AS external_id
    FROM mycarmind_places
    WHERE (${city}::text IS NULL OR city ILIKE ${city ?? ""})
      AND (${state}::text IS NULL OR state ILIKE ${state ?? ""})
      AND (
        ${q}::text IS NULL OR
        name ILIKE ${`%${q ?? ""}%`} OR
        address ILIKE ${`%${q ?? ""}%`} OR
        category ILIKE ${`%${q ?? ""}%`}
      )
    ORDER BY
      CASE WHEN ${q}::text IS NULL THEN 0 ELSE
        CASE
          WHEN name ILIKE ${`%${q ?? ""}%`} THEN 0
          WHEN category ILIKE ${`%${q ?? ""}%`} THEN 1
          WHEN address ILIKE ${`%${q ?? ""}%`} THEN 2
          ELSE 3
        END
      END,
      name ASC
    LIMIT ${limit};
  `);

  const curatedPlaces: PlaceRecord[] = curatedRows.map((row) => ({
    id: row.id,
    provider: "curated",
    name: row.name,
    category: row.category,
    address: row.address,
    city: row.city,
    state: row.state,
    lat: row.lat,
    lng: row.lng,
    external_id: row.external_id ?? undefined,
    slug: row.slug,
    description: row.description,
  }));

  const googlePlaces = await fetchGooglePlacesTextSearch({
    q,
    city,
    state,
    lat,
    lng,
    limit,
  });

  const merged: PlaceRecord[] = [];

  for (const place of [...curatedPlaces, ...googlePlaces]) {
    const placeName = normalizeName(place.name);
    const duplicate = merged.find((existing) => {
      if (
        place.external_id &&
        existing.external_id &&
        place.external_id === existing.external_id
      ) {
        return true;
      }

      if (normalizeName(existing.name) !== placeName) {
        return false;
      }

      if (
        place.lat !== null &&
        place.lng !== null &&
        existing.lat !== null &&
        existing.lng !== null
      ) {
        return (
          distanceMiles(place.lat, place.lng, existing.lat, existing.lng) <=
          0.12
        );
      }

      return false;
    });

    if (!duplicate) {
      merged.push(place);
    }
  }

  const placesWithDistance = merged.map((place, index) => {
    const distance =
      lat !== null && lng !== null && place.lat !== null && place.lng !== null
        ? distanceMiles(lat, lng, place.lat, place.lng)
        : null;

    return {
      place,
      index,
      distance,
      relevance: getRelevanceScore(place, q),
    };
  });

  if (hasCoords) {
    placesWithDistance.sort((a, b) => {
      if (a.distance === null && b.distance === null) {
        return a.index - b.index;
      }
      if (a.distance === null) {
        return 1;
      }
      if (b.distance === null) {
        return -1;
      }
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      return a.index - b.index;
    });
  } else {
    placesWithDistance.sort((a, b) => {
      if (b.relevance !== a.relevance) {
        return b.relevance - a.relevance;
      }
      const byName = a.place.name.localeCompare(b.place.name);
      if (byName !== 0) {
        return byName;
      }
      return a.index - b.index;
    });
  }

  return NextResponse.json({
    places: placesWithDistance.slice(0, limit).map(({ place, distance }) => ({
      ...place,
      distance_miles: distance,
    })),
  });
}
