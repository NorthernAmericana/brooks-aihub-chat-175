import {
  formatRoutePath,
  getRouteAccessMetadata,
  normalizeRouteKey,
  type RouteKind,
} from "./routes";

export type RouteContractFixture = {
  id: string;
  label: string;
  slashInput: string;
  expected: {
    normalizedKey: string;
    formattedRoute: string;
    metadata: {
      foundersOnly: boolean;
      isFreeRoute: boolean;
    };
    suggestion: {
      kind: RouteKind;
      slash: string;
      route: string;
      foundersOnly: boolean;
      isFreeRoute: boolean;
    };
  };
};

export const ROUTE_CONTRACT_FIXTURES: RouteContractFixture[] = [
  {
    id: "brooks-bears-official",
    label: "Brooks Bears",
    slashInput: "/BrooksBears",
    expected: {
      normalizedKey: normalizeRouteKey("/BrooksBears"),
      formattedRoute: formatRoutePath("/BrooksBears"),
      metadata: getRouteAccessMetadata(false),
      suggestion: {
        kind: "official",
        slash: "/BrooksBears",
        route: formatRoutePath("/BrooksBears"),
        foundersOnly: false,
        isFreeRoute: true,
      },
    },
  },
  {
    id: "mycarmind-driver-free",
    label: "MyCarMind Driver",
    slashInput: "/MyCarMindATO/Driver",
    expected: {
      normalizedKey: normalizeRouteKey("/MyCarMindATO/Driver"),
      formattedRoute: formatRoutePath("/MyCarMindATO/Driver"),
      metadata: getRouteAccessMetadata(false),
      suggestion: {
        kind: "official",
        slash: "/MyCarMindATO/Driver",
        route: formatRoutePath("/MyCarMindATO/Driver"),
        foundersOnly: false,
        isFreeRoute: true,
      },
    },
  },
  {
    id: "custom-owner-route",
    label: "Roadtrip Buddy",
    slashInput: " /Custom Garage_Bot// ",
    expected: {
      normalizedKey: normalizeRouteKey(" /Custom Garage_Bot// "),
      formattedRoute: formatRoutePath(" /Custom Garage_Bot// "),
      metadata: getRouteAccessMetadata(false),
      suggestion: {
        kind: "custom",
        slash: " /Custom Garage_Bot// ",
        route: formatRoutePath(" /Custom Garage_Bot// "),
        foundersOnly: false,
        isFreeRoute: true,
      },
    },
  },
];
