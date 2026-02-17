# DB Route Registry → Shared Route Contract Mapping

This document defines how `RouteRegistry` records and related route metadata map into the shared route contract in `packages/shared-core/src/contracts/routes.ts`.

## Canonical contract fields

Shared contract source of truth:
- `RouteSuggestion`
- `RouteAccessMetadata`
- route formatting/normalization utilities (`formatRoutePath`, `normalizeRouteKey`, `sanitizeRouteSegment`)

## Mapping table

| Source | DB / app field | Shared contract field | Notes |
| --- | --- | --- | --- |
| `RouteRegistry` row | `id` | `RouteSuggestion.id` | Stable route identifier from registry. |
| `RouteRegistry` row | `label` | `RouteSuggestion.label` | Display label shown in route suggestions. |
| `RouteRegistry` row | `slash` | `RouteSuggestion.slash` | Canonical slash trigger string before normalization. |
| Derived from `slash` | `formatRoutePath(slash)` | `RouteSuggestion.route` | Guarantees leading and trailing slash (`/X/` form). |
| Constant for official records | N/A | `RouteSuggestion.kind = "official"` | Set by mapping utility. |
| Gating rule output | `requiresFoundersForSlashRoute(slash)` | `RouteAccessMetadata.foundersOnly` | `true` means founders entitlement required. |
| Derived from founders flag | `!foundersOnly` | `RouteAccessMetadata.isFreeRoute` | Normalized free-route indicator. |
| Lookup key derivation | `normalizeRouteKey(slash)` | route key map key | Used for deduping and prefix filtering in suggestions. |

## Custom route mapping (for parity)

Custom ATO route suggestions also conform to `RouteSuggestion`:

| Source | app field | Shared contract field | Notes |
| --- | --- | --- | --- |
| `UnofficialAto` row | `id` | `RouteSuggestion.id = custom-${id}` | Namespaced to avoid collisions with official route IDs. |
| `UnofficialAto` row | `name` | `RouteSuggestion.label` | User-facing custom route name. |
| `UnofficialAto` row | `route ?? name` | `RouteSuggestion.slash` | Fallback behavior preserved for custom routes. |
| Derived | `formatRoutePath(route ?? name)` | `RouteSuggestion.route` | Same canonical formatting as official routes. |
| Constant for custom records | N/A | `RouteSuggestion.kind = "custom"` | Set by mapping utility. |
| Constant in app mapping | `false` / `true` | `foundersOnly` / `isFreeRoute` | Custom routes are always free today. |

## Contract fixtures

Representative fixtures are defined in:
- `packages/shared-core/src/contracts/routes.fixtures.ts`

Fixtures cover:
- `/BrooksBears`
- `/MyCarMindATO/Driver`
- a custom-route normalization case

Both repositories can import these fixtures and assert that route normalization, formatting, and metadata mapping remain equivalent.
