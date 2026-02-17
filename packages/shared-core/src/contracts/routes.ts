export type NormalizedRouteKey = `/${string}/` | "/";

export type RouteKind = "official" | "custom";

export type RouteAccessMetadata = {
  foundersOnly: boolean;
  isFreeRoute: boolean;
};

export type RouteSuggestion = {
  id: string;
  label: string;
  slash: string;
  route: string;
  kind: RouteKind;
  atoId?: string;
} & Partial<RouteAccessMetadata>;

export const sanitizeRouteSegment = (value: string) =>
  value
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\s+/g, "")
    .replace(/\/{2,}/g, "/")
    .replace(/[^a-zA-Z0-9/_-]/g, "");

export const formatRoutePath = (value: string): string => {
  const trimmed = value
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/{2,}/g, "/");
  return trimmed ? `/${trimmed}/` : "/";
};

export const normalizeRouteKey = (value: string): string => {
  const cleaned = sanitizeRouteSegment(value);
  return cleaned ? `/${cleaned}/`.toLowerCase() : "/";
};

export const getRouteAccessMetadata = (
  foundersOnly: boolean
): RouteAccessMetadata => ({
  foundersOnly,
  isFreeRoute: !foundersOnly,
});
