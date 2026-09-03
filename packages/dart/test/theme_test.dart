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

  test('the signet flips for dark ground', () {
    expect(kdSignet(KdMode.light), 'assets/signet.svg');
    expect(kdSignet(KdMode.dark), 'assets/signet-invers.svg');
    expect(kdSignet(KdMode.warm), 'assets/signet.svg');
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
}
