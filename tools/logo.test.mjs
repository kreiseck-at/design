import { describe, it, expect } from "vitest";
import { loadLogo, polygonArea } from "./logo.mjs";

const root = new URL("../", import.meta.url);
const logo = await loadLogo(root);

describe("loadLogo — mark", () => {
  it("keeps the three brand paths byte for byte", () => {
    expect(logo.signet.frame).toEqual(["M0 0H48V30H42V6H0Z", "M0 6V48H30V42H6V6Z"]);
    expect(logo.signet.corner).toBe("M30 30H48V48H30Z");
  });
  it("derives 32 cells on the 8×8 grid: 23 frame, 9 corner, row-major", () => {
    expect(logo.grid).toBe(8);
    expect(logo.unit).toBe(6);
    expect(logo.cells).toHaveLength(32);
    expect(logo.cells.filter((c) => c.part === "frame")).toHaveLength(23);
    expect(logo.cells.filter((c) => c.part === "corner")).toHaveLength(9);
    expect(logo.cells[0]).toEqual({ index: 0, row: 0, col: 0, part: "frame" });
    expect(logo.cells.at(-1)).toEqual({ index: 31, row: 7, col: 7, part: "corner" });
    const sorted = [...logo.cells].sort((a, b) => a.row - b.row || a.col - b.col);
    expect(logo.cells).toEqual(sorted);
  });
  it("cells cover exactly the area of the paths — nothing hand-listed", () => {
    const frameArea = logo.signet.frame.reduce((s, d) => s + polygonArea(d), 0);
    expect(frameArea).toBe(23 * 36);
    expect(polygonArea(logo.signet.corner)).toBe(9 * 36);
  });
});

describe("loadLogo — wordmark", () => {
  it("splits into nine glyphs spelling Kasseneck, counters attached to their letter", () => {
    expect(logo.glyphs.map((g) => g.char).join("")).toBe("Kasseneck");
    expect(logo.glyphs.map((g) => g.holes)).toEqual([0, 1, 0, 0, 1, 0, 1, 0, 0]);
  });
  it("orders glyphs left to right inside the 332×48 box", () => {
    const xs = logo.glyphs.map((g) => g.bbox.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(xs[0]).toBeCloseTo(73.028, 3);
    const right = Math.max(...logo.glyphs.map((g) => g.bbox.x + g.bbox.width));
    expect(right).toBeLessThanOrEqual(332);
    expect(logo.viewBox).toEqual({ width: 332, height: 48 });
  });
  it("loses nothing: glyph paths joined are the source path", () => {
    const strip = (d) => d.replace(/\s+/g, "");
    expect(strip(logo.glyphs.map((g) => g.d).join(""))).toBe(strip(logo.wordmark.d));
  });
  it("parses every glyph into ops Dart can draw (M/L/C/Z only)", () => {
    for (const g of logo.glyphs) {
      expect(g.ops.length).toBeGreaterThan(3);
      expect(g.ops.every((op) => "MLCZ".includes(op[0]))).toBe(true);
    }
  });
});
