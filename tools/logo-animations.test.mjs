import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { loadLogo } from "./logo.mjs";
import { loadAnimations, loadSounds, resolveAnimation, checkSounds, orderCells, orderGlyphs, pixelIndices, morphVectors } from "./logo-animations.mjs";
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
  it("exit animations start at rest, fully visible, and end with nothing left", () => {
    const exits = animations.filter((x) => x.scenario === "exit");
    expect(exits.length).toBeGreaterThan(0);
    for (const a of exits) {
      const start = sample(a, 0), end = sample(a, 1);
      for (const st of [...start.cells, ...start.glyphs]) expect(st, a.name).toEqual({ opacity: 1, scale: 1, dx: 0, dy: 0, tint: 0, accent: 0 });
      for (const st of start.pixels) expect(st.opacity, `${a.name} pixel`).toBe(0);
      for (const st of [...end.cells, ...end.glyphs, ...end.pixels]) expect(st.opacity, a.name).toBe(0);
    }
  });
  // A hold point is only worth stopping at if the picture there is finished:
  // a frozen frame with something half-way through a move reads as a stall.
  it("at its hold point an animation stands still — nothing is part-way anywhere", () => {
    const held = animations.filter((a) => a.hold);
    expect(held.length).toBeGreaterThan(0);
    for (const a of held) {
      const s = sample(a, a.hold / a.duration);
      for (const st of [...s.cells, ...s.glyphs, ...s.pixels]) {
        expect([0, 1], `${a.name} opacity`).toContain(st.opacity);
        if (st.opacity === 0) continue;
        expect(st.dx, `${a.name} still sliding`).toBe(0);
        expect(st.dy, `${a.name} still sliding`).toBe(0);
        expect(st.scale, `${a.name} still growing`).toBe(1);
      }
      // And the sign itself must be what stands there.
      expect(s.pixels.some((st) => st.opacity > 0), `${a.name} holds on nothing`).toBe(true);
    }
  });
  it("a hold point outside the animation is refused", () => {
    const base = { de: "T", scenario: "state", highlight: "success", duration: 1000, tracks: [{ target: "cells", duration: 100 }] };
    expect(() => resolveAnimation("t", { ...base, hold: 1200 }, logo, ["success"])).toThrow(/hold must lie inside/);
    expect(() => resolveAnimation("t", { ...base, hold: 0 }, logo, ["success"])).toThrow(/hold must lie inside/);
  });
  it("a state animation names the colour role it signals, and the role exists", () => {
    const roleNames = Object.keys(JSON.parse(readFileSync(new URL("tokens/base.json", root), "utf8")).roles);
    for (const a of animations) {
      if (a.scenario === "state") expect(a.highlight, `${a.name} signals nothing`).toBeTruthy();
      if (a.highlight) expect(roleNames, a.name).toContain(a.highlight);
    }
  });
  it("an unknown colour role is refused", () => {
    const base = { de: "T", scenario: "state", duration: 1000, tracks: [{ target: "cells", duration: 100 }] };
    expect(() => resolveAnimation("t", { ...base, highlight: "grellgruen" }, logo, ["success", "danger"])).toThrow(/unknown colour role/);
    expect(() => resolveAnimation("t", { ...base, highlight: 7 }, logo, ["success"])).toThrow(/must be a role name/);
  });
  it("state animations begin and end at the logo itself", () => {
    const states = animations.filter((x) => x.scenario === "state");
    expect(states.length).toBeGreaterThan(0);
    for (const a of states) {
      for (const t of [0, 1]) {
        const s = sample(a, t);
        for (const st of [...s.cells, ...s.glyphs]) expect(st, `${a.name} at t=${t}`).toEqual({ opacity: 1, scale: 1, dx: 0, dy: 0, tint: 0, accent: 0 });
        for (const st of s.pixels) expect(st.opacity, `${a.name} pixel at t=${t}`).toBe(0);
      }
      // A state that never leaves the logo says nothing.
      const middle = sample(a, 0.5);
      expect(middle.pixels.some((st) => st.opacity > 0), a.name).toBe(true);
    }
  });
  // The mark is drawn in its own 8×8 box (viewBox 0 0 48 48), so anything an
  // animation pushes past an edge is cut off. Arriving out of an edge reads as
  // entering, but a farewell that gets clipped just looks broken — so an exit
  // has to be gone before it reaches one.
  it("nothing an exit or state animation still shows is drawn outside the 8×8", () => {
    const pos = new Map(logo.cells.map((c) => [c.index, c]));
    for (const a of animations.filter((x) => x.scenario === "exit" || x.scenario === "state")) {
      for (let i = 0; i <= 600; i++) {
        const s = sample(a, i / 600);
        const inside = (st, col, row, what) => {
          if (st.opacity <= 0.001 || st.scale <= 0) return;
          const half = st.scale / 2, x = col + 0.5 + st.dx, y = row + 0.5 + st.dy;
          const out = Math.max(-(x - half), x + half - logo.grid, -(y - half), y + half - logo.grid);
          expect(out, `${a.name} ${what} at t=${(i / 600).toFixed(3)}`).toBeLessThanOrEqual(0);
        };
        s.cells.forEach((st, k) => { const c = pos.get(k); if (c) inside(st, c.col, c.row, `cell ${k}`); });
        s.pixels.forEach((st, k) => inside(st, k % logo.grid, Math.floor(k / logo.grid), `pixel ${k}`));
      }
    }
  });
});

const sounds = await loadSounds(root);

describe("cues and sounds", () => {
  const base = { de: "T", scenario: "splash", duration: 1000, tracks: [{ target: "cells", duration: 100 }] };
  const cued = (cues) => resolveAnimation("t", { ...base, cues }, logo, null, sounds);

  it("every tone is a playable spec, and every tone is used", () => {
    const used = new Set(animations.flatMap((a) => (a.cues ?? []).map((c) => c.sound)).filter(Boolean));
    for (const [name, s] of Object.entries(sounds)) {
      expect(s.notes.length, name).toBeGreaterThan(0);
      expect(used, `${name} is never cued`).toContain(name);
    }
  });
  it("a tone outside hearing, out of gain or without notes is refused", () => {
    expect(() => checkSounds({ t: { wave: "sine", gain: 0.2, notes: [{ hz: 4, ms: 100 }] } })).toThrow(/outside hearing/);
    expect(() => checkSounds({ t: { wave: "sine", gain: 2, notes: [{ hz: 440, ms: 100 }] } })).toThrow(/gain/);
    expect(() => checkSounds({ t: { wave: "sine", gain: 0.2, notes: [] } })).toThrow(/1 to 8 notes/);
    expect(() => checkSounds({ t: { wave: "kazoo", gain: 0.2, notes: [{ hz: 440, ms: 100 }] } })).toThrow(/unknown wave/);
  });
  it("a cue names a tone that exists, lands inside the animation, and does something", () => {
    expect(() => cued([{ at: 10, sound: "nope" }])).toThrow(/unknown sound/);
    expect(() => cued([{ at: 1200, haptic: "light" }])).toThrow(/inside the animation/);
    expect(() => cued([{ at: 10, haptic: "kick" }])).toThrow(/unknown haptic/);
    expect(() => cued([{ at: 10 }])).toThrow(/neither taps nor sounds/);
  });
  it("cues come out in time order", () => {
    expect(cued([{ at: 800, haptic: "light" }, { at: 200, haptic: "heavy" }]).cues.map((c) => c.at)).toEqual([200, 800]);
    for (const a of animations.filter((x) => x.cues)) {
      const times = a.cues.map((c) => c.at);
      expect([...times].sort((x, y) => x - y), a.name).toEqual(times);
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
    const tEnd = (tr.start + tr.duration - 0.01) / a.duration; // just before the track releases: move ≈ 1
    const s = sample(a, tEnd);
    tr.indices.forEach((i, k) => {
      expect(s.pixels[i].dx).toBeCloseTo(tr.vectors[k][0], 3);
      expect(s.pixels[i].dy).toBeCloseTo(tr.vectors[k][1], 3);
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

describe("heart — into the corner", () => {
  it("from the small heart on, the lit pixels in the corner only ever grow, up to the full block", () => {
    const a = animations.find((x) => x.name === "heart");
    const corner = new Set(logo.cells.filter((c) => c.part === "corner").map((c) => c.row * 8 + c.col));
    const stills = a.tracks.filter((t) => t.kind === "pixel" && t.before === "none" && t.duration > 0);
    const from = stills[1].start, to = stills.at(-1).start + stills.at(-1).duration;
    // lit = a pixel or the cell itself, so the handover pixel → cell counts as one thing
    const cellAt = new Map(logo.cells.filter((c) => c.part === "corner").map((c) => [c.row * 8 + c.col, c.index]));
    let prev = 0;
    for (let T = from; T <= to + 1; T += 10) {
      const s = sample(a, T / a.duration);
      const lit = [...corner].filter((i) => s.pixels[i].opacity > 0 || s.cells[cellAt.get(i)].opacity > 0).length;
      expect(lit, `${T} ms`).toBeGreaterThanOrEqual(prev);
      prev = lit;
    }
    expect(prev).toBe(9);
    const after = sample(a, (to + 1) / a.duration);
    for (const c of logo.cells.filter((c) => c.part === "corner")) expect(after.cells[c.index].opacity).toBe(1);
  });
});
