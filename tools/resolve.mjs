import { buildRamp } from "./ramps.mjs";

const isLiteral = (value) => value.startsWith("#");

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

  return {
    brand: brand.name,
    ramps,
    roles,
    surfacePairs: base.surfacePairs,
    data: base.data,
    form: base.form,
    type: base.type,
    fonts: brand.fonts,
    modes: brand.modes,
    modeOverrides: base.modeOverrides,
  };
}
