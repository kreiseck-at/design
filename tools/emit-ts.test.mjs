import { test, expect, describe, beforeAll } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "./resolve.mjs";
import { emitTs } from "./emit-ts.mjs";

let out;
beforeAll(async () => {
  const base = JSON.parse(await readFile(new URL("../tokens/base.json", import.meta.url)));
  const brand = JSON.parse(
    await readFile(new URL("../tokens/brands/kasseneck.json", import.meta.url)),
  );
  out = emitTs(resolve(base, brand));
});

describe("emitTs", () => {
  test("declares every role as a custom property in both modes", () => {
    expect(out.css).toContain("--kd-brand: #136B6B;");
    expect(out.css).toContain('[data-kd-mode="dark"]');
    expect(out.css).toMatch(/\[data-kd-mode="dark"\][\s\S]*--kd-brand: #139E9B;/);
  });

  test("never leaves a colour defined in only one mode", () => {
    const light = [...out.css.matchAll(/--kd-([a-z-]+): #/g)].map((m) => m[1]);
    const dark = [...out.css.split('[data-kd-mode="dark"]')[1].matchAll(/--kd-([a-z-]+): #/g)]
      .map((m) => m[1]);
    expect(new Set(dark)).toEqual(new Set(light));
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
});
