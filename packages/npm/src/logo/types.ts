/** Per-element state. `dx`/`dy` in cells (1/8 of the mark), `scale` around the element's centre, `tint` 0..1 toward the highlight colour. */
export interface Style { opacity: number; scale: number; dx: number; dy: number; tint: number; /** 0..1 toward the brand petrol */ accent: number }
export interface Keyframe { at: number; opacity?: number; scale?: number; dx?: number; dy?: number; tint?: number; accent?: number; /** 0..1 along the track's vector */ move?: number }
export interface Track {
  kind: "cell" | "glyph" | "pixel";
  /** element indices in play order */
  indices: number[];
  /** draw a fresh order from the seed each run */
  shuffle: boolean;
  /** per element (aligned with indices): where `move` 1 takes it, in cells */
  vectors?: [number, number][];
  /** ms */
  start: number;
  /** ms between consecutive elements */
  stagger: number;
  /** ms per element */
  duration: number;
  /** one of EASINGS */
  easing: string;
  /** local time runs modulo the animation duration */
  wrap: boolean;
  /** first keyframe applies before start, or nothing does */
  before: "hold" | "none";
  /** last keyframe holds after the end, or nothing does */
  after: "hold" | "none";
  /** sorted by `at`, 0..1 */
  keyframes: Keyframe[];
}
export interface Animation { name: string; de: string; scenario: string; duration: number; loop: boolean; tracks: Track[] }
