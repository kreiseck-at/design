## 0.8.0

- Added: five animations. `mail` and `mailslot` are the first of a new kind —
  the logo becomes a sign and the sign leaves, one flying off, the other posted
  into the corner. `confirm` and `error` go the same way and come back, so the
  mark can answer an action. `heartbeat` now beats lub-dub instead of ticking.
- Added: `hold` stops a run at the animation's hold point and stays there — the
  check keeps standing, the cross keeps showing, the envelope waits. The point
  itself is data (`animations.confirm.hold`), chosen where nothing is mid-move.
- Added: an animation may name a **colour role** rather than a colour.
  `confirm` is drawn in `success`, `error` in `danger-deep`, resolved per
  surface in light and dark; `animationHighlight` gives you the value when you
  sample by hand. A `highlight` you pass in still wins.
- Added: **cues** — moments that tap and sound, and the tones behind them
  (`sounds`). Tones are specs, not files, played on the Web Audio API; a note
  may glide to a second frequency. Both halves are off until asked for:
  `<LogoMotion sound haptics />`. `playSound` and `tapHaptic` work on their own.
  `navigator.vibrate` does not exist on iOS Safari, where taps stay silent.
- Added: role `danger-deep` — danger that sits quietly against a light page.

## 0.7.0

- Added: `@kreiseck/design/logo` — the Kasseneck logo as React components
  (`Signet`, `Wordmark`, `Logo`) drawn from geometry: the mark as the brand
  paths, the wordmark as Archivo 600 outlines. The mark animates cell by cell
  on its 8×8 grid (`cells`) and carries a pixel layer over all 64 fields
  (`pixels`) for pixel art that turns into the mark.
- Added: `LogoMotion` plays the data-defined animations (rain, bloom, scatter,
  heart, heartbeat, euro, check, star, lock, receipt, breathe); `sample` gives per-element
  styles for custom motion. The same data drives the Flutter package
  `kreiseck_design`; the golden fixture holds sampled frames both must reproduce.
