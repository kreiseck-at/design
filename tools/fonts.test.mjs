import { describe, it, expect } from "vitest";
import { emitFontsCss, WEB_FACES } from "./fonts.mjs";

describe("emitFontsCss", () => {
  const css = emitFontsCss();
  it("declares every packaged face once", () => {
    expect(WEB_FACES).toHaveLength(6);
    for (const face of WEB_FACES) {
      expect(css).toContain(`src: url("./fonts/${face.file}") format("woff2");`);
    }
    expect(css.match(/@font-face/g)).toHaveLength(6);
  });
  it("uses the family names the tokens name, with swap and the right weights", () => {
    expect(css).toContain('font-family: "Archivo";');
    expect(css).toContain('font-family: "DM Mono";');
    expect(css).toContain("font-display: swap;");
    expect(css).toContain("font-weight: 600;");
  });

  it("every declared face exists in the package", async () => {
    const { access } = await import("node:fs/promises");
    for (const face of WEB_FACES) {
      await expect(access(new URL(`../packages/npm/fonts/${face.file}`, import.meta.url))).resolves.toBeUndefined();
    }
  });
});
