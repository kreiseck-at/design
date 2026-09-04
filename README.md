# Design Tokens

Design tokens and an icon set generated from a single source into two published packages: `@kreiseck/design` (npm) and `kreiseck_design` (pub.dev).

## Build

Generate design tokens from source into the output packages:

```bash
pnpm build
```

## Check

Verify that generated output matches the source (fails if out of sync):

```bash
pnpm check
```

## Test

Run the unit test suite:

```bash
pnpm test
```

## Icons

Each icon starts as one file, `icons/<id>.svg`, listed by id in
`icons/index.json` (group, German label, search terms). The source files
speak a small dialect, not full SVG: every icon is one
`<svg viewBox="0 0 24 24">` built only from `path`, `circle`, `rect` and
`line`, with no groups, colours, transforms or stroke attributes, and at
most one decimal place per coordinate. Points stay within 1.5…22.5 to leave
a margin at the edge of the grid, and a `rect` without an `rx` gets a
default corner radius of 2.5.

The hand — stroke 1.75, round caps and joins — is not part of the source;
the build applies it once, uniformly, when it emits each target. Running
`pnpm build` both validates every source file against the dialect and
regenerates the Dart, React, plain SVG and sprite outputs, plus the gallery.

To add an icon: drop the new `icons/<id>.svg`, add its entry to
`icons/index.json`, then run `pnpm build`.

## Why the build fails

Two independent guards protect this repo, and both have been made to fail on
purpose, then restored, to prove they actually catch something.

**A contrast violation aborts `pnpm build`.** Changing `brand-700` in
`tokens/brands/kasseneck.json` from `#136B6B` to `#8FBFBF` (a much lighter
teal) drops the contrast of white text on the brand colour below the 4.5
minimum:

```
$ pnpm build
Token check failed:
  - light: "on-brand" on "brand" is 2.02, needs 4.5
  - light: "brand" on "surface" is 2.02, needs 4.5
  - light: "brand" on "ground" is 1.89, needs 4.5
 ELIFECYCLE  Command failed with exit code 1.
```

**An edited generated file makes `pnpm check` fail.** Hand-editing
`--kd-brand` in `packages/npm/src/tokens.css` so it no longer matches what
the generator would produce from the token source:

```
$ pnpm check
Out of date: packages/npm/src/tokens.css
Run `pnpm build` and commit the result.
 ELIFECYCLE  Command failed with exit code 1.
```

Both changes were reverted (`git checkout <file>`) and rebuilding/rechecking
returned to `done` / `up to date`.
