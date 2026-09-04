import { describe, it, expect } from "vitest";
import { iconDigests } from "./icons-digest.mjs";

const model = (rectAttrs) => ({
  order: ["arrow-left", "cash-drawer"],
  icons: {
    "arrow-left": { filled: false, stroke: [{ tag: "path", attrs: { d: "M14 6l-6 6 6 6" } }] },
    "cash-drawer": {
      filled: true,
      stroke: [{ tag: "rect", attrs: { x: "3", y: "10", width: "18", height: "10", ...rectAttrs } }],
      fill: [{ tag: "rect", attrs: { x: "3", y: "11", width: "18", height: "9", fill: "currentColor", ...rectAttrs } }],
    },
  },
});

describe("iconDigests", () => {
  it("gives the same checksum for the same source", () => {
    const a = iconDigests(model());
    const b = iconDigests(model());
    expect(a).toEqual(b);
  });

  it("changes the checksum when the effective rx changes", () => {
    const withDefault = iconDigests(model());
    const withExplicitRx = iconDigests(model({ rx: "1" }));
    expect(withDefault["cash-drawer"]).not.toBe(withExplicitRx["cash-drawer"]);
    expect(withDefault["cash-drawer-filled"]).not.toBe(withExplicitRx["cash-drawer-filled"]);
  });

  it("keeps a stable digest independent of key iteration order", () => {
    const out = iconDigests(model());
    expect(Object.keys(out)).toEqual(["arrow-left", "cash-drawer", "cash-drawer-filled"]);
    expect(out["arrow-left"]).toMatch(/^[0-9a-f]{64}$/);
    expect(out["cash-drawer"]).toMatch(/^[0-9a-f]{64}$/);
    expect(out["cash-drawer"]).not.toBe(out["cash-drawer-filled"]);
  });
});
