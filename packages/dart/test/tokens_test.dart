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
      'neutralWarm': KdRamps.neutralWarm,
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

  test('every role matches the golden file in every mode', () {
    final roles = golden['roles'] as Map<String, dynamic>;
    final modes = (golden['modes'] as List).cast<String>();
    for (final mode in modes) {
      final table = KdRoles.byMode[KdMode.values.byName(mode)]!;
      for (final entry in (roles[mode] as Map<String, dynamic>).entries) {
        expect(table[entry.key]!.toARGB32(), argb(entry.value as String),
            reason: '$mode/${entry.key}');
      }
    }
  });

  test('every data colour matches the golden file in both modes', () {
    final data = golden['data'] as Map<String, dynamic>;
    for (final mode in ['light', 'dark']) {
      final expected = (data[mode] as List).cast<String>();
      final actual = mode == 'light' ? KdData.light : KdData.dark;
      expect(actual.length, expected.length, reason: '$mode slot count');
      for (var i = 0; i < expected.length; i++) {
        expect(actual[i].toARGB32(), argb(expected[i]), reason: '$mode slot ${i + 1}');
      }
    }
  });

  test('the golden file is not degenerate', () {
    expect((golden['ramps'] as Map).length, 7);
    final modes = (golden['modes'] as List).cast<String>();
    final light = golden['roles']['light'] as Map;
    expect(light.length, greaterThanOrEqualTo(30));
    for (final mode in modes) {
      expect((golden['roles'][mode] as Map).length, light.length, reason: mode);
    }
    expect((golden['data']['light'] as List).length, 8);
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

  test('every typography role matches the golden file', () {
    final type = golden['type'] as Map<String, dynamic>;
    expect(KdType.roles.keys.toSet(), type.keys.toSet());
    for (final entry in type.entries) {
      final expected = entry.value as Map<String, dynamic>;
      final actual = KdType.roles[entry.key]!;
      expect(actual.size, (expected['size'] as num).toDouble(), reason: '${entry.key}.size');
      expect(actual.leading, (expected['leading'] as num).toDouble(),
          reason: '${entry.key}.leading');
      expect(actual.weight, expected['weight'], reason: '${entry.key}.weight');
      expect(actual.tracking, (expected['tracking'] as num).toDouble(),
          reason: '${entry.key}.tracking');
      expect(actual.mono, expected['mono'] ?? false, reason: '${entry.key}.mono');
      expect(actual.uppercase, expected['uppercase'] ?? false, reason: '${entry.key}.uppercase');
    }
  });

  test('form (radii, motion, focus ring, shadow) matches the golden file', () {
    final form = golden['form'] as Map<String, dynamic>;
    final radius = form['radius'] as Map<String, dynamic>;
    final size = form['size'] as Map<String, dynamic>;
    final focusRing = form['focusRing'] as Map<String, dynamic>;
    final motion = form['motion'] as Map<String, dynamic>;
    final shadow = form['shadow'] as Map<String, dynamic>;

    expect(KdForm.radiusSm, (radius['sm'] as num).toDouble());
    expect(KdForm.radius, (radius['md'] as num).toDouble());
    expect(KdForm.radiusLg, (radius['lg'] as num).toDouble());
    expect(KdForm.radiusFull, (radius['full'] as num).toDouble());
    expect(KdForm.borderWidth, (form['borderWidth'] as num).toDouble());
    expect(KdForm.tapMin, (size['tapMin'] as num).toDouble());
    expect(KdForm.controlPos, (size['controlPos'] as num).toDouble());
    expect(KdForm.controlWeb, (size['controlWeb'] as num).toDouble());
    expect(KdForm.space, (form['space'] as List).map((v) => (v as num).toDouble()).toList());
    expect(KdForm.focusRingWidth, (focusRing['width'] as num).toDouble());
    expect(KdForm.focusRingOffset, (focusRing['offset'] as num).toDouble());
    expect(KdForm.motionFast, (motion['fast'] as num).toDouble());
    expect(KdForm.motionBase, (motion['base'] as num).toDouble());
    expect(KdForm.motionSlow, (motion['slow'] as num).toDouble());
    expect(KdForm.shadow1, shadow['1']);
    expect(KdForm.shadow2, shadow['2']);
    expect(KdForm.shadow3, shadow['3']);
  });
}
