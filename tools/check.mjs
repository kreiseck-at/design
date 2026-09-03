import { contrast } from "./color.mjs";

const TEXT = 4.5;
const CONTROL = 3.0;

/**
 * Every rule here is one that was broken somewhere in the house before this
 * package existed. The build fails on a problem; a design system that only
 * documents its promises does not keep them.
 */
export function check(model) {
  const problems = [];

  for (const mode of ["light", "dark"]) {
    const roles = model.roles[mode];

    // 1. Every surface carries its ink, and the pair is readable.
    for (const [surface, ink] of Object.entries(model.surfacePairs)) {
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

    // 2. Muted text still has to be readable on the page ground.
    const muted = contrast(roles["ink-muted"], roles.ground);
    if (muted < TEXT) {
      problems.push(`${mode}: "ink-muted" on "ground" is ${muted.toFixed(2)}, needs ${TEXT}`);
    }

    // 3. The boundary of a control (WCAG 1.4.11) — the rule the whole house
    //    was failing: 1.24 to 1.56 instead of 3.
    for (const [role, against] of [["border", "surface"], ["border", "ground"], ["focus", "ground"]]) {
      const value = contrast(roles[role], roles[against]);
      if (value < CONTROL) {
        problems.push(
          `${mode}: "${role}" against "${against}" is ${value.toFixed(2)}, needs ${CONTROL}`,
        );
      }
    }

    // 4. Data colours must be visible on the ground they are drawn on.
    model.data[mode].forEach((colour, i) => {
      const value = contrast(colour, roles.ground);
      if (value < CONTROL) {
        problems.push(
          `${mode}: data slot ${i + 1} (${colour}) against "ground" is ${value.toFixed(2)}, needs ${CONTROL}`,
        );
      }
    });
  }

  return { ok: problems.length === 0, problems };
}
