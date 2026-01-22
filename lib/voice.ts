export type VoiceOption = {
  id: string;
  label: string;
};

// Voice options for NAMC chats only
const NAMC_VOICE_OPTIONS: VoiceOption[] = [
  { id: "By89qnNqll35EKDmc3Hm", label: "Bruce NAMC" },
  { id: "7fJYplvotvPf1yl7PLLP", label: "Selena NAMC" },
];

// Brooks AI HUB placeholder voice (not yet implemented)
const BROOKS_AI_HUB_VOICE: VoiceOption = {
  id: "brooks-ai-hub-placeholder",
  label: "Brooks AI HUB",
};

export const getRouteKey = (title: string) => {
  const match = title.match(/\/([^/]+)\//i);
  return match?.[1]?.toLowerCase() ?? "default";
};

export const isNamcRoute = (title: string) => {
  return getRouteKey(title) === "namc";
};

// Get the default voice for a route
export const getDefaultVoice = (routeKey: string): VoiceOption => {
  if (routeKey === "namc") {
    return NAMC_VOICE_OPTIONS[0]; // Bruce NAMC as default
  }
  return BROOKS_AI_HUB_VOICE; // Placeholder for non-NAMC chats
};

// Only used for backward compatibility
export const getOfficialVoice = (routeKey: string) => {
  if (routeKey === "namc") {
    return "Bruce NAMC";
  }
  return "Brooks AI HUB";
};

// Get available voice options for a route
export const getVoiceOptions = (routeKey: string): VoiceOption[] => {
  if (routeKey === "namc") {
    return NAMC_VOICE_OPTIONS;
  }
  // No voice options for non-NAMC chats (voice disabled)
  return [];
};
