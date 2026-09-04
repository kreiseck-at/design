import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

/// One drawing command on the 24-unit grid.
sealed class KdOp {
  const KdOp();
  List<Offset> get points;
}

class KdMove extends KdOp {
  const KdMove(this.x, this.y);
  final double x, y;
  @override
  List<Offset> get points => [Offset(x, y)];
  @override
  bool operator ==(Object other) => other is KdMove && other.x == x && other.y == y;
  @override
  int get hashCode => Object.hash(KdMove, x, y);
}

class KdLine extends KdOp {
  const KdLine(this.x, this.y);
  final double x, y;
  @override
  List<Offset> get points => [Offset(x, y)];
  @override
  bool operator ==(Object other) => other is KdLine && other.x == x && other.y == y;
  @override
  int get hashCode => Object.hash(KdLine, x, y);
}

class KdCubic extends KdOp {
  const KdCubic(this.x1, this.y1, this.x2, this.y2, this.x, this.y);
  final double x1, y1, x2, y2, x, y;
  @override
  List<Offset> get points => [Offset(x1, y1), Offset(x2, y2), Offset(x, y)];
  @override
  bool operator ==(Object other) =>
      other is KdCubic && other.x1 == x1 && other.y1 == y1 && other.x2 == x2 && other.y2 == y2 && other.x == x && other.y == y;
  @override
  int get hashCode => Object.hash(KdCubic, x1, y1, x2, y2, x, y);
}

class KdClose extends KdOp {
  const KdClose();
  @override
  List<Offset> get points => const [];
  @override
  bool operator ==(Object other) => other is KdClose;
  @override
  int get hashCode => (KdClose).hashCode;
}

/// Path data of one icon: stroked ops, filled ops, or both.
class KdIconData {
  const KdIconData({this.stroke = const [], this.fill = const []});
  final List<KdOp> stroke;
  final List<KdOp> fill;

  // Value equality, not identity: two icons built from equal ops are the
  // same icon, so a Map keyed on KdIconData (the painters' path cache)
  // dedupes them instead of growing one entry per construction site.
  @override
  bool operator ==(Object other) =>
      other is KdIconData && listEquals(other.stroke, stroke) && listEquals(other.fill, fill);
  @override
  int get hashCode => Object.hash(Object.hashAll(stroke), Object.hashAll(fill));
}

Path _pathOf(List<KdOp> ops) {
  final path = Path();
  for (final op in ops) {
    switch (op) {
      case KdMove(:final x, :final y):
        path.moveTo(x, y);
      case KdLine(:final x, :final y):
        path.lineTo(x, y);
      case KdCubic(:final x1, :final y1, :final x2, :final y2, :final x, :final y):
        path.cubicTo(x1, y1, x2, y2, x, y);
      case KdClose():
        path.close();
    }
  }
  return path;
}

/// The hand of the set: stroke 1.75 at 24, round caps and joins. The paths
/// are built once per icon and cached; painting only scales.
class KdIconPainter extends CustomPainter {
  KdIconPainter(this.data, {required this.color, required this.strokeWidth});
  final KdIconData data;
  final Color color;
  final double strokeWidth;

  static final _strokeCache = <KdIconData, Path>{};
  static final _fillCache = <KdIconData, Path>{};

  /// Number of distinct paths currently cached, for tests: equal
  /// [KdIconData] must hit the same cache entry instead of growing this.
  @visibleForTesting
  static int get debugStrokeCacheSize => _strokeCache.length;
  @visibleForTesting
  static int get debugFillCacheSize => _fillCache.length;

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / 24;
    canvas.save();
    canvas.scale(scale);
    if (data.fill.isNotEmpty) {
      final path = _fillCache.putIfAbsent(data, () => _pathOf(data.fill)..fillType = PathFillType.evenOdd);
      canvas.drawPath(path, Paint()..color = color..style = PaintingStyle.fill);
    }
    if (data.stroke.isNotEmpty) {
      final path = _strokeCache.putIfAbsent(data, () => _pathOf(data.stroke));
      canvas.drawPath(path, Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth / scale
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round);
    }
    canvas.restore();
  }

  @override
  bool shouldRepaint(KdIconPainter old) =>
      old.data != data || old.color != color || old.strokeWidth != strokeWidth;
}

/// An icon of the set. Size and colour fall back to the ambient [IconTheme],
/// so it slots in wherever a Material `Icon` would.
class KdIcon extends StatelessWidget {
  const KdIcon(this.data, {super.key, this.size, this.color, this.semanticLabel});
  final KdIconData data;
  final double? size;
  final Color? color;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final theme = IconTheme.of(context);
    var s = size ?? theme.size ?? 24;
    if (theme.applyTextScaling == true) {
      s = MediaQuery.textScalerOf(context).scale(s);
    }
    var c = color ?? theme.color ?? const Color(0xFF000000);
    final opacity = theme.opacity ?? 1;
    // Only touch the colour when the theme actually dims it: withValues
    // always returns a plain Color, so calling it unconditionally would
    // silently turn a MaterialColor (or any other Color subtype) opaque
    // callers pass in into a plain one even when nothing changed.
    if (opacity != 1) c = c.withValues(alpha: c.a * opacity);
    return Semantics(
      label: semanticLabel,
      excludeSemantics: semanticLabel == null,
      child: SizedBox(
        width: s,
        height: s,
        child: CustomPaint(painter: KdIconPainter(data, color: c, strokeWidth: 1.75 * s / 24)),
      ),
    );
  }
}

/// The Kreiseck mark: an open frame with a solid square in the lower-right
/// corner. Two colours, so it is not a [KdIcon]. Defaults: frame in the
/// ambient icon colour, square in the brand colour.
///
/// Geometry of the Kasseneck mark on the 24-unit grid: the mark fills the
/// whole box, no margin. Frame is drawn as four rects —
/// top, right, left and bottom bar — and the square sits in the notch they
/// leave open at the lower-right.
class KdSignetPainter extends CustomPainter {
  KdSignetPainter({required this.frame, required this.square});
  final Color frame;
  final Color square;

  @override
  void paint(Canvas canvas, Size size) {
    final u = size.width / 24;
    final framePaint = Paint()..color = frame;
    canvas.drawRect(Rect.fromLTWH(0 * u, 0 * u, 24 * u, 3 * u), framePaint);
    canvas.drawRect(Rect.fromLTWH(21 * u, 0 * u, 3 * u, 15 * u), framePaint);
    canvas.drawRect(Rect.fromLTWH(0 * u, 3 * u, 3 * u, 21 * u), framePaint);
    canvas.drawRect(Rect.fromLTWH(0 * u, 21 * u, 15 * u, 3 * u), framePaint);
    canvas.drawRect(Rect.fromLTWH(15 * u, 15 * u, 9 * u, 9 * u), Paint()..color = square);
  }

  @override
  bool shouldRepaint(KdSignetPainter old) => old.frame != frame || old.square != square;
}

class KdSignet extends StatelessWidget {
  const KdSignet({super.key, this.size = 40, this.frame, this.square});
  final double size;
  final Color? frame;
  final Color? square;

  @override
  Widget build(BuildContext context) {
    final f = frame ?? IconTheme.of(context).color ?? const Color(0xFF000000);
    final q = square ?? Theme.of(context).colorScheme.primary;
    return SizedBox(width: size, height: size, child: CustomPaint(painter: KdSignetPainter(frame: f, square: q)));
  }
}
