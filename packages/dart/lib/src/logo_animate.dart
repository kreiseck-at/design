import 'dart:math' as math;
import 'dart:ui';

import 'icon.dart';

/// Runtime of the logo animations — a line-by-line mirror of
/// tools/logo-animate.mjs. The golden fixture samples every animation through
/// the JavaScript reference; `logo_test.dart` replays them through this file,
/// so a change here that the reference does not share fails the build.

enum KdLogoPart { frame, corner }

/// One filled cell of the mark on the 8×8 grid.
class KdLogoCell {
  const KdLogoCell(this.index, this.row, this.col, this.part);
  final int index;
  final int row;
  final int col;
  final KdLogoPart part;
}

/// One glyph of the wordmark as an outline in the logo box.
class KdLogoGlyph {
  const KdLogoGlyph(this.char, {required this.bounds, required this.ops});
  final String char;
  final Rect bounds;
  final List<KdOp> ops;
}

enum KdLogoTarget { cell, glyph, pixel }

enum KdLogoHold { hold, none }

enum KdEasing { linear, step, inSine, outSine, inOutSine, inCubic, outCubic, inOutCubic, inBack, outBack, outBounce }

/// Per-element state. `dx`/`dy` in cells (1/8 of the mark), `scale` around
/// the element's centre, `tint` 0..1 toward the highlight colour.
class KdLogoStyle {
  const KdLogoStyle({this.opacity = 1, this.scale = 1, this.dx = 0, this.dy = 0, this.tint = 0, this.accent = 0});
  final double opacity;
  final double scale;
  final double dx;
  final double dy;
  final double tint;
  /// 0..1 toward the brand petrol, the corner's colour.
  final double accent;

  static const rest = KdLogoStyle();

  /// A pixel at rest is not there.
  static const restPixel = KdLogoStyle(opacity: 0);
  bool get isRest => opacity == 1 && scale == 1 && dx == 0 && dy == 0 && tint == 0 && accent == 0;

  KdLogoStyle copyWith({double? opacity, double? scale, double? dx, double? dy, double? tint, double? accent}) => KdLogoStyle(
        opacity: opacity ?? this.opacity,
        scale: scale ?? this.scale,
        dx: dx ?? this.dx,
        dy: dy ?? this.dy,
        tint: tint ?? this.tint,
        accent: accent ?? this.accent,
      );

  @override
  bool operator ==(Object other) =>
      other is KdLogoStyle && other.opacity == opacity && other.scale == scale && other.dx == dx && other.dy == dy && other.tint == tint && other.accent == accent;
  @override
  int get hashCode => Object.hash(opacity, scale, dx, dy, tint, accent);
  @override
  String toString() => 'KdLogoStyle(opacity: $opacity, scale: $scale, dx: $dx, dy: $dy, tint: $tint, accent: $accent)';
}

class KdLogoKeyframe {
  const KdLogoKeyframe(this.at, {this.opacity, this.scale, this.dx, this.dy, this.tint, this.accent, this.move});
  final double at;
  final double? opacity;
  final double? scale;
  final double? dx;
  final double? dy;
  final double? tint;
  final double? accent;
  /// 0..1 along the track's vector.
  final double? move;

  double? operator [](int prop) => switch (prop) { 0 => opacity, 1 => scale, 2 => dx, 3 => dy, 4 => tint, 5 => accent, _ => move };
}

const _propCount = 6;
const _propMove = 6;

class KdLogoTrack {
  const KdLogoTrack({
    required this.kind,
    required this.indices,
    this.shuffle = false,
    this.vectors,
    required this.start,
    required this.stagger,
    required this.duration,
    required this.easing,
    required this.wrap,
    required this.before,
    required this.after,
    required this.keyframes,
  });
  final KdLogoTarget kind;
  final List<int> indices;
  /// Draw a fresh order from the seed each run.
  final bool shuffle;
  /// Per element (aligned with [indices]): where `move` 1 takes it, in cells.
  final List<Offset>? vectors;
  final double start;
  final double stagger;
  final double duration;
  final KdEasing easing;
  final bool wrap;
  final KdLogoHold before;
  final KdLogoHold after;
  final List<KdLogoKeyframe> keyframes;
}

class KdLogoAnimation {
  const KdLogoAnimation({
    required this.name,
    required this.label,
    required this.scenario,
    required this.duration,
    required this.loop,
    required this.tracks,
  });
  final String name;
  final String label;
  final String scenario;
  /// Milliseconds.
  final double duration;
  final bool loop;
  final List<KdLogoTrack> tracks;
}

const kdLogoCellCount = 32;
const kdLogoGlyphCount = 9;

/// All fields of the 8×8: a pixel layer for art before the mark forms.
const kdLogoPixelCount = 64;
const _back = 1.70158;

int _imul(int a, int b) {
  // 32-bit multiply with every intermediate below 2^53 — exact on Flutter web.
  final al = a & 0xffff, ah = a >> 16, bl = b & 0xffff, bh = b >> 16;
  return ((al * bl) + (((ah * bl + al * bh) & 0xffff) << 16)) & 0xffffffff;
}

/// mulberry32, bit for bit the runtime's `rng`: the same seed shuffles the
/// same order here and on the web.
double Function() kdRng(int seed) {
  var a = seed & 0xffffffff;
  return () {
    a = (a + 0x6d2b79f5) & 0xffffffff;
    var t = a;
    t = _imul(t ^ (t >> 15), t | 1);
    t = (t ^ ((t + _imul(t ^ (t >> 7), t | 61)) & 0xffffffff)) & 0xffffffff;
    return ((t ^ (t >> 14)) & 0xffffffff) / 4294967296;
  };
}

/// Fisher–Yates with [kdRng].
List<int> kdShuffle(List<int> list, int seed) {
  final next = kdRng(seed);
  final out = [...list];
  for (var i = out.length - 1; i > 0; i--) {
    final j = (next() * (i + 1)).floor();
    final tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

double kdEase(KdEasing e, double u) {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  switch (e) {
    case KdEasing.linear:
      return u;
    case KdEasing.step:
      return u < 1 ? 0 : 1;
    case KdEasing.inSine:
      return 1 - math.cos((u * math.pi) / 2);
    case KdEasing.outSine:
      return math.sin((u * math.pi) / 2);
    case KdEasing.inOutSine:
      return -(math.cos(math.pi * u) - 1) / 2;
    case KdEasing.inCubic:
      return u * u * u;
    case KdEasing.outCubic:
      return 1 - math.pow(1 - u, 3).toDouble();
    case KdEasing.inOutCubic:
      return u < 0.5 ? 4 * u * u * u : 1 - math.pow(-2 * u + 2, 3) / 2;
    case KdEasing.inBack:
      return (_back + 1) * u * u * u - _back * u * u;
    case KdEasing.outBack:
      return 1 + (_back + 1) * math.pow(u - 1, 3) + _back * math.pow(u - 1, 2);
    case KdEasing.outBounce:
      const n = 7.5625, d = 2.75;
      if (u < 1 / d) return n * u * u;
      if (u < 2 / d) {
        final v = u - 1.5 / d;
        return n * v * v + 0.75;
      }
      if (u < 2.5 / d) {
        final v = u - 2.25 / d;
        return n * v * v + 0.9375;
      }
      final v = u - 2.625 / d;
      return n * v * v + 0.984375;
  }
}

double? _valueAt(List<KdLogoKeyframe> keyframes, int prop, double e) {
  KdLogoKeyframe? lo, hi;
  for (final k in keyframes) {
    if (k[prop] == null) continue;
    if (k.at <= e) lo = k;
    if (k.at >= e && hi == null) hi = k;
  }
  if (lo == null && hi == null) return null;
  if (lo == null) return hi![prop];
  if (hi == null || identical(hi, lo) || hi.at == lo.at) return lo[prop];
  final f = (e - lo.at) / (hi.at - lo.at);
  return lo[prop]! + (hi[prop]! - lo[prop]!) * f;
}

class KdLogoSample {
  const KdLogoSample(this.cells, this.glyphs, this.pixels);
  final List<KdLogoStyle> cells;
  final List<KdLogoStyle> glyphs;
  final List<KdLogoStyle> pixels;

  /// The twin contract: value × 1000 rounded like JavaScript's Math.round,
  /// cells, glyphs, then pixels, opacity/scale/dx/dy/tint/accent.
  List<int> flatten() => [
        for (final s in [...cells, ...glyphs, ...pixels])
          for (final v in [s.opacity, s.scale, s.dx, s.dy, s.tint, s.accent]) (v * 1000 + 0.5).floor(),
      ];
}

/// Style of every cell and glyph at [t] (0..1 of the animation's duration; a
/// looping animation may be sampled beyond 1). A track marked `shuffle`
/// plays in an order drawn from [seed]; players draw one per run.
KdLogoSample kdSampleLogo(KdLogoAnimation anim, double t, {int seed = 0}) {
  final cells = List<KdLogoStyle>.filled(kdLogoCellCount, KdLogoStyle.rest);
  final glyphs = List<KdLogoStyle>.filled(kdLogoGlyphCount, KdLogoStyle.rest);
  final pixels = List<KdLogoStyle>.filled(kdLogoPixelCount, KdLogoStyle.restPixel);
  final T = t * anim.duration;
  for (var ti = 0; ti < anim.tracks.length; ti++) {
    final track = anim.tracks[ti];
    final targets = switch (track.kind) { KdLogoTarget.cell => cells, KdLogoTarget.glyph => glyphs, KdLogoTarget.pixel => pixels };
    // Shuffling permutes play positions; a vector stays with its element.
    final positions = track.shuffle ? kdShuffle(List.generate(track.indices.length, (i) => i), (seed + ti * 0x9e3779b9) & 0xffffffff) : null;
    for (var i = 0; i < track.indices.length; i++) {
      final at = positions == null ? i : positions[i];
      final index = track.indices[at];
      var local = T - track.start - i * track.stagger;
      if (track.wrap) local = ((local % anim.duration) + anim.duration) % anim.duration;
      if (local < 0 && track.before == KdLogoHold.none) continue;
      // End exclusive: a still that ends where the next begins never shows both.
      if (local >= track.duration && track.after == KdLogoHold.none) continue;
      final u = track.duration <= 0 ? (local < 0 ? 0.0 : 1.0) : math.min(1.0, math.max(0.0, local / track.duration));
      final e = kdEase(track.easing, u);
      var style = targets[index];
      for (var prop = 0; prop < _propCount; prop++) {
        final v = _valueAt(track.keyframes, prop, e);
        if (v == null) continue;
        style = switch (prop) {
          0 => style.copyWith(opacity: v),
          1 => style.copyWith(scale: v),
          2 => style.copyWith(dx: v),
          3 => style.copyWith(dy: v),
          4 => style.copyWith(tint: v),
          _ => style.copyWith(accent: v),
        };
      }
      if (track.vectors != null) {
        final m = _valueAt(track.keyframes, _propMove, e);
        if (m != null) style = style.copyWith(dx: style.dx + m * track.vectors![at].dx, dy: style.dy + m * track.vectors![at].dy);
      }
      targets[index] = style;
    }
  }
  return KdLogoSample(cells, glyphs, pixels);
}
