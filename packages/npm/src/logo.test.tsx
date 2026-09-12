import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { readFileSync } from "node:fs";
import { Signet, Wordmark, Logo, LogoMotion, sample, flatten, animations, animationNames, sounds, playSound, tapHaptic, fireCue, FRAME_PATHS, CORNER_PATH, glyphs, cells, SAMPLE_TIMES } from "./logo/index.js";

const golden = JSON.parse(readFileSync(new URL("../../../golden/kasseneck.json", import.meta.url), "utf8")).logo;
const source = readFileSync(new URL("../../../brand/kasseneck-logo.svg", import.meta.url), "utf8");
const sourcePaths = [...source.matchAll(/<path d="([^"]+)"/g)].map((m) => m[1]);
const ds = (html: string) => [...html.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]);
const strip = (s: string) => s.replace(/\s+/g, "");

describe("Signet", () => {
  it("at rest renders the three brand paths byte for byte, nothing else", () => {
    const html = renderToStaticMarkup(createElement(Signet));
    expect(html).toContain('viewBox="0 0 48 48"');
    expect(html).toContain('width="40"');
    expect(html).toContain('aria-hidden="true"');
    expect(ds(html)).toEqual([...FRAME_PATHS, CORNER_PATH]);
    expect(ds(html)).toEqual(sourcePaths.slice(0, 3));
    expect(html).not.toContain("<rect");
    expect(html).toContain('fill="currentColor"');
    expect(html).toContain('fill="var(--kd-brand, #136B6B)"');
  });
  it("switches to one rect per cell only when a cell leaves rest", () => {
    const rest = cells.map(() => ({ opacity: 1, scale: 1, dx: 0, dy: 0, tint: 0, accent: 0 }));
    expect(renderToStaticMarkup(createElement(Signet, { cells: rest }))).not.toContain("<rect");
    const moved = rest.map((s, i) => (i === 3 ? { ...s, opacity: 0.5, tint: 0.25 } : s));
    const html = renderToStaticMarkup(createElement(Signet, { cells: moved, ink: "#000", highlight: "#0ff" }));
    expect(html.match(/<rect/g)).toHaveLength(32);
    expect(html).toContain('opacity="0.5"');
    expect(html).toContain('fill="color-mix(in oklab, #000, #0ff 25%)"');
    const gone = rest.map((s, i) => (i === 0 ? { ...s, opacity: 0 } : s));
    expect(renderToStaticMarkup(createElement(Signet, { cells: gone })).match(/<rect/g)).toHaveLength(31);
  });
  it("a title makes it an image", () => {
    const html = renderToStaticMarkup(createElement(Signet, { title: "Kasseneck" }));
    expect(html).toContain('role="img"');
    expect(html).toContain("<title>Kasseneck</title>");
  });
});

describe("Wordmark", () => {
  it("renders the nine glyphs; joined they are the source path — no font involved", () => {
    const html = renderToStaticMarkup(createElement(Wordmark, { height: 48 }));
    expect(html).toContain('viewBox="69 0 263 48"');
    expect(html).toContain('width="263"');
    const paths = ds(html);
    expect(paths).toHaveLength(9);
    expect(strip(paths.join(""))).toBe(strip(sourcePaths[3]));
    expect(html).not.toContain("<text");
  });
  it("moves, scales and tints a glyph around its own centre", () => {
    const rest = glyphs.map(() => ({ opacity: 1, scale: 1, dx: 0, dy: 0, tint: 0, accent: 0 }));
    rest[0] = { opacity: 1, scale: 0.5, dx: 1, dy: 0, tint: 1, accent: 0 };
    const html = renderToStaticMarkup(createElement(Wordmark, { glyphs: rest, ink: "#000", highlight: "#0ff" }));
    const cx = glyphs[0].bbox.x + glyphs[0].bbox.width / 2, cy = glyphs[0].bbox.y + glyphs[0].bbox.height / 2;
    expect(html).toContain(`transform="translate(${Math.round((cx + 6) * 1000) / 1000} ${Math.round(cy * 1000) / 1000}) scale(0.5)`);
    expect(html).toContain('fill="#0ff"');
  });
});

describe("Logo", () => {
  it("is the brand box, 332/48 as wide as tall, named Kasseneck", () => {
    const html = renderToStaticMarkup(createElement(Logo, { height: 48 }));
    expect(html).toContain('viewBox="0 0 332 48"');
    expect(html).toContain('width="332"');
    expect(html).toContain('role="img"');
    expect(html).toContain("<title>Kasseneck</title>");
    expect(ds(html)).toEqual(sourcePaths.slice(0, 3).concat(glyphs.map((g) => g.d)));
  });
});

describe("animations — twin contract", () => {
  it("every golden animation exists here and nothing more", () => {
    expect(Object.keys(golden.animations).sort()).toEqual([...animationNames].sort());
    expect(Object.keys(animations).sort()).toEqual([...animationNames].sort());
  });
  it("every sample of every animation matches the golden", () => {
    let checked = 0;
    for (const [name, meta] of Object.entries<any>(golden.animations)) {
      const anim = animations[name];
      expect(anim.duration).toBe(meta.duration);
      expect(anim.loop).toBe(meta.loop);
      for (const [t, line] of Object.entries<string>(meta.samples)) {
        expect(flatten(sample(anim, Number(t))).join(","), `${name} at ${t}`).toBe(line);
        checked++;
      }
    }
    expect(checked).toBe(Object.keys(golden.animations).length * SAMPLE_TIMES.length);
  });
});

describe("LogoMotion", () => {
  it("renders the first frame on the server", () => {
    const html = renderToStaticMarkup(createElement(LogoMotion, { animation: "scatter", height: 48 }));
    expect(html).toContain('viewBox="0 0 332 48"');
    // Frame 0 of "scatter" hides everything: the cell container is there, no rect yet.
    expect(html).toContain('class="kd-signet-cells"');
    expect(html).not.toContain("<rect");
    const mark = renderToStaticMarkup(createElement(LogoMotion, { animation: "breathe", wordmark: false, height: 40 }));
    expect(mark).toContain('viewBox="0 0 48 48"');
  });
});

describe("frame changes", () => {
  it("cells and glyphs never share a key, and each group has its own container", () => {
    // Rendering the same tree twice with different states would otherwise
    // leave React pairing a rect with a path — stale cells on screen.
    const s = sample(animations.rain, 0.5);
    const html = renderToStaticMarkup(createElement(Logo, { cells: s.cells, glyphs: s.glyphs, pixels: s.pixels }));
    expect(html).toContain('class="kd-signet-cells"');
    expect(html).toContain('class="kd-wordmark-glyphs"');
    // Rain starts with everything hidden: no rect, no glyph path, no pixel.
    const start = sample(animations.rain, 0);
    const empty = renderToStaticMarkup(createElement(Logo, { cells: start.cells, glyphs: start.glyphs, pixels: start.pixels }));
    expect(empty).not.toContain("<rect");
    expect(empty).not.toContain(" d=");
  });
});

describe("pixel art", () => {
  it("draws the lit pixels of the heart while the mark's cells are still hidden", () => {
    const s = sample(animations.heart, 0.4);
    expect(s.cells.every((c) => c.opacity === 0)).toBe(true);
    const lit = s.pixels.filter((p) => p.opacity > 0).length;
    expect(lit).toBe(32); // the heart bitmap has 32 lit fields
    const html = renderToStaticMarkup(createElement(Signet, { cells: s.cells, pixels: s.pixels, ink: "#000", accent: "#0f0", highlight: "#0ff" }));
    expect(html).toContain('class="kd-signet-pixels"');
    expect(html.match(/<rect/g)).toHaveLength(32);
    expect(html).toContain('fill="#0f0"'); // the heart wears the corner's petrol
  });
  it("at rest the pixel layer renders nothing", () => {
    const s = sample(animations.heart, 1);
    const html = renderToStaticMarkup(createElement(Signet, { cells: s.cells, pixels: s.pixels }));
    expect(html).not.toContain("kd-signet-pixels");
    expect(html).toContain('class="kd-signet-rest"');
  });
});

describe("hold", () => {
  const rects = (html: string) => (html.match(/<rect /g) ?? []).length;

  it("holding shows the finished sign where playing to the end shows the logo again", () => {
    const held = renderToStaticMarkup(createElement(LogoMotion, { animation: "confirm", hold: true, autoplay: false, wordmark: false }));
    const ended = renderToStaticMarkup(createElement(LogoMotion, { animation: "confirm", autoplay: false, wordmark: false }));

    // At the end the mark is at rest, so the painter draws the three brand paths.
    expect(rects(ended)).toBe(0);
    expect(ds(ended)).toEqual([...FRAME_PATHS, CORNER_PATH]);

    // Held, the check stands: one rect per lit pixel, and nothing else.
    const s = sample(animations.confirm, animations.confirm.hold! / animations.confirm.duration);
    expect(rects(held)).toBe(s.pixels.filter((p) => p.opacity > 0).length + s.cells.filter((c) => c.opacity > 0).length);
    expect(rects(held)).toBeGreaterThan(0);
  });

  it("every animation with a hold point holds on its own sign", () => {
    for (const name of animationNames) {
      const a = animations[name];
      if (!a.hold) continue;
      const html = renderToStaticMarkup(createElement(LogoMotion, { animation: name, hold: true, autoplay: false, wordmark: false }));
      expect(rects(html), name).toBeGreaterThan(0);
    }
  });
});

describe("cues: sound and touch", () => {
  it("a tap uses the device's vibration; without one nothing happens and nothing throws", () => {
    const buzzes: number[] = [];
    const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
    Object.defineProperty(globalThis, "navigator", { value: { vibrate: (ms: number) => buzzes.push(ms) }, configurable: true });
    tapHaptic("selection");
    tapHaptic("heavy");
    tapHaptic(undefined);
    expect(buzzes).toEqual([5, 35]);

    Object.defineProperty(globalThis, "navigator", { value: {}, configurable: true });
    expect(() => tapHaptic("heavy")).not.toThrow();
    if (original) Object.defineProperty(globalThis, "navigator", original);
    else delete (globalThis as { navigator?: unknown }).navigator;
  });

  it("a tone stays silent where there is no audio, and fireCue obeys what was asked for", () => {
    expect(() => playSound("confirm")).not.toThrow();
    expect(() => playSound(undefined)).not.toThrow();
    const buzzes: number[] = [];
    const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
    Object.defineProperty(globalThis, "navigator", { value: { vibrate: (ms: number) => buzzes.push(ms) }, configurable: true });
    fireCue({ at: 0, haptic: "light", sound: "confirm" }, {});
    expect(buzzes, "off by default").toEqual([]);
    fireCue({ at: 0, haptic: "light", sound: "confirm" }, { haptics: true });
    expect(buzzes).toEqual([10]);
    if (original) Object.defineProperty(globalThis, "navigator", original);
    else delete (globalThis as { navigator?: unknown }).navigator;
  });

  it("every tone the data names is playable and every cue points at one", () => {
    for (const [name, s] of Object.entries(sounds)) {
      expect(s.notes.length, name).toBeGreaterThan(0);
      for (const n of s.notes) expect(n.hz, name).toBeGreaterThan(20);
    }
    for (const a of animationNames) {
      for (const cue of animations[a].cues ?? []) {
        expect(cue.at, a).toBeLessThanOrEqual(animations[a].duration);
        if (cue.sound) expect(Object.keys(sounds), a).toContain(cue.sound);
      }
    }
  });
});

describe("playSound", () => {
  class FakeParam {
    constructor(public calls: [string, number, number][]) {}
    setValueAtTime = (v: number, t: number) => this.calls.push(["set", v, t]);
    linearRampToValueAtTime = (v: number, t: number) => this.calls.push(["linear", v, t]);
    exponentialRampToValueAtTime = (v: number, t: number) => this.calls.push(["exp", v, t]);
  }
  type Played = { hz: number; start: number; stop: number; type: string; peak: number; to?: number; glideEnd?: number };

  function fakeAudio(state: "running" | "suspended") {
    const played: Played[] = [];
    const context = {
      state,
      currentTime: 5,
      destination: {},
      resume() {
        context.state = "running";
        return Promise.resolve();
      },
      createGain() {
        const calls: [string, number, number][] = [];
        return { gain: new FakeParam(calls), calls, connect: () => context.destination };
      },
      createOscillator() {
        const note: Played = { hz: 0, start: 0, stop: 0, type: "", peak: 0 };
        played.push(note);
        return {
          set type(v: string) { note.type = v; },
          frequency: {
            setValueAtTime: (v: number) => { note.hz = v; },
            exponentialRampToValueAtTime: (v: number, t: number) => { note.to = v; note.glideEnd = t; },
          },
          connect: (g: { calls: [string, number, number][] }) => {
            // The peak the envelope ramps up to is this note's loudness.
            queueMicrotask(() => { note.peak = g.calls.find((c) => c[0] === "linear")?.[1] ?? 0; });
            return { connect: () => {} };
          },
          start: (t: number) => { note.start = t; },
          stop: (t: number) => { note.stop = t; },
        };
      },
    };
    return { context, played };
  }

  // One page, one audio context — so both halves are told on the same fake:
  // suspended at first, the way a browser hands it over, then running.
  it("waits for a suspended context, then books every note in order, struck and stopped at its own length", async () => {
    const { context, played } = fakeAudio("suspended");
    const original = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", { value: { AudioContext: function () { return context; } }, configurable: true });

    playSound("confirm");
    expect(played, "nothing is booked against a standing clock").toHaveLength(0);
    await Promise.resolve();
    await Promise.resolve();
    expect(context.state, "asked the browser to let it play").toBe("running");
    expect(played.length, "played once allowed").toBe(sounds.confirm.notes.length);

    played.length = 0;
    context.currentTime = 5;
    playSound("confirm");
    await Promise.resolve();
    const spec = sounds.confirm;
    expect(played.map((p) => p.hz)).toEqual(spec.notes.map((n) => n.hz));
    expect(played.every((p) => p.type === spec.wave)).toBe(true);
    // The second note starts where the first one stops — the tone is a sequence.
    expect(played[0].start).toBe(5);
    expect(played[0].stop).toBeCloseTo(5 + spec.notes[0].ms / 1000, 6);
    expect(played[1].start).toBeCloseTo(played[0].stop, 6);
    expect(played[0].peak).toBe(spec.gain);

    if (original) Object.defineProperty(globalThis, "window", original);
    else delete (globalThis as { window?: unknown }).window;
  });

  it("a gliding note ramps to its second frequency by its own end; a plain one does not", async () => {
    const { context, played } = fakeAudio("running");
    const original = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", { value: { AudioContext: function () { return context; } }, configurable: true });

    playSound("sent");
    await Promise.resolve();
    const spec = sounds.sent;
    expect(spec.notes.some((n) => n.to !== undefined), "the send tone glides").toBe(true);
    played.forEach((p, i) => {
      expect(p.to, `note ${i}`).toBe(spec.notes[i].to);
      if (p.to !== undefined) expect(p.glideEnd, `note ${i} arrives at its end`).toBeCloseTo(p.stop, 6);
    });

    played.length = 0;
    playSound("confirm");
    await Promise.resolve();
    expect(played.every((p) => p.to === undefined), "the confirmation is struck, not slid").toBe(true);

    if (original) Object.defineProperty(globalThis, "window", original);
    else delete (globalThis as { window?: unknown }).window;
  });
});
