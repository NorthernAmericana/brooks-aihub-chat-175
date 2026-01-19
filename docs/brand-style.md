# Brand Style Guide: Cozy + Retro-Future + Woodsy

This guide translates the “cozy + retro-future + woodsy” vibe into practical styling rules. It anchors to the design tokens and utilities defined in `app/globals.css` and the shared primitives in `components/ui/`.

## 1) Color + Typography (via `app/globals.css`)

### Core palette (use Tailwind tokens, not raw hex)
The base palette is defined as CSS variables in `app/globals.css` (light/dark), mapped to Tailwind via `@theme` tokens:

- **Backgrounds**: `bg-background`, `bg-card`, `bg-popover`
- **Foreground/text**: `text-foreground`, `text-card-foreground`, `text-popover-foreground`
- **Primary accents**: `bg-primary`, `text-primary-foreground`
- **Secondary/muted**: `bg-secondary`, `bg-muted`, `text-muted-foreground`
- **Borders/inputs/rings**: `border-border`, `bg-input`, `ring-ring`

**Tailwind usage examples:**

```tsx
<div className="bg-card text-card-foreground border border-border">
  <p className="text-muted-foreground">Warm, low-contrast supporting copy.</p>
</div>
```

### Cozy + woodsy atmosphere utilities
`app/globals.css` includes custom utilities for the vibe:

- **`woodsy-base`**: layered warm gradients + subtle texture
- **`soft-vignette`**: inset shadow to focus content
- **`retro-rainbow-text`** / **`retro-rainbow-border`**: controlled retro-future accents
- **`neon-outline`**: soft glow edge for “retro tech” emphasis
- **`pixel-text-shadow`** + **`font-pixel`**: pixel-era accents for headers/labels

**Tailwind usage examples:**

```tsx
<section className="woodsy-base soft-vignette text-foreground">
  <h1 className="retro-rainbow-text font-pixel text-3xl">Campfire Console</h1>
  <p className="text-muted-foreground">Warm, calm, and slightly futuristic.</p>
</section>
```

### Typography guidance
Typography is driven by the theme fonts in `@theme`:

- **Sans**: `font-sans` → default for body copy and UI text.
- **Mono**: `font-mono` → use sparingly for data/terminal-like elements.
- **Pixel**: `font-pixel` → only for small bursts of retro flair (badges, short headlines).

**Tailwind usage examples:**

```tsx
<p className="font-sans text-sm text-muted-foreground">
  Cozy guidance that reads like a warm whisper.
</p>
<span className="font-mono text-xs">v0.9.3</span>
```

### Contrast + readability rules
- Keep body copy on `bg-background` or `bg-card` to retain warmth.
- Use `text-muted-foreground` for secondary copy; avoid lowering opacity beyond 60% unless you are in a compact UI.
- Use `neon-outline` and `retro-rainbow-*` sparingly to keep the cozy base.

## 2) Component Styling Conventions (`components/ui/`)

All components in `components/ui/` should adhere to the tokenized color system and the cozy/woodsy texture.

### Buttons
- Primary buttons should lean warm and tactile:
  - `bg-primary text-primary-foreground`
  - Soft edges: `rounded-md` (derived from `--radius`)
  - Use `neon-outline` for high-focus calls to action only.

**Example (Tailwind + existing Button):**

```tsx
<Button className="bg-primary text-primary-foreground rounded-md neon-outline">
  Launch Cabin
</Button>
```

### Cards & surfaces
- Use `bg-card text-card-foreground border border-border` as the default surface.
- For hero or immersive sections, layer `woodsy-base` + `soft-vignette`.

```tsx
<Card className="bg-card text-card-foreground border border-border">
  <CardHeader>
    <CardTitle className="font-pixel">Trail Log</CardTitle>
  </CardHeader>
</Card>
```

### Inputs
- Inputs should feel tactile and calm:
  - `bg-input` with `border-border`
  - `focus-visible:ring-ring`
  - Avoid pure white fills; rely on the defined tokens.

```tsx
<Input className="bg-input border-border focus-visible:ring-ring" />
```

### Badges / chips
- Use muted accents or retro gradients sparingly.
- Favor `bg-secondary text-secondary-foreground` for everyday tags.

```tsx
<Badge className="bg-secondary text-secondary-foreground">Woodsy</Badge>
```

### Dialogs, sheets, and popovers
- Prefer `bg-popover text-popover-foreground` surfaces.
- Add `soft-vignette` on large overlays if needed to emphasize focus.

```tsx
<DialogContent className="bg-popover text-popover-foreground soft-vignette" />
```

## 3) Tone & Voice Guidelines (UI Copy)

**Vibe:** warm, a bit nostalgic, gently futuristic. Think: cabin light, synth hum, and quiet confidence.

### Principles
- **Cozy:** Use warm, grounded phrasing. Avoid cold or overly technical language.
- **Retro-future:** Subtle nods to analog/digital blends ("signal", "glow", "console")—don’t overdo it.
- **Woodsy:** Use nature-adjacent metaphors ("trail", "campfire", "evergreen") without turning it into camp.

### Do / Don’t
**Do:**
- “Let’s light the cabin console.”
- “Ready to chart a new trail?”
- “Signals are clear. You’re all set.”

**Don’t:**
- “Initializing device runtime protocols…”
- “Error 0x0F: operation failed.”
- “Your transaction has been processed successfully.”

### Microcopy patterns
- **Primary CTAs:** short, warm, and active ("Start trail", "Open cabin")
- **Secondary actions:** supportive ("Save for later", "Keep it nearby")
- **Empty states:** reassuring and forward-looking ("No signals yet — we’ll keep the glow ready.")
- **Errors:** calm and helpful ("That path didn’t load. Try again in a moment.")

## 4) Applying the Guidelines in Tailwind

When implementing UI:

1. **Start with tokens** from `app/globals.css` (`bg-background`, `text-foreground`, `border-border`, etc.).
2. **Add atmosphere** with utilities (`woodsy-base`, `soft-vignette`) on large surfaces.
3. **Accent sparingly** with `retro-rainbow-*`, `pixel-text-shadow`, and `neon-outline` to avoid visual noise.
4. **Keep typography consistent**: `font-sans` for body, `font-mono` for data, `font-pixel` for short headings.

**Example layout snippet:**

```tsx
<section className="woodsy-base soft-vignette text-foreground">
  <div className="max-w-4xl mx-auto p-8">
    <h2 className="font-pixel text-3xl retro-rainbow-text">Signal Cabin</h2>
    <p className="mt-2 text-muted-foreground">
      Cozy, retro-future notes with a woodsy glow.
    </p>
    <div className="mt-6 flex gap-3">
      <Button className="bg-primary text-primary-foreground">Open Cabin</Button>
      <Button variant="secondary" className="bg-secondary text-secondary-foreground">
        Save for Later
      </Button>
    </div>
  </div>
</section>
```

---

If you need new tokens or utilities, define them in `app/globals.css` so they stay consistent with the theme system.
