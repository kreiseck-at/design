import { readFile, writeFile } from "node:fs/promises";
import { contrast } from "../tools/color.mjs";

const model = JSON.parse(
  await readFile(new URL("../golden/kasseneck.json", import.meta.url)),
);

// Pick whichever of black/white reads better on this background, instead of
// guessing from the step number: a fixed cutoff puts white text on several
// mid-tone swatches (e.g. any ramp's 500) at well under 4.5:1.
const pickInk = (colour) =>
  contrast(colour, "#FFFFFF") >= contrast(colour, "#000000")
    ? "#FFFFFF"
    : "#000000";

const swatch = (label, colour) =>
  `<div class="sw" style="background:${colour};color:${pickInk(colour)}">` +
  `<b>${label}</b><span>${colour}</span></div>`;

const ramps = Object.entries(model.ramps)
  .map(([name, ramp]) => {
    const cells = Object.entries(ramp)
      .map(([step, colour]) => swatch(step, colour))
      .join("");
    return `<h3>${name}</h3><div class="row">${cells}</div>`;
  })
  .join("");

const roleRows = Object.keys(model.roles.light)
  .map(
    (role) =>
      `<tr><td><code>${role}</code></td>` +
      `<td>${swatch("", model.roles.light[role])}</td>` +
      `<td>${swatch("", model.roles.dark[role])}</td></tr>`,
  )
  .join("");

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Kreiseck Design — ${model.brand}</title>
<style>
  body { font-family: system-ui; margin: 0; padding: 2rem; background: ${model.roles.light.ground};
         color: ${model.roles.light.ink}; }
  .row { display: flex; border-radius: ${model.form.radius.md}px; overflow: hidden; margin: .4rem 0 1.4rem; }
  .sw { flex: 1; padding: 1rem .4rem; text-align: center; font-size: .7rem; font-family: ui-monospace, monospace; }
  .sw b { display: block; font-size: .8rem; }
  table { border-collapse: collapse; width: 100%; }
  td { padding: .3rem .6rem; border-bottom: 1px solid ${model.roles.light.divider}; }
  td .sw { border-radius: 6px; min-width: 5rem; }
</style></head><body>
<h1>Kreiseck Design — ${model.brand}</h1>
<p>Generated from <code>golden/kasseneck.json</code>. Modes: ${model.modes.join(", ")}.</p>
<h2>Ramps</h2>${ramps}
<h2>Roles</h2><table><tr><th>role</th><th>light</th><th>dark</th></tr>${roleRows}</table>
</body></html>`;

await writeFile(new URL("index.html", import.meta.url), html);
console.log("wrote gallery/index.html");
