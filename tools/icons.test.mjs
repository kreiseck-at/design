import { describe, it, expect } from "vitest";
import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { validateIcon, parseElements, loadIcons } from "./icons.mjs";

const ok = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M14 6l-6 6 6 6"/></svg>`;

describe("validateIcon", () => {
  it("accepts a minimal stroke icon", () => {
    expect(validateIcon("arrow-left", ok, { filled: false })).toEqual([]);
  });
  it("rejects a wrong viewBox", () => {
    const bad = ok.replace('viewBox="0 0 24 24"', 'viewBox="0 0 20 20"');
    expect(validateIcon("a", bad, { filled: false })).toEqual([`a: viewBox must be "0 0 24 24"`]);
  });
  it("rejects elements and attributes outside the dialect", () => {
    const bad = `<svg viewBox="0 0 24 24"><g><path d="M4 4h16" stroke="#000"/></g></svg>`;
    const problems = validateIcon("a", bad, { filled: false });
    expect(problems).toContain("a: element <g> is not allowed");
    expect(problems).toContain("a: attribute stroke on <path> is not allowed");
  });
  it("rejects coordinates off the grid or outside 1.5–22.5", () => {
    expect(validateIcon("a", `<svg viewBox="0 0 24 24"><path d="M1 4h16"/></svg>`, { filled: false }))
      .toEqual(["a: point (1, 4) outside 1.5–22.5"]);
    expect(validateIcon("a", `<svg viewBox="0 0 24 24"><circle cx="12.25" cy="12" r="4"/></svg>`, { filled: false }))
      .toEqual(["a: value 12.25 has more than one decimal"]);
  });
  it("rejects Q/T path commands", () => {
    expect(validateIcon("a", `<svg viewBox="0 0 24 24"><path d="M4 4Q12 2 20 4"/></svg>`, { filled: false }))
      .toEqual(["a: path command Q is not allowed (use C)"]);
  });
  it("allows fill attributes only in filled icons", () => {
    const f = `<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z" fill="currentColor"/></svg>`;
    expect(validateIcon("a", f, { filled: false })).toEqual(["a: attribute fill on <path> is not allowed"]);
    expect(validateIcon("a-filled", f, { filled: true })).toEqual([]);
    const wrong = f.replace("currentColor", "#000");
    expect(validateIcon("a-filled", wrong, { filled: true })).toEqual([`a-filled: fill must be "currentColor"`]);
  });
  it("rejects rx of 2.5 or more (the build sets 2.5 by default)", () => {
    expect(validateIcon("a", `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/></svg>`, { filled: false }))
      .toEqual(["a: rx 3 must be 0 or smaller than 2.5 (omit it for the default)"]);
  });
  it("rejects bad names", () => {
    expect(validateIcon("Arrow_Left", ok, { filled: false })).toEqual(["Arrow_Left: name must match ^[a-z][a-z0-9]*(-[a-z0-9]+)*$"]);
  });
  it("rejects path commands outside the dialect instead of silently absorbing them", () => {
    expect(validateIcon("a", `<svg viewBox="0 0 24 24"><path d="M4 4X10 10"/></svg>`, { filled: false }))
      .toContain(`a: path contains unexpected character "X"`);
  });
  it("rejects path text that a command never consumes", () => {
    expect(validateIcon("a", `<svg viewBox="0 0 24 24"><path d="4 M4 4"/></svg>`, { filled: false }))
      .toContain("a: path has text before the first command");
  });
  it("rejects attribute values with units or other non-numeric garbage", () => {
    const problems = validateIcon("a", `<svg viewBox="0 0 24 24"><rect x="12px" y="3" width="18" height="18"/></svg>`, { filled: false });
    expect(problems).toContain("a: value 12px is not a number with at most one decimal");
  });
  it("rejects scientific notation in path coordinates", () => {
    const problems = validateIcon("a", `<svg viewBox="0 0 24 24"><path d="M4 4l1e2 3"/></svg>`, { filled: false });
    expect(problems).toContain("a: value 1e2 is not a number with at most one decimal");
  });
  it("rejects a negative radius", () => {
    expect(validateIcon("a", `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="-4"/></svg>`, { filled: false }))
      .toContain("a: r must be positive");
  });
  it("rejects non-positive width or height", () => {
    const problems = validateIcon("a", `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="-1" height="18"/></svg>`, { filled: false });
    expect(problems).toContain("a: width must be positive");
  });
});

describe("parseElements", () => {
  it("returns tag and attributes in document order", () => {
    expect(parseElements(`<svg viewBox="0 0 24 24"><circle cx="8" cy="9" r="5"/><path d="M13 9v9h8"/></svg>`))
      .toEqual([
        { tag: "circle", attrs: { cx: "8", cy: "9", r: "5" } },
        { tag: "path", attrs: { d: "M13 9v9h8" } },
      ]);
  });
});

describe("loadIcons", () => {
  async function repo(files, index) {
    const dir = await mkdtemp(join(tmpdir(), "icons-"));
    await mkdir(join(dir, "icons"));
    await writeFile(join(dir, "icons/index.json"), JSON.stringify(index));
    for (const [name, text] of Object.entries(files)) await writeFile(join(dir, "icons", name), text);
    return pathToFileURL(dir + "/");
  }
  it("pairs files with index entries and reports both directions", async () => {
    const root = await repo({ "a.svg": ok, "b.svg": ok, "c-filled.svg": ok },
      { a: { group: "action", de: "A", terms: [] }, c: { group: "action", de: "C", terms: [], filled: true }, d: { group: "action", de: "D", terms: [] } });
    await expect(loadIcons(root)).rejects.toMatchObject({ problems: expect.arrayContaining([
      "b: file without entry in index.json",
      "c: filled: true but c.svg is missing",
      "d: entry without file",
    ]) });
  });
  it("rejects an unknown group", async () => {
    const root = await repo({ "a.svg": ok }, { a: { group: "misc", de: "A", terms: [] } });
    await expect(loadIcons(root)).rejects.toMatchObject({ problems: ["a: group misc is not one of navigation, action, status, cash, document, people, device"] });
  });
  it("builds the model in index order", async () => {
    const root = await repo({ "a.svg": ok, "a-filled.svg": ok.replace("/>", ' fill="currentColor"/>') },
      { a: { group: "action", de: "A", terms: ["x"], filled: true } });
    const model = await loadIcons(root);
    expect(model.order).toEqual(["a"]);
    expect(model.icons.a.fill[0].attrs.fill).toBe("currentColor");
    expect(model.icons.a.stroke[0].tag).toBe("path");
  });
});
