import { readFile, readdir, writeFile, mkdir, unlink } from "node:fs/promises";
import { resolve as resolveTokens } from "./resolve.mjs";
import { check } from "./check.mjs";
import { emitTs } from "./emit-ts.mjs";
import { emitDart } from "./emit-dart.mjs";
import { emitGallery } from "./emit-gallery.mjs";
import { loadIcons } from "./icons.mjs";
import { emitIconsDart } from "./emit-icons-dart.mjs";
import { emitIconsWeb } from "./emit-icons-web.mjs";
import { iconDigests } from "./icons-digest.mjs";

const root = new URL("../", import.meta.url);
const checkOnly = process.argv.includes("--check");

// The two directories the web icon generator owns entirely: every file in
// them comes from outputs(), so a deleted or renamed icon must not leave a
// stale component or svg behind.
const ICON_OUTPUT_DIRS = ["packages/npm/src/icons", "packages/npm/svg"];
const KEEP = new Set(["packages/npm/src/icons/create-icon.tsx"]);

async function staleIconFiles(known) {
  const stale = [];
  for (const dir of ICON_OUTPUT_DIRS) {
    const dirUrl = new URL(`${dir}/`, root);
    const entries = await readdir(dirUrl).catch(() => []);
    for (const entry of entries) {
      const path = `${dir}/${entry}`;
      if (KEEP.has(path)) continue;
      if (dir.endsWith("icons") && !entry.endsWith(".tsx")) continue;
      if (!known.has(path)) stale.push(path);
    }
  }
  return stale;
}

// A new brand costs one file with about twenty values: drop it in
// tokens/brands/ and it gets its own golden fixture, checked the same way.
// The npm/Dart packages and the gallery are still built from the first
// brand found — today there is exactly one, so this changes nothing yet.
async function loadBrands() {
  const dir = new URL("tokens/brands/", root);
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
  return Promise.all(files.map((f) => readFile(new URL(f, dir)).then((b) => JSON.parse(b))));
}

const outputs = async (models) => {
  const primary = models[0];
  const { ts, css } = emitTs(primary);
  const colourSource = await readFile(new URL("tools/color.mjs", root), "utf8");
  const asMjs = "// Generated from tools/color.mjs. Do not edit.\n\n" + colourSource;
  return [
    ["packages/npm/src/tokens.ts", ts],
    ["packages/npm/src/tokens.css", css],
    ["packages/npm/src/oklch.mjs", asMjs],
    ["packages/dart/lib/src/tokens.dart", emitDart(primary)],
    ["gallery/index.html", emitGallery(primary)],
    ["packages/dart/lib/src/icons.dart", emitIconsDart(iconsModel)],
    ...emitIconsWeb(iconsModel).files,
    ...models.map((model) => [`golden/${model.brand}.json`, `${JSON.stringify(model, null, 2)}\n`]),
  ];
};

const base = JSON.parse(await readFile(new URL("tokens/base.json", root)));
const brands = await loadBrands();

let iconsModel;
try {
  iconsModel = await loadIcons(root);
} catch (e) {
  if (!e.problems) throw e;
  console.error("Icon check failed:");
  for (const p of e.problems) console.error(`  - ${p}`);
  process.exit(1);
}

const models = brands.map((brand) => ({ ...resolveTokens(base, brand), icons: iconDigests(iconsModel) }));

for (const model of models) {
  const result = check(model);
  if (!result.ok) {
    console.error(`Token check failed for "${model.brand}":`);
    for (const problem of result.problems) console.error(`  - ${problem}`);
    process.exit(1);
  }
}

const built = await outputs(models);
const orphans = await staleIconFiles(new Set(built.map(([path]) => path)));
let stale = false;

if (checkOnly) {
  for (const orphan of orphans) {
    console.error(`Out of date: ${orphan}`);
    stale = true;
  }
} else {
  for (const orphan of orphans) await unlink(new URL(orphan, root));
}

for (const [path, content] of built) {
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
