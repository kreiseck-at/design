import 'package:flutter/material.dart';

import 'tokens.dart';

/// Colour by role. Never reach for a ramp step in application code.
Color kdColor(KdMode mode, String role) {
  final colour = KdRoles.byMode[mode]?[role];
  if (colour == null) throw ArgumentError('unknown role: $role');
  return colour;
}

/// The type scale as a Material text theme. Sizes, leading, weight and
/// tracking come from the generated `KdType`; nothing here is typed by hand.
TextTheme kdTextTheme(KdMode mode) {
  final ink = kdColor(mode, 'ink');
  TextStyle s(KdTypeStyle t, {Color? color}) => TextStyle(
        fontFamily: t.mono ? KdFonts.mono : KdFonts.sans,
        package: KdFonts.package,
        fontSize: t.size,
        height: t.leading,
        fontWeight: FontWeight.values[(t.weight ~/ 100) - 1],
        letterSpacing: t.size * t.tracking,
        color: color ?? ink,
      );
  final r = KdType.roles;
  return TextTheme(
    displaySmall: s(r['display']!),
    headlineSmall: s(r['title']!),
    titleLarge: s(r['heading']!),
    titleMedium: s(r['heading']!),
    bodyLarge: s(r['body']!),
    bodyMedium: s(r['body']!),
    bodySmall: s(r['small']!, color: kdColor(mode, 'ink-muted')),
    labelSmall: s(r['label']!, color: kdColor(mode, 'ink-muted')),
  );
}

/// Amounts, numbers and codes: everything that stands in a column and is
/// compared. Never body text.
TextStyle kdMonoStyle(KdMode mode, {bool large = false}) {
  final t = KdType.roles[large ? 'mono-lg' : 'mono']!;
  return TextStyle(
    fontFamily: KdFonts.mono,
    package: KdFonts.package,
    fontSize: t.size,
    height: t.leading,
    fontWeight: FontWeight.values[(t.weight ~/ 100) - 1],
    fontFeatures: const [FontFeature.tabularFigures()],
    color: kdColor(mode, 'ink'),
  );
}

/// Asset path of the signet. Flips to the inverse only when the ground is
/// dark — `warm` and `contrast` stay on a light ground and use the normal
/// mark.
String kdSignet(KdMode mode) =>
    mode == KdMode.dark ? 'assets/signet-invers.svg' : 'assets/signet.svg';

/// A Flutter theme built from the roles, so widgets nobody styles by hand
/// still look right.
ThemeData kdTheme(KdMode mode) {
  final dark = mode == KdMode.dark;
  final contrast = mode == KdMode.contrast;
  final scheme = ColorScheme(
    brightness: dark ? Brightness.dark : Brightness.light,
    primary: kdColor(mode, 'brand'),
    onPrimary: kdColor(mode, 'on-brand'),
    primaryContainer: kdColor(mode, 'brand-surface'),
    onPrimaryContainer: kdColor(mode, 'on-brand-surface'),
    // One colour for action. Two would compete for the same glance.
    secondary: kdColor(mode, 'brand'),
    onSecondary: kdColor(mode, 'on-brand'),
    error: kdColor(mode, 'danger'),
    onError: kdColor(mode, 'on-danger'),
    errorContainer: kdColor(mode, 'danger-surface'),
    onErrorContainer: kdColor(mode, 'on-danger-surface'),
    surface: kdColor(mode, 'surface'),
    onSurface: kdColor(mode, 'on-surface'),
    onSurfaceVariant: kdColor(mode, 'ink-muted'),
    outline: kdColor(mode, 'border'),
    outlineVariant: kdColor(mode, 'divider'),
  );

  final shape = RoundedRectangleBorder(
    borderRadius: BorderRadius.circular(KdForm.radius),
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: kdColor(mode, 'ground'),
    fontFamily: KdFonts.sans,
    package: KdFonts.package,
    textTheme: kdTextTheme(mode),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(KdForm.tapMin, KdForm.controlPos),
        shape: shape,
        side: contrast
            ? BorderSide(color: kdColor(mode, 'ink'), width: 2)
            : BorderSide.none,
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: kdColor(mode, 'surface'),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(KdForm.radius),
        borderSide: BorderSide(
          color: kdColor(mode, 'border'),
          width: contrast ? 2 : KdForm.borderWidth,
        ),
      ),
    ),
  );
}
