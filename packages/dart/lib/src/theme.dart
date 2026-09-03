import 'package:flutter/material.dart';

import 'tokens.dart';

/// Colour by role. Never reach for a ramp step in application code.
Color kdColor(KdMode mode, String role) {
  final colour = KdRoles.byMode[mode]?[role];
  if (colour == null) throw ArgumentError('unknown role: $role');
  return colour;
}

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
