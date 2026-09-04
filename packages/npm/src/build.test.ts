import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";

describe.skipIf(!existsSync(new URL("../dist", import.meta.url)))("dist", () => {
  it("has both entries with types", () => {
    for (const f of ["index.js", "index.d.ts", "icons.js", "icons.d.ts"]) expect(existsSync(new URL(`../dist/${f}`, import.meta.url))).toBe(true);
  });
});
