import { contrast } from "./color.mjs";
import { iconSvgInner } from "./emit-icons-web.mjs";
import { GROUPS } from "./icons.mjs";

// The gallery is HTML, not just JS-string interpolation: an id, German label
// or search term with a quote or angle bracket must not break out of an
// attribute or read as a tag.
const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Pick whichever of black/white reads better on this background, instead of
// guessing from the step number: a fixed cutoff puts white text on several
// mid-tone swatches (e.g. any ramp's 500) at well under 4.5:1.
const pickInk = (colour) =>
  contrast(colour, "#FFFFFF") >= contrast(colour, "#000000") ? "#FFFFFF" : "#000000";

const swatch = (label, colour) =>
  `<div class="sw" style="background:${colour};color:${pickInk(colour)}">` +
  `<b>${label}</b><span>${colour}</span></div>`;

/**
 * The visual proving ground, as a pure function of the model — so it is one
 * of `outputs()` and `pnpm check` covers it like every other generated file
 * instead of a page nobody notices going stale.
 */
export function emitGallery(model, iconsModel = { order: [], icons: {} }) {
  const ramps = Object.entries(model.ramps)
    .map(([name, ramp]) => {
      const cells = Object.entries(ramp)
        .map(([step, colour]) => swatch(step, colour))
        .join("");
      return `<h3>${name}</h3><div class="row">${cells}</div>`;
    })
    .join("");

  const roleHead = model.modes.map((mode) => `<th>${mode}</th>`).join("");
  const roleRows = Object.keys(model.roles.light)
    .map(
      (role) =>
        `<tr><td><code>${role}</code></td>` +
        model.modes.map((mode) => `<td>${swatch("", model.roles[mode][role])}</td>`).join("") +
        `</tr>`,
    )
    .join("");

  const hand = 'fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"';
  // A filled icon's elements already carry their own fill/fill-rule; giving
  // it the stroke hand too would paint a stroke right over its holes (stroke
  // is an inherited SVG property), so its cell gets the filled hand instead.
  const filledHand = 'fill="currentColor" stroke="none"';
  const iconSvg = (elements, cls, filled) => `<svg class="${cls}" viewBox="0 0 24 24" ${filled ? filledHand : hand}>${iconSvgInner(elements)}</svg>`;
  const byGroup = {};
  for (const id of iconsModel.order) (byGroup[iconsModel.icons[id].group] ??= []).push(id);
  const iconCells = GROUPS.filter((group) => byGroup[group]).map((group) => {
    const ids = byGroup[group];
    return `<h3>${group}</h3><div class="icons">` + ids.map((id) => {
      const icon = iconsModel.icons[id];
      const sizes = ["s16", "s20", "s24", "s40"].map((s) => `<span class="ic ${s}">${iconSvg(icon.stroke, `kd-${id}`, false)}</span>`).join("");
      const filled = icon.filled ? `<span class="ic s24">${iconSvg(icon.fill, `kd-${id}-filled`, true)}</span>` : "";
      const terms = [esc(id), esc(icon.de), ...icon.terms.map(esc)].join(" ").toLowerCase();
      return `<div class="icon" data-terms="${terms}"><div class="sizes">${sizes}${filled}</div><code>${esc(id)}</code><small>${esc(icon.de)}</small></div>`;
    }).join("") + `</div>`;
  }).join("");
  const iconsSection = `<section id="icons"><h2>Icons</h2>
<p><input type="search" id="icon-search" placeholder="search name, German label or term"> <label><input type="checkbox" id="icon-dark"> dark ground</label></p>
${iconCells}</section>
<script>
const q=document.getElementById('icon-search'),d=document.getElementById('icon-dark');
q.addEventListener('input',()=>{const v=q.value.toLowerCase();document.querySelectorAll('.icon').forEach(e=>{e.hidden=Boolean(v)&&!e.dataset.terms.includes(v)})});
d.addEventListener('change',()=>document.getElementById('icons').classList.toggle('dark',d.checked));
</script>`;

  return `<!doctype html>
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
  .icons{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px} .icon{border:1px solid #ddd;border-radius:10px;padding:8px;color:#132A2A} .sizes{display:flex;gap:10px;align-items:center;height:44px} .ic svg{display:block} .s16 svg{width:16px;height:16px} .s20 svg{width:20px;height:20px} .s24 svg{width:24px;height:24px} .s40 svg{width:40px;height:40px} .icon code,.icon small{display:block} .icon code{font-size:11px;margin-top:2px} .icon small{font-size:11px;color:#4A6363;margin-top:2px} #icons.dark .icon{background:#131B1B;color:#F2F5F5;border-color:#2A3A3A}
</style></head><body>
<h1>Kreiseck Design — ${model.brand}</h1>
<p>Generated from <code>golden/kasseneck.json</code>. Modes: ${model.modes.join(", ")}.</p>
<h2>Ramps</h2>${ramps}
<h2>Roles</h2><table><tr><th>role</th>${roleHead}</tr>${roleRows}</table>
${iconsSection}
</body></html>`;
}
