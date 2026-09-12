# kreiseck_design

Design tokens, a Material theme and the brand assets used across Kreiseck's
Flutter apps. The values — colour ramps, roles, radii, spacing, type scale —
come from one token source and are generated for this package and for its
npm twin at the same time; a golden fixture shared between the two is what
keeps them in sync, not a hand-maintained comparison. An app reads a role
(`kdColor(mode, 'brand')`), never a ramp step, so a palette change does not
mean hunting down colour literals.

## Installation

```yaml
dependencies:
  kreiseck_design: ^0.2.0
```

## Usage

Build a theme from a mode and hand it to `MaterialApp`:

```dart
import 'package:flutter/material.dart';
import 'package:kreiseck_design/kreiseck_design.dart';

MaterialApp(
  theme: kdTheme(KdMode.light),
  darkTheme: kdTheme(KdMode.dark),
  home: const MyHomePage(),
);
```

Read a colour by role rather than by ramp step:

```dart
Container(
  color: kdColor(KdMode.light, 'brand'),
  child: const Icon(Icons.check, color: Colors.white),
);
```

Amounts, numbers and anything else that stands in a column and gets
compared should use the monospace style, not the body text:

```dart
Text('€ 42,00', style: kdMonoStyle(KdMode.light));
```

`KdMode` has four values — `light`, `dark`, `warm` and `contrast` — and
`kdTheme`, `kdColor` and `kdTextTheme` all take one to resolve against.

## Brand colour at runtime

`brandRamp` turns an arbitrary seed colour into the same eleven-step ramp
the shipped palette is built from. The hue stays the customer's; the
lightness is the ladder's — so a bright yellow becomes a dark gold on
which white text is readable. Step 700 carries that guarantee: white text
on it reads at 4.5:1 or better for any seed.

```dart
final ramp = brandRamp(const Color(0xFFFFD400));
final button = ramp[700]!;   // #705C00 — white text on it reads at 6.5:1
```

## Icons

Every icon shares one hand: a 24-unit grid, stroke 1.75, round caps and
joins. `KdIcon` paints it as a `CustomPainter`, so it slots in anywhere a
Material `Icon` would.

```dart
KdIcon(KdIcons.receipt);
```

With no `size` or `color`, it falls back to the ambient `IconTheme` — set
one on an `IconTheme.merge` or a widget's `iconTheme` and every `KdIcon`
underneath it follows. Either can also be given explicitly, and a
`semanticLabel` makes the icon speak to screen readers instead of staying
decorative:

```dart
KdIcon(KdIcons.receipt, size: 20, color: kdColor(KdMode.light, 'brand'));
KdIcon(KdIcons.check, semanticLabel: 'Bestätigt');
```

Eleven icons also come as a filled variant, named with a `Filled` suffix —
`KdIcons.receiptFilled`, `KdIcons.checkFilled` — for a selected or emphasised
state next to the plain outline for the rest. Look any icon up by its source
name (the id used in the icon repository) instead of the generated Dart
name with `KdIcons.byName`:

```dart
KdIcons.byName['cash-drawer'];
```

The set covers seven groups; one example each:

- **navigation** — `KdIcons.arrowLeft`
- **action** — `KdIcons.edit`
- **device** — `KdIcons.monitor`
- **cash** — `KdIcons.receipt`
- **status** — `KdIcons.checkCircle`
- **document** — `KdIcons.file`
- **people** — `KdIcons.user`

## The logo

The Kasseneck logo is drawn from geometry, no asset and no font: the mark as
the three brand paths, the wordmark as Archivo 600 outlines. What you see is
pixel for pixel the brand's SVG.

```dart
KdSignet(size: 40)            // the mark: frame in the icon colour, corner in colorScheme.primary
KdLogo(height: 28)            // mark + wordmark, 332/48 as wide as tall
KdWordmark(height: 28)        // the wordmark alone
```

Colours: `frame`/`ink` and `square`/`accent` (on a dark ground pass a light
ink); `highlight` is the light petrol a tinted cell blends toward.

The mark carries the brand, not the business. On a surface themed in a
customer's own colour (`colorScheme.primary` is theirs there) pass the brand
petrol explicitly — `square: KdRoles.light['brand']` (or the mode's roles) — and never recolour the
corner with the customer's colour: a mark in another colour is a different
mark. The customer's colour belongs to the controls around it.

### Animations

The mark is an 8×8 grid: 32 cells of the frame and the corner, plus a pixel
layer over all 64 fields that is invisible at rest — so the mark can show
pixel art and *become* the logo. Every animation is data
(`brand/animations.json`), identical in this package and `@kreiseck/design`.

```dart
KdLogoMotion(animation: KdLogoAnimations.heart, height: 40)
KdLogoMotion(animation: KdLogoAnimations.breathe, wordmark: false, height: 64)   // the mark alone, loops
KdLogoMotion(animation: KdLogoAnimations.byName['euro']!, onDone: () => go())
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
| `mail` | Brief | exit | 2100 ms · hält bei 1250 |
| `confirm` | Bestätigt | state · success | 1600 ms · hält bei 1000 |
| `error` | Fehler | state · danger | 1450 ms · hält bei 880 |
| `breathe` | Atmen | waiting | 2400 ms · loops |

`loop` overrides the animation's own flag, `autoplay: false` shows the last
frame, and `KdLogoMotionState.play()` restarts (each run draws its own order
for tracks marked random).

An animation in the `state` column names a **colour role** rather than a colour,
and is drawn in `kdColor(mode, 'success' | 'danger')` for the ambient
brightness; a `highlight:` you pass in wins.

Some animations also carry **cues** — moments that tap and sound. `haptics: true`
turns on the touch half, which Flutter carries itself. The sound half is handed
to you, so this package needs no audio dependency: a tone is a spec, and
`kdRenderWav` turns it into bytes for whatever player the app already has.

`hold: true` stops at the animation's **hold point** and stays there: the check
keeps standing, the cross keeps showing, the envelope waits instead of flying
off. It is the moment the sign is finished and nothing is on its way any more
(`KdLogoAnimations.confirm.hold`, in ms). A held run plays only the cues it
reaches, and never loops.

```dart
KdLogoMotion(
  animation: KdLogoAnimations.confirm,
  haptics: true,
  onCue: (cue) {
    final tone = KdSounds.byName[cue.sound];
    if (tone != null) player.play(BytesSource(kdRenderWav(tone)));
  },
)
```

For your own motion, sample the data and hand the styles to the widgets:

```dart
final s = kdSampleLogo(KdLogoAnimations.rain, t);       // t 0..1
KdLogo(height: 28, cells: s.cells, glyphs: s.glyphs, pixels: s.pixels)
```

A `KdLogoStyle` per element carries `opacity`, `scale`, `dx`/`dy` (in cells),
`tint` (toward `highlight`) and `accent` (toward the corner's petrol). At rest
the widgets paint the brand paths, so a static logo never shows seams
between cells.

## Fonts and licence

Archivo and DM Mono ship with the package (`fonts/`) under the SIL Open
Font License; the corresponding `OFL-Archivo.txt` and `OFL-DMMono.txt`
travel with them. The code itself is MIT — see `LICENSE`.

## Source

https://github.com/kreiseck-at/design
