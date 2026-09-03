# Design Tokens

Design tokens generated from a single source into two published packages: `@kreiseck/design` (npm) and `kreiseck_design` (pub.dev).

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
