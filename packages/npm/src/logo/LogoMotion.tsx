import { createElement, useEffect, useRef, useState } from "react";
import { sample } from "./animate.mjs";
import type { Animation } from "./types.js";
import { animations, type AnimationName } from "./data.js";
import { Logo, Signet, type LogoProps } from "./Logo.js";
import { roles } from "../tokens.js";
import { fireCue } from "./feedback.js";

export interface LogoMotionProps extends Omit<LogoProps, "cells" | "glyphs" | "pixels"> {
  /** One of the data-defined animations, by name or as data. */
  animation: AnimationName | Animation;
  /** Draw the mark alone (as `Signet`, `height` as its size). */
  wordmark?: boolean;
  /** Override the animation's own loop flag. */
  loop?: boolean;
  /** Playback rate; 1 by default. */
  rate?: number;
  /** Start on mount; true by default. */
  autoplay?: boolean;
  /** Restart whenever this value changes. */
  playKey?: unknown;
  /** Fires once a non-looping run ends. */
  onDone?: () => void;
  /** Stop at the animation's hold point and stay there — the check keeps standing, the cross keeps showing. */
  hold?: boolean;
  /** Play the animation's cue tones. Off by default — a page makes noise only when it asks to. */
  sound?: boolean;
  /** Tap the device at the animation's cues. Off by default; iOS Safari cannot vibrate at all. */
  haptics?: boolean;
}

const resolve = (a: AnimationName | Animation): Animation => (typeof a === "string" ? animations[a] : a);

/**
 * An animation that names a colour role (a confirmation is `success`, an error
 * `danger`) is drawn in that role: the CSS variable carries light and dark, the
 * built value is the fallback for a page without the token sheet. A `highlight`
 * passed in wins — the caller knows their surface best.
 */
export const animationHighlight = (a: AnimationName | Animation): string | undefined => {
  const role = resolve(a).highlight;
  return role ? `var(--kd-${role}, ${(roles.light as Record<string, string>)[role]})` : undefined;
};

/** Plays a logo animation with requestAnimationFrame; renders `Logo` or `Signet` per frame. */
export function LogoMotion({ animation, wordmark = true, loop, rate = 1, autoplay = true, playKey, onDone, height = 28, highlight, hold = false, sound = false, haptics = false, ...rest }: LogoMotionProps) {
  const anim = resolve(animation);
  const signal = highlight ?? animationHighlight(anim);
  // Holding ends the run at the hold point, so it cannot also loop.
  const stop = hold && anim.hold ? anim.hold / anim.duration : 1;
  const loops = (loop ?? anim.loop) && stop === 1;
  const [t, setT] = useState(autoplay ? 0 : stop);
  const [seed, setSeed] = useState(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const feedback = useRef({ sound, haptics });
  feedback.current = { sound, haptics };

  useEffect(() => {
    if (!autoplay) return;
    let frame = 0;
    const started = performance.now();
    // Cues fire once each as the playhead passes them; a loop arms them again
    // every round, so a repeating animation keeps its beat.
    const cues = anim.cues ?? [];
    let fired = 0;
    const pass = (ms: number) => {
      while (fired < cues.length && cues[fired].at <= ms) fireCue(cues[fired++], feedback.current);
    };
    const tick = (now: number) => {
      const elapsed = ((now - started) * rate) / anim.duration;
      if (loops) {
        const within = elapsed % 1;
        if (within * anim.duration < (fired ? cues[fired - 1].at : 0)) fired = 0;
        pass(within * anim.duration);
        setT(within);
        frame = requestAnimationFrame(tick);
      } else if (elapsed >= stop) {
        pass(stop * anim.duration);
        setT(stop);
        doneRef.current?.();
      } else {
        pass(elapsed * anim.duration);
        setT(elapsed);
        frame = requestAnimationFrame(tick);
      }
    };
    setSeed(Math.floor(Math.random() * 4294967296));
    setT(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [anim, loops, rate, autoplay, playKey, stop]);

  const s = sample(anim, t, seed);
  return wordmark
    ? createElement(Logo, { height, cells: s.cells, glyphs: s.glyphs, pixels: s.pixels, ...(signal ? { highlight: signal } : {}), ...rest })
    : createElement(Signet, { size: height, cells: s.cells, pixels: s.pixels, ...(signal ? { highlight: signal } : {}), ...rest });
}
