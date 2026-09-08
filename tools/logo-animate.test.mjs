import { describe, it, expect } from "vitest";
import { EASINGS, PROPS, ease, sample, flatten, resting, shuffle, rng } from "./logo-animate.mjs";

const track = (over) => ({
  kind: "cell", indices: [0, 1], shuffle: false, start: 100, stagger: 50, duration: 200, easing: "linear", wrap: false, before: "hold", after: "hold",
  keyframes: [{ at: 0, opacity: 0, scale: 0.5 }, { at: 1, opacity: 1, scale: 1 }],
  ...over,
});
const anim = (tracks, over) => ({ name: "t", de: "T", scenario: "test", duration: 1000, loop: false, tracks, ...over });

describe("ease", () => {
  it("every easing maps 0→0 and 1→1", () => {
    for (const name of EASINGS) {
      expect(ease(name, 0)).toBe(0);
      expect(ease(name, 1)).toBe(1);
    }
  });
  it("step jumps only at the end", () => {
    expect(ease("step", 0.999)).toBe(0);
    expect(ease("step", 1)).toBe(1);
  });
  it("out-back overshoots, out-bounce stays within [0, 1]", () => {
    expect(ease("out-back", 0.7)).toBeGreaterThan(1);
    for (let u = 0; u <= 1; u += 0.05) expect(ease("out-bounce", u)).toBeLessThanOrEqual(1 + 1e-9);
  });
});

describe("sample", () => {
  it("rests at the defaults: opacity 1, scale 1, no offset, no tint", () => {
    const s = sample(anim([]), 0.5);
    expect(s.cells).toHaveLength(32);
    expect(s.glyphs).toHaveLength(9);
    expect(s.pixels).toHaveLength(64);
    expect(s.pixels[9]).toEqual({ opacity: 0, scale: 1, dx: 0, dy: 0, tint: 0, accent: 0 });
    expect(s.cells[5]).toEqual(resting());
    expect(resting()).toEqual({ opacity: 1, scale: 1, dx: 0, dy: 0, tint: 0, accent: 0 });
  });
  it("holds the first keyframe before start and the last after the end; untouched props stay at rest", () => {
    const a = anim([track()]);
    expect(sample(a, 0).cells[0]).toEqual({ opacity: 0, scale: 0.5, dx: 0, dy: 0, tint: 0, accent: 0 });
    expect(sample(a, 1).cells[0]).toEqual({ opacity: 1, scale: 1, dx: 0, dy: 0, tint: 0, accent: 0 });
    expect(sample(a, 1).cells[2]).toEqual(resting());
  });
  it("staggers by list position: element 1 starts 50 ms after element 0", () => {
    const a = anim([track()]);
    // T = 200 ms → element 0 is at 100/200 = 0.5, element 1 at 50/200 = 0.25
    const s = sample(a, 0.2);
    expect(s.cells[0].opacity).toBeCloseTo(0.5, 9);
    expect(s.cells[1].opacity).toBeCloseTo(0.25, 9);
    expect(s.cells[0].scale).toBeCloseTo(0.75, 9);
  });
  it("interpolates between the neighbouring keyframes that define a prop", () => {
    const a = anim([track({ keyframes: [{ at: 0, scale: 1 }, { at: 0.5, scale: 2 }, { at: 1, scale: 1, opacity: 0.2 }], stagger: 0 })]);
    expect(sample(a, 0.15).cells[0].scale).toBeCloseTo(1.5, 9); // local 0.25 → between kf0 and kf1
    expect(sample(a, 0.25).cells[0].scale).toBeCloseTo(1.5, 9); // local 0.75 → between kf1 and kf2
    // opacity is only defined on the last keyframe → constant
    expect(sample(a, 0.15).cells[0].opacity).toBeCloseTo(0.2, 9);
  });
  it("applies the easing to the local time before keyframe lookup", () => {
    const a = anim([track({ easing: "step", stagger: 0 })]);
    expect(sample(a, 0.29).cells[0].opacity).toBe(0);
    expect(sample(a, 0.3).cells[0].opacity).toBe(1);
  });
  it("wrap: local time runs modulo the animation duration", () => {
    const a = anim([track({ wrap: true, start: 0, stagger: 0, duration: 400 })]);
    expect(sample(a, 0.1).cells[0].opacity).toBeCloseTo(0.25, 9);
    expect(sample(a, 1.1).cells[0].opacity).toBeCloseTo(0.25, 9);
    // element that starts later than now wraps to the tail of the previous cycle
    const b = anim([track({ wrap: true, start: 800, stagger: 0, duration: 400 })]);
    expect(sample(b, 0.1).cells[0].opacity).toBeCloseTo(0.75, 9); // (100 - 800) mod 1000 = 300 → 0.75
  });
  it("before: none leaves the element alone until the track starts; after: none releases it", () => {
    const a = anim([track({ before: "none", after: "none", stagger: 0 })]);
    expect(sample(a, 0.05).cells[0]).toEqual(resting());
    expect(sample(a, 0.2).cells[0].opacity).toBeCloseTo(0.5, 9);
    expect(sample(a, 0.5).cells[0]).toEqual(resting());
  });
  it("a later track overrides the props it defines, and only those", () => {
    const a = anim([track({ stagger: 0 }), track({ stagger: 0, keyframes: [{ at: 0, dx: 2 }, { at: 1, dx: 0 }] })]);
    const s = sample(a, 0.2);
    expect(s.cells[0].opacity).toBeCloseTo(0.5, 9);
    expect(s.cells[0].dx).toBeCloseTo(1, 9);
  });
  it("glyph tracks touch glyphs, not cells", () => {
    const a = anim([track({ kind: "glyph", indices: [3], stagger: 0 })]);
    const s = sample(a, 1);
    expect(s.glyphs[3].scale).toBe(1);
    expect(s.glyphs[3].opacity).toBe(1);
    expect(sample(a, 0).glyphs[3].opacity).toBe(0);
    expect(sample(a, 0).cells[3]).toEqual(resting());
  });
});

describe("pixel tracks", () => {
  it("light pixels that rest invisible, and leave cells alone", () => {
    const a = anim([track({ kind: "pixel", indices: [0, 63], stagger: 0, keyframes: [{ at: 0, opacity: 0 }, { at: 1, opacity: 1 }] })]);
    const s = sample(a, 1);
    expect(s.pixels[0].opacity).toBe(1);
    expect(s.pixels[63].opacity).toBe(1);
    expect(s.pixels[1].opacity).toBe(0);
    expect(s.cells[0]).toEqual(resting());
  });
});

describe("shuffle", () => {
  it("is a permutation, deterministic per seed, different across seeds", () => {
    const list = Array.from({ length: 32 }, (_, i) => i);
    const a = shuffle(list, 7), b = shuffle(list, 7), c = shuffle(list, 8);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    expect([...a].sort((x, y) => x - y)).toEqual(list);
    expect(list).toEqual(Array.from({ length: 32 }, (_, i) => i)); // input untouched
  });
  it("rng stays in [0, 1) and is reproducible", () => {
    const r = rng(123), r2 = rng(123);
    for (let i = 0; i < 100; i++) { const v = r(); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); expect(v).toBe(r2()); }
  });
  it("a shuffled track plays in the seed's order; seed 0 is the golden's order", () => {
    const tr = track({ indices: [0, 1, 2, 3], shuffle: true, stagger: 100, duration: 1, easing: "step", keyframes: [{ at: 0, opacity: 0 }, { at: 1, opacity: 1 }] });
    const a = anim([tr]);
    // at T = 101 ms exactly one element (the first in order) is lit
    const lit = (seed) => sample(a, 0.101, seed).cells.slice(0, 4).map((c) => c.opacity);
    expect(lit(0).filter((o) => o === 1)).toHaveLength(1);
    const seeds = new Set([0, 1, 2, 3, 4, 5, 6, 7].map((s) => lit(s).join("")));
    expect(seeds.size).toBeGreaterThan(1);
    expect(lit(0)).toEqual(lit(0));
  });
});

describe("flatten", () => {
  it("is the twin contract: 32 cells + 9 glyphs + 64 pixels × 6 props as integers ×1000, in that order", () => {
    expect(PROPS).toEqual(["opacity", "scale", "dx", "dy", "tint", "accent"]);
    const f = flatten(sample(anim([track({ stagger: 0 })]), 0.2));
    expect(f).toHaveLength((32 + 9 + 64) * 6);
    expect(f.slice(41 * 6, 41 * 6 + 6)).toEqual([0, 1000, 0, 0, 0, 0]);
    expect(f.slice(0, 6)).toEqual([500, 750, 0, 0, 0, 0]);
    expect(f.slice(12, 18)).toEqual([1000, 1000, 0, 0, 0, 0]);
    expect(f.every(Number.isInteger)).toBe(true);
  });
});

describe("vectors + move", () => {
  it("adds move × vector to dx/dy, per element, on top of the dx/dy props", () => {
    const a = anim([track({ indices: [0, 1], stagger: 0, vectors: [[2, 0], [0, -3]], keyframes: [{ at: 0, move: 0, dx: 1 }, { at: 1, move: 1, dx: 1 }] })]);
    const s = sample(a, 0.2); // local 0.5
    expect(s.cells[0].dx).toBeCloseTo(2, 9);
    expect(s.cells[0].dy).toBe(0);
    expect(s.cells[1].dx).toBeCloseTo(1, 9);
    expect(s.cells[1].dy).toBeCloseTo(-1.5, 9);
  });
});
