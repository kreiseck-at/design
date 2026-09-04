export default {
  test: { include: ["**/*.test.mjs", "packages/npm/**/*.test.ts", "packages/npm/**/*.test.tsx"] },
  esbuild: { jsx: "automatic" },
};
