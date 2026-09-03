import { hexToOklch, oklchToHex } from "./oklch.mjs";
import { steps, ladders, chromaProfiles, brandRampMaxChroma } from "./tokens.js";

const LADDER = ladders.colour;
const PROFILE = chromaProfiles.colour;

/**
 * A ramp from whatever colour a business picked as its own. The hue stays
 * theirs, the lightness is ours — which is why white on step 700 is readable
 * no matter what comes in. Screaming yellow becomes a dark gold.
 *
 * The ladder, profile and chroma ceiling come from the generated tokens, the
 * exact numbers `pnpm build` used for the shipped ramps — not a second copy
 * of them that could drift on its own.
 */
export function brandRamp(seed: string): Record<number, string> {
  const { c, h } = hexToOklch(seed);
  const chroma = Math.min(c / 0.88, brandRampMaxChroma);
  const ramp: Record<number, string> = {};
  steps.forEach((step, i) => {
    ramp[step] = oklchToHex({ l: LADDER[i], c: chroma * PROFILE[i], h });
  });
  return ramp;
}
