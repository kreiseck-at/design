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
}
