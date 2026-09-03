import { describe, test, expect } from "vitest";
import { brandRamp } from "./brand-ramp.js";
import { contrast } from "./contrast.js";

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
});
