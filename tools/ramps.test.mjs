import { test, expect, describe } from "vitest";
import { readFile } from "node:fs/promises";
import { buildRamp } from "./ramps.mjs";
import { hexToOklch } from "./color.mjs";

// Read from the token source rather than a fourth hand-typed copy of the
// same numbers — resolve.mjs, brand-ramp.ts and brand_ramp.dart already
// each carry their own, and a fixed test copy would happily keep passing
// after the real ladder moved out from under it.
const base = JSON.parse(await readFile(new URL("../tokens/base.json", import.meta.url)));
const STEPS = base.steps;
const L_COLOUR = base.ladders.colour;
const C_COLOUR = base.chromaProfiles.colour;
const L_NEUTRAL = base.ladders.neutral;
const C_NEUTRAL = base.chromaProfiles.neutral;

const brand = () =>
  buildRamp({
    hue: 194.9,
    chroma: 0.0875,
    lightness: L_COLOUR,
    chromaProfile: C_COLOUR,
    steps: STEPS,
    anchors: { 500: "#139E9B", 700: "#136B6B" },
  });

describe("buildRamp", () => {
  test("returns one colour per step", () => {
    expect(Object.keys(brand()).map(Number)).toEqual(STEPS);
  });

  test("anchors win over the generated value", () => {
    expect(brand()[500]).toBe("#139E9B");
    expect(brand()[700]).toBe("#136B6B");
  });

  test("lightness decreases monotonically", () => {
    const ramp = brand();
    const ls = STEPS.map((s) => hexToOklch(ramp[s]).l);
    for (let i = 1; i < ls.length; i += 1) expect(ls[i]).toBeLessThan(ls[i - 1]);
  });

  test("keeps the hue wherever chroma makes hue meaningful", () => {
    const ramp = brand();
    // Below roughly c = 0.05 the 8-bit rounding of a channel moves the hue by
    // degrees: at step 50 the requested chroma is 0.0087, where one step of
    // 1/255 in a channel is a large share of the whole chroma. Measured on
    // this ladder: 5.8° at step 50, 2.8° at 100, under 1.4° from 200 down.
    const wide = { 50: 6, 100: 6, 200: 2 };
    for (const step of STEPS) {
      if (step === 500 || step === 700) continue;
      const tolerance = wide[step] ?? 1.5;
      expect(Math.abs(hexToOklch(ramp[step]).h - 194.9)).toBeLessThan(tolerance);
    }
  });

  test("stays in the petrol family even where the hue is unstable", () => {
    const ramp = brand();
    for (const step of [50, 100]) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(ramp[step].slice(i, i + 2), 16));
      expect(r).toBeLessThan(g); // petrol: red is the quiet channel
      expect(Math.abs(g - b)).toBeLessThanOrEqual(4); // green and blue stay together
    }
  });

  test("neutral ramp lands on the two paragraph anchors", () => {
    const neutral = buildRamp({
      hue: 195.5,
      chroma: 0.03,
      lightness: L_NEUTRAL,
      chromaProfile: C_NEUTRAL,
      steps: STEPS,
      anchors: { 900: "#132A2A", 950: "#131B1B" },
    });
    expect(neutral[900]).toBe("#132A2A");
    expect(neutral[950]).toBe("#131B1B");
  });

  test("applies the chroma profile step by step", () => {
    const ramp = brand();
    // Not an ordering check: gamut clipping alone would produce a falling
    // curve even with the profile removed. This pins each step to the
    // chroma the profile asks for — the anchors are excluded because they
    // carry their own.
    STEPS.forEach((step, i) => {
      if (step === 500 || step === 700) return;
      expect(hexToOklch(ramp[step]).c).toBeCloseTo(0.0875 * C_COLOUR[i], 2);
    });
  });

  test("refuses a ladder that does not match the steps", () => {
    expect(() =>
      buildRamp({ hue: 194.9, chroma: 0.0875, lightness: [0.5], chromaProfile: C_COLOUR, steps: STEPS }),
    ).toThrow(/11 entries/);
  });
});
