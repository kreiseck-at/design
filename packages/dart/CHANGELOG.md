## 0.2.0

- Added: `KdIcon`, `KdIconData`/`KdOp`, `KdIcons` (150 icons in seven groups —
  navigation, action, device, cash, status, document, people — plus 11 filled
  variants, and `KdIcons.byName` for lookup by source name), `KdSignet` as a
  proper widget with `frame` and `square` colours.
- Removed (breaking): the `kdSignet(mode)` function and the two bundled SVG
  assets (`signet.svg`, `signet-invers.svg`) — use `KdSignet` instead. A
  consumer that rendered the old assets no longer needs `flutter_svg` for the
  mark; the till app switches over in its next release.

## 0.1.0

- First release: colour ramps in OKLCH with anchored brand steps, roles for the
  modes light, warm, dark and contrast, form and type tokens, a full Material
  theme, `brandRamp` for a business colour at runtime, Archivo and DM Mono, and
  the signet. Every value is generated from one token source and checked
  against a golden file shared with the npm twin.
