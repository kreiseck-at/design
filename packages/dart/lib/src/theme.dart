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

/// Elevation by mode. Not a token — the till app tuned these four numbers
/// by eye per style, and this keeps that tuning rather than inventing a
/// token for a single call site. `contrast` gets none: a shadow is a soft
/// edge, and contrast mode draws every edge with a hard line instead.
double _kdElevation(KdMode mode) {
  switch (mode) {
    case KdMode.light:
      return 1;
    case KdMode.warm:
      return 1;
    case KdMode.dark:
      return 0.5;
    case KdMode.contrast:
      return 0;
  }
}

/// Disabled means grey and bordered, not translucent — a till is read in
/// bad light. Material's own 12 %/38 % alpha reads as a soft smudge under
/// counter lighting; a flat `surface-raised` fill with an `ink-muted`
/// label and a `border` outline stays legible as a control that is there,
/// just not pressable right now.
WidgetStateProperty<Color?> _kdDisabledBackground(KdMode mode, Color? enabled) =>
    WidgetStateProperty.resolveWith(
      (s) => s.contains(WidgetState.disabled) ? kdColor(mode, 'surface-raised') : enabled,
    );

WidgetStateProperty<Color?> _kdDisabledForeground(KdMode mode, Color? enabled) =>
    WidgetStateProperty.resolveWith(
      (s) => s.contains(WidgetState.disabled) ? kdColor(mode, 'ink-muted') : enabled,
    );

WidgetStateProperty<BorderSide?> _kdDisabledSide(
  KdMode mode,
  double borderWidth,
  BorderSide? enabled,
) =>
    WidgetStateProperty.resolveWith(
      (s) => s.contains(WidgetState.disabled)
          ? BorderSide(color: kdColor(mode, 'border'), width: borderWidth)
          : enabled,
    );

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

  final text = kdTextTheme(mode);
  final elevation = _kdElevation(mode);
  final borderWidth = contrast ? 2.0 : KdForm.borderWidth;
  final controlShape = RoundedRectangleBorder(
    borderRadius: BorderRadius.circular(KdForm.radius),
  );
  final cardShape = RoundedRectangleBorder(
    borderRadius: BorderRadius.circular(KdForm.radiusLg),
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: kdColor(mode, 'ground'),
    fontFamily: KdFonts.sans,
    package: KdFonts.package,
    textTheme: text,
    // Nobody aims precisely at a till: no control under 56 dp.
    materialTapTargetSize: MaterialTapTargetSize.padded,
    appBarTheme: AppBarTheme(
      backgroundColor: kdColor(mode, 'surface'),
      foregroundColor: kdColor(mode, 'ink'),
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: elevation * 2,
      shadowColor: const Color(0xFF000000),
      titleTextStyle: text.titleLarge,
    ),
    cardTheme: CardThemeData(
      color: kdColor(mode, 'surface'),
      surfaceTintColor: Colors.transparent,
      elevation: elevation * 1.5,
      shape: cardShape.copyWith(
        side: BorderSide(color: kdColor(mode, 'border'), width: borderWidth),
      ),
      margin: EdgeInsets.zero,
    ),
    dividerTheme: DividerThemeData(
      color: kdColor(mode, 'divider'),
      thickness: borderWidth,
      space: borderWidth,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(KdForm.tapMin, KdForm.controlPos),
        shape: controlShape,
        textStyle: text.titleMedium,
        elevation: elevation,
      ).copyWith(
        backgroundColor: _kdDisabledBackground(mode, kdColor(mode, 'brand')),
        foregroundColor: _kdDisabledForeground(mode, kdColor(mode, 'on-brand')),
        side: _kdDisabledSide(
          mode,
          borderWidth,
          contrast ? BorderSide(color: kdColor(mode, 'ink'), width: 2) : BorderSide.none,
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(KdForm.tapMin, KdForm.controlPos),
        shape: controlShape,
        textStyle: text.titleMedium,
      ).copyWith(
        backgroundColor: _kdDisabledBackground(mode, null),
        foregroundColor: _kdDisabledForeground(mode, kdColor(mode, 'ink')),
        side: _kdDisabledSide(
          mode,
          borderWidth,
          BorderSide(color: kdColor(mode, 'border'), width: borderWidth),
        ),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        minimumSize: const Size(KdForm.tapMin, KdForm.controlPos),
        shape: controlShape,
      ).copyWith(
        backgroundColor: _kdDisabledBackground(mode, null),
        foregroundColor: _kdDisabledForeground(mode, kdColor(mode, 'brand')),
        side: _kdDisabledSide(mode, borderWidth, BorderSide.none),
      ),
    ),
    chipTheme: ChipThemeData(
      // Not fully round: a pill reads as a label, and a selection at a
      // till is a switch.
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(KdForm.radius),
        side: BorderSide(color: kdColor(mode, 'border'), width: borderWidth),
      ),
      backgroundColor: kdColor(mode, 'surface'),
      disabledColor: kdColor(mode, 'surface-raised'),
      selectedColor: kdColor(mode, 'brand-surface'),
      labelStyle: text.bodyMedium,
      secondaryLabelStyle: text.bodyMedium?.copyWith(
        color: kdColor(mode, 'brand'),
        fontWeight: FontWeight.w600,
      ),
      side: BorderSide(color: kdColor(mode, 'border'), width: borderWidth),
      showCheckmark: false,
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 8),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: kdColor(mode, 'surface-raised'),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(KdForm.radius),
        borderSide: BorderSide(color: kdColor(mode, 'border'), width: borderWidth),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(KdForm.radius),
        borderSide: BorderSide(color: kdColor(mode, 'border'), width: borderWidth),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(KdForm.radius),
        borderSide: BorderSide(color: kdColor(mode, 'brand'), width: borderWidth + 1),
      ),
      labelStyle: text.bodyMedium?.copyWith(color: kdColor(mode, 'ink-muted')),
      helperStyle: text.bodySmall,
      helperMaxLines: 3,
    ),
    listTileTheme: ListTileThemeData(
      titleTextStyle: text.bodyLarge,
      subtitleTextStyle: text.bodySmall,
      iconColor: kdColor(mode, 'ink-muted'),
      shape: controlShape,
    ),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith(
        // Off is a **grey** thumb, not a white one: white on near-white
        // is not a track with a button seen from across a counter — it
        // is an empty patch of surface, and the owner is left hunting
        // for the switch that is right in front of them.
        (s) => s.contains(WidgetState.selected)
            ? kdColor(mode, 'on-brand')
            : kdColor(mode, 'ink-muted'),
      ),
      trackColor: WidgetStateProperty.resolveWith(
        (s) => s.contains(WidgetState.disabled)
            ? kdColor(mode, 'surface-raised')
            : s.contains(WidgetState.selected)
                ? kdColor(mode, 'brand')
                : kdColor(mode, 'surface'),
      ),
      // The outline keeps the track separate from the ground.
      trackOutlineColor: WidgetStateProperty.resolveWith(
        (s) => s.contains(WidgetState.selected)
            ? kdColor(mode, 'brand')
            : kdColor(mode, 'border'),
      ),
      trackOutlineWidth: WidgetStateProperty.all(borderWidth + 0.5),
    ),
    sliderTheme: SliderThemeData(
      activeTrackColor: kdColor(mode, 'brand'),
      thumbColor: kdColor(mode, 'brand'),
      inactiveTrackColor: kdColor(mode, 'border'),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: kdColor(mode, 'ink'),
      contentTextStyle: text.bodyLarge?.copyWith(color: kdColor(mode, 'surface')),
      shape: controlShape,
      behavior: SnackBarBehavior.floating,
    ),
    progressIndicatorTheme: ProgressIndicatorThemeData(color: kdColor(mode, 'brand')),
    expansionTileTheme: ExpansionTileThemeData(
      textColor: kdColor(mode, 'ink'),
      collapsedTextColor: kdColor(mode, 'ink'),
      iconColor: kdColor(mode, 'ink-muted'),
      collapsedIconColor: kdColor(mode, 'ink-muted'),
    ),
  );
}
