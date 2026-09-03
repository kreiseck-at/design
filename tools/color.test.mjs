import { test, expect, describe } from "vitest";
import { hexToOklch, oklchToHex, contrast, relativeLuminance } from "./color.mjs";

describe("color", () => {
  test("round trip keeps the colour", () => {
    for (const hex of ["#136B6B", "#132A2A", "#FFFFFF", "#000000", "#D13329"]) {
      expect(oklchToHex(hexToOklch(hex))).toBe(hex);
    }
  });

  test("measures the anchors as specified", () => {
    const brand = hexToOklch("#136B6B");
    expect(brand.l).toBeCloseTo(0.480, 3);
    expect(brand.c).toBeCloseTo(0.077, 3);
    expect(brand.h).toBeCloseTo(194.9, 1);
  });

  test("clips out-of-gamut chroma but keeps the hue", () => {
    const wanted = { l: 0.95, c: 0.35, h: 194.9 };
    const got = hexToOklch(oklchToHex(wanted));
    expect(got.c).toBeLessThan(wanted.c);
    expect(got.h).toBeCloseTo(wanted.h, 0);
  });

  test("contrast matches the WCAG reference values", () => {
    expect(contrast("#FFFFFF", "#000000")).toBeCloseTo(21, 1);
    expect(contrast("#FFFFFF", "#136B6B")).toBeCloseTo(6.28, 2);
    expect(contrast("#132A2A", "#F4F8F8")).toBeCloseTo(14.098, 2);
  });

  test("relative luminance of white is 1", () => {
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 5);
  });
});
