import { readFile } from "node:fs/promises";
import { parseElements } from "./icons.mjs";
import { toOps } from "./svg-path.mjs";

const WORD = "Kasseneck";

/** Area of a closed, axis-aligned or general polygon path (M/L/H/V/Z only) — shoelace. */
export function polygonArea(d) {
  const ops = toOps({ tag: "path", attrs: { d } });
  let area = 0;
  let ring = [];
  const flush = () => {
    for (let i = 0; i < ring.length; i++) {
      const [x1, y1] = ring[i], [x2, y2] = ring[(i + 1) % ring.length];
      area += x1 * y2 - x2 * y1;
    }
    ring = [];
  };
  for (const op of ops) {
    if (op[0] === "Z") flush();
    else if (op[0] === "M") { flush(); ring.push([op[1], op[2]]); }
    else if (op[0] === "L") ring.push([op[1], op[2]]);
    else throw new Error(`polygonArea: curves not supported (${op[0]})`);
  }
  flush();
  return Math.abs(area) / 2;
}

// Even-odd point-in-polygon over every ring of a path.
function contains(d, px, py) {
  const ops = toOps({ tag: "path", attrs: { d } });
  const rings = [];
  for (const op of ops) {
    if (op[0] === "M") rings.push([[op[1], op[2]]]);
    else if (op[0] === "L") rings.at(-1).push([op[1], op[2]]);
  }
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

const bboxOf = (ops) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const op of ops) for (let i = 1; i < op.length; i += 2) {
    x0 = Math.min(x0, op[i]); x1 = Math.max(x1, op[i]);
    y0 = Math.min(y0, op[i + 1]); y1 = Math.max(y1, op[i + 1]);
  }
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
};
const within = (inner, outer) =>
  inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;

/**
 * Split the wordmark path into glyphs. A subpath whose box lies inside
 * another's is a counter (the hole of a, e) and stays with that letter.
 */
function splitGlyphs(d) {
  const subpaths = d.split(/\s*(?=M)/).filter(Boolean);
  const parts = subpaths.map((s) => ({ d: s, ops: toOps({ tag: "path", attrs: { d: s } }) })).map((p) => ({ ...p, bbox: bboxOf(p.ops) }));
  const glyphs = [];
  for (const part of parts) {
    const host = glyphs.find((g) => within(part.bbox, g.bbox));
    if (host) { host.parts.push(part); host.holes += 1; }
    else glyphs.push({ bbox: part.bbox, parts: [part], holes: 0 });
  }
  glyphs.sort((a, b) => a.bbox.x - b.bbox.x);
  if (glyphs.length !== WORD.length) throw new Error(`wordmark: expected ${WORD.length} glyphs, found ${glyphs.length}`);
  return glyphs.map((g, i) => ({
    char: WORD[i],
    d: g.parts.map((p) => p.d).join(" "),
    ops: g.parts.flatMap((p) => p.ops),
    bbox: g.bbox,
    holes: g.holes,
  }));
}

export async function loadLogo(root) {
  const svg = await readFile(new URL("brand/kasseneck-logo.svg", root), "utf8");
  const [, w, h] = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  const paths = parseElements(svg).filter((e) => e.tag === "path").map((e) => e.attrs.d);
  if (paths.length !== 4) throw new Error(`brand/kasseneck-logo.svg: expected 4 paths, found ${paths.length}`);
  const [frameA, frameB, corner, wordmark] = paths;
  const grid = 8;
  const unit = 48 / grid;
  const cells = [];
  for (let row = 0; row < grid; row++) for (let col = 0; col < grid; col++) {
    const cx = (col + 0.5) * unit, cy = (row + 0.5) * unit;
    const part = contains(corner, cx, cy) ? "corner" : contains(frameA, cx, cy) || contains(frameB, cx, cy) ? "frame" : null;
    if (part) cells.push({ index: cells.length, row, col, part });
  }
  return {
    viewBox: { width: Number(w), height: Number(h) },
    grid,
    unit,
    signet: { frame: [frameA, frameB], corner },
    cells,
    wordmark: { d: wordmark },
    glyphs: splitGlyphs(wordmark),
  };
}
