import { test, expect, describe, beforeAll } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "./resolve.mjs";
import { check } from "./check.mjs";
import { contrast } from "./color.mjs";

let model;
beforeAll(async () => {
  const base = JSON.parse(await readFile(new URL("../tokens/base.json", import.meta.url)));
  const brand = JSON.parse(
    await readFile(new URL("../tokens/brands/kasseneck.json", import.meta.url)),
  );
  model = resolve(base, brand);
});

describe("check", () => {
  test("the shipped tokens pass", () => {
    const result = check(model);
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
  });

  test("catches text that is too pale on its surface", () => {
    const broken = structuredClone(model);
    broken.roles.light["on-surface"] = "#BBBBBB";
    const result = check(broken);
    expect(result.ok).toBe(false);
    expect(result.problems.join(" ")).toMatch(/on-surface.*surface/);
  });

  test("catches a border below 3:1", () => {
    const broken = structuredClone(model);
    broken.roles.light.border = "#DCE0E5";
    const result = check(broken);
    expect(result.ok).toBe(false);
    expect(result.problems.join(" ")).toMatch(/border/);
  });

  test("catches a surface without its ink", () => {
    const broken = structuredClone(model);
    delete broken.roles.light["on-ground"];
    const result = check(broken);
    expect(result.ok).toBe(false);
    expect(result.problems.join(" ")).toMatch(/on-ground/);
  });

  test("catches a data colour that vanishes against its ground", () => {
    const broken = structuredClone(model);
    broken.data.light = [...broken.data.light.slice(1), "#F7FAFA"];
    const result = check(broken);
    expect(result.ok).toBe(false);
    expect(result.problems.join(" ")).toMatch(/data/);
  });

  test("catches semantic ink that is unreadable on a card", () => {
    const broken = structuredClone(model);
    broken.roles.light.success = "#A9D8C0";
    const result = check(broken);
    expect(result.ok).toBe(false);
    expect(result.problems.join(" ")).toMatch(/success.*surface/);
  });

  test("catches a border that vanishes against a raised surface", () => {
    const broken = structuredClone(model);
    broken.roles.light["surface-raised"] = broken.roles.light.border;
    const result = check(broken);
    expect(result.ok).toBe(false);
    expect(result.problems.join(" ")).toMatch(/border.*surface-raised/);
  });

  test("catches muted text that fails only on the tinted brand surface", () => {
    const broken = structuredClone(model);
    // Clears the plain ground (what rule 2 used to check alone) and the
    // white card, but not the tinted brand-surface it also sits on
    // (helper text in a focused field) — the surface the widening added.
    broken.roles.light["ink-muted"] = "#6C6C6C";
    const result = check(broken);
    expect(contrast(broken.roles.light["ink-muted"], broken.roles.light.ground)).toBeGreaterThanOrEqual(4.5);
    expect(result.ok).toBe(false);
    expect(result.problems.join(" ")).toMatch(/ink-muted.*brand-surface/);
  });

  test("catches a focus ring that vanishes against a plain white card", () => {
    const broken = structuredClone(model);
    broken.roles.light.focus = "#E3EDEC";
    const result = check(broken);
    expect(result.ok).toBe(false);
    expect(result.problems.join(" ")).toMatch(/"focus" against "surface"/);
  });

  test("reports a missing role instead of throwing", () => {
    const broken = structuredClone(model);
    delete broken.roles.light["ink-muted"];
    expect(() => check(broken)).not.toThrow();
    const result = check(broken);
    expect(result.ok).toBe(false);
    expect(result.problems.join(" ")).toMatch(/"ink-muted" is missing/);
  });

  test("reports a missing surface (not only a missing ink) instead of throwing", () => {
    // Rule 1 guarded the ink side of a surface pair but not the surface
    // itself: deleting "danger" (a surfacePairs key) used to reach the
    // colour code with `undefined` and throw a bare TypeError.
    const broken = structuredClone(model);
    delete broken.roles.light.danger;
    expect(() => check(broken)).not.toThrow();
    const result = check(broken);
    expect(result.ok).toBe(false);
    expect(result.problems.join(" ")).toMatch(/"danger" is missing/);
  });

  test("every role can be dropped without the checker throwing", () => {
    for (const role of Object.keys(model.roles.light)) {
      const broken = structuredClone(model);
      delete broken.roles.light[role];
      expect(() => check(broken), `dropping "${role}"`).not.toThrow();
    }
  });

  test("checks every mode, not only light and dark", () => {
    const broken = structuredClone(model);
    broken.roles.warm["on-surface"] = "#CCCCCC";
    const result = check(broken);
    expect(result.ok).toBe(false);
    expect(result.problems.join(" ")).toMatch(/warm: "on-surface"/);
  });
});
