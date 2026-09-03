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
  kreiseck_design: ^0.1.0
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

## Fonts and licence

Archivo and DM Mono ship with the package (`fonts/`) under the SIL Open
Font License; the corresponding `OFL-Archivo.txt` and `OFL-DMMono.txt`
travel with them. The signet ships as `assets/signet.svg` and
`assets/signet-invers.svg` for dark grounds. The code itself is MIT —
see `LICENSE`.

## Source

https://github.com/kreiseck-at/design
