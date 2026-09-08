import { createElement, forwardRef, type SVGProps } from "react";
import type { Style } from "./types.js";
import { LOGO_HEIGHT, LOGO_WIDTH } from "./data.js";
import { signetNodes, wordmarkNodes } from "./paint.js";

/** Where the wordmark starts in the logo box (the text origin of the brand file). */
export const WORDMARK_START = 69;
export const WORDMARK_WIDTH = LOGO_WIDTH - WORDMARK_START;

export const DEFAULT_INK = "currentColor";
export const DEFAULT_ACCENT = "var(--kd-brand, #136B6B)";
/** Where `tint` blends to: a light petrol that reads against ink and brand alike. */
export const DEFAULT_HIGHLIGHT = "#139E9B";

interface Common extends Omit<SVGProps<SVGSVGElement>, "height" | "width"> {
  /** Frame and wordmark colour; the text colour by default. */
  ink?: string;
  /** Corner colour; the brand role by default. */
  accent?: string;
  /** Colour a tinted cell or glyph blends toward; light petrol by default. */
  highlight?: string;
  /** Accessible name; without it the graphic is decorative. */
  title?: string;
}

const a11y = (title: string | undefined, rest: Record<string, unknown>) => {
  const named = Boolean(title) || rest["aria-label"] != null || rest["aria-labelledby"] != null;
  return named ? { role: "img" } : { "aria-hidden": "true" };
};

export interface SignetProps extends Common {
  /** Width and height; 40 by default. */
  size?: number | string;
  /** 32 cell styles (see `sample`) — animates the mark. */
  cells?: readonly Style[] | null;
  /** 64 pixel styles, invisible at rest — pixel art on the 8×8. */
  pixels?: readonly Style[] | null;
}

/** The mark alone: an open frame with the corner filled. */
export const Signet = forwardRef<SVGSVGElement, SignetProps>(function Signet(
  { size = 40, ink = DEFAULT_INK, accent = DEFAULT_ACCENT, highlight = DEFAULT_HIGHLIGHT, cells, pixels, title, className, ...rest },
  ref,
) {
  return createElement(
    "svg",
    { ref, xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 48 48", width: size, height: size, className: ["kd-signet", className].filter(Boolean).join(" "), ...a11y(title, rest), ...rest },
    title ? createElement("title", null, title) : null,
    signetNodes(ink, accent, highlight, cells, pixels),
  );
});

export interface WordmarkProps extends Common {
  /** Height of the logo box; 28 by default. */
  height?: number;
  /** 9 glyph styles (see `sample`) — animates the letters. */
  glyphs?: readonly Style[] | null;
}

/** The wordmark alone — Archivo 600 as outlines, so no font is needed. */
export const Wordmark = forwardRef<SVGSVGElement, WordmarkProps>(function Wordmark(
  { height = 28, ink = DEFAULT_INK, accent = DEFAULT_ACCENT, highlight = DEFAULT_HIGHLIGHT, glyphs, title, className, ...rest },
  ref,
) {
  return createElement(
    "svg",
    {
      ref, xmlns: "http://www.w3.org/2000/svg",
      viewBox: `${WORDMARK_START} 0 ${WORDMARK_WIDTH} ${LOGO_HEIGHT}`,
      width: (height * WORDMARK_WIDTH) / LOGO_HEIGHT, height,
      className: ["kd-wordmark", className].filter(Boolean).join(" "), ...a11y(title, rest), ...rest,
    },
    title ? createElement("title", null, title) : null,
    wordmarkNodes(ink, accent, highlight, glyphs),
  );
});

export interface LogoProps extends Common {
  /** Height; 28 by default. Width follows, 332/48 of it. */
  height?: number;
  cells?: readonly Style[] | null;
  glyphs?: readonly Style[] | null;
  pixels?: readonly Style[] | null;
}

/** Mark and wordmark side by side, in the 332×48 box of the brand file. */
export const Logo = forwardRef<SVGSVGElement, LogoProps>(function Logo(
  { height = 28, ink = DEFAULT_INK, accent = DEFAULT_ACCENT, highlight = DEFAULT_HIGHLIGHT, cells, glyphs, pixels, title = "Kasseneck", className, ...rest },
  ref,
) {
  return createElement(
    "svg",
    {
      ref, xmlns: "http://www.w3.org/2000/svg",
      viewBox: `0 0 ${LOGO_WIDTH} ${LOGO_HEIGHT}`,
      width: (height * LOGO_WIDTH) / LOGO_HEIGHT, height,
      className: ["kd-logo", className].filter(Boolean).join(" "), ...a11y(title, rest), ...rest,
    },
    title ? createElement("title", null, title) : null,
    signetNodes(ink, accent, highlight, cells, pixels),
    wordmarkNodes(ink, accent, highlight, glyphs),
  );
});
