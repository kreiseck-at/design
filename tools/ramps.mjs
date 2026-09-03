import { oklchToHex } from "./color.mjs";

/**
 * One ramp from one hue. The lightness ladder is shared across all colour
 * ramps, so step 600 is equally light in every ramp and colours can be
 * swapped without the picture tipping over.
 *
 * `anchors` overwrite the generated value for that step. They exist because
 * three values are fixed by the brand and must be hit exactly.
 */
export function buildRamp({ hue, chroma, lightness, chromaProfile, steps, anchors = {} }) {
  if (lightness.length !== steps.length || chromaProfile.length !== steps.length) {
    throw new Error(`ladder and profile must have ${steps.length} entries`);
  }
  const ramp = {};
  steps.forEach((step, i) => {
    ramp[step] =
      anchors[step] ?? oklchToHex({ l: lightness[i], c: chroma * chromaProfile[i], h: hue });
  });
  return ramp;
}
