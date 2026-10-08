import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kreiseck_design/kreiseck_design.dart';

void main() {
  test('KdMode offers only the modes the roles table has values for', () {
    // A deferred mode should not be a value anyone can pass — every entry
    // here has its own row in `KdRoles.byMode`.
    expect(KdMode.values, [KdMode.light, KdMode.warm, KdMode.dark, KdMode.contrast]);
    for (final mode in KdMode.values) {
      expect(KdRoles.byMode[mode], isNotNull, reason: mode.name);
    }
  });

  test('onError is the ink Material paints on the solid error colour, not '
      'the ink for the tinted error card', () {
    for (final mode in [KdMode.light, KdMode.dark]) {
      final onError = kdTheme(mode).colorScheme.onError;
      expect(onError, kdColor(mode, 'on-danger'), reason: mode.name);
      expect(onError, isNot(kdColor(mode, 'on-danger-surface')), reason: mode.name);
    }
  });

  test('text theme carries the house fonts from this package', () {
    final t = kdTextTheme(KdMode.light);
    // TextStyle's own constructor folds `package:` into `fontFamily` as
    // 'packages/<package>/<family>' — that qualified form is what actually
    // resolves the bundled font, in this package's own code as much as in
    // a consumer's, so this is the family a working style carries.
    expect(t.bodyLarge!.fontFamily, 'packages/kreiseck_design/Archivo');
    expect(t.bodyLarge!.fontFamilyFallback, isNull);
    expect(kdMonoStyle(KdMode.light).fontFamily, 'packages/kreiseck_design/DM Mono');
    expect(KdFonts.package, 'kreiseck_design');
  });

  test('display and label follow the type scale', () {
    final t = kdTextTheme(KdMode.light);
    expect(t.displaySmall!.fontSize, 32);
    expect(t.displaySmall!.fontWeight, FontWeight.w600);
    expect(t.labelSmall!.fontSize, 11);
    expect(t.labelSmall!.letterSpacing, closeTo(1.1, 0.01)); // +10 % of 11 px
  });

  test('the theme for the till has a 56 px filled button and 10 px corners', () {
    final theme = kdTheme(KdMode.light);
    final style = theme.filledButtonTheme.style!;
    expect(style.minimumSize!.resolve({})!.height, 56);
    final shape = style.shape!.resolve({}) as RoundedRectangleBorder;
    expect((shape.borderRadius as BorderRadius).topLeft.x, 10);
  });

  test('contrast mode draws a 2 px ink border on every control', () {
    final theme = kdTheme(KdMode.contrast);
    final card = theme.cardTheme.shape as RoundedRectangleBorder;
    expect(card.side.width, 2);
    expect(card.side.color, kdColor(KdMode.contrast, 'border'));
    final input = theme.inputDecorationTheme.enabledBorder as OutlineInputBorder;
    expect(input.borderSide.width, 2);
    expect(theme.cardTheme.elevation, 0);
  });

  test('chips are not pills', () {
    final chip = kdTheme(KdMode.light).chipTheme.shape as RoundedRectangleBorder;
    expect((chip.borderRadius as BorderRadius).topLeft.x, 10);
  });

  test('a switched-off switch is grey, not white', () {
    final sw = kdTheme(KdMode.light).switchTheme;
    expect(sw.thumbColor!.resolve({}), kdColor(KdMode.light, 'ink-muted'));
  });

  test('a disabled button is grey and bordered, not translucent', () {
    final theme = kdTheme(KdMode.light);
    final style = theme.filledButtonTheme.style!;
    final disabled = {WidgetState.disabled};
    expect(style.backgroundColor!.resolve(disabled), kdColor(KdMode.light, 'surface-raised'));
    expect(style.foregroundColor!.resolve(disabled), kdColor(KdMode.light, 'ink-muted'));
    expect(style.side!.resolve(disabled)!.color, kdColor(KdMode.light, 'border'));
    // Enabled stays brand on on-brand.
    expect(style.backgroundColor!.resolve({}), kdColor(KdMode.light, 'brand'));
  });

  test('every text role has a size, so apply(fontSizeFactor:) cannot crash', () {
    final t = kdTextTheme(KdMode.light);
    for (final style in [t.displayLarge, t.displayMedium, t.displaySmall, t.headlineLarge,
        t.headlineMedium, t.headlineSmall, t.titleLarge, t.titleMedium, t.titleSmall,
        t.bodyLarge, t.bodyMedium, t.bodySmall, t.labelLarge, t.labelMedium, t.labelSmall]) {
      expect(style, isNotNull);
      expect(style!.fontSize, isNotNull);
      expect(style.fontFamily, contains('Archivo'));
    }
    expect(() => t.apply(fontSizeFactor: 1.2), returnsNormally);
    expect(t.labelLarge!.fontWeight, FontWeight.w500);
  });

  test('the colour scheme carries the roles Material derives otherwise', () {
    final s = kdTheme(KdMode.light).colorScheme;
    expect(s.secondaryContainer, kdColor(KdMode.light, 'brand-surface'));
    expect(s.surfaceContainerHighest, kdColor(KdMode.light, 'surface-raised'));
    expect(s.inverseSurface, kdColor(KdMode.light, 'ink'));
    expect(s.shadow, const Color(0xFF000000));
  });

  group('roles override', () {
    const graphite = Color(0xFF2E3133);
    const white = Color(0xFFFFFFFF);
    const family = {
      'brand': graphite,
      'on-brand': white,
      'brand-pressed': Color(0xFF1E2022),
      'brand-surface': Color(0xFFE4E5E6),
      'on-brand-surface': graphite,
    };

    // Every colour the theme resolves for controls, in the states a till shows.
    List<Color?> resolved(ThemeData t) {
      const states = [<WidgetState>{}, {WidgetState.pressed}, {WidgetState.selected}, {WidgetState.disabled}];
      return [
        t.colorScheme.primary,
        t.colorScheme.secondary,
        t.colorScheme.primaryContainer,
        t.colorScheme.inversePrimary,
        for (final s in states) ...[
          t.filledButtonTheme.style?.backgroundColor?.resolve(s),
          t.filledButtonTheme.style?.foregroundColor?.resolve(s),
          t.textButtonTheme.style?.foregroundColor?.resolve(s),
          t.outlinedButtonTheme.style?.foregroundColor?.resolve(s),
          t.switchTheme.trackColor?.resolve(s),
          t.switchTheme.thumbColor?.resolve(s),
          t.switchTheme.trackOutlineColor?.resolve(s),
        ],
        t.chipTheme.selectedColor,
        t.chipTheme.secondaryLabelStyle?.color,
        (t.inputDecorationTheme.focusedBorder as OutlineInputBorder?)?.borderSide.color,
        t.sliderTheme.activeTrackColor,
        t.sliderTheme.thumbColor,
        t.progressIndicatorTheme.color,
      ];
    }

    for (final mode in [KdMode.light, KdMode.dark]) {
      test('$mode: without roles the theme resolves exactly as before', () {
        expect(resolved(kdTheme(mode, roles: const {})), resolved(kdTheme(mode)));
      });

      test('$mode: the overridden brand reaches buttons, focus, selection and switches', () {
        final t = kdTheme(mode, roles: family);
        expect(t.colorScheme.primary, graphite);
        expect(t.filledButtonTheme.style!.backgroundColor!.resolve({}), graphite);
        expect(t.filledButtonTheme.style!.foregroundColor!.resolve({}), white);
        expect(t.textButtonTheme.style!.foregroundColor!.resolve({}), graphite);
        expect(t.switchTheme.trackColor!.resolve({WidgetState.selected}), graphite);
        expect((t.inputDecorationTheme.focusedBorder as OutlineInputBorder).borderSide.color, graphite);
        expect(t.progressIndicatorTheme.color, graphite);
      });

      test('$mode: with the brand family overridden no petrol is left', () {
        final petrol = {
          for (final m in KdMode.values)
            for (final r in ['brand', 'on-brand', 'brand-pressed', 'brand-surface', 'on-brand-surface'])
              KdRoles.byMode[m]?[r],
        }..remove(null);
        // Neutral roles may coincide with an on-brand white; only the brand hues count.
        petrol.removeAll([white, kdColor(mode, 'ink'), kdColor(mode, 'surface')]);
        for (final c in resolved(kdTheme(mode, roles: family))) {
          expect(petrol.contains(c), isFalse, reason: '$c');
        }
      });
    }

    test('a name that is not a role throws', () {
      expect(() => kdTheme(KdMode.light, roles: const {'brnad': graphite}), throwsArgumentError);
      expect(() => kdTextTheme(KdMode.light, roles: const {'inc': graphite}), throwsArgumentError);
    });

    test('kdTextTheme takes the override too', () {
      expect(kdTextTheme(KdMode.light, roles: const {'ink': graphite}).bodyMedium!.color, graphite);
    });
  });
}
