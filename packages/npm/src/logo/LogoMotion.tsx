import { createElement, useEffect, useRef, useState } from "react";
import { sample } from "./animate.mjs";
import type { Animation } from "./types.js";
import { animations, type AnimationName } from "./data.js";
import { Logo, Signet, type LogoProps } from "./Logo.js";

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
}

const resolve = (a: AnimationName | Animation): Animation => (typeof a === "string" ? animations[a] : a);

/** Plays a logo animation with requestAnimationFrame; renders `Logo` or `Signet` per frame. */
export function LogoMotion({ animation, wordmark = true, loop, rate = 1, autoplay = true, playKey, onDone, height = 28, ...rest }: LogoMotionProps) {
  const anim = resolve(animation);
  const loops = loop ?? anim.loop;
  const [t, setT] = useState(autoplay ? 0 : 1);
  const [seed, setSeed] = useState(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (!autoplay) return;
    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const elapsed = ((now - started) * rate) / anim.duration;
      if (loops) {
        setT(elapsed % 1);
        frame = requestAnimationFrame(tick);
      } else if (elapsed >= 1) {
        setT(1);
        doneRef.current?.();
      } else {
        setT(elapsed);
        frame = requestAnimationFrame(tick);
      }
    };
    setSeed(Math.floor(Math.random() * 4294967296));
    setT(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [anim, loops, rate, autoplay, playKey]);

  const s = sample(anim, t, seed);
  return wordmark
    ? createElement(Logo, { height, cells: s.cells, glyphs: s.glyphs, pixels: s.pixels, ...rest })
    : createElement(Signet, { size: height, cells: s.cells, pixels: s.pixels, ...rest });
}
