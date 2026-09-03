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
}
