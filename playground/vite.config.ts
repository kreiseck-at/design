import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const at = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// The playground renders the package straight from its sources, so what you
// see is what the next publish ships.
export default defineConfig({
  plugins: [react()],
  server: { port: 5178, fs: { allow: [at("..")] } },
  resolve: {
    alias: {
      "@kreiseck/design/logo": at("../packages/npm/src/logo/index.ts"),
      "@kreiseck/design/fonts.css": at("../packages/npm/fonts.css"),
      "@kreiseck/design/tokens.css": at("../packages/npm/src/tokens.css"),
    },
  },
});
