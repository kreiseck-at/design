import 'dart:math' as math;
import 'dart:ui' show Color;

const _steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const _ladder = [0.972, 0.94, 0.884, 0.812, 0.73, 0.648, 0.566, 0.48, 0.4, 0.325, 0.25];
const _profile = [0.1, 0.18, 0.36, 0.58, 0.8, 1.0, 0.98, 0.88, 0.74, 0.56, 0.42];
const _maxChroma = 0.2;

double _srgbToLinear(int c) {
  final v = c / 255;
  return v <= 0.04045 ? v / 12.92 : math.pow((v + 0.055) / 1.055, 2.4).toDouble();
}

double _linearToSrgb(double c) {
  final v = c <= 0.0031308 ? 12.92 * c : 1.055 * math.pow(c, 1 / 2.4) - 0.055;
  return v.clamp(0.0, 1.0).toDouble();
}

List<double> _toOklch(Color seed) {
  final argb = seed.toARGB32();
  final r = _srgbToLinear((argb >> 16) & 0xFF);
  final g = _srgbToLinear((argb >> 8) & 0xFF);
  final b = _srgbToLinear(argb & 0xFF);
  final l = math.pow(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b, 1 / 3).toDouble();
  final m = math.pow(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b, 1 / 3).toDouble();
  final s = math.pow(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b, 1 / 3).toDouble();
  final a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  final bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  final hue = (math.atan2(bb, a) * 180 / math.pi + 360) % 360;
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    math.sqrt(a * a + bb * bb),
    hue,
  ];
}

List<double> _toRgb(double lightness, double chroma, double hue) {
  final a = chroma * math.cos(hue * math.pi / 180);
  final b = chroma * math.sin(hue * math.pi / 180);
  final l = math.pow(lightness + 0.3963377774 * a + 0.2158037573 * b, 3).toDouble();
  final m = math.pow(lightness - 0.1055613458 * a - 0.0638541728 * b, 3).toDouble();
  final s = math.pow(lightness - 0.0894841775 * a - 1.291485548 * b, 3).toDouble();
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

bool _inGamut(double l, double c, double h) =>
    _toRgb(l, c, h).every((v) => v >= -0.0001 && v <= 1.0001);

Color _fromOklch(double l, double c, double h) {
  var chroma = c;
  if (!_inGamut(l, chroma, h)) {
    var lo = 0.0;
    var hi = chroma;
    for (var i = 0; i < 40; i++) {
      final mid = (lo + hi) / 2;
      if (_inGamut(l, mid, h)) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    chroma = lo;
  }
  final rgb = _toRgb(l, chroma, h).map((v) => (_linearToSrgb(v) * 255).round()).toList();
  return Color.fromARGB(255, rgb[0], rgb[1], rgb[2]);
}

/// The twin of `brandRamp` in the npm package: same ladder, same profile,
/// same eleven values for the same input.
Map<int, Color> brandRamp(Color seed) {
  final oklch = _toOklch(seed);
  final chroma = math.min(oklch[1] / 0.88, _maxChroma);
  final ramp = <int, Color>{};
  for (var i = 0; i < _steps.length; i++) {
    ramp[_steps[i]] = _fromOklch(_ladder[i], chroma * _profile[i], oklch[2]);
  }
  return ramp;
}
