const argb = (hex) => `0xFF${hex.replace("#", "").toUpperCase()}`;

const map = (entries, indent = "    ") =>
  Object.entries(entries)
    .map(([key, colour]) => `${indent}'${key}': Color(${argb(colour)}),`)
    .join("\n");

const doubleList = (values) => `[${values.map((v) => v.toString()).join(", ")}]`;

const doubleListMap = (entries, indent = "    ") =>
  Object.entries(entries)
    .map(([key, values]) => `${indent}'${key}': ${doubleList(values)},`)
    .join("\n");

export function emitDart(model) {
  const ramps = Object.entries(model.ramps)
    .map(([name, ramp]) => `  static const Map<int, Color> ${name} = {\n${
      Object.entries(ramp).map(([step, c]) => `    ${step}: Color(${argb(c)}),`).join("\n")
    }\n  };`)
    .join("\n\n");

  const dataList = (mode) =>
    model.data[mode].map((c) => `Color(${argb(c)})`).join(", ");

  return (
    "// Generated from tokens/. Do not edit; run `pnpm build` in the design repo.\n\n" +
    "import 'dart:ui' show Color;\n\n" +
    "/// The lightness ladder, chroma profile and step list a ramp is built\n" +
    "/// from — the same numbers `KdRamps` was generated with, so a runtime\n" +
    "/// ramp built from an arbitrary seed colour stays the twin of the\n" +
    "/// TypeScript package instead of a hand-typed copy of it.\n" +
    "class KdLadders {\n  const KdLadders._();\n\n" +
    `  static const List<int> steps = ${doubleList(model.steps)};\n\n` +
    `  static const double brandRampMaxChroma = ${model.brandRampMaxChroma};\n\n` +
    `  static const Map<String, List<double>> ladders = {\n${doubleListMap(model.ladders)}\n  };\n\n` +
    `  static const Map<String, List<double>> chromaProfiles = {\n${doubleListMap(model.chromaProfiles)}\n  };\n}\n\n` +
    `/// The ramps of the ${model.brand} brand.\nclass KdRamps {\n  const KdRamps._();\n\n${ramps}\n}\n\n` +
    "/// Roles resolved for both modes. An app reads a role, never a step.\n" +
    "class KdRoles {\n  const KdRoles._();\n\n" +
    `  static const Map<String, Color> light = {\n${map(model.roles.light)}\n  };\n\n` +
    `  static const Map<String, Color> dark = {\n${map(model.roles.dark)}\n  };\n}\n\n` +
    "/// Categorical colours for tiles and charts. Fixed order, never cycled.\n" +
    "class KdData {\n  const KdData._();\n\n" +
    `  static const List<Color> light = [${dataList("light")}];\n` +
    `  static const List<Color> dark = [${dataList("dark")}];\n}\n\n` +
    "class KdForm {\n  const KdForm._();\n\n" +
    `  static const double radiusSm = ${model.form.radius.sm};\n` +
    `  static const double radius = ${model.form.radius.md};\n` +
    `  static const double radiusLg = ${model.form.radius.lg};\n` +
    `  static const double radiusFull = ${model.form.radius.full};\n` +
    `  static const double borderWidth = ${model.form.borderWidth};\n` +
    `  static const double tapMin = ${model.form.size.tapMin};\n` +
    `  static const double controlPos = ${model.form.size.controlPos};\n` +
    `  static const double controlWeb = ${model.form.size.controlWeb};\n` +
    `  static const List<double> space = [${model.form.space.join(", ")}];\n}\n\n` +
    "class KdFonts {\n  const KdFonts._();\n\n" +
    `  static const String sans = '${model.fonts.sans.family}';\n` +
    `  static const String mono = '${model.fonts.mono.family}';\n}\n`
  );
}
