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
  test("produces six ramps of eleven steps", () => {
    expect(Object.keys(model.ramps).sort()).toEqual(
      ["brand", "danger", "info", "neutral", "success", "warning"],
    );
    for (const ramp of Object.values(model.ramps)) {
      expect(Object.keys(ramp)).toHaveLength(11);
    }
  });

  test("hits every anchor", () => {
    expect(model.ramps.brand[500]).toBe("#139E9B");
    expect(model.ramps.brand[700]).toBe("#136B6B");
    expect(model.ramps.neutral[900]).toBe("#132A2A");
    expect(model.ramps.neutral[950]).toBe("#131B1B");
  });

  test("resolves roles to real colours in both modes", () => {
    expect(model.roles.light.brand).toBe("#136B6B");
    expect(model.roles.dark.brand).toBe("#139E9B");
    expect(model.roles.light["on-brand"]).toBe("#FFFFFF");
    expect(model.roles.dark.ground).toBe("#131B1B");
    expect(model.roles.light.ink).toBe("#132A2A");
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
});
