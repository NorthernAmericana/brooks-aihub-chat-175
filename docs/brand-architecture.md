# Brand Architecture

This page defines how the Northern Americana organization presents company, media, and product brands in a clear hierarchy.

## Brand roles

### 1) Northern Americana Tech (legal and company role)

**Northern Americana Tech** is the legal operating company.

Responsibilities:

- Owns legal entities, contracts, compliance, and core operations.
- Runs shared technology, infrastructure, finance, and platform governance.
- Publishes and operates the Brooks AI HUB product platform.

### 2) Northern Americana Media Collection (media branch role)

**Northern Americana Media Collection (NAMC)** is the media and storytelling branch under the company umbrella.

Responsibilities:

- Develops and curates media properties, lore systems, and story universes.
- Defines media-facing editorial voice, canon, and cross-format brand packaging.
- Ships media-aligned experiences that can be distributed through Brooks AI HUB.

### 3) Brooks AI HUB (product and platform role)

**Brooks AI HUB** is the consumer product and platform layer.

Responsibilities:

- Serves as the app ecosystem, launcher, and conversational platform.
- Hosts first-party and branch-aligned apps, agents, and experiences.
- Connects users to interactive tools, games, and media experiences across business lines.

## How apps under HUB map to branches and business lines

All apps launched in Brooks AI HUB should be mapped on two dimensions:

1. **Branch owner** (who owns narrative, product, and lifecycle decisions)
2. **Business line** (what category of value the app delivers)

### Mapping model

| HUB app                           | Branch owner                           | Business line             | Example focus                                           |
| --------------------------------- | -------------------------------------- | ------------------------- | ------------------------------------------------------- |
| NAMC App experiences              | Northern Americana Media Collection    | Media & Storytelling      | Lore hubs, character experiences, franchise activations |
| Utility/assistant experiences     | Northern Americana Tech                | AI Tools & Productivity   | Assistant workflows, everyday utilities                 |
| Game-like interactive experiences | Northern Americana Tech + NAMC (joint) | Interactive Entertainment | Light games, narrative play, companion loops            |
| Commerce-enabled app surfaces     | Northern Americana Tech                | Platform Commerce         | Entitlements, subscriptions, premium content access     |

### Governance rule of thumb

- **Branch owner decides content direction.**
- **Brooks AI HUB decides platform UX, safety, and distribution mechanics.**
- **Northern Americana Tech finalizes legal/commercial policy.**

## Simple architecture diagram

```mermaid
flowchart TD
    NAT[Northern Americana Tech\n(Legal company + platform operator)] --> NAMC[Northern Americana Media Collection\n(Media branch)]
    NAT --> HUB[Brooks AI HUB\n(Product + platform)]
    NAMC --> HUB

    HUB --> A1[NAMC media apps\n(Media & Storytelling)]
    HUB --> A2[Utility apps\n(AI Tools & Productivity)]
    HUB --> A3[Interactive apps\n(Entertainment)]
    HUB --> A4[Commerce surfaces\n(Platform Commerce)]
```

## Approved copy snippets

Use these snippets as default, approved messaging in public-facing surfaces.

### Landing page copy

**Option A (short):**

> Brooks AI HUB is the platform product from Northern Americana Tech, with media experiences powered by Northern Americana Media Collection.

**Option B (expanded):**

> Built by Northern Americana Tech, Brooks AI HUB is a unified app and AI platform that brings together tools, interactive experiences, and media worlds from Northern Americana Media Collection.

### App store description copy

**Option A (short):**

> Brooks AI HUB is Northern Americana Tech’s platform for AI chat, apps, and interactive media, including experiences from Northern Americana Media Collection.

**Option B (expanded):**

> Discover AI-powered tools, games, and media experiences in Brooks AI HUB — the platform operated by Northern Americana Tech and featuring stories and worlds from Northern Americana Media Collection.

### Social bio copy

**Option A (compact):**

> Brooks AI HUB by Northern Americana Tech • Media worlds by Northern Americana Media Collection.

**Option B (compact + purpose):**

> AI chat + apps + media in one place. Built by Northern Americana Tech, featuring NAMC experiences.

## Reuse guidance

- Keep legal/company references as **Northern Americana Tech**.
- Use **Northern Americana Media Collection (NAMC)** when referring to media branch identity.
- Use **Brooks AI HUB** as the user-facing product/platform name.
- In mixed contexts, lead with product first, then company attribution.
