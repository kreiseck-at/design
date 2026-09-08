# @kreiseck/design

Design tokens, colour roles for four modes, a brand ramp, the icon set and the Kasseneck logo (with its animations) shared by all Kreiseck surfaces.

## Install

```bash
npm install @kreiseck/design
```

## Tokens

```ts
import { roles, ramps, brandRamp } from "@kreiseck/design";

roles.light.brand; // "#136B6B"
```

`roles` gives semantic colour roles (`brand`, `surface`, `ink`, …) per mode (`light`, `dark`, and the two high-contrast modes). `ramps` holds the raw colour ladders those roles are built from. `brandRamp(seed)` derives a full ramp from a single hex colour, so a business's own brand colour gets a ramp with the same contrast guarantees as the built-in ones.

The same values are also published as CSS custom properties:

```css
@import "@kreiseck/design/tokens.css";

.button {
  background: var(--kd-brand);
  color: var(--kd-on-brand);
}
```

## Icons

```tsx
import { Receipt } from "@kreiseck/design/icons";

<Receipt size={20} strokeWidth={2} title="Receipt" />;
```

Icons are React components on a 24×24 grid, stroked in `currentColor` by default. `size` and `strokeWidth` are optional (24 and 1.75); without a `title` the icon renders `aria-hidden`, with one it renders `role="img"` and an accessible `<title>`. Filled variants ship alongside their outline counterpart, e.g. `ReceiptFilled`.

### Sprite

Every icon is also available as a standalone SVG and inside one sprite sheet, for places a React component doesn't reach (email templates, print, non-React apps). Import the sprite as a string with your bundler, inject it once, then reference symbols by id:

```ts
import spriteSource from "@kreiseck/design/svg/sprite.svg?raw"; // Vite; adjust the query for your bundler

document.body.insertAdjacentHTML("afterbegin", spriteSource);
```

```html
<svg><use href="#kd-receipt" /></svg>
```

An external `href` pointing at the sprite file (`sprite.svg#kd-receipt`) works in Chrome and Firefox but not in Safari, which only resolves `<use>` against fragments already in the document — inline the sprite once as above and reference it by id everywhere.

Or a single icon file directly: `@kreiseck/design/svg/receipt.svg`.

## Logo

The Kasseneck logo as React components, drawn from geometry — no asset, no
font: the mark as the three brand paths, the wordmark as Archivo 600
outlines. What renders is byte for byte the brand's SVG.

```tsx
import { Signet, Logo, Wordmark, LogoMotion } from "@kreiseck/design/logo";

<Signet size={40} />                 // the mark: frame in currentColor, corner in var(--kd-brand)
<Logo height={28} />                 // mark + wordmark, 332/48 as wide as tall
<Wordmark height={28} />             // the wordmark alone
```

`ink`, `accent` and `highlight` take any CSS colour (on a dark ground pass a
light `ink`); `title` names the graphic, without one it is decorative.

### Animations

The mark is an 8×8 grid: 32 cells of the frame and the corner, plus a pixel
layer over all 64 fields that is invisible at rest — so the mark can show
pixel art and *become* the logo. Every animation is data
(`brand/animations.json`), identical here and in the Flutter package.

```tsx
<LogoMotion animation="heart" height={40} />
<LogoMotion animation="breathe" wordmark={false} height={64} />   // the mark alone, loops
<LogoMotion animation="euro" onDone={() => go()} playKey={run} />  // change playKey to replay
```

| name | label | scenario | length |
|---|---|---|---|
| `rain` | Regen | splash | 1600 ms |
| `bloom` | Aufblühen | splash | 1400 ms |
| `scatter` | Zufall | splash | 1400 ms |
| `heart` | Herz | splash | 2150 ms |
| `heartbeat` | Herzschlag | splash | 2850 ms |
| `euro` | Euro | splash | 2100 ms |
| `check` | Haken | splash | 2100 ms |
| `star` | Stern | splash | 2100 ms |
| `lock` | Schloss | splash | 2100 ms |
| `receipt` | Bon | splash | 2100 ms |
| `breathe` | Atmen | waiting | 2400 ms · loops |

`loop` overrides the animation's own flag, `rate` scales playback,
`autoplay={false}` shows the last frame. Tracks marked random draw a fresh
order every run.

For your own motion, sample the data and hand the styles to the components:

```tsx
import { sample, animations } from "@kreiseck/design/logo";

const s = sample(animations.rain, t);     // t 0..1
<Logo height={28} cells={s.cells} glyphs={s.glyphs} pixels={s.pixels} />
```

A `Style` per element carries `opacity`, `scale`, `dx`/`dy` (in cells),
`tint` (toward `highlight`) and `accent` (toward the corner's petrol).
Intermediate tints use `color-mix()`, so a tinted frame needs a 2023+
browser; at rest the components render the plain brand paths and never show
seams between cells.

## Fonts

```ts
import "@kreiseck/design/fonts.css";
```

Archivo (400/500/600/700) and DM Mono (400/500) ship as `.woff2` files inside the package — importing `fonts.css` self-hosts them, with no request to a third-party font service and no cookie banner needed for it.

## Gallery

All tokens, ramps and icons rendered together live in [`/gallery`](https://github.com/kreiseck-at/design/tree/main/gallery) in this repository.
