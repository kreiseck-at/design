import { readdir, unlink } from "node:fs/promises";

// The two directories the web icon generator owns entirely: every file in
// them comes from build.mjs's outputs(), so a deleted or renamed icon must
// not leave a stale component or svg behind.
const ICON_OUTPUT_DIRS = ["packages/npm/src/icons", "packages/npm/svg"];
const KEEP = new Set(["packages/npm/src/icons/create-icon.tsx"]);

/** Files under the two icon-output directories that `produced` no longer accounts for. */
export async function staleIconFiles(root, produced) {
  const stale = [];
  for (const dir of ICON_OUTPUT_DIRS) {
    const dirUrl = new URL(`${dir}/`, root);
    const entries = await readdir(dirUrl).catch(() => []);
    for (const entry of entries) {
      const path = `${dir}/${entry}`;
      if (KEEP.has(path)) continue;
      // create-icon.tsx aside, everything else under src/icons is generated,
      // both the .tsx components and the .ts index/barrel files.
      if (dir.endsWith("icons") && !(entry.endsWith(".tsx") || entry.endsWith(".ts"))) continue;
      if (!produced.has(path)) stale.push(path);
    }
  }
  return stale;
}

/** Deletes every file staleIconFiles() finds; returns the paths it removed. */
export async function removeStale(root, produced) {
  const stale = await staleIconFiles(root, produced);
  for (const path of stale) await unlink(new URL(path, root));
  return stale;
}
