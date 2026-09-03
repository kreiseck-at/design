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

const typeStyle = (role) =>
  `KdTypeStyle(size: ${role.size}, leading: ${role.leading}, weight: ${role.weight}, ` +
  `tracking: ${role.tracking}, mono: ${role.mono ?? false}, uppercase: ${role.uppercase ?? false})`;

const typeMap = (type, indent = "    ") =>
  Object.entries(type)
    .map(([name, role]) => `${indent}'${name}': ${typeStyle(role)},`)
    .join("\n");

export function emitDart(model) {
  const ramps = Object.entries(model.ramps)
    .map(([name, ramp]) => `  static const Map<int, Color> ${name} = {\n${
      Object.entries(ramp).map(([step, c]) => `    ${step}: Color(${argb(c)}),`).join("\n")
    }\n  };`)
    .join("\n\n");

  const dataList = (mode) =>
    model.data[mode].map((c) => `Color(${argb(c)})`).join(", ");

  const roleTables = model.modes
    .map((mode) => `  static const Map<String, Color> ${mode} = {\n${map(model.roles[mode])}\n  };`)
    .join("\n\n");

  const byMode = model.modes.map((mode) => `    KdMode.${mode}: ${mode},`).join("\n");

  return (
    "// Generated from tokens/. Do not edit; run `pnpm build` in the design repo.\n\n" +
    "import 'dart:ui' show Color;\n\n" +
    "/// The modes a brand can offer, in the order `tokens/brands/` declares\n" +
    "/// them.\n" +
    `enum KdMode { ${model.modes.join(", ")} }\n\n` +
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
    "/// Roles resolved for every mode the brand offers. An app reads a role,\n" +
    "/// never a step.\n" +
    "class KdRoles {\n  const KdRoles._();\n\n" +
    `${roleTables}\n\n` +
    `  static const Map<KdMode, Map<String, Color>> byMode = {\n${byMode}\n  };\n}\n\n` +
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
    `  static const List<double> space = [${model.form.space.join(", ")}];\n` +
    `  static const double focusRingWidth = ${model.form.focusRing.width};\n` +
    `  static const double focusRingOffset = ${model.form.focusRing.offset};\n` +
    `  static const double motionFast = ${model.form.motion.fast};\n` +
    `  static const double motionBase = ${model.form.motion.base};\n` +
    `  static const double motionSlow = ${model.form.motion.slow};\n` +
    `  static const String shadow1 = '${model.form.shadow["1"]}';\n` +
    `  static const String shadow2 = '${model.form.shadow["2"]}';\n` +
    `  static const String shadow3 = '${model.form.shadow["3"]}';\n}\n\n` +
    "class KdFonts {\n  const KdFonts._();\n\n" +
    `  static const String sans = '${model.fonts.sans.family}';\n` +
    `  static const String mono = '${model.fonts.mono.family}';\n\n` +
    "  /// The Dart package these fonts ship in. Every `TextStyle` built from\n" +
    "  /// `KdType` sets `package:` to this, or a consuming app never finds\n" +
    "  /// the bundled font — fixed regardless of brand.\n" +
    "  static const String package = 'kreiseck_design';\n}\n\n" +
    "/// One typography role: size in logical pixels, `leading` as a\n" +
    "/// multiplier of size, `weight` as a `FontWeight` value (400, 600, …),\n" +
    "/// `tracking` in em. Matches `TextStyle`'s own units, so a caller can\n" +
    "/// spread these straight into one.\n" +
    "class KdTypeStyle {\n" +
    "  const KdTypeStyle({\n" +
    "    required this.size,\n" +
    "    required this.leading,\n" +
    "    required this.weight,\n" +
    "    required this.tracking,\n" +
    "    this.mono = false,\n" +
    "    this.uppercase = false,\n" +
    "  });\n\n" +
    "  final double size;\n" +
    "  final double leading;\n" +
    "  final int weight;\n" +
    "  final double tracking;\n" +
    "  final bool mono;\n" +
    "  final bool uppercase;\n" +
    "}\n\n" +
    "/// The type scale, by role. Never hand-type a size or a weight in an\n" +
    "/// app — the drift this package exists to end.\n" +
    "class KdType {\n  const KdType._();\n\n" +
    `  static const Map<String, KdTypeStyle> roles = {\n${typeMap(model.type)}\n  };\n}\n`
  );
}
