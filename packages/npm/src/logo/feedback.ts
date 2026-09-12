import type { Cue, Haptic, Sound } from "./types.js";
import { sounds } from "./data.js";

/**
 * Sound and touch for the logo animations. A tone is a spec, never a file: the
 * notes are played in order on one oscillator, each struck hard and left to
 * decay, so nothing has to be shipped or decoded. Both are opt-in — a page
 * makes noise only when it asks to.
 */

/** How long each tap buzzes where only a duration can be given. */
const HAPTIC_MS: Record<Haptic, number> = { selection: 5, light: 10, medium: 20, heavy: 35 };

const ATTACK = 0.008;

let ctx: AudioContext | null = null;

/** The shared context, made on first use. */
function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  return ctx;
}

/**
 * Plays a tone. Silent, never throwing, where audio is unavailable or still
 * blocked — a design system may not be the reason a page breaks.
 */
export function playSound(sound: Sound | string | undefined): void {
  const spec = typeof sound === "string" ? sounds[sound] : sound;
  if (!spec) return;
  const context = audio();
  if (!context) return;

  const schedule = () => {
    // The clock is read after the context is running: a suspended one stands
    // still, and notes booked against that frozen time would all land at once.
    let at = context.currentTime;
    for (const note of spec.notes) {
      const seconds = note.ms / 1000;
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = spec.wave;
      osc.frequency.setValueAtTime(note.hz, at);
      // A gliding note slides to its second frequency by its own end — what
      // makes a send sound like leaving rather than like two keys struck.
      if (note.to !== undefined) osc.frequency.exponentialRampToValueAtTime(note.to, at + seconds);
      // Struck, then decaying: exponentialRamp cannot reach zero, so it lands
      // just under audible and stops there.
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(spec.gain, at + ATTACK);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
      osc.connect(gain).connect(context.destination);
      osc.start(at);
      osc.stop(at + seconds);
      at += seconds;
    }
  };

  // A browser keeps a new context suspended until the page has been touched.
  // Resuming is asynchronous, so the tone waits for it instead of being dropped.
  if (context.state === "running") schedule();
  else void context.resume().then(schedule, () => {});
}

/** Taps the device. Does nothing where vibration is unsupported — iOS Safari has none. */
export function tapHaptic(haptic: Haptic | undefined): void {
  if (!haptic || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  navigator.vibrate(HAPTIC_MS[haptic]);
}

/** Fires one cue: whichever of its two halves the caller asked for. */
export function fireCue(cue: Cue, { sound = false, haptics = false }: { sound?: boolean; haptics?: boolean }): void {
  if (haptics) tapHaptic(cue.haptic);
  if (sound) playSound(cue.sound);
}
