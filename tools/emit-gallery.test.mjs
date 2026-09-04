import { test, expect, describe, beforeAll, it } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "./resolve.mjs";
import { emitGallery } from "./emit-gallery.mjs";

let html, model;
beforeAll(async () => {
  const base = JSON.parse(await readFile(new URL("../tokens/base.json", import.meta.url)));
  const brand = JSON.parse(
    await readFile(new URL("../tokens/brands/kasseneck.json", import.meta.url)),
  );
  model = resolve(base, brand);
  html = emitGallery(model);
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

  it("lists every icon by group with search terms, in stroke and filled, at four sizes", () => {
    const icons = { order: ["receipt"], icons: { receipt: { group: "cash", de: "Beleg", terms: ["bon"], filled: true,
      stroke: [{ tag: "path", attrs: { d: "M6 3h12v18" } }], fill: [{ tag: "path", attrs: { d: "M6 3h12v18z", fill: "currentColor" } }] } } };
    const html = emitGallery(model, icons);
    expect(html).toContain('<section id="icons">');
    expect(html).toContain("<h3>cash</h3>");
    expect(html).toContain('data-terms="receipt beleg bon"');
    expect(html).toMatch(/class="ic s16"[^>]*>.*?<svg/);
    expect(html).toContain("kd-receipt-filled");
    expect(html).toContain('<input type="search" id="icon-search"');
  });

  it("gives the filled cell fill=currentColor and stroke=none instead of the stroke hand, so it doesn't paint over its holes", () => {
    const icons = { order: ["receipt"], icons: { receipt: { group: "cash", de: "Beleg", terms: ["bon"], filled: true,
      stroke: [{ tag: "path", attrs: { d: "M6 3h12v18" } }], fill: [{ tag: "path", attrs: { d: "M6 3h12v18z", fill: "currentColor" } }] } } };
    const html = emitGallery(model, icons);
    expect(html).toContain('<svg class="kd-receipt-filled" viewBox="0 0 24 24" fill="currentColor" stroke="none">');
    const filledCell = html.slice(html.indexOf('class="kd-receipt-filled"'));
    expect(filledCell.slice(0, filledCell.indexOf("</svg>"))).not.toContain("stroke-width");
  });

  it("orders groups by the canonical GROUPS list, not first-seen order", () => {
    const icons = { order: ["a", "b"], icons: {
      a: { group: "cash", de: "A", terms: [], stroke: [] },
      b: { group: "navigation", de: "B", terms: [], stroke: [] },
    } };
    const html = emitGallery(model, icons);
    expect(html.indexOf("<h3>navigation</h3>")).toBeLessThan(html.indexOf("<h3>cash</h3>"));
  });

  it("escapes id, de and terms wherever they land", () => {
    const icons = { order: ["a"], icons: {
      a: { group: "cash", de: 'A "b" <c>', terms: [], stroke: [] },
    } };
    const html = emitGallery(model, icons);
    expect(html).toContain('data-terms="a a &quot;b&quot; &lt;c&gt;"');
    expect(html).toContain("<small>A &quot;b&quot; &lt;c&gt;</small>");
  });
});
