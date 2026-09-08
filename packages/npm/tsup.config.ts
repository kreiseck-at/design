import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts", icons: "src/icons/index.ts", logo: "src/logo/index.ts" },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react"],
});
