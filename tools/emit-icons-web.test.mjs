import { describe, it, expect } from "vitest";
import { emitIconsWeb, pascal } from "./emit-icons-web.mjs";

const model = { order: ["arrow-left", "cash-drawer"], icons: {
  "arrow-left": { group: "navigation", de: "Zurück", terms: [], filled: false, stroke: [{ tag: "path", attrs: { d: "M14 6l-6 6 6 6" } }] },
  "cash-drawer": { group: "cash", de: "Kassenlade", terms: [], filled: true,
    stroke: [{ tag: "rect", attrs: { x: "3", y: "10", width: "18", height: "10" } }],
    fill: [{ tag: "rect", attrs: { x: "3", y: "10", width: "18", height: "10", fill: "currentColor" } }] },
} };
const files = Object.fromEntries(emitIconsWeb(model).files);

describe("emitIconsWeb", () => {
  it("names components in PascalCase", () => {
    expect(pascal("cash-drawer")).toBe("CashDrawer");
    expect(files["packages/npm/src/icons/CashDrawerFilled.tsx"]).toContain('createIcon("cash-drawer-filled"');
  });
  it("keeps source shapes (rect stays rect, rx filled in) for crisp SVG", () => {
    expect(files["packages/npm/src/icons/CashDrawer.tsx"]).toContain('["rect", { x: "3", y: "10", width: "18", height: "10", rx: "2.5" }]');
  });
  it("writes an index that re-exports every component", () => {
    const index = files["packages/npm/src/icons/index.ts"];
    expect(index).toContain('export { ArrowLeft } from "./ArrowLeft.js";');
    expect(index).toContain('export { CashDrawerFilled } from "./CashDrawerFilled.js";');
    expect(index).toContain("export const iconNames = [\"arrow-left\", \"cash-drawer\", \"cash-drawer-filled\"] as const;");
  });
  it("writes standalone svg files with the hand applied", () => {
    const svg = files["packages/npm/svg/arrow-left.svg"];
    expect(svg).toBe('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 6l-6 6 6 6"/></svg>\n');
    expect(files["packages/npm/svg/cash-drawer-filled.svg"]).toContain('<rect x="3" y="10" width="18" height="10" fill="currentColor" rx="2.5"/>');
  });
  it("writes one sprite with a symbol per icon", () => {
    const sprite = files["packages/npm/svg/sprite.svg"];
    expect(sprite).toContain('<symbol id="kd-arrow-left" viewBox="0 0 24 24">');
    expect(sprite).toContain('<symbol id="kd-cash-drawer-filled" viewBox="0 0 24 24">');
    expect(sprite.startsWith('<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="display:none">')).toBe(true);
  });
});
