export type RouteKind = "official" | "custom";

export type RouteSuggestion = {
  id: string;
  label: string;
  slash: string;
  route: string;
  kind: RouteKind;
  atoId?: string;
  foundersOnly?: boolean;
  isFreeRoute?: boolean;
};
