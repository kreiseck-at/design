import { contrast } from "./color.mjs";

const TEXT = 4.5;
const CONTROL = 3.0;

/**
 * Contrast between two roles, guarded: a role missing from the table (e.g.
 * a deleted token) reports a proper problem string instead of throwing out
 * of the colour code with a bare TypeError.
 */
function pairContrast(mode, roles, role, against, threshold, verb, problems) {
  const a = roles[role];
  const b = roles[against];
  if (!a || !b) {
    const missing = !a ? role : against;
    problems.push(`${mode}: role "${missing}" is missing`);
    return;
  }
  const value = contrast(a, b);
  if (value < threshold) {
    problems.push(`${mode}: "${role}" ${verb} "${against}" is ${value.toFixed(2)}, needs ${threshold}`);
  }
}

/**
 * Every rule here is one that was broken somewhere in the house before this
 * package existed. The build fails on a problem; a design system that only
 * documents its promises does not keep them.
 */
export function check(model) {
  const problems = [];

  for (const mode of Object.keys(model.roles)) {
    const roles = model.roles[mode];

    // 1. Every surface carries its ink, and the pair is readable.
    for (const [surface, ink] of Object.entries(model.surfacePairs)) {
      if (!roles[surface]) {
        problems.push(`${mode}: role "${surface}" is missing`);
        continue;
      }
      if (!roles[ink]) {
        problems.push(`${mode}: surface "${surface}" has no ink token "${ink}"`);
        continue;
      }
      const value = contrast(roles[ink], roles[surface]);
      if (value < TEXT) {
        problems.push(
          `${mode}: "${ink}" on "${surface}" is ${value.toFixed(2)}, needs ${TEXT}`,
        );
      }
    }

    // 2. Muted text still has to be readable everywhere it is actually put
    //    down, not only on the page ground — a table header on a raised
    //    card and helper text on a tinted brand surface are ordinary spots.
    for (const against of ["ground", "surface", "surface-raised", "brand-surface"]) {
      pairContrast(mode, roles, "ink-muted", against, TEXT, "on", problems);
    }

    // 3. The boundary of a control (WCAG 1.4.11) — the rule the whole house
    //    was failing: 1.24 to 1.56 instead of 3.
    for (const [role, against] of [
      ["border", "surface"],
      ["border", "ground"],
      ["border", "surface-raised"],
      // `control` carries the same tone as `border` but does a different
      // job: it FILLS a control (a switch track, an unchecked box) instead
      // of drawing its edge. A filled control still has to be identifiable
      // against whatever it sits on, and the thing riding on it (a switch
      // knob) has to be identifiable against the fill -- both are 1.4.11
      // boundaries, not text, so they gate at 3:1 and stay out of
      // `surfacePairs` (which gates at 4.5 for text).
      ["control", "surface"],
      ["control", "ground"],
      ["control", "surface-raised"],
      ["on-control", "control"],
      ["focus", "ground"],
      ["focus", "surface-raised"],
      ["focus", "surface"],
    ]) {
      pairContrast(mode, roles, role, against, CONTROL, "against", problems);
    }

    // 4. Data colours must be visible on the ground they are drawn on.
    // `model.data` only distinguishes light/dark; `warm` (a re-coloured
    // neutral ladder) and `contrast` (sharper edges, same hues) check
    // their categorical colours against the light set.
    if (!roles.ground) {
      problems.push(`${mode}: role "ground" is missing`);
    } else {
      (model.data[mode] ?? model.data.light).forEach((colour, i) => {
        const value = contrast(colour, roles.ground);
        if (value < CONTROL) {
          problems.push(
            `${mode}: data slot ${i + 1} (${colour}) against "ground" is ${value.toFixed(2)}, needs ${CONTROL}`,
          );
        }
      });
    }

    // 5. Semantic ink is written on cards and on the page, not only inside
    //    its own tinted surface. `surface-raised` is deliberately absent:
    //    it carries header text and active-field chrome in `ink`, never
    //    coloured text.
    for (const role of ["success", "warning", "danger", "info", "brand"]) {
      for (const against of ["surface", "ground"]) {
        pairContrast(mode, roles, role, against, TEXT, "on", problems);
      }
    }

    // `danger-strong` is a signal tone for surfaces and icons, not body
    // text — it answers to the control threshold.
    for (const against of ["surface", "ground"]) {
      pairContrast(mode, roles, "danger-strong", against, CONTROL, "on", problems);
    }
  }

  return { ok: problems.length === 0, problems };
}
