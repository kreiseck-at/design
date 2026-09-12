import { createHash } from "node:crypto";
import { sample, flatten, shuffle, SAMPLE_TIMES } from "./logo-animate.mjs";

const sha = (s) => createHash("sha256").update(s).digest("hex");

/** What the golden freezes about the logo: geometry digests and animation samples. */
export function logoDigest(logo, animations, sounds = {}) {
  const anims = {};
  for (const a of animations) {
    const samples = {};
    // One line per sample time so a drift shows up as one readable diff line.
    for (const t of SAMPLE_TIMES) samples[String(t)] = flatten(sample(a, t)).join(",");
    anims[a.name] = { de: a.de, scenario: a.scenario, duration: a.duration, loop: a.loop, ...(a.highlight ? { highlight: a.highlight } : {}), ...(a.hold ? { hold: a.hold } : {}), ...(a.cues ? { cues: a.cues } : {}), samples };
  }
  return {
    width: logo.viewBox.width,
    height: logo.viewBox.height,
    grid: logo.grid,
    cells: logo.cells.map(({ row, col, part }) => ({ row, col, part })),
    frame: sha(logo.signet.frame.join("|")),
    corner: sha(logo.signet.corner),
    glyphs: logo.glyphs.map((g) => ({ char: g.char, bbox: g.bbox, holes: g.holes, digest: sha(g.d) })),
    animations: anims,
    sounds,
    // Pins the PRNG: both packages must shuffle 0..31 with seed 7 into this.
    shuffle7: shuffle(Array.from({ length: 32 }, (_, i) => i), 7).join(","),
  };
}
