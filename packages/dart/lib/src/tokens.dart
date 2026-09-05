// Generated from tokens/. Do not edit; run `pnpm build` in the design repo.

import 'dart:ui' show Color;

/// The modes a brand can offer, in the order `tokens/brands/` declares
/// them.
enum KdMode { light, warm, dark, contrast }

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
    'warm': [0.42, 0.5, 0.62, 0.75, 0.88, 0.96, 1, 1, 0.96, 0.8, 0.6],
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
    50: Color(0xFFF6F7F7),
    100: Color(0xFFEDEFEF),
    200: Color(0xFFDCDEDE),
    300: Color(0xFFC5C8C8),
    400: Color(0xFFABAFAF),
    500: Color(0xFF8F9393),
    600: Color(0xFF646868),
    700: Color(0xFF545959),
    800: Color(0xFF3A3E3E),
    900: Color(0xFF222626),
    950: Color(0xFF181A1A),
  };

  static const Map<int, Color> neutralWarm = {
    50: Color(0xFFFBF6EE),
    100: Color(0xFFF4EEE4),
    200: Color(0xFFE4DDD2),
    300: Color(0xFFCFC6B9),
    400: Color(0xFFB7AC9D),
    500: Color(0xFF9B9180),
    600: Color(0xFF716656),
    700: Color(0xFF615647),
    800: Color(0xFF453C2D),
    900: Color(0xFF2C2419),
    950: Color(0xFF1E1810),
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

/// Roles resolved for every mode the brand offers. An app reads a role,
/// never a step.
class KdRoles {
  const KdRoles._();

  static const Map<String, Color> light = {
    'brand': Color(0xFF136B6B),
    'on-brand': Color(0xFFFFFFFF),
    'brand-pressed': Color(0xFF0A5252),
    'brand-surface': Color(0xFFE0EFEE),
    'on-brand-surface': Color(0xFF222626),
    'ground': Color(0xFFF6F7F7),
    'on-ground': Color(0xFF222626),
    'surface': Color(0xFFFFFFFF),
    'on-surface': Color(0xFF222626),
    'surface-raised': Color(0xFFEDEFEF),
    'on-surface-raised': Color(0xFF222626),
    'ink': Color(0xFF222626),
    'ink-muted': Color(0xFF646868),
    'border': Color(0xFF646868),
    'divider': Color(0xFFDCDEDE),
    'focus': Color(0xFF268686),
    'success': Color(0xFF136F47),
    'on-success': Color(0xFFFFFFFF),
    'success-surface': Color(0xFFE0F0E6),
    'on-success-surface': Color(0xFF0C3E27),
    'warning': Color(0xFF8F470D),
    'on-warning': Color(0xFFFFFFFF),
    'warning-surface': Color(0xFFF9E7DD),
    'on-warning-surface': Color(0xFF512709),
    'danger': Color(0xFFAB1F18),
    'on-danger': Color(0xFFFFFFFF),
    'danger-strong': Color(0xFFD13329),
    'danger-surface': Color(0xFFFFE4E0),
    'on-danger-surface': Color(0xFF61130E),
    'info': Color(0xFF3659A7),
    'on-info': Color(0xFFFFFFFF),
    'info-surface': Color(0xFFE2ECFE),
    'on-info-surface': Color(0xFF1D325F),
  };

  static const Map<String, Color> warm = {
    'brand': Color(0xFF136B6B),
    'on-brand': Color(0xFFFFFFFF),
    'brand-pressed': Color(0xFF0A5252),
    'brand-surface': Color(0xFFE0EFEE),
    'on-brand-surface': Color(0xFF2C2419),
    'ground': Color(0xFFFBF6EE),
    'on-ground': Color(0xFF2C2419),
    'surface': Color(0xFFFFFFFF),
    'on-surface': Color(0xFF2C2419),
    'surface-raised': Color(0xFFF4EEE4),
    'on-surface-raised': Color(0xFF2C2419),
    'ink': Color(0xFF2C2419),
    'ink-muted': Color(0xFF716656),
    'border': Color(0xFF716656),
    'divider': Color(0xFFE4DDD2),
    'focus': Color(0xFF268686),
    'success': Color(0xFF136F47),
    'on-success': Color(0xFFFFFFFF),
    'success-surface': Color(0xFFE0F0E6),
    'on-success-surface': Color(0xFF0C3E27),
    'warning': Color(0xFF8F470D),
    'on-warning': Color(0xFFFFFFFF),
    'warning-surface': Color(0xFFF9E7DD),
    'on-warning-surface': Color(0xFF512709),
    'danger': Color(0xFFAB1F18),
    'on-danger': Color(0xFFFFFFFF),
    'danger-strong': Color(0xFFD13329),
    'danger-surface': Color(0xFFFFE4E0),
    'on-danger-surface': Color(0xFF61130E),
    'info': Color(0xFF3659A7),
    'on-info': Color(0xFFFFFFFF),
    'info-surface': Color(0xFFE2ECFE),
    'on-info-surface': Color(0xFF1D325F),
  };

  static const Map<String, Color> dark = {
    'brand': Color(0xFF139E9B),
    'on-brand': Color(0xFF181A1A),
    'brand-pressed': Color(0xFF71B6B5),
    'brand-surface': Color(0xFF0C3C3C),
    'on-brand-surface': Color(0xFFF6F7F7),
    'ground': Color(0xFF181A1A),
    'on-ground': Color(0xFFF6F7F7),
    'surface': Color(0xFF222626),
    'on-surface': Color(0xFFF6F7F7),
    'surface-raised': Color(0xFF3A3E3E),
    'on-surface-raised': Color(0xFFF6F7F7),
    'ink': Color(0xFFF6F7F7),
    'ink-muted': Color(0xFFABAFAF),
    'border': Color(0xFF8F9393),
    'divider': Color(0xFF3A3E3E),
    'focus': Color(0xFF71B6B5),
    'success': Color(0xFF71BA91),
    'on-success': Color(0xFF181A1A),
    'success-surface': Color(0xFF0C3E27),
    'on-success-surface': Color(0xFFF0F8F3),
    'warning': Color(0xFFDD9467),
    'on-warning': Color(0xFF181A1A),
    'warning-surface': Color(0xFF512709),
    'on-warning-surface': Color(0xFFFEF4EE),
    'danger': Color(0xFFFC7B6C),
    'on-danger': Color(0xFF181A1A),
    'danger-strong': Color(0xFFF04E41),
    'danger-surface': Color(0xFF61130E),
    'on-danger-surface': Color(0xFFFFF3F1),
    'info': Color(0xFF81A6F3),
    'on-info': Color(0xFF181A1A),
    'info-surface': Color(0xFF1D325F),
    'on-info-surface': Color(0xFFF1F6FF),
  };

  static const Map<String, Color> contrast = {
    'brand': Color(0xFF0A5252),
    'on-brand': Color(0xFFFFFFFF),
    'brand-pressed': Color(0xFF0C3C3C),
    'brand-surface': Color(0xFFE0EFEE),
    'on-brand-surface': Color(0xFF000000),
    'ground': Color(0xFFFFFFFF),
    'on-ground': Color(0xFF000000),
    'surface': Color(0xFFFFFFFF),
    'on-surface': Color(0xFF000000),
    'surface-raised': Color(0xFFFFFFFF),
    'on-surface-raised': Color(0xFF000000),
    'ink': Color(0xFF000000),
    'ink-muted': Color(0xFF3A3E3E),
    'border': Color(0xFF000000),
    'divider': Color(0xFF000000),
    'focus': Color(0xFF000000),
    'success': Color(0xFF136F47),
    'on-success': Color(0xFFFFFFFF),
    'success-surface': Color(0xFFE0F0E6),
    'on-success-surface': Color(0xFF0C3E27),
    'warning': Color(0xFF8F470D),
    'on-warning': Color(0xFFFFFFFF),
    'warning-surface': Color(0xFFF9E7DD),
    'on-warning-surface': Color(0xFF512709),
    'danger': Color(0xFFAB1F18),
    'on-danger': Color(0xFFFFFFFF),
    'danger-strong': Color(0xFFD13329),
    'danger-surface': Color(0xFFFFE4E0),
    'on-danger-surface': Color(0xFF61130E),
    'info': Color(0xFF3659A7),
    'on-info': Color(0xFFFFFFFF),
    'info-surface': Color(0xFFE2ECFE),
    'on-info-surface': Color(0xFF1D325F),
  };

  static const Map<KdMode, Map<String, Color>> byMode = {
    KdMode.light: light,
    KdMode.warm: warm,
    KdMode.dark: dark,
    KdMode.contrast: contrast,
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
  static const double focusRingWidth = 2;
  static const double focusRingOffset = 2;
  static const double motionFast = 120;
  static const double motionBase = 200;
  static const double motionSlow = 320;
  static const String shadow1 = '0 1px 2px rgba(19, 27, 27, 0.08)';
  static const String shadow2 = '0 4px 12px rgba(19, 27, 27, 0.10)';
  static const String shadow3 = '0 12px 32px rgba(19, 27, 27, 0.14)';
}

class KdFonts {
  const KdFonts._();

  static const String sans = 'Archivo';
  static const String mono = 'DM Mono';

  /// The Dart package these fonts ship in. Every `TextStyle` built from
  /// `KdType` sets `package:` to this, or a consuming app never finds
  /// the bundled font — fixed regardless of brand.
  static const String package = 'kreiseck_design';
}

/// One typography role: size in logical pixels, `leading` as a
/// multiplier of size, `weight` as a `FontWeight` value (400, 600, …),
/// `tracking` in em. Matches `TextStyle`'s own units, so a caller can
/// spread these straight into one.
class KdTypeStyle {
  const KdTypeStyle({
    required this.size,
    required this.leading,
    required this.weight,
    required this.tracking,
    this.mono = false,
    this.uppercase = false,
  });

  final double size;
  final double leading;
  final int weight;
  final double tracking;
  final bool mono;
  final bool uppercase;
}

/// The type scale, by role. Never hand-type a size or a weight in an
/// app — the drift this package exists to end.
class KdType {
  const KdType._();

  static const Map<String, KdTypeStyle> roles = {
    'display': KdTypeStyle(size: 32, leading: 1.15, weight: 600, tracking: -0.015, mono: false, uppercase: false),
    'title': KdTypeStyle(size: 24, leading: 1.25, weight: 600, tracking: -0.015, mono: false, uppercase: false),
    'heading': KdTypeStyle(size: 18, leading: 1.35, weight: 600, tracking: 0, mono: false, uppercase: false),
    'body': KdTypeStyle(size: 16, leading: 1.6, weight: 400, tracking: 0, mono: false, uppercase: false),
    'small': KdTypeStyle(size: 14, leading: 1.5, weight: 400, tracking: 0, mono: false, uppercase: false),
    'label': KdTypeStyle(size: 11, leading: 1.4, weight: 500, tracking: 0.1, mono: false, uppercase: true),
    'mono': KdTypeStyle(size: 16, leading: 1.5, weight: 400, tracking: 0, mono: true, uppercase: false),
    'mono-lg': KdTypeStyle(size: 20, leading: 1.3, weight: 500, tracking: 0, mono: true, uppercase: false),
  };
}
