import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";

// The gallery searches the id directly, so index.json's "terms" only need to
// carry what the id itself does not already say — real synonyms, not a
// restatement of the key. This is checked separately from tools/icons.mjs's
// structural validation because it's a content-quality rule, not a dialect one.
const ALLOWED_SHARED_TERMS = new Set(["bon", "cancel", "karte", "lupe", "options"]);

describe("icons/index.json terms", () => {
  it("every icon has 3 to 5 terms, none of which is its own id", async () => {
    const index = JSON.parse(await readFile(new URL("../icons/index.json", import.meta.url), "utf8"));
    const problems = [];
    for (const [id, meta] of Object.entries(index)) {
      const terms = meta.terms ?? [];
      if (terms.length < 3 || terms.length > 5) problems.push(`${id}: has ${terms.length} terms, expected 3-5`);
      if (terms.includes(id)) problems.push(`${id}: terms include its own id`);
    }
    expect(problems).toEqual([]);
  });

  it("no term is shared by two icons, except the five grandfathered ones", async () => {
    const index = JSON.parse(await readFile(new URL("../icons/index.json", import.meta.url), "utf8"));
    const owners = new Map();
    for (const [id, meta] of Object.entries(index)) {
      for (const term of meta.terms ?? []) {
        if (!owners.has(term)) owners.set(term, []);
        owners.get(term).push(id);
      }
    }
    const unexpectedlyShared = [...owners.entries()].filter(
      ([term, ids]) => ids.length > 1 && !ALLOWED_SHARED_TERMS.has(term),
    );
    expect(unexpectedlyShared).toEqual([]);
    // The five grandfathered terms should still actually be there; if they
    // ever stop being shared, the exception list above should shrink too.
    for (const term of ALLOWED_SHARED_TERMS) expect(owners.has(term)).toBe(true);
  });
});
