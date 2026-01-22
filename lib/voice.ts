export const VOICE_OPTIONS = [
  "Atlas",
  "Nova",
  "Echo",
  "Sable",
  "Aria",
  "Lumen",
];

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
