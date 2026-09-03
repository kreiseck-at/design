import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve as resolveTokens } from "./resolve.mjs";
import { check } from "./check.mjs";
import { emitTs } from "./emit-ts.mjs";

const root = new URL("../", import.meta.url);
const checkOnly = process.argv.includes("--check");

const outputs = async (model) => {
  const { ts, css } = emitTs(model);
  return [
    ["packages/npm/src/tokens.ts", ts],
    ["packages/npm/src/tokens.css", css],
    ["golden/kasseneck.json", `${JSON.stringify(model, null, 2)}\n`],
  ];
};

const base = JSON.parse(await readFile(new URL("tokens/base.json", root)));
const brand = JSON.parse(await readFile(new URL("tokens/brands/kasseneck.json", root)));
const model = resolveTokens(base, brand);

const result = check(model);
if (!result.ok) {
  console.error("Token check failed:");
  for (const problem of result.problems) console.error(`  - ${problem}`);
  process.exit(1);
}

let stale = false;
for (const [path, content] of await outputs(model)) {
  const target = new URL(path, root);
  if (checkOnly) {
    const current = await readFile(target, "utf8").catch(() => null);
    if (current !== content) {
      console.error(`Out of date: ${path}`);
      stale = true;
    }
  } else {
    await mkdir(new URL(".", target), { recursive: true });
    await writeFile(target, content);
    console.log(`wrote ${path}`);
  }
}
if (stale) {
  console.error("Run `pnpm build` and commit the result.");
  process.exit(1);
}
console.log(checkOnly ? "up to date" : "done");
