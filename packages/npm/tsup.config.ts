import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts", icons: "src/icons/index.ts" },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react"],
  loader: { ".css": "copy" },
});
