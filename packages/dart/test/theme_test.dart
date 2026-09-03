import 'package:flutter_test/flutter_test.dart';
import 'package:kreiseck_design/kreiseck_design.dart';

void main() {
  test('KdMode offers only the modes the roles table has values for', () {
    // `warm` used to be selectable while silently returning the light
    // table. A deferred mode should not be a value anyone can pass.
    expect(KdMode.values, [KdMode.light, KdMode.dark, KdMode.contrast]);
  });

  test('onError is the ink Material paints on the solid error colour, not '
      'the ink for the tinted error card', () {
    for (final mode in [KdMode.light, KdMode.dark]) {
      final onError = kdTheme(mode).colorScheme.onError;
      expect(onError, kdColor(mode, 'on-danger'), reason: mode.name);
      expect(onError, isNot(kdColor(mode, 'on-danger-surface')), reason: mode.name);
    }
  });
}
