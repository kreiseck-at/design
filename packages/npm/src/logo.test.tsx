import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { readFileSync } from "node:fs";
import { Signet, Wordmark, Logo, LogoMotion, sample, flatten, animations, animationNames, FRAME_PATHS, CORNER_PATH, glyphs, cells, SAMPLE_TIMES } from "./logo/index.js";

const golden = JSON.parse(readFileSync(new URL("../../../golden/kasseneck.json", import.meta.url), "utf8")).logo;
const source = readFileSync(new URL("../../../brand/kasseneck-logo.svg", import.meta.url), "utf8");
const sourcePaths = [...source.matchAll(/<path d="([^"]+)"/g)].map((m) => m[1]);
const ds = (html: string) => [...html.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]);
const strip = (s: string) => s.replace(/\s+/g, "");

describe("Signet", () => {
  it("at rest renders the three brand paths byte for byte, nothing else", () => {
    const html = renderToStaticMarkup(createElement(Signet));
    expect(html).toContain('viewBox="0 0 48 48"');
    expect(html).toContain('width="40"');
    expect(html).toContain('aria-hidden="true"');
    expect(ds(html)).toEqual([...FRAME_PATHS, CORNER_PATH]);
    expect(ds(html)).toEqual(sourcePaths.slice(0, 3));
    expect(html).not.toContain("<rect");
    expect(html).toContain('fill="currentColor"');
    expect(html).toContain('fill="var(--kd-brand, #136B6B)"');
  });
  it("switches to one rect per cell only when a cell leaves rest", () => {
    const rest = cells.map(() => ({ opacity: 1, scale: 1, dx: 0, dy: 0, tint: 0, accent: 0 }));
    expect(renderToStaticMarkup(createElement(Signet, { cells: rest }))).not.toContain("<rect");
    const moved = rest.map((s, i) => (i === 3 ? { ...s, opacity: 0.5, tint: 0.25 } : s));
    const html = renderToStaticMarkup(createElement(Signet, { cells: moved, ink: "#000", highlight: "#0ff" }));
    expect(html.match(/<rect/g)).toHaveLength(32);
    expect(html).toContain('opacity="0.5"');
    expect(html).toContain('fill="color-mix(in oklab, #000, #0ff 25%)"');
    const gone = rest.map((s, i) => (i === 0 ? { ...s, opacity: 0 } : s));
    expect(renderToStaticMarkup(createElement(Signet, { cells: gone })).match(/<rect/g)).toHaveLength(31);
  });
  it("a title makes it an image", () => {
    const html = renderToStaticMarkup(createElement(Signet, { title: "Kasseneck" }));
    expect(html).toContain('role="img"');
    expect(html).toContain("<title>Kasseneck</title>");
  });
});

describe("Wordmark", () => {
  it("renders the nine glyphs; joined they are the source path — no font involved", () => {
    const html = renderToStaticMarkup(createElement(Wordmark, { height: 48 }));
    expect(html).toContain('viewBox="69 0 263 48"');
    expect(html).toContain('width="263"');
    const paths = ds(html);
    expect(paths).toHaveLength(9);
    expect(strip(paths.join(""))).toBe(strip(sourcePaths[3]));
    expect(html).not.toContain("<text");
  });
  it("moves, scales and tints a glyph around its own centre", () => {
    const rest = glyphs.map(() => ({ opacity: 1, scale: 1, dx: 0, dy: 0, tint: 0, accent: 0 }));
    rest[0] = { opacity: 1, scale: 0.5, dx: 1, dy: 0, tint: 1, accent: 0 };
    const html = renderToStaticMarkup(createElement(Wordmark, { glyphs: rest, ink: "#000", highlight: "#0ff" }));
    const cx = glyphs[0].bbox.x + glyphs[0].bbox.width / 2, cy = glyphs[0].bbox.y + glyphs[0].bbox.height / 2;
    expect(html).toContain(`transform="translate(${Math.round((cx + 6) * 1000) / 1000} ${Math.round(cy * 1000) / 1000}) scale(0.5)`);
    expect(html).toContain('fill="#0ff"');
  });
});

describe("Logo", () => {
  it("is the brand box, 332/48 as wide as tall, named Kasseneck", () => {
    const html = renderToStaticMarkup(createElement(Logo, { height: 48 }));
    expect(html).toContain('viewBox="0 0 332 48"');
    expect(html).toContain('width="332"');
    expect(html).toContain('role="img"');
    expect(html).toContain("<title>Kasseneck</title>");
    expect(ds(html)).toEqual(sourcePaths.slice(0, 3).concat(glyphs.map((g) => g.d)));
  });
});

describe("animations — twin contract", () => {
  it("every golden animation exists here and nothing more", () => {
    expect(Object.keys(golden.animations).sort()).toEqual([...animationNames].sort());
    expect(Object.keys(animations).sort()).toEqual([...animationNames].sort());
  });
  it("every sample of every animation matches the golden", () => {
    let checked = 0;
    for (const [name, meta] of Object.entries<any>(golden.animations)) {
      const anim = animations[name];
      expect(anim.duration).toBe(meta.duration);
      expect(anim.loop).toBe(meta.loop);
      for (const [t, line] of Object.entries<string>(meta.samples)) {
        expect(flatten(sample(anim, Number(t))).join(","), `${name} at ${t}`).toBe(line);
        checked++;
      }
    }
    expect(checked).toBe(Object.keys(golden.animations).length * SAMPLE_TIMES.length);
  });
});

describe("LogoMotion", () => {
  it("renders the first frame on the server", () => {
    const html = renderToStaticMarkup(createElement(LogoMotion, { animation: "scatter", height: 48 }));
    expect(html).toContain('viewBox="0 0 332 48"');
    // Frame 0 of "scatter" hides everything: the cell container is there, no rect yet.
    expect(html).toContain('class="kd-signet-cells"');
    expect(html).not.toContain("<rect");
    const mark = renderToStaticMarkup(createElement(LogoMotion, { animation: "breathe", wordmark: false, height: 40 }));
    expect(mark).toContain('viewBox="0 0 48 48"');
  });
});

describe("frame changes", () => {
  it("cells and glyphs never share a key, and each group has its own container", () => {
    // Rendering the same tree twice with different states would otherwise
    // leave React pairing a rect with a path — stale cells on screen.
    const s = sample(animations.rain, 0.5);
    const html = renderToStaticMarkup(createElement(Logo, { cells: s.cells, glyphs: s.glyphs, pixels: s.pixels }));
    expect(html).toContain('class="kd-signet-cells"');
    expect(html).toContain('class="kd-wordmark-glyphs"');
    // Rain starts with everything hidden: no rect, no glyph path, no pixel.
    const start = sample(animations.rain, 0);
    const empty = renderToStaticMarkup(createElement(Logo, { cells: start.cells, glyphs: start.glyphs, pixels: start.pixels }));
    expect(empty).not.toContain("<rect");
    expect(empty).not.toContain(" d=");
  });
});

describe("pixel art", () => {
  it("draws the lit pixels of the heart while the mark's cells are still hidden", () => {
    const s = sample(animations.heart, 0.4);
    expect(s.cells.every((c) => c.opacity === 0)).toBe(true);
    const lit = s.pixels.filter((p) => p.opacity > 0).length;
    expect(lit).toBe(32); // the heart bitmap has 32 lit fields
    const html = renderToStaticMarkup(createElement(Signet, { cells: s.cells, pixels: s.pixels, ink: "#000", accent: "#0f0", highlight: "#0ff" }));
    expect(html).toContain('class="kd-signet-pixels"');
    expect(html.match(/<rect/g)).toHaveLength(32);
    expect(html).toContain('fill="#0f0"'); // the heart wears the corner's petrol
  });
  it("at rest the pixel layer renders nothing", () => {
    const s = sample(animations.heart, 1);
    const html = renderToStaticMarkup(createElement(Signet, { cells: s.cells, pixels: s.pixels }));
    expect(html).not.toContain("kd-signet-pixels");
    expect(html).toContain('class="kd-signet-rest"');
  });
});
