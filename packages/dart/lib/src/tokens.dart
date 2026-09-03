// Generated from tokens/. Do not edit; run `pnpm build` in the design repo.

import 'dart:ui' show Color;

/// The lightness ladder, chroma profile and step list a ramp is built
/// from — the same numbers `KdRamps` was generated with, so a runtime
/// ramp built from an arbitrary seed colour stays the twin of the
/// TypeScript package instead of a hand-typed copy of it.
class KdLadders {
  const KdLadders._();

  static const List<int> steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

  static const double brandRampMaxChroma = 0.2;

  static const Map<String, List<double>> ladders = {
    'colour': [0.972, 0.94, 0.884, 0.812, 0.73, 0.648, 0.566, 0.48, 0.4, 0.325, 0.25],
    'neutral': [0.975, 0.95, 0.9, 0.83, 0.75, 0.66, 0.515, 0.46, 0.36, 0.266, 0.214],
  };

  static const Map<String, List<double>> chromaProfiles = {
    'colour': [0.1, 0.18, 0.36, 0.58, 0.8, 1, 0.98, 0.88, 0.74, 0.56, 0.42],
    'neutral': [0.14, 0.22, 0.34, 0.48, 0.62, 0.78, 0.9, 1, 1, 0.95, 0.55],
  };
}

/// The ramps of the kasseneck brand.
class KdRamps {
  const KdRamps._();

  static const Map<int, Color> brand = {
    50: Color(0xFFEFF8F7),
    100: Color(0xFFE0EFEE),
    200: Color(0xFFC2E0DF),
    300: Color(0xFF9CCCCC),
    400: Color(0xFF71B6B5),
    500: Color(0xFF139E9B),
    600: Color(0xFF268686),
    700: Color(0xFF136B6B),
    800: Color(0xFF0A5252),
    900: Color(0xFF0C3C3C),
    950: Color(0xFF072727),
  };

  static const Map<int, Color> neutral = {
    50: Color(0xFFF4F8F8),
    100: Color(0xFFEAF0F0),
    200: Color(0xFFD7E0E0),
    300: Color(0xFFBDCACA),
    400: Color(0xFFA1B2B2),
    500: Color(0xFF829797),
    600: Color(0xFF566D6C),
    700: Color(0xFF445E5D),
    800: Color(0xFF2A4242),
    900: Color(0xFF132A2A),
    950: Color(0xFF131B1B),
  };

  static const Map<int, Color> success = {
    50: Color(0xFFF0F8F3),
    100: Color(0xFFE0F0E6),
    200: Color(0xFFC2E2CE),
    300: Color(0xFF9CD0B1),
    400: Color(0xFF71BA91),
    500: Color(0xFF42A473),
    600: Color(0xFF268A5C),
    700: Color(0xFF136F47),
    800: Color(0xFF0A5635),
    900: Color(0xFF0C3E27),
    950: Color(0xFF072918),
  };

  static const Map<int, Color> warning = {
    50: Color(0xFFFEF4EE),
    100: Color(0xFFF9E7DD),
    200: Color(0xFFF4D1BC),
    300: Color(0xFFEAB494),
    400: Color(0xFFDD9467),
    500: Color(0xFFCD7439),
    600: Color(0xFFB05C1F),
    700: Color(0xFF8F470D),
    800: Color(0xFF703506),
    900: Color(0xFF512709),
    950: Color(0xFF361905),
  };

  static const Map<int, Color> danger = {
    50: Color(0xFFFFF3F1),
    100: Color(0xFFFFE4E0),
    200: Color(0xFFFFCAC2),
    300: Color(0xFFFFA79A),
    400: Color(0xFFFC7B6C),
    500: Color(0xFFF04E41),
    600: Color(0xFFD13329),
    700: Color(0xFFAB1F18),
    800: Color(0xFF861510),
    900: Color(0xFF61130E),
    950: Color(0xFF410B07),
  };

  static const Map<int, Color> info = {
    50: Color(0xFFF1F6FF),
    100: Color(0xFFE2ECFE),
    200: Color(0xFFC7D9FD),
    300: Color(0xFFA5C2FB),
    400: Color(0xFF81A6F3),
    500: Color(0xFF5F8BE9),
    600: Color(0xFF4971CC),
    700: Color(0xFF3659A7),
    800: Color(0xFF284483),
    900: Color(0xFF1D325F),
    950: Color(0xFF122040),
  };
}

/// Roles resolved for both modes. An app reads a role, never a step.
class KdRoles {
  const KdRoles._();

  static const Map<String, Color> light = {
    'brand': Color(0xFF136B6B),
    'on-brand': Color(0xFFFFFFFF),
    'brand-pressed': Color(0xFF0A5252),
    'brand-surface': Color(0xFFE0EFEE),
    'on-brand-surface': Color(0xFF132A2A),
    'ground': Color(0xFFF4F8F8),
    'on-ground': Color(0xFF132A2A),
    'surface': Color(0xFFFFFFFF),
    'on-surface': Color(0xFF132A2A),
    'surface-raised': Color(0xFFEAF0F0),
    'on-surface-raised': Color(0xFF132A2A),
    'ink': Color(0xFF132A2A),
    'ink-muted': Color(0xFF566D6C),
    'border': Color(0xFF566D6C),
    'divider': Color(0xFFD7E0E0),
    'focus': Color(0xFF268686),
    'success': Color(0xFF136F47),
    'success-surface': Color(0xFFF0F8F3),
    'on-success-surface': Color(0xFF0C3E27),
    'warning': Color(0xFF8F470D),
    'warning-surface': Color(0xFFFEF4EE),
    'on-warning-surface': Color(0xFF512709),
    'danger': Color(0xFFAB1F18),
    'on-danger': Color(0xFFFFFFFF),
    'danger-strong': Color(0xFFD13329),
    'danger-surface': Color(0xFFFFF3F1),
    'on-danger-surface': Color(0xFF61130E),
    'info': Color(0xFF3659A7),
    'info-surface': Color(0xFFF1F6FF),
    'on-info-surface': Color(0xFF1D325F),
  };

  static const Map<String, Color> dark = {
    'brand': Color(0xFF139E9B),
    'on-brand': Color(0xFF131B1B),
    'brand-pressed': Color(0xFF71B6B5),
    'brand-surface': Color(0xFF0C3C3C),
    'on-brand-surface': Color(0xFFF4F8F8),
    'ground': Color(0xFF131B1B),
    'on-ground': Color(0xFFF4F8F8),
    'surface': Color(0xFF132A2A),
    'on-surface': Color(0xFFF4F8F8),
    'surface-raised': Color(0xFF2A4242),
    'on-surface-raised': Color(0xFFF4F8F8),
    'ink': Color(0xFFF4F8F8),
    'ink-muted': Color(0xFFA1B2B2),
    'border': Color(0xFF829797),
    'divider': Color(0xFF2A4242),
    'focus': Color(0xFF71B6B5),
    'success': Color(0xFF71BA91),
    'success-surface': Color(0xFF072918),
    'on-success-surface': Color(0xFFF0F8F3),
    'warning': Color(0xFFDD9467),
    'warning-surface': Color(0xFF361905),
    'on-warning-surface': Color(0xFFFEF4EE),
    'danger': Color(0xFFFC7B6C),
    'on-danger': Color(0xFF131B1B),
    'danger-strong': Color(0xFFF04E41),
    'danger-surface': Color(0xFF410B07),
    'on-danger-surface': Color(0xFFFFF3F1),
    'info': Color(0xFF81A6F3),
    'info-surface': Color(0xFF122040),
    'on-info-surface': Color(0xFFF1F6FF),
  };
}

/// Categorical colours for tiles and charts. Fixed order, never cycled.
class KdData {
  const KdData._();

  static const List<Color> light = [Color(0xFF0D9488), Color(0xFFB45309), Color(0xFF4F46E5), Color(0xFFDB2777), Color(0xFF4D7C0F), Color(0xFF0284C7), Color(0xFFA16207), Color(0xFF7E22CE)];
  static const List<Color> dark = [Color(0xFF0D9488), Color(0xFFB45309), Color(0xFF6366F1), Color(0xFFDB2777), Color(0xFF65A30D), Color(0xFF0284C7), Color(0xFFA16207), Color(0xFFA855F7)];
}

class KdForm {
  const KdForm._();

  static const double radiusSm = 6;
  static const double radius = 10;
  static const double radiusLg = 14;
  static const double radiusFull = 999;
  static const double borderWidth = 1.5;
  static const double tapMin = 44;
  static const double controlPos = 56;
  static const double controlWeb = 40;
  static const List<double> space = [4, 8, 12, 16, 24, 32, 48];
}

class KdFonts {
  const KdFonts._();

  static const String sans = 'Archivo';
  static const String mono = 'DM Mono';
}
