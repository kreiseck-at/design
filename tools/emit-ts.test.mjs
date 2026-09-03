import { test, expect, describe, beforeAll } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "./resolve.mjs";
import { emitTs } from "./emit-ts.mjs";

let out;
let model;
beforeAll(async () => {
  const base = JSON.parse(await readFile(new URL("../tokens/base.json", import.meta.url)));
  const brand = JSON.parse(
    await readFile(new URL("../tokens/brands/kasseneck.json", import.meta.url)),
  );
  model = resolve(base, brand);
  out = emitTs(model);
});

describe("emitTs", () => {
  test("declares every role as a custom property in both modes", () => {
    expect(out.css).toContain("--kd-brand: #136B6B;");
    expect(out.css).toContain('[data-kd-mode="dark"]');
    expect(out.css).toMatch(/\[data-kd-mode="dark"\][\s\S]*--kd-brand: #139E9B;/);
  });

  test("never leaves a colour defined in only one mode", () => {
    // Both sets must be scoped to their own block. Matching over the whole
    // document made the light set pick up the dark block's declarations, so
    // a role missing from :root alone went unnoticed.
    const [lightBlock, darkBlock] = out.css.split('[data-kd-mode="dark"]');
    const names = (block) => new Set([...block.matchAll(/--kd-([a-z-]+): #/g)].map((m) => m[1]));
    expect(names(lightBlock).size).toBeGreaterThan(0);
    expect(names(darkBlock)).toEqual(names(lightBlock));
  });

  test("exports typed ramps and roles", () => {
    expect(out.ts).toContain("export const ramps =");
    expect(out.ts).toContain('"700": "#136B6B"');
    expect(out.ts).toContain("export const roles =");
    expect(out.ts).toContain("export type Role =");
  });

  test("carries the generated-file warning", () => {
    expect(out.ts.startsWith("// Generated from tokens/")).toBe(true);
    expect(out.css.startsWith("/* Generated from tokens/")).toBe(true);
  });

  test("declares shadow and focus-ring custom properties", () => {
    expect(out.css).toContain("--kd-shadow-1: 0 1px 2px rgba(19, 27, 27, 0.08);");
    expect(out.css).toContain("--kd-shadow-2:");
    expect(out.css).toContain("--kd-shadow-3:");
    expect(out.css).toContain("--kd-focus-ring-width: 2px;");
    expect(out.css).toContain("--kd-focus-ring-offset: 2px;");
  });

  test("the contrast mode override carries border width, focus ring and shadows", () => {
    const block = out.css.split('[data-kd-mode="contrast"]')[1].split("}")[0];
    expect(block).toContain("--kd-border-width: 2px;");
    expect(block).toContain("--kd-focus-ring-width: 3px;");
    expect(block).toContain("--kd-focus-ring-offset: 2px;");
    expect(block).toContain("--kd-shadow-1: none;");
    expect(block).toContain("--kd-shadow-2: none;");
    expect(block).toContain("--kd-shadow-3: none;");
  });

  test("the dark media guard applies whenever no mode is pinned, not only light", () => {
    // A page pinned to `contrast` on a dark-scheme OS must not silently get
    // the dark palette: the guard has to exclude every explicit mode, not
    // just "light".
    expect(out.css).toContain(":root:not([data-kd-mode]) {");
    expect(out.css).not.toContain(':root:not([data-kd-mode="light"])');
  });

  test("exports form and typography", () => {
    expect(out.ts).toContain("export const form =");
    expect(out.ts).toContain("export const typography =");
  });

  test("does not offer a deferred mode nobody built role values for", () => {
    // A mode a caller can pass has to be a mode the roles table actually
    // has values for — the type union always matches `brand.modes`.
    expect(out.ts).toContain('export type Mode = "light" | "warm" | "dark" | "contrast";');
  });

  test("emits one block per mode with the full role set", () => {
    for (const mode of model.modes.filter((m) => m !== "light")) {
      const block = out.css.split(`[data-kd-mode="${mode}"]`)[1].split("}")[0];
      expect([...block.matchAll(/--kd-([a-z-]+): #/g)].length).toBe(
        Object.keys(model.roles.light).length,
      );
    }
    expect(out.ts).toContain('"light" | "warm" | "dark" | "contrast"');
  });
});
