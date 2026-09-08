// Generated from tools/logo-animate.mjs. Do not edit.

// Runtime of the logo animations, shared word for word by the web package
// (copied by tools/build.mjs) and mirrored line by line in Dart
// (packages/dart/lib/src/logo_animate.dart). The golden fixture samples every
// animation through this file; both packages must reproduce those samples.
//
// Model: an animation is a list of tracks. A track drives one property set on
// a list of elements (cells of the mark, or glyphs of the wordmark), each
// element starting `stagger` ms after the previous one. Time inside a track
// is eased once, then looked up in the keyframes. Besides the 32 cells of
// the mark and the 9 glyphs there is a pixel layer: all 64 fields of the
// 8×8, invisible at rest, so the mark can show pixel art before it becomes
// the logo — or morph into it: a track may carry one target vector per
// element, and the keyframe prop `move` (0..1) walks the element along it.
// `accent` blends an element toward the brand petrol (the corner's colour), `tint` blends an element
// toward the highlight colour (a light petrol by default — ink and brand petrol
// are both too dark to read as a running light against each other).

// The types live in types.ts (the d.ts bundler cannot re-export JSDoc
// typedefs); this file only references them.
/** @typedef {import("./types.js").Style} Style */
/** @typedef {import("./types.js").Keyframe} Keyframe */
/** @typedef {import("./types.js").Track} Track */
/** @typedef {import("./types.js").Animation} Animation */

export const CELL_COUNT = 32;
export const GLYPH_COUNT = 9;
export const PIXEL_COUNT = 64;
/** @type {readonly ["opacity", "scale", "dx", "dy", "tint", "accent"]} */
export const PROPS = ["opacity", "scale", "dx", "dy", "tint", "accent"];
export const EASINGS = ["linear", "step", "in-sine", "out-sine", "in-out-sine", "in-cubic", "out-cubic", "in-out-cubic", "in-back", "out-back", "out-bounce"];

/**
 * mulberry32 — the one PRNG both packages carry, so a shuffled track plays
 * the same order for the same seed in Flutter and on the web. Integer maths
 * is kept below 2^53 so it is exact on Flutter web too.
 * @param {number} seed
 */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1) >>> 0;
    t = (t ^ ((t + Math.imul(t ^ (t >>> 7), t | 61)) >>> 0)) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates with `rng(seed)`. @param {number[]} list @param {number} seed */
export function shuffle(list, seed) {
  const next = rng(seed);
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
  }
  return out;
}

/** @returns {Style} */
export const resting = () => ({ opacity: 1, scale: 1, dx: 0, dy: 0, tint: 0, accent: 0 });
/** A pixel at rest is not there. @returns {Style} */
export const restingPixel = () => ({ opacity: 0, scale: 1, dx: 0, dy: 0, tint: 0, accent: 0 });

const BACK = 1.70158;

/** @param {string} name @param {number} u 0..1 */
export function ease(name, u) {
  // Exact at the ends: out-back and friends leave 1e-16 residue at 0, which
  // would read as "a little visible" in every threshold downstream.
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  switch (name) {
    case "linear": return u;
    case "step": return u < 1 ? 0 : 1;
    case "in-sine": return 1 - Math.cos((u * Math.PI) / 2);
    case "out-sine": return Math.sin((u * Math.PI) / 2);
    case "in-out-sine": return -(Math.cos(Math.PI * u) - 1) / 2;
    case "in-cubic": return u * u * u;
    case "out-cubic": return 1 - Math.pow(1 - u, 3);
    case "in-out-cubic": return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    case "in-back": return (BACK + 1) * u * u * u - BACK * u * u;
    case "out-back": return 1 + (BACK + 1) * Math.pow(u - 1, 3) + BACK * Math.pow(u - 1, 2);
    case "out-bounce": {
      const n = 7.5625, d = 2.75;
      if (u < 1 / d) return n * u * u;
      if (u < 2 / d) { const v = u - 1.5 / d; return n * v * v + 0.75; }
      if (u < 2.5 / d) { const v = u - 2.25 / d; return n * v * v + 0.9375; }
      const v = u - 2.625 / d; return n * v * v + 0.984375;
    }
    default: throw new Error(`unknown easing ${name}`);
  }
}

/**
 * Value of `prop` at eased position `e` — linear between the two neighbouring
 * keyframes that define it; a prop defined on one keyframe only is constant.
 * @param {Keyframe[]} keyframes @param {"opacity" | "scale" | "dx" | "dy" | "tint" | "accent" | "move"} prop @param {number} e
 * @returns {number | undefined}
 */
function valueAt(keyframes, prop, e) {
  /** @type {Keyframe | undefined} */
  let lo, hi;
  for (const k of keyframes) {
    if (k[prop] === undefined) continue;
    if (k.at <= e) lo = k;
    if (k.at >= e && hi === undefined) hi = k;
  }
  if (lo === undefined && hi === undefined) return undefined;
  if (lo === undefined) return /** @type {number} */ (/** @type {Keyframe} */ (hi)[prop]);
  if (hi === undefined || hi === lo || hi.at === lo.at) return /** @type {number} */ (lo[prop]);
  const f = (e - lo.at) / (hi.at - lo.at);
  return /** @type {number} */ (lo[prop]) + (/** @type {number} */ (hi[prop]) - /** @type {number} */ (lo[prop])) * f;
}

/**
 * Style of every cell and glyph at `t` (0..1 of the animation's duration; a
 * looping animation may be sampled beyond 1).
 * A track marked `shuffle` plays its elements in an order drawn from `seed`;
 * a player draws a fresh seed per run, the golden uses 0.
 * @param {Animation} anim @param {number} t @param {number} [seed]
 * @returns {{ cells: Style[], glyphs: Style[], pixels: Style[] }}
 */
export function sample(anim, t, seed = 0) {
  const cells = Array.from({ length: CELL_COUNT }, resting);
  const glyphs = Array.from({ length: GLYPH_COUNT }, resting);
  const pixels = Array.from({ length: PIXEL_COUNT }, restingPixel);
  const T = t * anim.duration;
  anim.tracks.forEach((track, ti) => {
    const targets = track.kind === "cell" ? cells : track.kind === "glyph" ? glyphs : pixels;
    // Each track gets its own stream from the seed, so two shuffled tracks
    // never share an order.
    // Shuffling permutes play positions; a vector stays with its element.
    const positions = track.shuffle ? shuffle(track.indices.map((_, i) => i), (seed + ti * 0x9e3779b9) >>> 0) : null;
    track.indices.forEach((_, i) => {
      const at = positions ? positions[i] : i;
      const index = track.indices[at];
      let local = T - track.start - i * track.stagger;
      if (track.wrap) local = ((local % anim.duration) + anim.duration) % anim.duration;
      if (local < 0 && track.before === "none") return;
      if (local > track.duration && track.after === "none") return;
      const u = track.duration <= 0 ? (local < 0 ? 0 : 1) : Math.min(1, Math.max(0, local / track.duration));
      const e = ease(track.easing, u);
      for (const prop of PROPS) {
        const v = valueAt(track.keyframes, prop, e);
        if (v !== undefined) targets[index][prop] = v;
      }
      if (track.vectors) {
        const m = valueAt(track.keyframes, "move", e);
        if (m !== undefined) {
          targets[index].dx += m * track.vectors[at][0];
          targets[index].dy += m * track.vectors[at][1];
        }
      }
    });
  });
  return { cells, glyphs, pixels };
}

/**
 * The twin contract: one flat integer list (value × 1000, rounded), cells,
 * glyphs, then pixels, props in PROPS order. Dart builds the same list; the
 * golden holds it.
 * @param {{ cells: Style[], glyphs: Style[], pixels: Style[] }} s
 */
export const flatten = (s) => [...s.cells, ...s.glyphs, ...s.pixels].flatMap((st) => PROPS.map((p) => Math.round(st[p] * 1000)));

/** Sample points frozen in the golden. */
export const SAMPLE_TIMES = [0, 0.2, 0.37, 0.5, 0.63, 0.81, 1];
