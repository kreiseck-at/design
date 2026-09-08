import { describe, it, expect } from "vitest";
import { loadLogo } from "./logo.mjs";
import { loadAnimations, resolveAnimation, orderCells, orderGlyphs, pixelIndices, morphVectors } from "./logo-animations.mjs";
import { sample, flatten, SAMPLE_TIMES } from "./logo-animate.mjs";

const root = new URL("../", import.meta.url);
const logo = await loadLogo(root);
const at = (row, col) => logo.cells.find((c) => c.row === row && c.col === col).index;
const adjacent = (a, b) => {
  const A = logo.cells[a], B = logo.cells[b];
  return Math.abs(A.row - B.row) + Math.abs(A.col - B.col) === 1;
};

describe("cell orders", () => {
  it("clockwise walks the open frame as one path: bottom end → left → top → right end", () => {
    const o = orderCells("clockwise", "frame", logo);
    expect(o).toHaveLength(23);
    expect(o[0]).toBe(at(7, 4));
    expect(o.at(-1)).toBe(at(4, 7));
    for (let i = 1; i < o.length; i++) expect(adjacent(o[i - 1], o[i])).toBe(true);
    expect(orderCells("counter", "frame", logo)).toEqual([...o].reverse());
  });
  it("ring is the closed outer edge, 28 cells clockwise from the top-left, through the corner", () => {
    const o = orderCells("ring", "cells", logo);
    expect(o).toHaveLength(28);
    expect(o[0]).toBe(at(0, 0));
    expect(o[7]).toBe(at(0, 7));
    expect(o[14]).toBe(at(7, 7));
    expect(o[21]).toBe(at(7, 0));
    for (let i = 1; i < o.length; i++) expect(adjacent(o[i - 1], o[i])).toBe(true);
    expect(adjacent(o.at(-1), o[0])).toBe(true);
  });
  it("from-corner starts inside the corner block, to-corner ends there", () => {
    const from = orderCells("from-corner", "cells", logo);
    expect(logo.cells[from[0]].part).toBe("corner");
    expect(logo.cells[from.at(-1)]).toMatchObject({ row: 0, col: 0 });
    expect(orderCells("to-corner", "cells", logo)).toEqual([...from].reverse());
  });
  it("columns is column-major; reading is row-major; random is deterministic per seed", () => {
    const cols = orderCells("columns", "cells", logo);
    expect(logo.cells[cols[0]]).toMatchObject({ row: 0, col: 0 });
    expect(logo.cells[cols[1]]).toMatchObject({ row: 1, col: 0 });
    expect(orderCells("reading", "cells", logo)).toEqual(logo.cells.map((c) => c.index));
    expect(orderCells("random:7", "cells", logo)).toEqual(orderCells("random:7", "cells", logo));
    expect(resolveAnimation("t", { de: "T", scenario: "test", duration: 1000, tracks: [{ target: "cells", order: "random", duration: 100 }] }, logo).tracks[0]).toMatchObject({ shuffle: true, indices: logo.cells.map((c) => c.index) });
    expect(resolveAnimation("t", { de: "T", scenario: "test", duration: 1000, tracks: [{ target: "cells", order: "random:7", duration: 100 }] }, logo).tracks[0].shuffle).toBe(false);
    expect(orderCells("random:7", "cells", logo)).not.toEqual(orderCells("random:8", "cells", logo));
    expect([...orderCells("random:7", "cells", logo)].sort((a, b) => a - b)).toEqual(logo.cells.map((c) => c.index));
  });
  it("glyph orders", () => {
    expect(orderGlyphs("ltr")).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(orderGlyphs("rtl")).toEqual([8, 7, 6, 5, 4, 3, 2, 1, 0]);
    expect(orderGlyphs("center-out")).toEqual([4, 3, 5, 2, 6, 1, 7, 0, 8]);
    expect(orderGlyphs("edges-in")).toEqual([0, 8, 1, 7, 2, 6, 3, 5, 4]);
  });
});

describe("pixelIndices", () => {
  const art = ["#.......", "........", "........", "........", "........", "........", "........", ".......#"];
  it("returns lit fields as row * 8 + col", () => {
    expect(pixelIndices(art)).toEqual([0, 63]);
    expect(pixelIndices(art, "random:1")).toHaveLength(2);
  });
  it("rejects a bitmap that is not 8 × 8 of . and #", () => {
    expect(() => pixelIndices(["#"])).toThrow(/8 rows/);
    expect(() => pixelIndices(art.map(() => "........"))).toThrow(/no lit/);
    expect(() => pixelIndices([...art.slice(0, 7), "......x#"])).toThrow(/8 rows/);
  });
  it("a pixels track needs an art and resolves to kind pixel", () => {
    const base = { de: "T", scenario: "test", duration: 1000, tracks: [{ target: "pixels", art, duration: 100, from: { opacity: 0 }, to: { opacity: 1 } }] };
    const a = resolveAnimation("t", base, logo);
    expect(a.tracks[0]).toMatchObject({ kind: "pixel", indices: [0, 63] });
    expect(() => resolveAnimation("t", { ...base, tracks: [{ target: "pixels", duration: 100 }] }, logo)).toThrow(/art/);
  });
});

describe("resolveAnimation", () => {
  const base = { de: "T", scenario: "test", duration: 1000, tracks: [{ target: "frame", order: "clockwise", stagger: 10, duration: 100, easing: "linear", from: { opacity: 0 }, to: { opacity: 1 } }] };
  it("expands target/order into explicit indices and from/to into keyframes with defaults filled", () => {
    const a = resolveAnimation("t", base, logo);
    expect(a).toMatchObject({ name: "t", loop: false, duration: 1000 });
    const [tr] = a.tracks;
    expect(tr).toMatchObject({ kind: "cell", start: 0, stagger: 10, duration: 100, easing: "linear", wrap: false, before: "hold", after: "hold" });
    expect(tr.indices).toEqual(orderCells("clockwise", "frame", logo));
    expect(tr.keyframes).toEqual([{ at: 0, opacity: 0 }, { at: 1, opacity: 1 }]);
  });
  it("rejects a track that runs past the animation unless it wraps", () => {
    const late = { ...base, tracks: [{ ...base.tracks[0], start: 900 }] };
    expect(() => resolveAnimation("t", late, logo)).toThrow(/past the end/);
    expect(() => resolveAnimation("t", { ...late, tracks: [{ ...late.tracks[0], wrap: true }] }, logo)).not.toThrow();
  });
  it("rejects unknown props, easings, orders and targets", () => {
    const withTrack = (over) => ({ ...base, tracks: [{ ...base.tracks[0], ...over }] });
    expect(() => resolveAnimation("t", withTrack({ from: { rotate: 1 } }), logo)).toThrow(/rotate/);
    expect(() => resolveAnimation("t", withTrack({ easing: "bouncy" }), logo)).toThrow(/bouncy/);
    expect(() => resolveAnimation("t", withTrack({ order: "spiral" }), logo)).toThrow(/spiral/);
    expect(() => resolveAnimation("t", withTrack({ target: "letters" }), logo)).toThrow(/letters/);
    expect(() => resolveAnimation("t", withTrack({ keyframes: [{ at: 2, opacity: 1 }] }), logo)).toThrow(/at/);
  });
});

const animations = await loadAnimations(root, logo);

describe("brand/animations.json", () => {
  it("every animation resolves, has a German label and a scenario, and its samples are finite", () => {
    expect(animations.length).toBeGreaterThanOrEqual(8);
    for (const a of animations) {
      expect(a.de).toMatch(/\S/);
      expect(a.scenario).toMatch(/^(splash|exit|transition|loading|waiting|state|progress)$/);
      for (const t of SAMPLE_TIMES) expect(flatten(sample(a, t)).every(Number.isFinite)).toBe(true);
    }
  });
  it("a non-looping animation ends at rest or fully gone — never half-way", () => {
    for (const a of animations.filter((x) => !x.loop)) {
      const end = sample(a, 1);
      for (const p of end.pixels) expect(p.opacity, `${a.name} pixel`).toBe(0);
      for (const st of [...end.cells, ...end.glyphs]) {
        expect([0, 1]).toContain(st.opacity);
        if (st.opacity === 1) expect(st).toMatchObject({ dx: 0, dy: 0, tint: 0 });
      }
    }
  });
  it("splash animations start invisible somewhere and end fully visible at rest", () => {
    for (const a of animations.filter((x) => x.scenario === "splash")) {
      const start = sample(a, 0), end = sample(a, 1);
      const moved = [...start.cells, ...start.glyphs].some((st) => st.opacity < 1 || st.dx !== 0 || st.dy !== 0 || st.scale !== 1);
      expect(moved, a.name).toBe(true);
      for (const st of [...end.cells, ...end.glyphs]) expect(st, a.name).toEqual({ opacity: 1, scale: 1, dx: 0, dy: 0, tint: 0, accent: 0 });
    }
  });
});

describe("morph", () => {
  const heart = ["........", ".##..##.", "########", "########", ".######.", "..####..", "...##...", "........"];
  it("into mark: 32 heart pixels land on 32 distinct cells of the mark", () => {
    const idx = pixelIndices(heart);
    const { vectors: v, landed: hit } = morphVectors(idx, "mark", logo);
    expect(hit).toHaveLength(32);
    const landed = idx.map((i, k) => `${Math.floor(i / 8) + v[k][1]},${(i % 8) + v[k][0]}`);
    expect(new Set(landed).size).toBe(32);
    const cellSet = new Set(logo.cells.map((c) => `${c.row},${c.col}`));
    for (const l of landed) expect(cellSet.has(l)).toBe(true);
  });
  it("into corner: every pixel ends inside the 3×3 corner", () => {
    const idx = pixelIndices(heart);
    const { vectors: v, landed: hit } = morphVectors(idx, "corner", logo);
    expect(hit).toHaveLength(9);
    idx.forEach((i, k) => {
      const row = Math.floor(i / 8) + v[k][1], col = (i % 8) + v[k][0];
      expect(row).toBeGreaterThanOrEqual(5);
      expect(col).toBeGreaterThanOrEqual(5);
    });
  });
  it("a morphed track moves its pixels along the vectors with `move`; shuffling keeps vector and pixel together", () => {
    const a = animations.find((x) => x.name === "euro");
    const tr = a.tracks.find((t) => t.vectors);
    expect(tr.vectors).toHaveLength(tr.indices.length);
    // corner-bound pixels colour on the way: accent follows move
    const cornerBound = a.tracks.filter((t) => t.vectors)[1];
    expect(cornerBound.keyframes.at(-1)).toMatchObject({ move: 1, accent: 1 });
    expect(tr.keyframes.at(-1).accent).toBeUndefined();
    const tEnd = (tr.start + tr.duration) / a.duration; // local time == duration: still on the track, move = 1
    const s = sample(a, tEnd);
    tr.indices.forEach((i, k) => {
      expect(s.pixels[i].dx).toBeCloseTo(tr.vectors[k][0], 6);
      expect(s.pixels[i].dy).toBeCloseTo(tr.vectors[k][1], 6);
    });
    const c = animations.find((x) => x.name === "check");
    const ct = c.tracks.find((t) => t.vectors);
    const tMid = (ct.start + ct.duration * 0.5) / c.duration;
    for (const seed of [1, 2]) {
      const sm = sample(c, tMid, seed);
      ct.indices.forEach((i, k) => expect(Math.sign(sm.pixels[i].dx)).toBe(Math.sign(ct.vectors[k][0] * 0.5)));
    }
  });
});

describe("handover: landed / unlanded", () => {
  it("landed cells appear the instant their pixel goes; the rest come with the remaining animation", () => {
    const a = animations.find((x) => x.name === "euro");
    const morph = a.tracks.find((t) => t.vectors);
    expect(a.tracks.filter((t) => t.vectors).length).toBe(2); // split by landing part: frame-bound and corner-bound
    const landedTrack = a.tracks.find((t) => t.kind === "cell" && t.duration === 0);
    const restTrack = a.tracks.find((t) => t.kind === "cell" && t.duration > 0);
    expect(landedTrack.indices.length + restTrack.indices.length).toBe(32);
    expect(new Set([...landedTrack.indices, ...restTrack.indices]).size).toBe(32);
    const handover = landedTrack.start;
    expect(handover).toBe(morph.start + morph.duration);
    const before = sample(a, (handover - 5) / a.duration), after = sample(a, (handover + 5) / a.duration);
    for (const i of landedTrack.indices) { expect(before.cells[i].opacity).toBe(0); expect(after.cells[i].opacity).toBe(1); }
    expect(before.pixels.filter((p) => p.opacity > 0).length).toBeGreaterThan(0);
    expect(after.pixels.filter((p) => p.opacity > 0).length).toBe(0);
    // the rest starts no earlier than the handover, and is still hidden right before it
    expect(restTrack.start).toBeGreaterThanOrEqual(handover);
    for (const i of restTrack.indices) expect(before.cells[i].opacity).toBe(0);
  });
  it("rejects landed/unlanded without a morph", () => {
    expect(() => resolveAnimation("t", { de: "T", scenario: "test", duration: 1000, tracks: [{ target: "landed", duration: 1 }] }, logo)).toThrow(/needs a morph/);
  });
});

describe("heart", () => {
  it("every pixel, once shown, stays until the smaller heart takes over — nothing blinks away", () => {
    const a = animations.find((x) => x.name === "heart");
    const first = a.tracks[0];
    const done = first.start + first.stagger * (first.indices.length - 1) + first.duration;
    const hand = a.tracks.find((t) => t.kind === "pixel" && t.start > done).start;
    let prev = 0;
    for (let T = 0; T < hand; T += 10) { // up to the instant the smaller heart takes over
      const lit = sample(a, T / a.duration).pixels.filter((p) => p.opacity >= 0.999).length;
      expect(lit, `${T} ms`).toBeGreaterThanOrEqual(prev);
      prev = lit;
    }
    expect(prev).toBe(first.indices.length);
  });
});
