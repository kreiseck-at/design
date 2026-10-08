import 'package:flutter/material.dart';

import 'tokens.dart';

/// Colour by role. Never reach for a ramp step in application code.
Color kdColor(KdMode mode, String role) {
  final colour = KdRoles.byMode[mode]?[role];
  if (colour == null) throw ArgumentError('unknown role: $role');
  return colour;
}

/// Resolves a role: an app's override first, the brand's role otherwise.
typedef _KdRoleOf = Color Function(String role);

_KdRoleOf _kdRoles(KdMode mode, Map<String, Color> roles) {
  final known = KdRoles.byMode[mode]!;
  for (final name in roles.keys) {
    // A typo ('brnad') would otherwise fall through to the brand's colour
    // without a word -- the very colour the app set out to replace.
    if (!known.containsKey(name)) throw ArgumentError('unknown role: $name');
  }
  return (role) => roles[role] ?? kdColor(mode, role);
}

/// The type scale as a Material text theme. Sizes, leading, weight and
/// tracking come from the generated `KdType`; nothing here is typed by hand.
/// [roles] overrides colour roles, as in [kdTheme].
TextTheme kdTextTheme(KdMode mode, {Map<String, Color> roles = const {}}) {
  final c = _kdRoles(mode, roles);
  final ink = c('ink');
  final muted = c('ink-muted');
  TextStyle s(KdTypeStyle t, {Color? color, int? weight}) => TextStyle(
        fontFamily: t.mono ? KdFonts.mono : KdFonts.sans,
        package: KdFonts.package,
        fontSize: t.size,
        height: t.leading,
        fontWeight: FontWeight.values[((weight ?? t.weight) ~/ 100) - 1],
        letterSpacing: t.size * t.tracking,
        color: color ?? ink,
      );
  final r = KdType.roles;
  // Every one of Material's fifteen text roles gets a size — a role left
  // at `fontSize: null` makes `TextTheme.apply(fontSizeFactor:)` throw,
  // and a till needs that call for its font-scale setting.
  return TextTheme(
    displayLarge: s(r['display']!),
    displayMedium: s(r['display']!),
    displaySmall: s(r['display']!),
    headlineLarge: s(r['title']!),
    headlineMedium: s(r['title']!),
    headlineSmall: s(r['title']!),
    titleLarge: s(r['heading']!),
    titleMedium: s(r['heading']!),
    titleSmall: s(r['body']!, weight: 600),
    bodyLarge: s(r['body']!),
    bodyMedium: s(r['body']!),
    bodySmall: s(r['small']!, color: muted),
    labelLarge: s(r['body']!, weight: 500),
    labelMedium: s(r['small']!, weight: 500),
    labelSmall: s(r['label']!, color: muted),
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
WidgetStateProperty<Color?> _kdDisabledBackground(_KdRoleOf c, Color? enabled) =>
    WidgetStateProperty.resolveWith(
      (s) => s.contains(WidgetState.disabled) ? c('surface-raised') : enabled,
    );

WidgetStateProperty<Color?> _kdDisabledForeground(_KdRoleOf c, Color? enabled) =>
    WidgetStateProperty.resolveWith(
      (s) => s.contains(WidgetState.disabled) ? c('ink-muted') : enabled,
    );

WidgetStateProperty<BorderSide?> _kdDisabledSide(
  _KdRoleOf c,
  double borderWidth,
  BorderSide? enabled,
) =>
    WidgetStateProperty.resolveWith(
      (s) => s.contains(WidgetState.disabled)
          ? BorderSide(color: c('border'), width: borderWidth)
          : enabled,
    );

/// A Flutter theme built from the roles, so widgets nobody styles by hand
/// still look right.
///
/// [roles] lets an app put its own colours on the same forms: every role
/// named there replaces the brand's (`{'brand': graphite, 'on-brand': white}`
/// paints buttons, focus and selection in graphite). A name that is not a
/// role throws. The override colours controls, not the Kasseneck mark --
/// `KdLogo` takes its colours itself.
ThemeData kdTheme(KdMode mode, {Map<String, Color> roles = const {}}) {
  final c = _kdRoles(mode, roles);
  final dark = mode == KdMode.dark;
  final contrast = mode == KdMode.contrast;
  final scheme = ColorScheme(
    brightness: dark ? Brightness.dark : Brightness.light,
    primary: c('brand'),
    onPrimary: c('on-brand'),
    primaryContainer: c('brand-surface'),
    onPrimaryContainer: c('on-brand-surface'),
    // One colour for action. Two would compete for the same glance.
    secondary: c('brand'),
    onSecondary: c('on-brand'),
    secondaryContainer: c('brand-surface'),
    onSecondaryContainer: c('on-brand-surface'),
    error: c('danger'),
    onError: c('on-danger'),
    errorContainer: c('danger-surface'),
    onErrorContainer: c('on-danger-surface'),
    surface: c('surface'),
    onSurface: c('on-surface'),
    onSurfaceVariant: c('ink-muted'),
    outline: c('border'),
    outlineVariant: c('divider'),
    // Shadows are black, in every mode — a role, not a token.
    shadow: const Color(0xFF000000),
    scrim: const Color(0xFF000000),
    inverseSurface: c('ink'),
    onInverseSurface: c('surface'),
    inversePrimary: c('brand-surface'),
    surfaceContainerLowest: c('surface'),
    surfaceContainerLow: c('surface-raised'),
    surfaceContainer: c('surface-raised'),
    surfaceContainerHigh: c('surface-raised'),
    surfaceContainerHighest: c('surface-raised'),
  );

  final text = kdTextTheme(mode, roles: roles);
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
    scaffoldBackgroundColor: c('ground'),
    fontFamily: KdFonts.sans,
    package: KdFonts.package,
    textTheme: text,
    // Nobody aims precisely at a till: no control under 56 dp.
    materialTapTargetSize: MaterialTapTargetSize.padded,
    appBarTheme: AppBarTheme(
      backgroundColor: c('surface'),
      foregroundColor: c('ink'),
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: elevation * 2,
      shadowColor: const Color(0xFF000000),
      titleTextStyle: text.titleLarge,
    ),
    cardTheme: CardThemeData(
      color: c('surface'),
      surfaceTintColor: Colors.transparent,
      elevation: elevation * 1.5,
      shape: cardShape.copyWith(
        side: BorderSide(color: c('border'), width: borderWidth),
      ),
      margin: EdgeInsets.zero,
    ),
    dividerTheme: DividerThemeData(
      color: c('divider'),
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
        backgroundColor: _kdDisabledBackground(c, c('brand')),
        foregroundColor: _kdDisabledForeground(c, c('on-brand')),
        side: _kdDisabledSide(
          c,
          borderWidth,
          contrast ? BorderSide(color: c('ink'), width: 2) : BorderSide.none,
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(KdForm.tapMin, KdForm.controlPos),
        shape: controlShape,
        textStyle: text.titleMedium,
      ).copyWith(
        backgroundColor: _kdDisabledBackground(c, null),
        foregroundColor: _kdDisabledForeground(c, c('ink')),
        side: _kdDisabledSide(
          c,
          borderWidth,
          BorderSide(color: c('border'), width: borderWidth),
        ),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        minimumSize: const Size(KdForm.tapMin, KdForm.controlPos),
        shape: controlShape,
      ).copyWith(
        backgroundColor: _kdDisabledBackground(c, null),
        foregroundColor: _kdDisabledForeground(c, c('brand')),
        side: _kdDisabledSide(c, borderWidth, BorderSide.none),
      ),
    ),
    chipTheme: ChipThemeData(
      // Not fully round: a pill reads as a label, and a selection at a
      // till is a switch.
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(KdForm.radius),
        side: BorderSide(color: c('border'), width: borderWidth),
      ),
      backgroundColor: c('surface'),
      disabledColor: c('surface-raised'),
      selectedColor: c('brand-surface'),
      labelStyle: text.bodyMedium,
      secondaryLabelStyle: text.bodyMedium?.copyWith(
        color: c('brand'),
        fontWeight: FontWeight.w600,
      ),
      side: BorderSide(color: c('border'), width: borderWidth),
      showCheckmark: false,
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 8),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: c('surface-raised'),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(KdForm.radius),
        borderSide: BorderSide(color: c('border'), width: borderWidth),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(KdForm.radius),
        borderSide: BorderSide(color: c('border'), width: borderWidth),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(KdForm.radius),
        borderSide: BorderSide(color: c('brand'), width: borderWidth + 1),
      ),
      labelStyle: text.bodyMedium?.copyWith(color: c('ink-muted')),
      helperStyle: text.bodySmall,
      helperMaxLines: 3,
    ),
    listTileTheme: ListTileThemeData(
      titleTextStyle: text.bodyLarge,
      subtitleTextStyle: text.bodySmall,
      iconColor: c('ink-muted'),
      shape: controlShape,
    ),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith(
        // Off is a **grey** thumb, not a white one: white on near-white
        // is not a track with a button seen from across a counter — it
        // is an empty patch of surface, and the owner is left hunting
        // for the switch that is right in front of them.
        (s) => s.contains(WidgetState.selected)
            ? c('on-brand')
            : c('ink-muted'),
      ),
      trackColor: WidgetStateProperty.resolveWith(
        (s) => s.contains(WidgetState.disabled)
            ? c('surface-raised')
            : s.contains(WidgetState.selected)
                ? c('brand')
                : c('surface'),
      ),
      // The outline keeps the track separate from the ground.
      trackOutlineColor: WidgetStateProperty.resolveWith(
        (s) => s.contains(WidgetState.selected)
            ? c('brand')
            : c('border'),
      ),
      trackOutlineWidth: WidgetStateProperty.all(borderWidth + 0.5),
    ),
    sliderTheme: SliderThemeData(
      activeTrackColor: c('brand'),
      thumbColor: c('brand'),
      inactiveTrackColor: c('border'),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: c('ink'),
      contentTextStyle: text.bodyLarge?.copyWith(color: c('surface')),
      shape: controlShape,
      behavior: SnackBarBehavior.floating,
    ),
    progressIndicatorTheme: ProgressIndicatorThemeData(color: c('brand')),
    expansionTileTheme: ExpansionTileThemeData(
      textColor: c('ink'),
      collapsedTextColor: c('ink'),
      iconColor: c('ink-muted'),
      collapsedIconColor: c('ink-muted'),
    ),
  );
}
