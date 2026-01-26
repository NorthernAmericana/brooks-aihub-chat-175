export type VoiceOption = {
  id: string;
  label: string;
};

// Define all available voices with their ElevenLabs IDs
const VOICES = {
  DANIEL: { id: "QOXGBQZ2d1ykGdEdFlgp", label: "Daniel" },
  BENJAMIN_BEAR: { id: "SMar3QtpKPfkPZ6oG9pg", label: "Benjamin Bear" },
  BRUCE: { id: "By89qnNqll35EKDmc3Hm", label: "Bruce" },
  SELENA: { id: "7fJYplvotvPf1yl7PLLP", label: "Selena" },
} as const;

export const ALL_VOICES: VoiceOption[] = Object.values(VOICES);

// Route-specific voice configuration
type RouteVoiceConfig = {
  voices: VoiceOption[];
  defaultVoiceId: string;
};

// Structured voice routing map: route key -> voice options and default
const VOICE_ROUTING_MAP: Record<string, RouteVoiceConfig> = {
  "brooks-ai-hub": {
    voices: [VOICES.DANIEL, VOICES.BENJAMIN_BEAR, VOICES.BRUCE, VOICES.SELENA],
    defaultVoiceId: VOICES.DANIEL.id,
  },
  "unofficial-ato": {
    voices: ALL_VOICES,
    defaultVoiceId: VOICES.DANIEL.id,
  },
  namc: {
    voices: [VOICES.BRUCE, VOICES.SELENA],
    defaultVoiceId: VOICES.BRUCE.id,
  },
  "brooks-bears": {
    voices: [VOICES.BENJAMIN_BEAR],
    defaultVoiceId: VOICES.BENJAMIN_BEAR.id,
  },
  brooksbears: {
    voices: [VOICES.BENJAMIN_BEAR],
    defaultVoiceId: VOICES.BENJAMIN_BEAR.id,
  },
  "brooks-bears-benjamin": {
    voices: [VOICES.BENJAMIN_BEAR],
    defaultVoiceId: VOICES.BENJAMIN_BEAR.id,
  },
  "my-car-mind": {
    voices: [VOICES.DANIEL],
    defaultVoiceId: VOICES.DANIEL.id,
  },
  mycarmindato: {
    voices: [VOICES.DANIEL],
    defaultVoiceId: VOICES.DANIEL.id,
  },
  "my-flower-ai": {
    voices: [VOICES.DANIEL],
    defaultVoiceId: VOICES.DANIEL.id,
  },
  myflowerai: {
    voices: [VOICES.DANIEL],
    defaultVoiceId: VOICES.DANIEL.id,
  },
  nat: {
    voices: [VOICES.DANIEL],
    defaultVoiceId: VOICES.DANIEL.id,
  },
  default: {
    voices: [VOICES.DANIEL],
    defaultVoiceId: VOICES.DANIEL.id,
  },
};

export const getRouteKey = (title: string) => {
  const match = title.match(/\/([^/]+)\//i);
  return match?.[1]?.toLowerCase() ?? "default";
};

// Get route key from chat, preferring the persisted routeKey field
export const getChatRouteKey = (chat: {
  routeKey?: string | null;
  title: string;
}) => {
  if (chat.routeKey) {
    return chat.routeKey.toLowerCase();
  }
  // Fallback to parsing from title for backward compatibility
  return getRouteKey(chat.title);
};

export const isNamcRoute = (title: string) => {
  return getRouteKey(title) === "namc";
};

// Check if chat is NAMC route using persisted routeKey or title
export const isChatNamcRoute = (chat: {
  routeKey?: string | null;
  title: string;
}) => {
  return getChatRouteKey(chat) === "namc";
};

// Get route configuration, falling back to default if not found
const getRouteConfig = (routeKey: string): RouteVoiceConfig => {
  const normalizedKey = routeKey.toLowerCase();
  return VOICE_ROUTING_MAP[normalizedKey] ?? VOICE_ROUTING_MAP.default;
};

// Get the default voice for a route
export const getDefaultVoice = (routeKey: string): VoiceOption => {
  const config = getRouteConfig(routeKey);
  const defaultVoice = config.voices.find(
    (v) => v.id === config.defaultVoiceId
  );
  return defaultVoice ?? config.voices[0];
};

// Get the official voice ID for a route (returns actual ElevenLabs voice ID)
export const getOfficialVoiceId = (routeKey: string): string => {
  return getDefaultVoice(routeKey).id;
};

// DEPRECATED: Only used for backward compatibility - returns label strings
export const getOfficialVoice = (routeKey: string): string => {
  return getDefaultVoice(routeKey).label;
};

// Get available voice options for a route
export const getVoiceOptions = (routeKey: string): VoiceOption[] => {
  const config = getRouteConfig(routeKey);
  return config.voices;
};
