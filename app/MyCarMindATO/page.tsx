"use client";

import {
  ArrowLeft,
  Compass,
  Home,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  Square,
  Star,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import useSWR from "swr";

import MapView from "@/components/mycarmindato/map-view";
import { useProfileIcon } from "@/hooks/use-profile-icon";
import { DEFAULT_AVATAR_SRC } from "@/lib/constants";
import type { RouteSuggestion } from "@/lib/routes/types";
import { normalizeRouteKey } from "@/lib/routes/utils";
import { fetcher } from "@/lib/utils";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";

type TownSummary = {
  id: string;
  city: string;
  cityName: string;
  stateName: string;
  subAreas: string[];
  vibes: string[];
  anchors: string[];
  communityVibe?: string;
};

type TownGroup = {
  stateName: string;
  towns: TownSummary[];
};

type TownResponse = {
  count: number;
  towns: TownSummary[];
  groupedTowns: TownGroup[];
};

type Challenge = {
  id: string;
  title: string;
  missionText: string;
  rotationCadenceDays: number;
};

type ChallengeResponse = {
  challenges: Challenge[];
  generatedAt: string;
};

type RoutesResponse = {
  routes: RouteSuggestion[];
};

type HomeLocation = {
  rawText: string;
  normalizedText?: string | null;
  updatedAt?: string | null;
};

type CurrentLocation = {
  lat: number;
  lng: number;
  label?: string | null;
  accuracy?: number | null;
  updatedAt?: string | null;
};

type NearbyBusiness = {
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
  source?: string | null;
};

const MAP_PIN_POSITIONS = [
  "top-8 left-12",
  "top-16 right-16",
  "bottom-16 left-20",
  "bottom-20 right-24",
  "top-24 left-1/2",
] as const;

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];
const COMPLETED_CHALLENGE_STORAGE_KEY =
  "mycarmindato.completedChallenges.v1";
const COMPLETED_CHALLENGE_RETENTION_DAYS = 21;

const normalizeQueryValue = (value: string) => value.trim().toLowerCase();

const truncateText = (text: string, maxLength = 140) =>
  text.length > maxLength ? `${text.slice(0, maxLength - 1).trim()}...` : text;

const buildMapSearchUrl = (query: string) =>
  `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`;

const buildGoogleReviewUrl = (placeId: string) =>
  `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;

const formatLocationLabel = (location?: NearbyBusiness["location"]) => {
  if (!location) {
    return "";
  }
  return [
    location.neighborhood,
    location.area,
    location.city,
    location.state,
    location.address,
  ]
    .filter((value) => value && value.trim())
    .join(", ");
};

export default function MyCarMindATOPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { profileIcon } = useProfileIcon();
  const { data: routeData } = useSWR<RoutesResponse>("/api/routes", fetcher);
  const [searchQuery, setSearchQuery] = useState("");
  const [towns, setTowns] = useState<TownSummary[]>([]);
  const [townGroups, setTownGroups] = useState<TownGroup[]>([]);
  const [selectedTownId, setSelectedTownId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isMapOnly, setIsMapOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<"map" | "dictionary">("map");
  const [homeLocation, setHomeLocation] = useState<HomeLocation | null>(null);
  const [homeLocationError, setHomeLocationError] = useState<string | null>(
    null
  );
  const [homeLocationLoaded, setHomeLocationLoaded] = useState(false);
  const [homeLocationDraft, setHomeLocationDraft] = useState<{
    rawText: string;
    normalizedText?: string | null;
  } | null>(null);
  const [homeLocationInput, setHomeLocationInput] = useState("");
  const [homeLocationSaving, setHomeLocationSaving] = useState(false);
  const [homeLocationSaveError, setHomeLocationSaveError] = useState<
    string | null
  >(null);
  const [homeLocationSaveSuccess, setHomeLocationSaveSuccess] = useState<
    string | null
  >(null);
  const [googleMapsReady, setGoogleMapsReady] = useState(false);
  const homeLocationInputRef = useRef<HTMLInputElement | null>(null);
  const homeLocationAutocompleteRef = useRef<any>(null);
  const [currentLocation, setCurrentLocation] =
    useState<CurrentLocation | null>(null);
  const [locationPermissionOpen, setLocationPermissionOpen] = useState(false);
  const [locationPermissionError, setLocationPermissionError] = useState<
    string | null
  >(null);
  const [locationRequesting, setLocationRequesting] = useState(false);
  const [nearbyQuery, setNearbyQuery] = useState("");
  const [nearbyResults, setNearbyResults] = useState<NearbyBusiness[]>([]);
  const [nearbySource, setNearbySource] = useState<string | null>(null);
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<NearbyBusiness | null>(
    null
  );
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoSuccess, setPhotoSuccess] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [challengeUpdatedAt, setChallengeUpdatedAt] = useState<string | null>(
    null
  );
  const [completedChallenges, setCompletedChallenges] = useState<
    { id: string; completedAt: string }[]
  >([]);
  const [completedChallengesLoaded, setCompletedChallengesLoaded] =
    useState(false);

  const routeCards = useMemo(() => {
    const desiredOrder = [
      "MyCarMindATO",
      "MyCarMindATO/Driver",
      "MyCarMindATO/Trucker",
      "MyCarMindATO/DeliveryDriver",
      "MyCarMindATO/Traveler",
    ];
    const routeByKey = new Map(
      (routeData?.routes ?? [])
        .filter((route) => route.kind === "official")
        .map((route) => [normalizeRouteKey(route.slash), route])
    );
    const labelOverrides: Record<string, string> = {};

    return desiredOrder
      .map((slash) => {
        const route = routeByKey.get(normalizeRouteKey(slash));
        if (!route) {
          return null;
        }
        const label = labelOverrides[route.slash] ?? route.label;
        return {
          label,
          route: route.route,
          slash: route.slash,
        };
      })
      .filter(
        (
          card
        ): card is {
          label: string;
          route: string;
          slash: string;
        } => Boolean(card)
      );
  }, [routeData]);

  const avatarSrc = profileIcon ?? session?.user?.image ?? DEFAULT_AVATAR_SRC;

  useEffect(() => {
    const controller = new AbortController();

    const loadTowns = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await fetch("/api/mycarmindato/towns", {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Failed to load towns.");
        }
        const data = (await response.json()) as TownResponse;
        setTowns(data.towns);
        setTownGroups(data.groupedTowns);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setLoadError(
          error instanceof Error ? error.message : "Unable to load towns."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadTowns();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem(COMPLETED_CHALLENGE_STORAGE_KEY)
        : null;
    if (!stored) {
      setCompletedChallengesLoaded(true);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as { id: string; completedAt: string }[];
      if (Array.isArray(parsed)) {
        setCompletedChallenges(parsed);
      }
    } catch {
      setCompletedChallenges([]);
    } finally {
      setCompletedChallengesLoaded(true);
    }
  }, []);

  const recentCompletedChallenges = useMemo(() => {
    const cutoff = Date.now() - COMPLETED_CHALLENGE_RETENTION_DAYS * 86400000;
    return completedChallenges.filter((entry) => {
      const completedAt = Date.parse(entry.completedAt);
      return Number.isFinite(completedAt) && completedAt >= cutoff;
    });
  }, [completedChallenges]);

  const saveCompletedChallenges = (next: { id: string; completedAt: string }[]) => {
    setCompletedChallenges(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        COMPLETED_CHALLENGE_STORAGE_KEY,
        JSON.stringify(next)
      );
    }
  };

  const loadChallenges = useCallback(
    async ({
      randomize = false,
      excludeIds,
    }: {
      randomize?: boolean;
      excludeIds?: string[];
    } = {}) => {
      setChallengeLoading(true);
      setChallengeError(null);
      try {
        const excluded =
          excludeIds ?? recentCompletedChallenges.map((entry) => entry.id);
        const params = new URLSearchParams({
          count: "3",
          exclude: excluded.join(","),
          random: randomize ? "1" : "0",
        });
        const response = await fetch(
          `/api/mycarmindato/challenges?${params.toString()}`
        );
        if (!response.ok) {
          throw new Error("Unable to load challenges.");
        }
        const data = (await response.json()) as ChallengeResponse;
        setChallenges(data.challenges);
        setChallengeUpdatedAt(data.generatedAt);
      } catch (error) {
        setChallengeError(
          error instanceof Error ? error.message : "Unable to load challenges."
        );
      } finally {
        setChallengeLoading(false);
      }
    },
    [recentCompletedChallenges]
  );

  useEffect(() => {
    if (!completedChallengesLoaded) {
      return;
    }
    void loadChallenges();
  }, [completedChallengesLoaded, loadChallenges]);

  const handleChallengeComplete = (challengeId: string) => {
    const now = new Date().toISOString();
    const next = [
      ...recentCompletedChallenges.filter((entry) => entry.id !== challengeId),
      { id: challengeId, completedAt: now },
    ];
    saveCompletedChallenges(next);
    
    // Navigate to agent with mission completion context
    const completedIds = next.map(c => c.id).join(", ");
    const prompt = `/MyCarMindATO/ I completed mission ${challengeId}. Recent missions: ${completedIds}. What's next?`;
    router.push(`/brooks-ai-hub?query=${encodeURIComponent(prompt)}`);
    
    void loadChallenges({
      randomize: true,
      excludeIds: next.map((entry) => entry.id),
    });
  };

  const completedChallengeIds = useMemo(
    () => new Set(recentCompletedChallenges.map((entry) => entry.id)),
    [recentCompletedChallenges]
  );

  useEffect(() => {
    let isActive = true;

    const loadHomeLocation = async () => {
      setHomeLocationError(null);
      setHomeLocationLoaded(false);

      try {
        const response = await fetch("/api/mycarmindato/home-location");
        if (!response.ok) {
          throw new Error("Unable to load home location.");
        }
        const data = (await response.json()) as {
          homeLocation: HomeLocation | null;
        };
        if (isActive) {
          setHomeLocation(data.homeLocation);
        }
      } catch (error) {
        if (isActive) {
          setHomeLocationError(
            error instanceof Error ? error.message : "Unable to load location."
          );
        }
      } finally {
        if (isActive) {
          setHomeLocationLoaded(true);
        }
      }
    };

    void loadHomeLocation();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (homeLocation) {
      setHomeLocationInput(
        homeLocation.normalizedText || homeLocation.rawText || ""
      );
    }
  }, [homeLocation]);

  const filteredTowns = useMemo(() => {
    const normalizedQuery = normalizeQueryValue(searchQuery);
    if (!normalizedQuery) {
      return towns.slice(0, 10);
    }

    return towns
      .filter((town) => {
        const haystack = [
          town.city,
          town.cityName,
          town.stateName,
          ...town.subAreas,
          ...town.vibes,
          ...town.anchors,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .slice(0, 12);
  }, [searchQuery, towns]);

  const filteredTownGroups = useMemo(() => {
    const normalizedQuery = normalizeQueryValue(searchQuery);
    if (!normalizedQuery) {
      return townGroups;
    }

    return townGroups
      .map((group) => {
        const matchingTowns = group.towns.filter((town) => {
          const haystack = [
            town.city,
            town.cityName,
            town.stateName,
            ...town.subAreas,
            ...town.vibes,
            ...town.anchors,
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(normalizedQuery);
        });
        return matchingTowns.length > 0
          ? { ...group, towns: matchingTowns }
          : null;
      })
      .filter((group): group is TownGroup => Boolean(group));
  }, [searchQuery, townGroups]);

  const selectedTown = useMemo(
    () => towns.find((town) => town.id === selectedTownId),
    [selectedTownId, towns]
  );

  const pinnedTowns = useMemo(
    () => filteredTowns.slice(0, MAP_PIN_POSITIONS.length),
    [filteredTowns]
  );

  const handleAskAgent = (destination?: string) => {
    const queryText = destination?.trim() || searchQuery.trim();
    if (!queryText) {
      router.push("/brooks-ai-hub");
      return;
    }
    
    // Build enhanced prompt with context
    let prompt = `/MyCarMindATO/ Plan a route to ${queryText}`;
    
    // Add home location context if available
    if (selectedLocationText) {
      prompt += ` from ${selectedLocationText}`;
    }
    
    // Add current location context if available
    if (currentLocation) {
      const locationStr = currentLocation.label || 
        `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`;
      prompt += ` (currently at ${locationStr})`;
    }
    
    // Add mission progress context if available
    if (recentCompletedChallenges.length > 0) {
      const completedIds = recentCompletedChallenges.map(c => c.id).join(", ");
      prompt += `. Recently completed missions: ${completedIds}`;
    }
    
    router.push(`/brooks-ai-hub?query=${encodeURIComponent(prompt)}`);
  };

  const handleTownSelect = (town: TownSummary) => {
    setSelectedTownId(town.id);
    setSearchQuery(town.city);
  };

  const selectedLocationText =
    homeLocation?.normalizedText || homeLocation?.rawText || "";
  const selectedLocationLabel = currentLocation
    ? currentLocation.label ||
      `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
    : selectedLocationText;

  const mapQuery = selectedTown?.city || searchQuery.trim() || "United States";
  const mapSearchUrl = buildMapSearchUrl(mapQuery);

  const handleTabChange = (tab: "map" | "dictionary") => {
    setActiveTab(tab);
    if (tab !== "map") {
      setIsMapOnly(false);
    }
  };

  const handleRouteCardClick = (route: string) => {
    if (route === "/Brooks AI HUB/") {
      router.push("/brooks-ai-hub");
      return;
    }
    
    // Build enhanced route with context
    let enhancedRoute = route;
    
    // Add location context to the route query
    const contextParts: string[] = [];
    
    if (selectedLocationText) {
      contextParts.push(`Home: ${selectedLocationText}`);
    }
    
    if (currentLocation) {
      const locationStr = currentLocation.label || 
        `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`;
      contextParts.push(`Current location: ${locationStr}`);
    }
    
    if (selectedTown) {
      contextParts.push(`Selected destination: ${selectedTown.city}`);
    }
    
    if (contextParts.length > 0) {
      enhancedRoute += ` [${contextParts.join(", ")}]`;
    }
    
    router.push(`/brooks-ai-hub?query=${encodeURIComponent(enhancedRoute)}`);
  };

  const handleSyncWithAgent = () => {
    // Build comprehensive sync prompt with all travel stats
    const syncParts: string[] = ["/MyCarMindATO/ Here's my current travel status:"];
    
    if (selectedLocationText) {
      syncParts.push(`Home base: ${selectedLocationText}`);
    }
    
    if (currentLocation) {
      const locationStr = currentLocation.label || 
        `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`;
      syncParts.push(`Current location: ${locationStr}`);
    }
    
    if (selectedTown) {
      syncParts.push(`Exploring: ${selectedTown.city}, ${selectedTown.stateName}`);
      if (selectedTown.communityVibe) {
        syncParts.push(`Vibe: ${selectedTown.communityVibe}`);
      }
    }
    
    if (recentCompletedChallenges.length > 0) {
      const missionCount = recentCompletedChallenges.length;
      const completedIds = recentCompletedChallenges.map(c => c.id).slice(0, 3).join(", ");
      syncParts.push(`Completed ${missionCount} missions recently: ${completedIds}`);
    }
    
    if (nearbyResults.length > 0) {
      syncParts.push(`Found ${nearbyResults.length} nearby spots`);
    }
    
    syncParts.push("What do you recommend?");
    
    const prompt = syncParts.join(". ");
    router.push(`/brooks-ai-hub?query=${encodeURIComponent(prompt)}`);
  };

  const handleNearbySearch = async (townCity: string) => {
    setNearbyQuery(townCity);
    setNearbyLoading(true);
    setNearbyError(null);

    try {
      const params = new URLSearchParams();
      params.set("location", townCity);
      params.set("limit", "10");

      const response = await fetch(
        `/api/mycarmindato/nearby?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("Unable to find nearby spots.");
      }
      const data = (await response.json()) as {
        businesses: NearbyBusiness[];
        source?: string;
      };
      setNearbyResults(data.businesses);
      setNearbySource(data.source ?? null);
    } catch (error) {
      setNearbyError(
        error instanceof Error ? error.message : "Unable to search nearby."
      );
    } finally {
      setNearbyLoading(false);
    }
  };

  const handleFindLocalSpots = async () => {
    if (!selectedLocationText && !currentLocation) {
      setNearbyError("Set a home location or enable current location.");
      return;
    }

    setNearbyLoading(true);
    setNearbyError(null);

    try {
      const params = new URLSearchParams();
      if (currentLocation) {
        params.set("lat", currentLocation.lat.toString());
        params.set("lng", currentLocation.lng.toString());
      } else {
        params.set("text", selectedLocationText);
      }
      if (nearbyQuery.trim()) {
        params.set("query", nearbyQuery.trim());
      }
      const response = await fetch(`/api/mycarmindato/nearby?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch nearby spots.");
      }
      const data = (await response.json()) as {
        source?: string | null;
        results: NearbyBusiness[];
      };
      setNearbyResults(data.results);
      setNearbySource(data.source ?? null);
    } catch (error) {
      setNearbyError(
        error instanceof Error ? error.message : "Unable to load nearby spots."
      );
      setNearbyResults([]);
      setNearbySource(null);
    } finally {
      setNearbyLoading(false);
    }
  };

  const buildReviewPrompt = (business: NearbyBusiness) => {
    const locationLabel = formatLocationLabel(business.location || undefined);
    return `/MyCarMindATO/ Review ${business.name}${
      locationLabel ? ` in ${locationLabel}` : ""
    }`;
  };

  const handlePlaceSelect = (business: NearbyBusiness) => {
    setSelectedPlace(business);
    setReviewId(null);
    setReviewText("");
    setPhotoFiles([]);
    setReviewError(null);
    setReviewSuccess(null);
    setPhotoError(null);
    setPhotoSuccess(null);
  };

  const handleReviewSubmit = async () => {
    if (!selectedPlace) {
      setReviewError("Select a place to review.");
      return;
    }

    if (!reviewText.trim()) {
      setReviewError("Write a short review before submitting.");
      return;
    }

    setReviewSubmitting(true);
    setReviewError(null);
    setReviewSuccess(null);

    try {
      const response = await fetch("/api/mycarmindato/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId: selectedPlace.id,
          placeName: selectedPlace.name,
          placeSource: selectedPlace.source,
          googleMapsUrl: selectedPlace.googleMapsUrl,
          rating: reviewRating,
          reviewText: reviewText.trim(),
        }),
      });

      const data = (await response.json()) as {
        review?: { id: string };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Unable to submit review.");
      }

      setReviewSuccess("Review saved. Thank you!");
      setReviewText("");
      setReviewId(data.review?.id ?? null);
      setShowReviewModal(true);
    } catch (error) {
      setReviewError(
        error instanceof Error ? error.message : "Unable to submit review."
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handlePhotoFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const invalidFiles = files.filter(
      (file) =>
        file.size > MAX_PHOTO_SIZE || !ALLOWED_PHOTO_TYPES.includes(file.type)
    );

    if (invalidFiles.length > 0) {
      setPhotoError(
        "Photos must be JPG, PNG, WEBP, or HEIC and under 5MB each."
      );
    } else {
      setPhotoError(null);
    }

    setPhotoFiles(
      files.filter(
        (file) =>
          file.size <= MAX_PHOTO_SIZE &&
          ALLOWED_PHOTO_TYPES.includes(file.type)
      )
    );
  };

  const handlePhotoSubmit = async () => {
    if (!selectedPlace) {
      setPhotoError("Select a place before uploading photos.");
      return;
    }

    if (photoFiles.length === 0) {
      setPhotoError("Choose at least one photo to upload.");
      return;
    }

    setPhotoUploading(true);
    setPhotoError(null);
    setPhotoSuccess(null);

    try {
      await Promise.all(
        photoFiles.map(async (file) => {
          if (
            !ALLOWED_PHOTO_TYPES.includes(file.type) ||
            file.size > MAX_PHOTO_SIZE
          ) {
            throw new Error("Invalid file detected.");
          }

          const formData = new FormData();
          formData.append("file", file);
          formData.append("placeId", selectedPlace.id);
          formData.append("placeName", selectedPlace.name);
          if (reviewId) {
            formData.append("reviewId", reviewId);
          }

          const response = await fetch("/api/mycarmindato/reviews", {
            method: "PUT",
            body: formData,
          });

          const data = (await response.json()) as { error?: string };

          if (!response.ok) {
            throw new Error(data.error || "Upload failed.");
          }
        })
      );

      setPhotoSuccess("Photos uploaded successfully.");
      setPhotoFiles([]);
    } catch (error) {
      setPhotoError(
        error instanceof Error ? error.message : "Upload failed."
      );
    } finally {
      setPhotoUploading(false);
    }
  };

  const requestCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationPermissionError(
        "Geolocation is not supported in this browser."
      );
      return;
    }

    setLocationRequesting(true);
    setLocationPermissionError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        let label: string | null = null;

        if (googleMapsReady && (window as typeof window & { google?: any })) {
          const googleMaps = (window as typeof window & { google?: any }).google;
          if (googleMaps?.maps?.Geocoder) {
            const geocoder = new googleMaps.maps.Geocoder();
            label = await new Promise((resolve) => {
              geocoder.geocode(
                { location: { lat: latitude, lng: longitude } },
                (results: any, status: string) => {
                  if (status === "OK" && results?.length) {
                    resolve(results[0].formatted_address);
                  } else {
                    resolve(null);
                  }
                }
              );
            });
          }
        }

        setCurrentLocation({
          lat: latitude,
          lng: longitude,
          accuracy: Number.isFinite(accuracy) ? accuracy : null,
          label,
          updatedAt: new Date().toISOString(),
        });
        setLocationRequesting(false);
        setLocationPermissionOpen(false);
      },
      (error) => {
        setLocationPermissionError(
          error.message || "Unable to retrieve your location."
        );
        setLocationRequesting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [googleMapsReady]);

  const handleSaveHomeLocation = useCallback(async () => {
    if (!homeLocationDraft?.rawText) {
      setHomeLocationSaveError("Select a Google Maps location first.");
      return;
    }

    setHomeLocationSaving(true);
    setHomeLocationSaveError(null);
    setHomeLocationSaveSuccess(null);

    try {
      const response = await fetch("/api/mycarmindato/home-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: homeLocationDraft.rawText,
          normalizedText: homeLocationDraft.normalizedText,
        }),
      });

      const data = (await response.json()) as {
        homeLocation?: HomeLocation;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Unable to save home location.");
      }

      if (data.homeLocation) {
        setHomeLocation(data.homeLocation);
        setHomeLocationSaveSuccess("Home location saved.");
        setHomeLocationDraft(null);
      }
    } catch (error) {
      setHomeLocationSaveError(
        error instanceof Error ? error.message : "Unable to save home location."
      );
    } finally {
      setHomeLocationSaving(false);
    }
  }, [homeLocationDraft]);

  useEffect(() => {
    if (!googleMapsReady || !homeLocationInputRef.current) {
      return;
    }

    if (homeLocationAutocompleteRef.current) {
      return;
    }

    const googleMaps = (window as typeof window & { google?: any }).google;
    if (!googleMaps?.maps?.places?.Autocomplete) {
      return;
    }

    homeLocationAutocompleteRef.current =
      new googleMaps.maps.places.Autocomplete(homeLocationInputRef.current, {
        fields: ["formatted_address", "name", "place_id"],
      });

    homeLocationAutocompleteRef.current.addListener("place_changed", () => {
      const place = homeLocationAutocompleteRef.current?.getPlace?.();
      const formatted =
        place?.formatted_address || place?.name || homeLocationInput.trim();
      if (!formatted) {
        return;
      }
      setHomeLocationInput(formatted);
      setHomeLocationDraft({
        rawText: formatted,
        normalizedText: place?.formatted_address ?? formatted,
      });
      setHomeLocationSaveError(null);
      setHomeLocationSaveSuccess(null);
    });
  }, [googleMapsReady, homeLocationInput]);

  return (
    <div className="app-page-overlay fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-[#0d1620] via-[#0f1c27] to-[#0b151d]">
      <div className="app-page-header sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-[#0b151d]/90 px-4 py-3 backdrop-blur-sm">
        <button
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
          onClick={() => router.back()}
          type="button"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white/10">
            <ImageWithFallback
              alt="MyCarMindATO icon"
              className="h-full w-full object-cover"
              containerClassName="size-full"
              height={36}
              src="/icons/mycarmindato-appicon.png"
              width={36}
            />
          </div>
          <div>
            <h1 className="font-pixel text-lg text-white">MyCarMindATO</h1>
            <p className="text-xs text-white/60">Live map experience</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "map" && (
            <button
              aria-pressed={isMapOnly}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
              onClick={() => setIsMapOnly((current) => !current)}
              type="button"
            >
              <Square className="h-4 w-4" />
              <span>{isMapOnly ? "Exit map only" : "Map only"}</span>
              <span className="sr-only">
                {isMapOnly
                  ? "Disable map only mode"
                  : "Enable map only mode to focus on the map"}
              </span>
            </button>
          )}
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
            <ImageWithFallback
              alt="Profile avatar"
              className="h-full w-full object-cover"
              containerClassName="size-full"
              height={40}
              src={avatarSrc}
              width={40}
            />
          </div>
        </div>
      </div>

      <div
        className={`app-page-content flex-1 ${
          isMapOnly && activeTab === "map"
            ? "flex flex-col overflow-hidden px-0 py-0"
            : "space-y-6 overflow-y-auto px-4 py-6"
        }`}
      >
        {!isMapOnly && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
              {(
                [
                  { key: "map", label: "Map" },
                  { key: "dictionary", label: "Location Dictionary" },
                ] as const
              ).map((tab) => (
                <button
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                    activeTab === tab.key
                      ? "bg-emerald-400 text-[#0b151d]"
                      : "text-white/70 hover:text-white"
                  }`}
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="text-xs text-white/50">
              {activeTab === "map"
                ? "Live map with pins and routing."
                : "Browse towns grouped by state."}
            </div>
          </div>
        )}

        {!isMapOnly && (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Brooks AI HUB Routes
                </p>
                <h2 className="text-xl font-semibold text-white">
                  Jump back into the main chat
                </h2>
                <p className="text-sm text-white/60">
                  Open an official ATO route in the Brooks AI HUB chat.
                </p>
              </div>
              <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/70">
                {routeCards.length} routes
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {routeCards.map((card) => (
                <button
                  className="group flex flex-col items-start gap-2 rounded-2xl border border-white/10 bg-[#0b151d]/60 p-4 text-left transition hover:border-emerald-300/40 hover:bg-[#0f1c27]"
                  key={card.route}
                  onClick={() => handleRouteCardClick(card.route)}
                  type="button"
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-white">
                      {card.label}
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.2em] text-white/50">
                      Route
                    </span>
                  </div>
                  <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                    {card.route}
                  </div>
                  <div className="text-xs text-white/60">
                    Launch in Brooks AI HUB chat
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {!isMapOnly && (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Personal memories
                </p>
                <h2 className="text-xl font-semibold text-white">
                  Review your MyCarMindATO memories
                </h2>
                <p className="text-sm text-white/60">
                  See your home location and saved vehicle for the
                  /MyCarMindATO/ route only.
                </p>
              </div>
              <button
                className="inline-flex items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-400/20 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/30"
                onClick={() => router.push("/MyCarMindATO/memories")}
                type="button"
              >
                Personal /MyCarMindATO/ Memories
              </button>
            </div>
          </section>
        )}

        {activeTab === "map" && (
          <section
            className={`rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm ${
              isMapOnly ? "flex h-full flex-col" : "p-5"
            }`}
          >
            {!isMapOnly && (
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                    Mapbox-style layout
                  </p>
                  <h2 className="text-xl font-semibold text-white">
                    Town discovery map
                  </h2>
                  <p className="text-sm text-white/60">
                    Explore destinations and route them to the MyCarMindATO
                    agent.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
                    onClick={handleSyncWithAgent}
                    type="button"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Sync with Agent
                  </button>
                  <button
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                    onClick={() => handleAskAgent(selectedTown?.city)}
                    type="button"
                  >
                    <Navigation className="h-4 w-4" />
                    Ask MyCarMindATO
                  </button>
                  <a
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                    href={mapSearchUrl}
                    rel="noopener"
                    target="_blank"
                  >
                    Open in maps
                  </a>
                </div>
              </div>
            )}

            <div className={isMapOnly ? "flex-1 p-4" : "mt-5"}>
              <div className="relative h-full min-h-[320px] overflow-hidden rounded-3xl border border-white/10 bg-[#0b1f2a] shadow-xl">
                <MapView
                  ariaLabel="MyCarMindATO map"
                  className="absolute inset-0 h-full w-full"
                  containerClassName="absolute inset-0"
                  query={mapQuery}
                  onReady={() => setGoogleMapsReady(true)}
                  pinnedTowns={pinnedTowns.map(t => ({
                    id: t.id,
                    city: t.city,
                    cityName: t.cityName,
                  }))}
                  homeLocation={selectedLocationText || null}
                  currentLocation={currentLocation}
                  isSyncing={isLoading}
                  isLiveTracking={!!currentLocation}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,15,24,0.1),rgba(5,15,24,0.75))] pointer-events-none" />

                <div className="absolute inset-0 z-10 p-6 pointer-events-none">
                  <div className="flex items-center justify-between text-white pointer-events-auto">
                    <div className={`rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70 flex items-center gap-2 ${currentLocation ? 'animate-pulse' : ''}`}>
                      {currentLocation && (
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                      )}
                      Live map
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Compass className="h-4 w-4" />
                      Towns indexed: {towns.length}
                    </div>
                  </div>

                  <div className="absolute inset-0">
                    {pinnedTowns.map((town, index) => {
                      const position = MAP_PIN_POSITIONS.at(index);
                      if (!position) {
                        return null;
                      }
                      return (
                        <button
                          aria-label={`Select ${town.city}`}
                          className={`absolute ${position} pointer-events-auto flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs text-white/90 shadow-lg backdrop-blur-sm transition hover:bg-black/70`}
                          key={town.id}
                          onClick={() => handleTownSelect(town)}
                          type="button"
                        >
                          <MapPin className="h-3 w-3 text-emerald-300" />
                          {town.cityName}
                        </button>
                      );
                    })}
                    {pinnedTowns.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-sm text-white/60">
                        {isLoading
                          ? "Loading towns..."
                          : "Town data is still syncing."}
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-black/50 p-4 text-white shadow-lg backdrop-blur-md pointer-events-auto">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                      Active destination
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-white">
                          {selectedTown?.city || "Select a town to preview"}
                        </p>
                        <p className="text-xs text-white/60">
                          {selectedTown?.communityVibe
                            ? truncateText(selectedTown.communityVibe, 120)
                            : "Search or tap a town pin to get started."}
                        </p>
                      </div>
                      <button
                        className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
                        onClick={() => handleAskAgent(selectedTown?.city)}
                        type="button"
                      >
                        Route
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "map" && !isMapOnly && (
          <>
            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Location settings
                  </h3>
                  <p className="text-sm text-white/60">
                    Save a Google Maps home base or use your current location.
                  </p>
                </div>
                <div className="text-xs text-white/50">
                  {homeLocationLoaded
                    ? homeLocation
                      ? "Home location ready."
                      : "No home location saved yet."
                    : "Loading home location..."}
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/50">
                    <span>Home location</span>
                    <span className="text-[0.65rem] normal-case text-white/60">
                      {homeLocation ? "Saved" : "Not set"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {homeLocation?.normalizedText ||
                      homeLocation?.rawText ||
                      "Pick a Google Maps location to save your home base."}
                  </p>
                  {homeLocation?.rawText &&
                    homeLocation.normalizedText &&
                    homeLocation.normalizedText !== homeLocation.rawText && (
                      <p className="mt-1 text-xs text-white/50">
                        Original: {homeLocation.rawText}
                      </p>
                    )}
                  {homeLocationError && (
                    <p className="mt-3 text-xs text-red-200">
                      {homeLocationError}
                    </p>
                  )}

                  <label
                    className="mt-4 block text-xs uppercase tracking-[0.2em] text-white/50"
                    htmlFor="home-location"
                  >
                    Set home on Google Maps
                  </label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
                    id="home-location"
                    onChange={(event) => {
                      setHomeLocationInput(event.target.value);
                      setHomeLocationDraft(null);
                      setHomeLocationSaveError(null);
                      setHomeLocationSaveSuccess(null);
                    }}
                    placeholder="Search an address or landmark"
                    ref={homeLocationInputRef}
                    type="text"
                    value={homeLocationInput}
                  />
                  {!googleMapsReady && (
                    <p className="mt-2 text-xs text-white/50">
                      Google Maps must load before you can save a location.
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={
                        homeLocationSaving ||
                        !homeLocationDraft ||
                        !googleMapsReady
                      }
                      onClick={handleSaveHomeLocation}
                      type="button"
                    >
                      <Home className="h-4 w-4" />
                      {homeLocationSaving ? "Saving..." : "Save home location"}
                    </button>
                    <span className="text-xs text-white/50">
                      Select a Google Maps result before saving.
                    </span>
                  </div>
                  {homeLocationSaveError && (
                    <p className="mt-3 text-xs text-red-200">
                      {homeLocationSaveError}
                    </p>
                  )}
                  {homeLocationSaveSuccess && (
                    <p className="mt-3 text-xs text-emerald-200">
                      {homeLocationSaveSuccess}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/50">
                    <span>Current location</span>
                    <span className="text-[0.65rem] normal-case text-white/60">
                      {currentLocation ? "Tracking enabled" : "Not enabled"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {currentLocation?.label ||
                      (currentLocation
                        ? `${currentLocation.lat.toFixed(
                            4
                          )}, ${currentLocation.lng.toFixed(4)}`
                        : "Allow access to use your real-time position.")}
                  </p>
                  {currentLocation?.updatedAt && (
                    <p className="mt-1 text-xs text-white/50">
                      Updated {new Date(currentLocation.updatedAt).toLocaleTimeString()}.
                    </p>
                  )}
                  {locationPermissionError && (
                    <p className="mt-3 text-xs text-red-200">
                      {locationPermissionError}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={locationRequesting}
                      onClick={() => {
                        setLocationPermissionError(null);
                        setLocationPermissionOpen(true);
                      }}
                      type="button"
                    >
                      <MapPin className="h-4 w-4" />
                      {currentLocation ? "Refresh current location" : "Enable current location"}
                    </button>
                    {currentLocation && (
                      <span className="text-xs text-white/50">
                        Accuracy:{" "}
                        {currentLocation.accuracy
                          ? `${Math.round(currentLocation.accuracy)}m`
                          : "Unknown"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Find local spots
                  </h3>
                  <p className="text-sm text-white/60">
                    Pull nearby businesses for quick reviews and routing.
                  </p>
                </div>
                <div className="text-xs text-white/50">
                  {selectedLocationLabel
                    ? `Near: ${selectedLocationLabel}`
                    : "Set a home location or enable current location."}
                </div>
              </div>
              {nearbySource && (
                <div className="mt-2 text-xs text-white/50">
                  Source: {nearbySource}
                </div>
              )}

              <div className="mt-4 grid gap-3 md:grid-cols-[1fr,auto]">
                <label className="sr-only" htmlFor="nearby-query">
                  Search local spots
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
                    id="nearby-query"
                    onChange={(event) => setNearbyQuery(event.target.value)}
                    placeholder="Try coffee shops, thrift, or brunch"
                    type="text"
                    value={nearbyQuery}
                  />
                </div>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                  disabled={nearbyLoading}
                  onClick={handleFindLocalSpots}
                  type="button"
                >
                  {nearbyLoading ? "Searching..." : "Find local spots"}
                </button>
              </div>

              {nearbyError && (
                <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {nearbyError}
                </div>
              )}

              {!nearbyError && nearbyResults.length === 0 && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/60">
                  Add a location and search to see nearby recommendations.
                </div>
              )}

              {nearbyResults.length > 0 && (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {nearbyResults.map((business) => {
                    const locationLabel = formatLocationLabel(
                      business.location || undefined
                    );
                    const reviewUrl = `/brooks-ai-hub?query=${encodeURIComponent(
                      buildReviewPrompt(business)
                    )}`;
                    const isSelectedPlace = selectedPlace?.id === business.id;
                    return (
                      <div
                        className={`rounded-2xl border p-4 ${
                          isSelectedPlace
                            ? "border-emerald-400/60 bg-emerald-400/10"
                            : "border-white/10 bg-black/30"
                        }`}
                        key={business.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {business.name}
                            </p>
                            <p className="text-xs text-white/60">
                              {business.category}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <button
                              className="rounded-full border border-emerald-300/60 bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-400/30"
                              onClick={() => handlePlaceSelect(business)}
                              type="button"
                            >
                              {isSelectedPlace ? "Selected" : "Select"}
                            </button>
                            <a
                              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
                              href={reviewUrl}
                            >
                              Draft review
                            </a>
                          </div>
                        </div>
                        {locationLabel && (
                          <p className="mt-2 text-xs text-white/60">
                            {locationLabel}
                          </p>
                        )}
                        {business.description && (
                          <p className="mt-2 text-xs text-white/60">
                            {truncateText(business.description, 120)}
                          </p>
                        )}
                        <div className="mt-3 flex items-center justify-between text-xs text-white/50">
                          <span>Local spot</span>
                          {business.googleMapsUrl && (
                            <a
                              className="inline-flex items-center gap-1 text-emerald-200 transition hover:text-emerald-100"
                              href={business.googleMapsUrl}
                              rel="noopener"
                              target="_blank"
                            >
                              Open maps
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Submit photos & reviews
                  </h3>
                  <p className="text-sm text-white/60">
                    Select a nearby place to share your photos and notes.
                  </p>
                </div>
                <div className="text-xs text-white/50">
                  {selectedPlace
                    ? `Selected: ${selectedPlace.name}`
                    : "No place selected"}
                </div>
              </div>

              {!selectedPlace && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/60">
                  Choose a place above to unlock photo uploads and reviews.
                </div>
              )}

              {selectedPlace && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white">
                        Write review
                      </h4>
                      <span className="inline-flex items-center gap-1 text-xs text-white/60">
                        <Star className="h-3 w-3 text-emerald-200" />
                        Rating
                      </span>
                    </div>
                    <div className="mt-3">
                      <label className="text-xs text-white/60" htmlFor="review-rating">
                        Rating
                      </label>
                      <select
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        id="review-rating"
                        onChange={(event) =>
                          setReviewRating(Number(event.target.value))
                        }
                        value={reviewRating}
                      >
                        {[5, 4, 3, 2, 1].map((value) => (
                          <option key={value} value={value}>
                            {value} stars
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-3">
                      <label className="text-xs text-white/60" htmlFor="review-text">
                        Review
                      </label>
                      <textarea
                        className="mt-1 min-h-[120px] w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        id="review-text"
                        onChange={(event) => setReviewText(event.target.value)}
                        placeholder="What stood out? Share the vibe, service, or must-know tips."
                        value={reviewText}
                      />
                    </div>
                    {reviewError && (
                      <p className="mt-3 text-xs text-red-200">{reviewError}</p>
                    )}
                    {reviewSuccess && (
                      <p className="mt-3 text-xs text-emerald-200">
                        {reviewSuccess}
                      </p>
                    )}
                    <button
                      className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-400/20 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/30"
                      disabled={reviewSubmitting}
                      onClick={handleReviewSubmit}
                      type="button"
                    >
                      {reviewSubmitting ? "Submitting..." : "Submit review"}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white">
                        Submit photos
                      </h4>
                      <span className="text-xs text-white/60">
                        JPG, PNG, WEBP, or HEIC · 5MB max
                      </span>
                    </div>
                    <div className="mt-3">
                      <input
                        accept={ALLOWED_PHOTO_TYPES.join(",")}
                        className="w-full text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white"
                        multiple
                        onChange={handlePhotoFilesChange}
                        type="file"
                      />
                    </div>
                    {photoFiles.length > 0 && (
                      <ul className="mt-3 space-y-1 text-xs text-white/60">
                        {photoFiles.map((file) => (
                          <li key={`${file.name}-${file.size}`}>
                            {file.name}
                          </li>
                        ))}
                      </ul>
                    )}
                    {photoError && (
                      <p className="mt-3 text-xs text-red-200">{photoError}</p>
                    )}
                    {photoSuccess && (
                      <p className="mt-3 text-xs text-emerald-200">
                        {photoSuccess}
                      </p>
                    )}
                    <button
                      className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                      disabled={photoUploading}
                      onClick={handlePhotoSubmit}
                      type="button"
                    >
                      {photoUploading ? "Uploading..." : "Upload photos"}
                    </button>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Destination search
                  </h3>
                  <p className="text-sm text-white/60">
                    Search towns from the MyCarMindATO discovery index.
                  </p>
                </div>
                <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/70">
                  {isLoading ? "Loading..." : `${towns.length} towns loaded`}
                </div>
              </div>

              <div className="mt-4">
                <label className="sr-only" htmlFor="town-search">
                  Search towns
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
                    id="town-search"
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setSelectedTownId(null);
                    }}
                    placeholder="Search for a town or landmark"
                    type="text"
                    value={searchQuery}
                  />
                </div>
              </div>

              {loadError && (
                <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {loadError}
                </div>
              )}

              {!loadError && (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {filteredTowns.map((town) => (
                    <div
                      className={`rounded-2xl border p-4 transition ${
                        selectedTownId === town.id
                          ? "border-emerald-400/60 bg-emerald-400/10"
                          : "border-white/10 bg-white/5"
                      }`}
                      key={town.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {town.city}
                          </p>
                          <p className="text-xs text-white/60">
                            {town.subAreas.slice(0, 2).join(", ") ||
                              "Town profile available"}
                          </p>
                        </div>
                        <button
                          className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
                          onClick={() => handleTownSelect(town)}
                          type="button"
                        >
                          Preview
                        </button>
                      </div>

                      {town.vibes.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {town.vibes.slice(0, 3).map((vibe) => (
                            <span
                              className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70"
                              key={`${town.id}-${vibe}`}
                            >
                              {vibe}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-xs text-white/50">
                          {town.anchors.at(0) ||
                            "Known for immersive travel missions"}
                        </div>
                        <button
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-200 transition hover:text-emerald-100"
                          onClick={() => handleAskAgent(town.city)}
                          type="button"
                        >
                          <Navigation className="h-3 w-3" />
                          Route
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Missions and mastery
                  </h3>
                  <p className="text-sm text-white/60">
                    Syncs with MyCarMindATO town discovery progress.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => loadChallenges({ randomize: true })}
                    type="button"
                    disabled={challengeLoading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${challengeLoading ? "animate-spin" : ""}`}
                    />
                    {challengeLoading ? "Refreshing" : "Refresh"}
                  </button>
                  <button
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
                    onClick={() => handleAskAgent(selectedTown?.city)}
                    type="button"
                  >
                    <Navigation className="h-4 w-4" />
                    Start mission
                  </button>
                </div>
              </div>

              {challengeError && (
                <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {challengeError}
                </div>
              )}

              {!challengeError && (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {challenges.map((mission) => {
                    const isCompleted = completedChallengeIds.has(mission.id);
                    return (
                      <div
                        className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-black/30 p-4"
                        key={mission.id}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-white">
                              {mission.title}
                            </p>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                              {`Every ${mission.rotationCadenceDays}d`}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-white/60">
                            {mission.missionText}
                          </p>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs text-white/50">
                          <span>
                            {isCompleted
                              ? "Completed recently"
                              : "Ready for action"}
                          </span>
                          <button
                            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={() => handleChallengeComplete(mission.id)}
                            type="button"
                            disabled={isCompleted}
                          >
                            {isCompleted ? "Completed" : "Mark done"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {challengeUpdatedAt && (
                <p className="mt-4 text-xs text-white/40">
                  Updated {new Date(challengeUpdatedAt).toLocaleString()}
                </p>
              )}
            </section>
          </>
        )}

        {activeTab === "dictionary" && (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Location dictionary
                </p>
                <h2 className="text-xl font-semibold text-white">
                  Towns grouped by state
                </h2>
                <p className="text-sm text-white/60">
                  Search within state lists while keeping the canonical order.
                </p>
              </div>
              <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/70">
                {isLoading ? "Loading..." : `${towns.length} towns indexed`}
              </div>
            </div>

            <div className="mt-4">
              <label className="sr-only" htmlFor="town-dictionary-search">
                Search location dictionary
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
                  id="town-dictionary-search"
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setSelectedTownId(null);
                  }}
                  placeholder="Search towns, vibes, or anchors"
                  type="text"
                  value={searchQuery}
                />
              </div>
            </div>

            {loadError && (
              <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {loadError}
              </div>
            )}

            {!loadError && (
              <div className="mt-5 max-h-[540px] overflow-y-auto rounded-2xl border border-white/10 bg-black/30">
                {filteredTownGroups.length === 0 && (
                  <div className="p-6 text-sm text-white/60">
                    {isLoading
                      ? "Loading towns..."
                      : "No towns match your search yet."}
                  </div>
                )}
                <div className="divide-y divide-white/10">
                  {filteredTownGroups.map((group) => (
                    <div key={group.stateName}>
                      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0b151d]/90 px-4 py-2 backdrop-blur-sm">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                            {group.stateName}
                          </p>
                          <p className="text-sm font-semibold text-white">
                            {group.towns.length} towns
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
                            onClick={() => {
                              const townsList = group.towns.map(t => t.cityName).slice(0, 5).join(", ");
                              const prompt = `/MyCarMindATO/ Plan a route through ${group.stateName}. Towns to visit: ${townsList}${group.towns.length > 5 ? ` and ${group.towns.length - 5} more` : ''}`;
                              router.push(`/brooks-ai-hub?query=${encodeURIComponent(prompt)}`);
                            }}
                            type="button"
                          >
                            Route All
                          </button>
                          <button
                            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
                            onClick={() => handleAskAgent(group.stateName)}
                            type="button"
                          >
                            Plan in {group.stateName}
                          </button>
                        </div>
                      </div>
                      <div className="grid gap-3 px-4 py-4 md:grid-cols-2">
                        {group.towns.map((town) => (
                          <div
                            className={`rounded-2xl border p-4 transition ${
                              selectedTownId === town.id
                                ? "border-emerald-400/60 bg-emerald-400/10"
                                : "border-white/10 bg-white/5"
                            }`}
                            key={town.id}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">
                                  {town.cityName}
                                </p>
                                <p className="text-xs text-white/60">
                                  {town.stateName}
                                </p>
                              </div>
                              <button
                                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
                                onClick={() => handleTownSelect(town)}
                                type="button"
                              >
                                Focus
                              </button>
                            </div>
                            <p className="mt-2 text-xs text-white/60">
                              {town.subAreas.slice(0, 2).join(", ") ||
                                town.anchors.at(0) ||
                                "Town profile available"}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                                {town.vibes.at(0) || "MyCarMindATO catalog"}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-200 transition hover:text-blue-100"
                                  onClick={() => handleNearbySearch(town.city)}
                                  type="button"
                                >
                                  <MapPin className="h-3 w-3" />
                                  Nearby
                                </button>
                                <button
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-200 transition hover:text-emerald-100"
                                  onClick={() => {
                                    handleTownSelect(town);
                                    handleTabChange("map");
                                  }}
                                  type="button"
                                >
                                  <Navigation className="h-3 w-3" />
                                  View map
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
      {locationPermissionOpen && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b151d] p-6 text-white shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Use your current location?
                </h3>
                <p className="mt-2 text-sm text-white/70">
                  MyCarMindATO uses your location to find nearby spots and
                  improve live map routing. Your location is only used for this
                  session unless you save a home location.
                </p>
              </div>
              <button
                aria-label="Close"
                className="rounded-full border border-white/10 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                onClick={() => setLocationPermissionOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                onClick={() => setLocationPermissionOpen(false)}
                type="button"
              >
                Not now
              </button>
              <button
                className="inline-flex items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-400/20 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/30 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={locationRequesting}
                onClick={requestCurrentLocation}
                type="button"
              >
                {locationRequesting ? "Requesting..." : "Allow current location"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showReviewModal && selectedPlace && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0b151d] p-6 text-white shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Thanks for sharing your review!
                </h3>
                <p className="mt-2 text-sm text-white/70">
                  Want to post it on Google Maps too? Local Guides love reviews
                  like this.
                </p>
              </div>
              <button
                aria-label="Close"
                className="rounded-full border border-white/10 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                onClick={() => setShowReviewModal(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                className="inline-flex flex-1 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-400/20 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/30"
                href={buildGoogleReviewUrl(selectedPlace.id)}
                rel="noopener"
                target="_blank"
              >
                Open Google review
              </a>
              <button
                className="inline-flex flex-1 items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                onClick={() => setShowReviewModal(false)}
                type="button"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
