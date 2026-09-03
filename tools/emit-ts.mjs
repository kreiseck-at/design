const HEAD_TS = "// Generated from tokens/. Do not edit; run `pnpm build`.\n\n";
const HEAD_CSS = "/* Generated from tokens/. Do not edit; run `pnpm build`. */\n\n";

const vars = (roles, indent = "  ") =>
  Object.entries(roles)
    .map(([role, colour]) => `${indent}--kd-${role}: ${colour};`)
    .join("\n");

export function emitTs(model) {
  const ts =
    HEAD_TS +
    `export const steps = ${JSON.stringify(model.steps)} as const;\n\n` +
    `export const ladders = ${JSON.stringify(model.ladders, null, 2)} as const;\n\n` +
    `export const chromaProfiles = ${JSON.stringify(model.chromaProfiles, null, 2)} as const;\n\n` +
    `export const brandRampMaxChroma = ${JSON.stringify(model.brandRampMaxChroma)};\n\n` +
    `export const ramps = ${JSON.stringify(model.ramps, null, 2)} as const;\n\n` +
    `export const roles = ${JSON.stringify(model.roles, null, 2)} as const;\n\n` +
    `export const data = ${JSON.stringify(model.data, null, 2)} as const;\n\n` +
    `export const form = ${JSON.stringify(model.form, null, 2)} as const;\n\n` +
    `export const typography = ${JSON.stringify(model.type, null, 2)} as const;\n\n` +
    `export const fonts = ${JSON.stringify(model.fonts, null, 2)} as const;\n\n` +
    `export type Role = keyof typeof roles.light;\n` +
    `export type Mode = ${model.modes.map((m) => `"${m}"`).join(" | ")};\n`;

  // One block per mode besides `light` (which lives in `:root`), each with
  // the full role set — a mode is never just its overrides, so a page
  // pinned to it never falls back to `:root`'s light colours for a role
  // the override list did not think to mention.
  const modeBlocks = model.modes
    .filter((mode) => mode !== "light")
    .map((mode) => {
      const overrides = model.modeOverrides[mode];
      const overrideVars = overrides
        ? `\n  --kd-border-width: ${overrides.borderWidth}px;` +
          `\n  --kd-focus-ring-width: ${overrides.focusRing.width}px;` +
          `\n  --kd-focus-ring-offset: ${overrides.focusRing.offset}px;` +
          `\n  --kd-shadow-1: ${overrides.shadow["1"]};` +
          `\n  --kd-shadow-2: ${overrides.shadow["2"]};` +
          `\n  --kd-shadow-3: ${overrides.shadow["3"]};`
        : "";
      return `[data-kd-mode="${mode}"] {\n${vars(model.roles[mode])}${overrideVars}\n}\n`;
    })
    .join("\n");

  const css =
    HEAD_CSS +
    `:root {\n${vars(model.roles.light)}\n` +
    `  --kd-radius-sm: ${model.form.radius.sm}px;\n` +
    `  --kd-radius: ${model.form.radius.md}px;\n` +
    `  --kd-radius-lg: ${model.form.radius.lg}px;\n` +
    `  --kd-radius-full: ${model.form.radius.full}px;\n` +
    `  --kd-border-width: ${model.form.borderWidth}px;\n` +
    `  --kd-focus-ring-width: ${model.form.focusRing.width}px;\n` +
    `  --kd-focus-ring-offset: ${model.form.focusRing.offset}px;\n` +
    model.form.space.map((v, i) => `  --kd-space-${i + 1}: ${v}px;`).join("\n") +
    `\n  --kd-motion-fast: ${model.form.motion.fast}ms;\n` +
    `  --kd-motion-base: ${model.form.motion.base}ms;\n` +
    `  --kd-motion-slow: ${model.form.motion.slow}ms;\n` +
    `  --kd-shadow-1: ${model.form.shadow["1"]};\n` +
    `  --kd-shadow-2: ${model.form.shadow["2"]};\n` +
    `  --kd-shadow-3: ${model.form.shadow["3"]};\n` +
    `  --kd-font-sans: "${model.fonts.sans.family}", ${model.fonts.sans.fallback.join(", ")};\n` +
    `  --kd-font-mono: "${model.fonts.mono.family}", ${model.fonts.mono.fallback.join(", ")};\n` +
    `}\n\n` +
    `${modeBlocks}\n` +
    `@media (prefers-color-scheme: dark) {\n` +
    `  :root:not([data-kd-mode]) {\n${vars(model.roles.dark, "    ")}\n  }\n}\n\n` +
    `@media (prefers-reduced-motion: reduce) {\n` +
    `  :root { --kd-motion-fast: 0ms; --kd-motion-base: 0ms; --kd-motion-slow: 0ms; }\n}\n`;

  return { ts, css };
}
