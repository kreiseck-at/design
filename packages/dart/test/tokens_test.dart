import 'dart:convert';
import 'dart:io';
import 'dart:ui' show Color;

import 'package:flutter_test/flutter_test.dart';
import 'package:kreiseck_design/kreiseck_design.dart';

/// The generated Dart has to say exactly what the generated TypeScript says.
/// Both are written from `golden/kasseneck.json`; this test reads that file
/// and compares — the same twin discipline as kasseneck_api.
void main() {
  late Map<String, dynamic> golden;

  setUpAll(() {
    golden = jsonDecode(File('../../golden/kasseneck.json').readAsStringSync())
        as Map<String, dynamic>;
  });

  int argb(String hex) => int.parse('FF${hex.substring(1)}', radix: 16);

  test('every ramp step matches the golden file', () {
    final ramps = golden['ramps'] as Map<String, dynamic>;
    final dartRamps = <String, Map<int, Color>>{
      'brand': KdRamps.brand,
      'neutral': KdRamps.neutral,
      'success': KdRamps.success,
      'warning': KdRamps.warning,
      'danger': KdRamps.danger,
      'info': KdRamps.info,
    };
    for (final entry in ramps.entries) {
      final steps = entry.value as Map<String, dynamic>;
      for (final step in steps.entries) {
        expect(
          dartRamps[entry.key]![int.parse(step.key)]!.toARGB32(),
          argb(step.value as String),
          reason: '${entry.key}-${step.key}',
        );
      }
    }
  });

  test('every role matches the golden file in both modes', () {
    final roles = golden['roles'] as Map<String, dynamic>;
    for (final mode in ['light', 'dark']) {
      final table = mode == 'light' ? KdRoles.light : KdRoles.dark;
      for (final entry in (roles[mode] as Map<String, dynamic>).entries) {
        expect(table[entry.key]!.toARGB32(), argb(entry.value as String),
            reason: '$mode/${entry.key}');
      }
    }
  });

  test('the anchors are exact', () {
    expect(KdRamps.brand[700]!.toARGB32(), 0xFF136B6B);
    expect(KdRamps.brand[500]!.toARGB32(), 0xFF139E9B);
    expect(KdRamps.neutral[900]!.toARGB32(), 0xFF132A2A);
    expect(KdRamps.neutral[950]!.toARGB32(), 0xFF131B1B);
  });

  test('an unknown role throws instead of returning a wrong colour', () {
    expect(() => kdColor(KdMode.light, 'nope'), throwsArgumentError);
  });
}
