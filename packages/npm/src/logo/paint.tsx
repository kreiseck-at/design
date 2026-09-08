import { createElement, type ReactNode } from "react";
import type { Style } from "./types.js";
import { CORNER_PATH, FRAME_PATHS, GRID, UNIT, cells, glyphs } from "./data.js";

/** Blend toward the highlight colour with the browser's own colour maths. */
export const mix = (base: string, other: string, t: number) =>
  t <= 0 ? base : t >= 1 ? other : `color-mix(in oklab, ${base}, ${other} ${Math.round(t * 1000) / 10}%)`;

const allRest = (styles?: readonly Style[] | null) =>
  !styles || styles.every((s) => s.opacity === 1 && s.scale === 1 && s.dx === 0 && s.dy === 0 && s.tint === 0 && s.accent === 0);
/** Element colour: its base, blended toward the brand petrol by `accent`, then toward the highlight by `tint`. */
const paint = (base: string, accent: string, highlight: string, s: Style) => mix(mix(base, accent, s.accent), highlight, s.tint);

const num = (v: number) => Math.round(v * 1000) / 1000;
const noPixels = (pixels?: readonly Style[] | null) => !pixels || pixels.every((s) => s.opacity <= 0 || s.scale <= 0);

/**
 * The mark as SVG nodes in the 48-unit box. At rest: the three brand paths,
 * byte for byte. Animated: one rect per cell — kept apart so a static logo
 * never shows anti-aliasing seams between cells.
 */
export function signetNodes(ink: string, accent: string, highlight: string, styles?: readonly Style[] | null, pixels?: readonly Style[] | null, alwaysCells = false): ReactNode {
  // Rest and cells live in different <g> keys, and every element has a key of
  // its own, so React never pairs a rect with a path when frames change.
  const art = pixelNodes(ink, accent, highlight, pixels);
  if (!alwaysCells && allRest(styles)) {
    return createElement("g", { key: "signet-rest", className: "kd-signet-rest" }, [
      art,
      createElement("path", { key: "f0", d: FRAME_PATHS[0], fill: ink }),
      createElement("path", { key: "f1", d: FRAME_PATHS[1], fill: ink }),
      createElement("path", { key: "c", d: CORNER_PATH, fill: accent }),
    ]);
  }
  const out: ReactNode[] = [];
  for (const cell of cells) {
    const s = styles ? styles[cell.index] : { opacity: 1, scale: 1, dx: 0, dy: 0, tint: 0, accent: 0 };
    if (s.opacity <= 0 || s.scale <= 0) continue;
    const base = paint(cell.part === "frame" ? ink : accent, accent, highlight, s);
    const cx = (cell.col + 0.5 + s.dx) * UNIT, cy = (cell.row + 0.5 + s.dy) * UNIT;
    const half = (UNIT * s.scale) / 2;
    out.push(
      createElement("rect", {
        key: `c${cell.index}`,
        x: num(cx - half), y: num(cy - half), width: num(half * 2), height: num(half * 2),
        fill: base,
        ...(s.opacity < 1 ? { opacity: num(s.opacity) } : {}),
      }),
    );
  }
  return createElement("g", { key: "signet-cells", className: "kd-signet-cells" }, [...out, art]);
}

/** The pixel layer: 64 fields of the 8×8, drawn only where lit. */
function pixelNodes(ink: string, accent: string, highlight: string, pixels?: readonly Style[] | null): ReactNode {
  if (noPixels(pixels)) return null;
  const out: ReactNode[] = [];
  pixels!.forEach((s, i) => {
    if (s.opacity <= 0 || s.scale <= 0) return;
    const cx = ((i % GRID) + 0.5 + s.dx) * UNIT, cy = (Math.floor(i / GRID) + 0.5 + s.dy) * UNIT;
    const half = (UNIT * s.scale) / 2;
    out.push(
      createElement("rect", {
        key: `p${i}`,
        x: num(cx - half), y: num(cy - half), width: num(half * 2), height: num(half * 2),
        fill: paint(ink, accent, highlight, s),
        ...(s.opacity < 1 ? { opacity: num(s.opacity) } : {}),
      }),
    );
  });
  return createElement("g", { key: "signet-pixels", className: "kd-signet-pixels" }, out);
}

/** The wordmark glyphs as SVG nodes in logo-box coordinates (x from 69). */
export function wordmarkNodes(ink: string, accent: string, highlight: string, styles?: readonly Style[] | null): ReactNode {
  if (allRest(styles)) return createElement("g", { key: "wordmark-rest", className: "kd-wordmark-rest" }, glyphs.map((g, i) => createElement("path", { key: `g${i}`, d: g.d, fill: ink })));
  const out: ReactNode[] = [];
  glyphs.forEach((g, i) => {
    const s = styles![i];
    if (s.opacity <= 0 || s.scale <= 0) return;
    const cx = g.bbox.x + g.bbox.width / 2, cy = g.bbox.y + g.bbox.height / 2;
    const moved = s.dx !== 0 || s.dy !== 0 || s.scale !== 1;
    const transform = moved
      ? `translate(${num(cx + s.dx * UNIT)} ${num(cy + s.dy * UNIT)}) scale(${num(s.scale)}) translate(${num(-cx)} ${num(-cy)})`
      : undefined;
    out.push(
      createElement("path", {
        key: `g${i}`,
        d: g.d,
        fill: paint(ink, accent, highlight, s),
        ...(transform ? { transform } : {}),
        ...(s.opacity < 1 ? { opacity: num(s.opacity) } : {}),
      }),
    );
  });
  return createElement("g", { key: "wordmark-glyphs", className: "kd-wordmark-glyphs" }, out);
}
