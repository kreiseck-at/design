import { createHash } from "node:crypto";
import { normalize, opsToSvgPath } from "./svg-path.mjs";

const digest = (elements) => createHash("sha256").update(normalize(elements, { rx: 2.5 }).map(opsToSvgPath).join("|")).digest("hex");

export function iconDigests(model) {
  const out = {};
  for (const id of model.order) {
    out[id] = digest(model.icons[id].stroke);
    if (model.icons[id].filled) out[`${id}-filled`] = digest(model.icons[id].fill);
  }
  return out;
}
