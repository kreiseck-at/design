const KAPPA = 0.5522847498;
const r3 = (v) => Math.round(v * 1000) / 1000;

// Arc → centre parameterisation → ≤90° pieces → cubics. This is the standard
// derivation from the SVG implementation notes (appendix B.2.4/B.2.5); rounding
// happens once at the end so pieces stay continuous.
function arcToCubics(x1, y1, rx, ry, phiDeg, largeArc, sweep, x2, y2) {
  if (x1 === x2 && y1 === y2) return [];
  if (rx === 0 || ry === 0) return [["L", x2, y2]];
  const phi = (phiDeg * Math.PI) / 180, cos = Math.cos(phi), sin = Math.sin(phi);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const x1p = cos * dx + sin * dy, y1p = -sin * dx + cos * dy;
  rx = Math.abs(rx); ry = Math.abs(ry);
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) { rx *= Math.sqrt(lambda); ry *= Math.sqrt(lambda); }
  const sign = largeArc === sweep ? -1 : 1;
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const coef = sign * Math.sqrt(Math.max(0, num / den));
  const cxp = coef * ((rx * y1p) / ry), cyp = coef * (-(ry * x1p) / rx);
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2, cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const angle = (ux, uy, vx, vy) => {
    const dot = ux * vx + uy * vy, len = Math.hypot(ux, uy) * Math.hypot(vx, vy);
    let a = Math.acos(Math.min(1, Math.max(-1, dot / len)));
    return ux * vy - uy * vx < 0 ? -a : a;
  };
  const theta1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let delta = angle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  if (sweep && delta < 0) delta += 2 * Math.PI;
  const pieces = Math.ceil(Math.abs(delta) / (Math.PI / 2) - 1e-9);
  const step = delta / pieces;
  const out = [];
  let t = theta1;
  const point = (a) => [cx + rx * Math.cos(a) * cos - ry * Math.sin(a) * sin, cy + rx * Math.cos(a) * sin + ry * Math.sin(a) * cos];
  const tangent = (a) => [-rx * Math.sin(a) * cos - ry * Math.cos(a) * sin, -rx * Math.sin(a) * sin + ry * Math.cos(a) * cos];
  for (let i = 0; i < pieces; i++) {
    const t2 = t + step, k = (4 / 3) * Math.tan(step / 4);
    const [px, py] = point(t), [qx, qy] = point(t2), [tx, ty] = tangent(t), [ux, uy] = tangent(t2);
    const end = i === pieces - 1 ? [x2, y2] : [qx, qy];
    out.push(["C", px + k * tx, py + k * ty, qx - k * ux, qy - k * uy, end[0], end[1]]);
    t = t2;
  }
  return out;
}

function pathOps(d) {
  const cmds = [...d.matchAll(/([MLHVCSAZmlhvcsaz])([^MLHVCSAZmlhvcsaz]*)/g)];
  const ops = [];
  let x = 0, y = 0, sx = 0, sy = 0, lastC = null;
  for (const [, c, argText] of cmds) {
    const args = [...argText.matchAll(/-?\d*\.?\d+(?:e-?\d+)?/gi)].map((m) => Number(m[0]));
    const rel = c === c.toLowerCase(), U = c.toUpperCase();
    const arity = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, A: 7, Z: 0 }[U];
    if (U === "Z") { ops.push(["Z"]); x = sx; y = sy; lastC = null; continue; }
    for (let i = 0; i < args.length; i += arity) {
      const a = args.slice(i, i + arity);
      const px = (v) => (rel ? x + v : v), py = (v) => (rel ? y + v : v);
      if (U === "M" && i === 0) { x = px(a[0]); y = py(a[1]); sx = x; sy = y; ops.push(["M", x, y]); lastC = null; }
      else if (U === "M" || U === "L") { x = px(a[0]); y = py(a[1]); ops.push(["L", x, y]); lastC = null; }
      else if (U === "H") { x = px(a[0]); ops.push(["L", x, y]); lastC = null; }
      else if (U === "V") { y = py(a[0]); ops.push(["L", x, y]); lastC = null; }
      else if (U === "C") { const op = ["C", px(a[0]), py(a[1]), px(a[2]), py(a[3]), px(a[4]), py(a[5])]; ops.push(op); x = op[5]; y = op[6]; lastC = [op[3], op[4]]; }
      else if (U === "S") { const c1 = lastC ? [2 * x - lastC[0], 2 * y - lastC[1]] : [x, y]; const op = ["C", c1[0], c1[1], px(a[0]), py(a[1]), px(a[2]), py(a[3])]; ops.push(op); x = op[5]; y = op[6]; lastC = [op[3], op[4]]; }
      else if (U === "A") { const ex = px(a[5]), ey = py(a[6]); ops.push(...arcToCubics(x, y, a[0], a[1], a[2], a[3] !== 0, a[4] !== 0, ex, ey)); x = ex; y = ey; lastC = null; }
    }
  }
  return ops;
}

function circleOps(cx, cy, r) {
  const k = KAPPA * r;
  return [
    ["M", cx + r, cy],
    ["C", cx + r, cy + k, cx + k, cy + r, cx, cy + r],
    ["C", cx - k, cy + r, cx - r, cy + k, cx - r, cy],
    ["C", cx - r, cy - k, cx - k, cy - r, cx, cy - r],
    ["C", cx + k, cy - r, cx + r, cy - k, cx + r, cy],
    ["Z"],
  ];
}

function rectOps(x, y, w, h, r) {
  if (r <= 0) return [["M", x, y], ["L", x + w, y], ["L", x + w, y + h], ["L", x, y + h], ["Z"]];
  r = Math.min(r, w / 2, h / 2);
  const k = KAPPA * r;
  return [
    ["M", x + r, y],
    ["L", x + w - r, y],
    ["C", x + w - r + k, y, x + w, y + r - k, x + w, y + r],
    ["L", x + w, y + h - r],
    ["C", x + w, y + h - r + k, x + w - r + k, y + h, x + w - r, y + h],
    ["L", x + r, y + h],
    ["C", x + r - k, y + h, x, y + h - r + k, x, y + h - r],
    ["L", x, y + r],
    ["C", x, y + r - k, x + r - k, y, x + r, y],
    ["Z"],
  ];
}

const round = (ops) => ops.map((op) => op.map((v, i) => (i === 0 ? v : r3(v))));

export function toOps({ tag, attrs }, { rx = 2.5 } = {}) {
  const n = (k) => Number(attrs[k]);
  switch (tag) {
    case "path": return round(pathOps(attrs.d));
    case "circle": return round(circleOps(n("cx"), n("cy"), n("r")));
    case "rect": return round(rectOps(n("x"), n("y"), n("width"), n("height"), "rx" in attrs ? n("rx") : rx));
    case "line": return round([["M", n("x1"), n("y1")], ["L", n("x2"), n("y2")]]);
    default: throw new Error(`unknown element ${tag}`);
  }
}

export const normalize = (elements, opts) => elements.map((e) => toOps(e, opts));

export const opsToSvgPath = (ops) => ops.map((op) => op[0] + op.slice(1).join(" ")).join("");
