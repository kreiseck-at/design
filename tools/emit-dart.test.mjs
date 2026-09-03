import { test, expect, describe, beforeAll } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "./resolve.mjs";
import { emitDart } from "./emit-dart.mjs";

let dart;
beforeAll(async () => {
  const base = JSON.parse(await readFile(new URL("../tokens/base.json", import.meta.url)));
  const brand = JSON.parse(
    await readFile(new URL("../tokens/brands/kasseneck.json", import.meta.url)),
  );
  dart = emitDart(resolve(base, brand));
});

describe("emitDart", () => {
  test("writes colours as ARGB literals", () => {
    expect(dart).toContain("0xFF136B6B");
    expect(dart).toContain("0xFF131B1B");
  });

  test("exposes roles for both modes", () => {
    expect(dart).toMatch(/class KdRoles[\s\S]*static const Map<String, Color> light/);
    expect(dart).toMatch(/static const Map<String, Color> dark/);
  });

  test("carries the generated-file warning and no dart:ui import beyond Color", () => {
    expect(dart.startsWith("// Generated from tokens/")).toBe(true);
    expect(dart).toContain("import 'dart:ui' show Color;");
  });

  test("exposes the full type scale, mono and uppercase flags included", () => {
    expect(dart).toMatch(/class KdType[\s\S]*static const Map<String, KdTypeStyle> roles/);
    expect(dart).toContain("'mono-lg': KdTypeStyle(");
    expect(dart).toMatch(/'label': KdTypeStyle\([^)]*uppercase: true[^)]*\)/);
    expect(dart).toMatch(/'mono': KdTypeStyle\([^)]*mono: true[^)]*\)/);
  });

  test("exposes motion, focus ring and shadow on KdForm", () => {
    expect(dart).toContain("static const double motionFast = 120;");
    expect(dart).toContain("static const double focusRingWidth = 2;");
    expect(dart).toContain("static const String shadow1 = '0 1px 2px rgba(19, 27, 27, 0.08)';");
  });

  test("emits a role table and an enum entry per mode", () => {
    expect(dart).toMatch(/static const Map<String, Color> warm/);
    expect(dart).toMatch(/static const Map<String, Color> contrast/);
    expect(dart).toContain("enum KdMode { light, warm, dark, contrast }");
  });
});
