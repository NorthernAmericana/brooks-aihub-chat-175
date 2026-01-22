export type VoiceOption = {
  id: string;
  label: string;
};

const DEFAULT_VOICE_OPTIONS: VoiceOption[] = [
  "Atlas",
  "Nova",
  "Echo",
  "Sable",
  "Aria",
  "Lumen",
].map((label) => ({ id: label, label }));

const ROUTE_VOICE_OPTIONS: Record<string, VoiceOption[]> = {
  namc: [
    { id: "By89qnNqll35EKDmc3Hm", label: "Bruce NAMC (Male)" },
    { id: "7fJYplvotvPf1yl7PLLP", label: "Selena NAMC (Female)" },
  ],
};

export const getRouteKey = (title: string) => {
  const match = title.match(/\/([^/]+)\//i);
  return match?.[1]?.toLowerCase() ?? "default";
};

export const getOfficialVoice = (routeKey: string) => {
  if (routeKey === "default") {
    return "Brooks Default";
  }
  return `${routeKey.toUpperCase()} Official`;
};

export const getVoiceOptions = (routeKey: string) => {
  if (routeKey === "namc") {
    return ROUTE_VOICE_OPTIONS.namc;
  }
  return DEFAULT_VOICE_OPTIONS;
};
