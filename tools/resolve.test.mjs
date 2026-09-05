import { test, expect, describe, beforeAll } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "./resolve.mjs";

let model;
beforeAll(async () => {
  const base = JSON.parse(await readFile(new URL("../tokens/base.json", import.meta.url)));
  const brand = JSON.parse(
    await readFile(new URL("../tokens/brands/kasseneck.json", import.meta.url)),
  );
  model = resolve(base, brand);
});

describe("resolve", () => {
  test("produces seven ramps of eleven steps", () => {
    expect(Object.keys(model.ramps).sort()).toEqual(
      ["brand", "danger", "info", "neutral", "neutralWarm", "success", "warning"],
    );
    for (const ramp of Object.values(model.ramps)) {
      expect(Object.keys(ramp)).toHaveLength(11);
    }
  });

  test("hits every anchor", () => {
    // Neutral carries no anchors any more — it is a plain generated ramp,
    // same as every other colour ramp except brand.
    expect(model.ramps.brand[500]).toBe("#139E9B");
    expect(model.ramps.brand[700]).toBe("#136B6B");
  });

  test("resolves roles to real colours in both modes", () => {
    expect(model.roles.light.brand).toBe("#136B6B");
    expect(model.roles.dark.brand).toBe("#139E9B");
    expect(model.roles.light["on-brand"]).toBe("#FFFFFF");
    expect(model.roles.dark.ground).toBe("#181A1A");
    expect(model.roles.light.ink).toBe("#222626");
  });

  test("carries form, type and data through untouched", () => {
    expect(model.form.radius.md).toBe(10);
    expect(model.type.body.size).toBe(16);
    expect(model.data.light).toHaveLength(8);
  });

  test("rejects a role pointing at a step that does not exist", () => {
    const base = { steps: [50], ladders: { colour: [0.9] }, chromaProfiles: { colour: [1] },
      roles: { x: { light: "brand-999", dark: "brand-50" } }, surfacePairs: {},
      data: { light: [], dark: [] }, form: {}, type: {}, modeOverrides: {} };
    const brand = { name: "t", ramps: { brand: { hue: 0, chroma: 0.1, ladder: "colour" } },
      fonts: {}, modes: ["light"] };
    expect(() => resolve(base, brand)).toThrow(/brand-999/);
  });

  test("resolves every mode the brand offers, falling back to light", () => {
    expect(Object.keys(model.roles).sort()).toEqual(["contrast", "dark", "light", "warm"]);
    expect(model.roles.warm.ground).not.toBe(model.roles.light.ground);   // own ramp
    expect(model.roles.warm.brand).toBe(model.roles.light.brand);         // fallback
    expect(model.roles.contrast.border).toBe("#000000");                  // own value
    expect(model.roles.contrast.danger).toBe(model.roles.light.danger);   // fallback
  });

  test("throws naming the role when a mandatory column is missing", () => {
    const base = { steps: [50], ladders: { colour: [0.9] }, chromaProfiles: { colour: [1] },
      roles: { x: { light: "brand-50" } }, surfacePairs: {},
      data: { light: [], dark: [] }, form: {}, type: {}, modeOverrides: {} };
    const brand = { name: "t", ramps: { brand: { hue: 0, chroma: 0.1, ladder: "colour" } },
      fonts: {}, modes: ["light"] };
    expect(() => resolve(base, brand)).toThrow(/"x".*"dark"/);
  });

  test("a ramp can opt into a chroma profile different from its ladder's", () => {
    // Same hue, same chroma, same ladder — `neutralWarm` only adds
    // `profile: "warm"`. If the field were ignored it would be identical to
    // `neutral` at every step; the pale end is where the warm profile (more
    // chroma at 50/100) makes the biggest difference.
    expect(model.ramps.neutralWarm[50]).not.toBe(model.ramps.neutral[50]);
    expect(model.ramps.neutralWarm[50]).toBe("#FBF6EE");
  });
});
