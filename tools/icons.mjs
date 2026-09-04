import { readFile, readdir } from "node:fs/promises";

export const GROUPS = ["navigation", "action", "status", "cash", "document", "people", "device"];
const NAME = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const ALLOWED = {
  path: ["d"],
  circle: ["cx", "cy", "r"],
  rect: ["x", "y", "width", "height", "rx"],
  line: ["x1", "y1", "x2", "y2"],
};
const FILL_ATTRS = ["fill", "fill-rule"];
const MIN = 1.5, MAX = 22.5;

export class IconError extends Error {
  constructor(problems) {
    super(`${problems.length} icon problem(s):\n  - ${problems.join("\n  - ")}`);
    this.problems = problems;
  }
}

// The dialect has no nesting and no text nodes, so a tag scanner is enough;
// a real XML parser would be a dependency for nothing.
export function parseElements(svg) {
  const inner = svg.replace(/<\?xml[^>]*>/, "").replace(/<!--[\s\S]*?-->/g, "");
  const tags = [...inner.matchAll(/<([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g)];
  const out = [];
  for (const [, tag, rawAttrs] of tags) {
    if (tag === "svg" || tag === "/svg") continue;
    const attrs = {};
    for (const m of rawAttrs.matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[m[1]] = m[2];
    out.push({ tag, attrs });
  }
  return out;
}

// Deliberately no "e" exponent here: the dialect is hand-written coordinates,
// so scientific notation is garbage, not a valid number in disguise.
const NUMBER_TOKEN = /-?\d*\.?\d+(?:e-?\d+)?/gi;
const numberTokens = (text) => [...text.matchAll(NUMBER_TOKEN)].map((m) => m[0]);

function checkNumber(id, value, problems) {
  const s = String(value);
  if (!/^-?\d*\.?\d+$/.test(s)) { problems.push(`${id}: value ${s} is not a number with at most one decimal`); return; }
  if (/\.\d{2,}/.test(s)) problems.push(`${id}: value ${s} has more than one decimal`);
}

function checkPoint(id, x, y, problems) {
  if (x < MIN || x > MAX || y < MIN || y > MAX) problems.push(`${id}: point (${x}, ${y}) outside ${MIN}–${MAX}`);
}

const PATH_CHARS = /[^\s\d.\-eEMLHVCSAZQTmlhvcsaqtz,]/;

// Walk the path once to check every point it touches, including control
// points and arc end points; relative commands are resolved against the
// running position so the check is about where lines really go.
function checkPath(id, d, problems) {
  const badChar = d.match(PATH_CHARS);
  if (badChar) { problems.push(`${id}: path contains unexpected character "${badChar[0]}"`); return; }
  const firstCommand = d.search(/[MLHVCSAZQTmlhvcsaqtz]/);
  if (firstCommand !== 0) { problems.push(`${id}: path has text before the first command`); return; }
  const cmds = [...d.matchAll(/([MLHVCSAZQTmlhvcsaqtz])([^MLHVCSAZQTmlhvcsaqtz]*)/g)];
  if (cmds.length === 0) problems.push(`${id}: empty path`);
  let x = 0, y = 0, sx = 0, sy = 0;
  for (const [, c, argText] of cmds) {
    if ("QqTt".includes(c)) { problems.push(`${id}: path command ${c.toUpperCase()} is not allowed (use C)`); return; }
    const rawArgs = numberTokens(argText);
    rawArgs.forEach((raw) => checkNumber(id, raw, problems));
    const args = rawArgs.map(Number);
    const rel = c === c.toLowerCase();
    const U = c.toUpperCase();
    const arity = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, A: 7, Z: 0 }[U];
    if (U === "Z") { x = sx; y = sy; continue; }
    if (args.length === 0 || args.length % arity !== 0) { problems.push(`${id}: command ${c} has ${args.length} numbers, expected a multiple of ${arity}`); return; }
    for (let i = 0; i < args.length; i += arity) {
      const a = args.slice(i, i + arity);
      const px = (v) => (rel ? x + v : v), py = (v) => (rel ? y + v : v);
      if (U === "H") { x = px(a[0]); checkPoint(id, x, y, problems); }
      else if (U === "V") { y = py(a[0]); checkPoint(id, x, y, problems); }
      else if (U === "C") { checkPoint(id, px(a[0]), py(a[1]), problems); checkPoint(id, px(a[2]), py(a[3]), problems); x = px(a[4]); y = py(a[5]); checkPoint(id, x, y, problems); }
      else if (U === "S") { checkPoint(id, px(a[0]), py(a[1]), problems); x = px(a[2]); y = py(a[3]); checkPoint(id, x, y, problems); }
      else if (U === "A") { x = px(a[5]); y = py(a[6]); checkPoint(id, x, y, problems); }
      else { x = px(a[0]); y = py(a[1]); checkPoint(id, x, y, problems); if (U === "M") { sx = x; sy = y; } }
    }
  }
}

export function validateIcon(id, svg, { filled }) {
  const problems = [];
  if (!NAME.test(id.replace(/-filled$/, ""))) problems.push(`${id}: name must match ${NAME.source}`);
  const root = svg.match(/<svg\b([^>]*)>/);
  if (!root) { problems.push(`${id}: no <svg> root`); return problems; }
  const rootAttrs = {};
  for (const m of root[1].matchAll(/([\w:-]+)="([^"]*)"/g)) rootAttrs[m[1]] = m[2];
  if (rootAttrs.viewBox !== "0 0 24 24") problems.push(`${id}: viewBox must be "0 0 24 24"`);
  for (const k of Object.keys(rootAttrs)) if (k !== "viewBox" && k !== "xmlns") problems.push(`${id}: root attribute ${k} is not allowed`);
  const elements = parseElements(svg);
  if (elements.length === 0) problems.push(`${id}: no elements`);
  for (const { tag, attrs } of elements) {
    if (!ALLOWED[tag]) { problems.push(`${id}: element <${tag}> is not allowed`); continue; }
    for (const [k, v] of Object.entries(attrs)) {
      if (FILL_ATTRS.includes(k)) {
        if (!filled) problems.push(`${id}: attribute ${k} on <${tag}> is not allowed`);
        else if (k === "fill" && v !== "currentColor") problems.push(`${id}: fill must be "currentColor"`);
        else if (k === "fill-rule" && v !== "evenodd") problems.push(`${id}: fill-rule must be "evenodd"`);
        continue;
      }
      if (!ALLOWED[tag].includes(k)) { problems.push(`${id}: attribute ${k} on <${tag}> is not allowed`); continue; }
      if (k !== "d") checkNumber(id, v, problems);
    }
    for (const k of ALLOWED[tag]) if (k !== "rx" && !(k in attrs)) problems.push(`${id}: <${tag}> is missing ${k}`);
    if (tag === "path" && attrs.d) checkPath(id, attrs.d, problems);
    if (tag === "circle") {
      const [cx, cy, r] = ["cx", "cy", "r"].map((k) => Number(attrs[k]));
      // Number(attrs.r) is NaN for garbage values already flagged above; don't pile on.
      if (!Number.isNaN(r) && !(r > 0)) problems.push(`${id}: r must be positive`);
      checkPoint(id, cx - r, cy - r, problems); checkPoint(id, cx + r, cy + r, problems);
    }
    if (tag === "rect") {
      const [x, y, w, h] = ["x", "y", "width", "height"].map((k) => Number(attrs[k]));
      if (!Number.isNaN(w) && !(w > 0)) problems.push(`${id}: width must be positive`);
      if (!Number.isNaN(h) && !(h > 0)) problems.push(`${id}: height must be positive`);
      checkPoint(id, x, y, problems); checkPoint(id, x + w, y + h, problems);
      if ("rx" in attrs) { const rx = Number(attrs.rx); if (!(rx === 0 || rx < 2.5)) problems.push(`${id}: rx ${attrs.rx} must be 0 or smaller than 2.5 (omit it for the default)`); }
    }
    if (tag === "line") { checkPoint(id, Number(attrs.x1), Number(attrs.y1), problems); checkPoint(id, Number(attrs.x2), Number(attrs.y2), problems); }
  }
  return problems;
}

export async function loadIcons(root) {
  const dir = new URL("icons/", root);
  const index = JSON.parse(await readFile(new URL("index.json", dir), "utf8"));
  const files = (await readdir(dir)).filter((f) => f.endsWith(".svg"));
  const problems = [];
  const present = new Set(files.map((f) => f.replace(/\.svg$/, "")));
  for (const f of present) {
    const base = f.replace(/-filled$/, "");
    if (!index[base]) problems.push(`${base}: file without entry in index.json`);
    else if (f.endsWith("-filled") && !index[base].filled) problems.push(`${base}: ${f}.svg exists but index.json has no filled: true`);
  }
  const icons = {};
  for (const [id, meta] of Object.entries(index)) {
    if (!GROUPS.includes(meta.group)) problems.push(`${id}: group ${meta.group} is not one of ${GROUPS.join(", ")}`);
    if (typeof meta.de !== "string" || !meta.de) problems.push(`${id}: de is missing`);
    if (!Array.isArray(meta.terms)) problems.push(`${id}: terms must be an array`);
    if (!present.has(id)) { problems.push(meta.filled && present.has(`${id}-filled`) ? `${id}: filled: true but ${id}.svg is missing` : `${id}: entry without file`); continue; }
    const strokeText = await readFile(new URL(`${id}.svg`, dir), "utf8");
    problems.push(...validateIcon(id, strokeText, { filled: false }));
    const icon = { group: meta.group, de: meta.de, terms: meta.terms ?? [], filled: !!meta.filled, stroke: parseElements(strokeText) };
    if (meta.filled) {
      if (!present.has(`${id}-filled`)) problems.push(`${id}: filled: true but ${id}-filled.svg is missing`);
      else {
        const fillText = await readFile(new URL(`${id}-filled.svg`, dir), "utf8");
        problems.push(...validateIcon(`${id}-filled`, fillText, { filled: true }));
        icon.fill = parseElements(fillText);
      }
    }
    icons[id] = icon;
  }
  if (problems.length) throw new IconError(problems);
  return { order: Object.keys(index), icons };
}
