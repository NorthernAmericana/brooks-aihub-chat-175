export const sanitizeRouteSegment = (value: string) =>
  value
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\s+/g, "")
    .replace(/\/{2,}/g, "/")
    .replace(/[^a-zA-Z0-9/_-]/g, "");

export const formatRoutePath = (value: string) => {
  const trimmed = value
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/{2,}/g, "/");
  return trimmed ? `/${trimmed}/` : "/";
};

export const normalizeRouteKey = (value: string) => {
  const cleaned = sanitizeRouteSegment(value);
  return cleaned ? `/${cleaned}/`.toLowerCase() : "/";
};
