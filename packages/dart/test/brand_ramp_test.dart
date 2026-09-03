import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;
import 'dart:ui' show Color;

import 'package:flutter_test/flutter_test.dart';
import 'package:kreiseck_design/kreiseck_design.dart';

double _lum(Color c) {
  double channel(int v) {
    final s = v / 255;
    return s <= 0.04045 ? s / 12.92 : math.pow((s + 0.055) / 1.055, 2.4).toDouble();
  }

  final v = c.toARGB32();
  return 0.2126 * channel((v >> 16) & 0xFF) +
      0.7152 * channel((v >> 8) & 0xFF) +
      0.0722 * channel(v & 0xFF);
}

double _contrast(Color a, Color b) {
  final la = _lum(a);
  final lb = _lum(b);
  final hi = la > lb ? la : lb;
  final lo = la > lb ? lb : la;
  return (hi + 0.05) / (lo + 0.05);
}

void main() {
  test('white stays readable on step 700 for any seed', () {
    for (final seed in [0xFFFFD400, 0xFFE11D48, 0xFF1B46F5, 0xFF136B6B, 0xFF7C3AED]) {
      final ramp = brandRamp(Color(seed));
      expect(_contrast(const Color(0xFFFFFFFF), ramp[700]!), greaterThanOrEqualTo(4.5));
    }
  });

  test('petrol reproduces the brand anchor', () {
    expect(brandRamp(const Color(0xFF136B6B))[700]!.toARGB32(), 0xFF136B6B);
  });

  // Pins the runtime function against the fixture generated in resolve.mjs,
  // the twin's contract with the TypeScript side. If _maxChroma or the
  // ladder drifted from what the build used, this — not a live-rendered
  // gallery — is what would catch it.
  test('matches the golden brandRamp fixture step by step, for every seed', () {
    final golden = jsonDecode(File('../../golden/kasseneck.json').readAsStringSync())
        as Map<String, dynamic>;
    final fixture = golden['brandRamp'] as Map<String, dynamic>;
    expect(fixture.length, 4);

    int argb(String hex) => int.parse('FF${hex.substring(1)}', radix: 16);

    for (final entry in fixture.entries) {
      final seedHex = entry.key;
      final seed = Color(argb(seedHex));
      final ramp = brandRamp(seed);
      final expected = entry.value as Map<String, dynamic>;
      for (final step in expected.entries) {
        expect(
          ramp[int.parse(step.key)]!.toARGB32(),
          argb(step.value as String),
          reason: '$seedHex step ${step.key}',
        );
      }
    }
  });
}
