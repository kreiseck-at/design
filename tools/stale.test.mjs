import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { staleIconFiles, removeStale } from "./stale.mjs";

let dir, root;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "kd-stale-"));
  root = pathToFileURL(`${dir}/`);
  await mkdir(join(dir, "packages/npm/src/icons"), { recursive: true });
  await mkdir(join(dir, "packages/npm/svg"), { recursive: true });
  await mkdir(join(dir, "other"), { recursive: true });
  await writeFile(join(dir, "packages/npm/src/icons/create-icon.tsx"), "// keep\n");
  await writeFile(join(dir, "packages/npm/src/icons/Kept.tsx"), "// kept\n");
  await writeFile(join(dir, "packages/npm/src/icons/Ghost.tsx"), "// orphan\n");
  await writeFile(join(dir, "packages/npm/src/icons/index.ts"), "// generated, not tsx\n");
  await writeFile(join(dir, "packages/npm/svg/kept.svg"), "<svg/>\n");
  await writeFile(join(dir, "packages/npm/svg/ghost.svg"), "<svg/>\n");
  await writeFile(join(dir, "other/Ghost.tsx"), "// outside the owned directories\n");
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const produced = new Set([
  "packages/npm/src/icons/Kept.tsx",
  "packages/npm/src/icons/index.ts",
  "packages/npm/svg/kept.svg",
]);

describe("staleIconFiles", () => {
  it("lists an orphan tsx and an orphan svg", async () => {
    const stale = await staleIconFiles(root, produced);
    expect(stale).toContain("packages/npm/src/icons/Ghost.tsx");
    expect(stale).toContain("packages/npm/svg/ghost.svg");
  });

  it("never lists create-icon.tsx", async () => {
    const stale = await staleIconFiles(root, produced);
    expect(stale).not.toContain("packages/npm/src/icons/create-icon.tsx");
  });

  it("never lists files outside the two owned directories", async () => {
    const stale = await staleIconFiles(root, produced);
    expect(stale).not.toContain("other/Ghost.tsx");
    expect(stale.every((p) => p.startsWith("packages/npm/src/icons/") || p.startsWith("packages/npm/svg/"))).toBe(true);
  });
});

describe("removeStale", () => {
  it("deletes exactly the listed files", async () => {
    const removed = await removeStale(root, produced);
    expect(removed.sort()).toEqual(["packages/npm/src/icons/Ghost.tsx", "packages/npm/svg/ghost.svg"]);

    await expect(stat(join(dir, "packages/npm/src/icons/Ghost.tsx"))).rejects.toThrow();
    await expect(stat(join(dir, "packages/npm/svg/ghost.svg"))).rejects.toThrow();

    await expect(stat(join(dir, "packages/npm/src/icons/create-icon.tsx"))).resolves.toBeTruthy();
    await expect(stat(join(dir, "packages/npm/src/icons/Kept.tsx"))).resolves.toBeTruthy();
    await expect(stat(join(dir, "packages/npm/src/icons/index.ts"))).resolves.toBeTruthy();
    await expect(stat(join(dir, "packages/npm/svg/kept.svg"))).resolves.toBeTruthy();
    await expect(stat(join(dir, "other/Ghost.tsx"))).resolves.toBeTruthy();
  });
});
