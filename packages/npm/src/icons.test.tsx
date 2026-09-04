import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { Receipt, CashDrawer, CheckFilled, iconNames } from "./icons/index.js";
import { readFileSync } from "node:fs";

describe("icon components", () => {
  it("render a 24-grid svg in currentColor, decorative by default", () => {
    const html = renderToStaticMarkup(createElement(Receipt));
    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain('stroke="currentColor"');
    expect(html).toContain('stroke-width="1.75"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('class="kd-icon kd-icon-receipt"');
  });
  it("take size, strokeWidth and title", () => {
    const html = renderToStaticMarkup(createElement(CashDrawer, { size: 20, strokeWidth: 2, title: "Kassenlade" }));
    expect(html).toContain('width="20"');
    expect(html).toContain('stroke-width="2"');
    expect(html).toContain("<title>Kassenlade</title>");
    expect(html).toContain('role="img"');
    expect(html).toContain('rx="2.5"');
  });
  it("renders a filled icon with fill=currentColor and no stroke, so it doesn't paint over its holes", () => {
    const html = renderToStaticMarkup(createElement(CheckFilled));
    expect(html).toContain('fill="currentColor"');
    expect(html).toContain('stroke="none"');
    expect(html).not.toContain("stroke-width");
  });
  it("the sprite carries every name", () => {
    const sprite = readFileSync(new URL("../svg/sprite.svg", import.meta.url), "utf8");
    for (const name of iconNames) expect(sprite).toContain(`id="kd-${name}"`);
  });
});
