export type VoiceOption = {
  id: string;
  label: string;
};

// Voice options for NAMC chats only
const NAMC_VOICE_OPTIONS: VoiceOption[] = [
  { id: "By89qnNqll35EKDmc3Hm", label: "Bruce NAMC" },
  { id: "7fJYplvotvPf1yl7PLLP", label: "Selena NAMC" },
];

// Brooks AI HUB official voice
const BROOKS_AI_HUB_VOICE: VoiceOption = {
  id: "QOXGBQZ2d1ykGdEdFlgp",
  label: "Daniel - Brooks AI HUB",
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

// Get the default voice for a route
export const getDefaultVoice = (routeKey: string): VoiceOption => {
  if (routeKey === "namc") {
    return NAMC_VOICE_OPTIONS[0]; // Bruce NAMC as default
  }
  return BROOKS_AI_HUB_VOICE; // Placeholder for non-NAMC chats
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
  if (routeKey === "namc") {
    return NAMC_VOICE_OPTIONS;
  }
  // Brooks AI HUB voice for non-NAMC chats
  return [BROOKS_AI_HUB_VOICE];
};
