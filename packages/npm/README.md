# @kreiseck/design

Design tokens, colour roles for four modes, a brand ramp and the icon set shared by all Kreiseck surfaces.

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

## Gallery

All tokens, ramps and icons rendered together live in [`/gallery`](https://github.com/kreiseck-at/design/tree/main/gallery) in this repository.
