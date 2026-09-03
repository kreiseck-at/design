import { hexToOklch, oklchToHex } from "./oklch.mjs";

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const LADDER = [0.972, 0.94, 0.884, 0.812, 0.73, 0.648, 0.566, 0.48, 0.4, 0.325, 0.25];
const PROFILE = [0.1, 0.18, 0.36, 0.58, 0.8, 1.0, 0.98, 0.88, 0.74, 0.56, 0.42];
const MAX_CHROMA = 0.2;

/**
 * A ramp from whatever colour a business picked as its own. The hue stays
 * theirs, the lightness is ours — which is why white on step 700 is readable
 * no matter what comes in. Screaming yellow becomes a dark gold.
 */
export function brandRamp(seed: string): Record<number, string> {
  const { c, h } = hexToOklch(seed);
  const chroma = Math.min(c / 0.88, MAX_CHROMA);
  const ramp: Record<number, string> = {};
  STEPS.forEach((step, i) => {
    ramp[step] = oklchToHex({ l: LADDER[i], c: chroma * PROFILE[i], h });
  });
  return ramp;
}
