import { readFile } from "node:fs/promises";
import { EASINGS, PROPS, shuffle } from "./logo-animate.mjs";

const TARGETS = ["frame", "corner", "cells", "glyphs", "pixels", "landed", "unlanded"];
const CELL_ORDERS = ["reading", "columns", "clockwise", "counter", "ring", "from-corner", "to-corner", "from-center"];
const GLYPH_ORDERS = ["ltr", "rtl", "center-out", "edges-in"];

// "random:<seed>" is shuffled here, at build time, and stays fixed;
// plain "random" leaves the reading order and marks the track `shuffle`, so
// each run draws its own order from the runtime's identical PRNG.

const dist = (c, row, col) => Math.hypot(c.row - row, c.col - col);
const stable = (cells, key) => [...cells].sort((a, b) => key(a) - key(b) || a.index - b.index).map((c) => c.index);

// Walk a set of cells as one path from `start`, always to an unvisited
// 4-neighbour; the frame and the ring are simple enough that the first
// neighbour in `prefer` order is the right one.
function walk(cells, start, prefer) {
  const byPos = new Map(cells.map((c) => [`${c.row},${c.col}`, c]));
  const out = [start.index];
  const seen = new Set(out);
  let cur = start;
  for (;;) {
    const next = prefer.map(([dr, dc]) => byPos.get(`${cur.row + dr},${cur.col + dc}`)).find((c) => c && !seen.has(c.index));
    if (!next) break;
    out.push(next.index);
    seen.add(next.index);
    cur = next;
  }
  if (out.length !== cells.length) throw new Error(`walk covered ${out.length} of ${cells.length} cells`);
  return out;
}

export function orderCells(order, target, logo) {
  const all = logo.cells;
  const set = target === "cells" ? all : all.filter((c) => c.part === target);
  const grid = logo.grid - 1;
  if (order.startsWith("random:")) return shuffle(set.map((c) => c.index), Number(order.slice(7)));
  switch (order) {
    case "reading": return set.map((c) => c.index);
    case "columns": return stable(set, (c) => c.col * logo.grid + c.row);
    case "from-corner": return stable(set, (c) => dist(c, grid - 1, grid - 1));
    case "to-corner": return orderCells("from-corner", target, logo).reverse();
    case "from-center": return stable(set, (c) => dist(c, grid / 2, grid / 2));
    case "clockwise": case "counter": {
      if (target !== "frame") throw new Error(`order ${order} is defined for the frame only`);
      // Start at the end of the bottom bar (next to the corner), go left, up, right, down.
      const start = set.reduce((best, c) => (c.row > best.row || (c.row === best.row && c.col > best.col) ? c : best));
      const path = walk(set, start, [[0, -1], [-1, 0], [0, 1], [1, 0]]);
      return order === "clockwise" ? path : path.reverse();
    }
    case "ring": {
      if (target !== "cells") throw new Error("order ring is defined for all cells");
      const edge = set.filter((c) => c.row === 0 || c.col === 0 || c.row === grid || c.col === grid);
      return walk(edge, edge.find((c) => c.row === 0 && c.col === 0), [[0, 1], [1, 0], [0, -1], [-1, 0]]);
    }
    default: throw new Error(`unknown cell order ${order} (${[...CELL_ORDERS, "random:<seed>"].join(", ")})`);
  }
}

/**
 * Pixel art: eight rows of eight characters, `#` lit. Returns the lit
 * indices (row * 8 + col) in the requested order.
 */
export function pixelIndices(art, order = "reading", grid = 8) {
  if (!Array.isArray(art) || art.length !== grid || art.some((r) => typeof r !== "string" || r.length !== grid || /[^.#]/.test(r)))
    throw new Error(`pixel art must be ${grid} rows of ${grid} characters, "." or "#"`);
  const lit = [];
  art.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === "#") lit.push({ index: r * grid + c, row: r, col: c }); }));
  if (lit.length === 0) throw new Error("pixel art has no lit pixel");
  const mid = (grid - 1) / 2;
  if (order.startsWith("random:")) return shuffle(lit.map((p) => p.index), Number(order.slice(7)));
  switch (order) {
    case "reading": return lit.map((p) => p.index);
    case "columns": return stable(lit, (p) => p.col * grid + p.row);
    case "from-center": return stable(lit, (p) => dist(p, mid, mid));
    case "from-corner": return stable(lit, (p) => dist(p, grid - 2, grid - 2));
    default: throw new Error(`unknown pixel order ${order} (reading, columns, from-center, from-corner, random:<seed>)`);
  }
}

export function orderGlyphs(order, count = 9) {
  const idx = Array.from({ length: count }, (_, i) => i);
  if (order.startsWith("random:")) return shuffle(idx, Number(order.slice(7)));
  const mid = (count - 1) / 2;
  switch (order) {
    case "ltr": return idx;
    case "rtl": return idx.reverse();
    case "center-out": return [...idx].sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid) || a - b);
    case "edges-in": return [...idx].sort((a, b) => Math.abs(b - mid) - Math.abs(a - mid) || a - b);
    default: throw new Error(`unknown glyph order ${order} (${[...GLYPH_ORDERS, "random:<seed>"].join(", ")})`);
  }
}

/**
 * Morph targets: each lit pixel gets the nearest free cell of `into`
 * (mark = all 32, corner = 9, frame = 23), greedily by distance so nothing
 * crosses more than it must; once every cell is taken, the rest share the
 * nearest one. Returns one [dx, dy] per pixel index, in cells, and the
 * indices of the cells that received a pixel (`landed`).
 */
export function morphVectors(pixelIdx, into, logo) {
  const grid = logo.grid;
  const targets = logo.cells.filter((c) => into === "mark" || c.part === into);
  if (targets.length === 0) throw new Error(`morph: unknown target ${into} (mark, corner, frame)`);
  const px = pixelIdx.map((i) => ({ row: Math.floor(i / grid), col: i % grid }));
  const pairs = [];
  px.forEach((p, a) => targets.forEach((c, b) => pairs.push([Math.hypot(p.row - c.row, p.col - c.col), a, b])));
  pairs.sort((x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2]);
  const chosen = new Array(px.length).fill(-1), taken = new Set();
  for (const [, a, b] of pairs) if (chosen[a] < 0 && !taken.has(b)) { chosen[a] = b; taken.add(b); }
  px.forEach((p, a) => {
    if (chosen[a] >= 0) return;
    let best = 0, bd = Infinity;
    targets.forEach((c, b) => { const d = Math.hypot(p.row - c.row, p.col - c.col); if (d < bd) { bd = d; best = b; } });
    chosen[a] = best;
  });
  return {
    vectors: px.map((p, a) => [targets[chosen[a]].col - p.col, targets[chosen[a]].row - p.row]),
    landed: [...new Set(chosen.map((b) => targets[b].index))].sort((x, y) => x - y),
    parts: px.map((p, a) => targets[chosen[a]].part),
  };
}

function checkProps(where, obj) {
  for (const k of Object.keys(obj)) {
    if (k === "at" || k === "move") continue;
    if (!PROPS.includes(k)) throw new Error(`${where}: unknown property ${k} (${PROPS.join(", ")})`);
    if (typeof obj[k] !== "number" || !Number.isFinite(obj[k])) throw new Error(`${where}: ${k} must be a finite number`);
  }
}

export function resolveAnimation(name, def, logo) {
  const duration = def.duration;
  if (!(duration > 0)) throw new Error(`${name}: duration must be positive`);
  // "landed"/"unlanded" refer to the cells the morph tracks of this animation
  // hand over to, so those resolve first.
  const landed = new Set();
  const resolveTrack = (t, i) => {
    const where = `${name}.tracks[${i}]`;
    if (!TARGETS.includes(t.target)) throw new Error(`${where}: unknown target ${t.target} (${TARGETS.join(", ")})`);
    if (!EASINGS.includes(t.easing ?? "linear")) throw new Error(`${where}: unknown easing ${t.easing} (${EASINGS.join(", ")})`);
    const kind = t.target === "glyphs" ? "glyph" : t.target === "pixels" ? "pixel" : "cell";
    if (kind === "pixel" && !t.art) throw new Error(`${where}: target pixels needs an "art" (8 rows of 8, "." or "#")`);
    const runtimeRandom = t.order === "random";
    const order = runtimeRandom ? "reading" : (t.order ?? (kind === "glyph" ? "ltr" : "reading"));
    const landedOrder = (set) => (order === "reading" ? set : orderCells(order, "cells", logo).filter((i) => set.includes(i)));
    const indices = kind === "glyph" ? orderGlyphs(order === "reading" ? "ltr" : order, logo.glyphs.length)
      : kind === "pixel" ? pixelIndices(t.art, order, logo.grid)
      : t.target === "landed" ? landedOrder([...landed].sort((a, b) => a - b))
      : t.target === "unlanded" ? landedOrder(logo.cells.map((c) => c.index).filter((i) => !landed.has(i)))
      : orderCells(order, t.target, logo);
    if ((t.target === "landed" || t.target === "unlanded") && landed.size === 0) throw new Error(`${where}: no ${t.target} cells — needs a morph track first`);
    let keyframes;
    if (t.keyframes) {
      keyframes = t.keyframes.map((k) => ({ ...k }));
    } else {
      keyframes = [{ at: 0, ...(t.from ?? {}) }, { at: 1, ...(t.to ?? {}) }];
    }
    for (const k of keyframes) {
      if (!(k.at >= 0 && k.at <= 1)) throw new Error(`${where}: keyframe at must lie in 0..1`);
      checkProps(where, k);
    }
    keyframes.sort((a, b) => a.at - b.at);
    if (t.morph && kind !== "pixel") throw new Error(`${where}: morph is for pixel tracks`);
    const morph = t.morph ? morphVectors(indices, t.morph, logo) : undefined;
    const vectors = morph?.vectors;
    if (morph) for (const c of morph.landed) landed.add(c);
    const trackOf = (idx, kf) => {
      const track = {
        kind, indices: idx, shuffle: runtimeRandom,
        start: t.start ?? 0, stagger: t.stagger ?? 0, duration: t.duration ?? 0,
        easing: t.easing ?? "linear", wrap: t.wrap ?? false,
        before: t.before ?? "hold", after: t.after ?? "hold",
        keyframes: kf,
      };
      for (const k of ["start", "stagger", "duration"]) if (!(track[k] >= 0)) throw new Error(`${where}: ${k} must be ≥ 0`);
      const end = track.start + track.stagger * (idx.length - 1) + track.duration;
      if (!track.wrap && end > duration) throw new Error(`${where}: runs past the end (${end} > ${duration} ms)`);
      return track;
    };
    // "colour": "landing" — pixels bound for the corner take on its petrol on
    // the way (accent follows move); the track splits into two, one per part.
    if (t.colour === "landing" && morph) {
      const pick = (part) => indices.map((idx, k) => k).filter((k) => morph.parts[k] === part);
      const sub = (ks, extra) => {
        if (ks.length === 0) return [];
        const kf = keyframes.map((k) => ({ ...k, ...(extra && k.move !== undefined ? { accent: k.move } : {}) }));
        return [{ ...trackOf(ks.map((k) => indices[k]), kf), vectors: ks.map((k) => vectors[k]) }];
      };
      return [...sub(pick("frame"), false), ...sub(pick("corner"), true)];
    }
    return [{ ...trackOf(indices, keyframes), ...(vectors ? { vectors } : {}) }];
  };
  const isLanded = (t) => t.target === "landed" || t.target === "unlanded";
  const resolved = new Array(def.tracks.length);
  def.tracks.forEach((t, i) => { if (!isLanded(t)) resolved[i] = resolveTrack(t, i); });
  def.tracks.forEach((t, i) => { if (isLanded(t)) resolved[i] = resolveTrack(t, i); });
  return { name, de: def.de, scenario: def.scenario, duration, loop: def.loop ?? false, tracks: resolved.flat() };
}

export async function loadAnimations(root, logo) {
  const json = JSON.parse(await readFile(new URL("brand/animations.json", root), "utf8"));
  return Object.entries(json.animations).map(([name, def]) => resolveAnimation(name, def, logo));
}
