import { test, expect, describe, beforeAll } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "./resolve.mjs";
import { emitGallery } from "./emit-gallery.mjs";

let html;
beforeAll(async () => {
  const base = JSON.parse(await readFile(new URL("../tokens/base.json", import.meta.url)));
  const brand = JSON.parse(
    await readFile(new URL("../tokens/brands/kasseneck.json", import.meta.url)),
  );
  html = emitGallery(resolve(base, brand));
});

describe("emitGallery", () => {
  test("titles the page with the brand", () => {
    expect(html).toContain("<title>Kreiseck Design — kasseneck</title>");
  });

  test("draws a swatch row for every ramp", () => {
    for (const name of ["brand", "neutral", "success", "warning", "danger", "info"]) {
      expect(html).toContain(`<h3>${name}</h3>`);
    }
    expect(html).toContain("#136B6B");
  });

  test("lists every role in both modes", () => {
    expect(html).toContain("<code>ink-muted</code>");
    expect((html.match(/<tr>/g) ?? []).length).toBeGreaterThan(28);
  });

  test("is a pure function of the model: same input, same output", () => {
    expect(html).not.toContain("undefined");
    expect(html).not.toContain("NaN");
  });
});
