export const VOICE_OPTIONS = [
  "Atlas",
  "Nova",
  "Echo",
  "Sable",
  "Aria",
  "Lumen",
];

export const NAMC_ROUTE_KEY = "namc";

export type RouteVoiceOption = {
  id: string;
  label: string;
  routeKey: string;
};

export const NAMC_VOICES: RouteVoiceOption[] = [
  {
    id: "By89qnNqll35EKDmc3Hm",
    label: "Bruce NAMC (Male)",
    routeKey: NAMC_ROUTE_KEY,
  },
  {
    id: "7fJYplvotvPf1yl7PLLP",
    label: "Selena NAMC (Female)",
    routeKey: NAMC_ROUTE_KEY,
  },
];

export const getRouteKey = (title: string) => {
  const match = title.match(/\/([^/]+)\//i);
  return match?.[1]?.toLowerCase() ?? "default";
};

export const getOfficialVoice = (routeKey: string) => {
  if (routeKey === "default") {
    return "Brooks Default";
  }
  if (routeKey === NAMC_ROUTE_KEY) {
    return "Selena NAMC (Female)";
  }
  return `${routeKey.toUpperCase()} Official`;
};

export const getRouteVoiceOptions = (routeKey: string) => {
  if (routeKey === NAMC_ROUTE_KEY) {
    return NAMC_VOICES;
  }
  return [];
};

export const getDefaultVoiceId = (routeKey: string) => {
  if (routeKey === NAMC_ROUTE_KEY) {
    return NAMC_VOICES[1]?.id ?? NAMC_VOICES[0]?.id ?? "";
  }
  return "";
};

export const getVoiceLabel = (voiceId: string, routeKey: string) => {
  const options = getRouteVoiceOptions(routeKey);
  return options.find((voice) => voice.id === voiceId)?.label ?? voiceId;
};

export const getVoiceById = (voiceId: string) => {
  return NAMC_VOICES.find((voice) => voice.id === voiceId);
};
