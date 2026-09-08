## 0.7.0

- Added: `@kreiseck/design/logo` — the Kasseneck logo as React components
  (`Signet`, `Wordmark`, `Logo`) drawn from geometry: the mark as the brand
  paths, the wordmark as Archivo 600 outlines. The mark animates cell by cell
  on its 8×8 grid (`cells`) and carries a pixel layer over all 64 fields
  (`pixels`) for pixel art that turns into the mark.
- Added: `LogoMotion` plays the data-defined animations (rain, bloom, scatter,
  heart, euro, check, star, lock, receipt, breathe); `sample` gives per-element
  styles for custom motion. The same data drives the Flutter package
  `kreiseck_design`; the golden fixture holds sampled frames both must reproduce.
