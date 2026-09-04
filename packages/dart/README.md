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
- **action** — `KdIcons.settings`
- **device** — `KdIcons.pos`
- **cash** — `KdIcons.receipt`
- **status** — `KdIcons.checkCircle`
- **document** — `KdIcons.file`
- **people** — `KdIcons.user`

## The signet

`KdSignet(size: 40)` draws the Kasseneck mark in two colours: `frame`
(defaults to the ambient icon colour) and `square` (defaults to
`colorScheme.primary`, the brand role). On a dark ground, pass a light
`frame`.

## Fonts and licence

Archivo and DM Mono ship with the package (`fonts/`) under the SIL Open
Font License; the corresponding `OFL-Archivo.txt` and `OFL-DMMono.txt`
travel with them. The code itself is MIT — see `LICENSE`.

## Source

https://github.com/kreiseck-at/design
