import { describe, test, expect } from "vitest";
import { readFileSync } from "node:fs";
import { brandRamp } from "./brand-ramp.js";
import { contrast } from "./contrast.js";

const golden = JSON.parse(
  readFileSync(new URL("../../../golden/kasseneck.json", import.meta.url), "utf8"),
);

describe("brandRamp", () => {
  test("white stays readable on step 700 for any seed", () => {
    for (const seed of ["#FFD400", "#E11D48", "#1B46F5", "#136B6B", "#7C3AED"]) {
      expect(contrast("#FFFFFF", brandRamp(seed)[700])).toBeGreaterThanOrEqual(4.5);
    }
  });

  test("petrol reproduces the brand anchor closely", () => {
    expect(brandRamp("#136B6B")[700]).toBe("#136B6B");
  });

  test("returns eleven steps", () => {
    expect(Object.keys(brandRamp("#FFD400"))).toHaveLength(11);
  });

  // Pins the runtime function against the fixture generated in resolve.mjs,
  // the twin's contract with the Dart side. If MAX_CHROMA or the ladder
  // drifted from what the build used, this — not a live-rendered gallery —
  // is what would catch it.
  test("matches the golden brandRamp fixture step by step, for every seed", () => {
    const seeds = Object.keys(golden.brandRamp);
    expect(seeds).toHaveLength(4);
    for (const seed of seeds) {
      const ramp = brandRamp(seed);
      const expected = golden.brandRamp[seed];
      for (const step of Object.keys(expected)) {
        expect(ramp[Number(step)], `${seed} step ${step}`).toBe(expected[step]);
      }
    }
  });
});
