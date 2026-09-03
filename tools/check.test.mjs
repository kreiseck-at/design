import { test, expect, describe, beforeAll } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "./resolve.mjs";
import { check } from "./check.mjs";

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
});
