import { buildRamp, seedRamp } from "./ramps.mjs";

const isLiteral = (value) => value.startsWith("#");

// The four seeds documented for a customer picking their own brand colour:
// a bright yellow, a saturated red, the kasseneck web blue and the petrol
// brand itself (which must reproduce its own anchor exactly).
const BRAND_RAMP_SEEDS = ["#FFD400", "#E11D48", "#1B46F5", "#136B6B"];

/** Turn "brand-700" into the colour it names. */
function lookup(ramps, reference) {
  if (isLiteral(reference)) return reference.toUpperCase();
  const cut = reference.lastIndexOf("-");
  const name = reference.slice(0, cut);
  const step = reference.slice(cut + 1);
  const ramp = ramps[name];
  if (!ramp || !ramp[step]) throw new Error(`unknown token reference: ${reference}`);
  return ramp[step];
}

/**
 * Base plus brand becomes one flat model. Everything downstream — TypeScript,
 * CSS, Dart, the golden file — is written from this and nothing else.
 */
export function resolve(base, brand) {
  const ramps = {};
  for (const [name, spec] of Object.entries(brand.ramps)) {
    ramps[name] = buildRamp({
      hue: spec.hue,
      chroma: spec.chroma,
      lightness: base.ladders[spec.ladder],
      chromaProfile: base.chromaProfiles[spec.ladder],
      steps: base.steps,
      anchors: spec.anchors ?? {},
    });
  }

  const roles = { light: {}, dark: {} };
  for (const [role, modes] of Object.entries(base.roles)) {
    roles.light[role] = lookup(ramps, modes.light);
    roles.dark[role] = lookup(ramps, modes.dark);
  }

  // The runtime `brandRamp(seed)` twin, generated once here with the same
  // ramp code the build already uses so both languages have one contract
  // to test against instead of trusting two hand-typed reimplementations.
  const brandRamp = {};
  for (const seed of BRAND_RAMP_SEEDS) {
    brandRamp[seed] = seedRamp({
      seed,
      steps: base.steps,
      lightness: base.ladders.colour,
      chromaProfile: base.chromaProfiles.colour,
      maxChroma: base.brandRampMaxChroma,
    });
  }

  return {
    brand: brand.name,
    steps: base.steps,
    ladders: base.ladders,
    chromaProfiles: base.chromaProfiles,
    brandRampMaxChroma: base.brandRampMaxChroma,
    ramps,
    roles,
    brandRamp,
    surfacePairs: base.surfacePairs,
    data: base.data,
    form: base.form,
    type: base.type,
    fonts: brand.fonts,
    modes: brand.modes,
    modeOverrides: base.modeOverrides,
  };
}
