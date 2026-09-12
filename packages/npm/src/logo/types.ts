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
export type Haptic = "selection" | "light" | "medium" | "heavy";
export type Wave = "sine" | "triangle" | "square" | "sawtooth";
/** One note of a tone: a frequency in hertz, a length in ms, optionally gliding to `to`. */
export interface Note { hz: number; ms: number; to?: number }
/** A tone as a spec, not a file: notes played in order under one wave and gain. */
export interface Sound { wave: Wave; gain: number; notes: Note[] }
/** A moment in an animation that taps, sounds, or both. */
export interface Cue { at: number; haptic?: Haptic; sound?: string }

export interface Animation {
  name: string; de: string; scenario: string; duration: number; loop: boolean;
  /** Colour role `tint` blends toward — "success", "danger" … Resolved per surface. */
  highlight?: string;
  /** Where the sign stands finished and nothing is moving — `hold` stops here. */
  hold?: number;
  /** Moments to tap or sound as the playhead passes them. */
  cues?: Cue[];
  tracks: Track[];
}
