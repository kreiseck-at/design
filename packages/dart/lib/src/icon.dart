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
}

class KdLine extends KdOp {
  const KdLine(this.x, this.y);
  final double x, y;
  @override
  List<Offset> get points => [Offset(x, y)];
}

class KdCubic extends KdOp {
  const KdCubic(this.x1, this.y1, this.x2, this.y2, this.x, this.y);
  final double x1, y1, x2, y2, x, y;
  @override
  List<Offset> get points => [Offset(x1, y1), Offset(x2, y2), Offset(x, y)];
}

class KdClose extends KdOp {
  const KdClose();
  @override
  List<Offset> get points => const [];
}

/// Path data of one icon: stroked ops, filled ops, or both.
class KdIconData {
  const KdIconData({this.stroke = const [], this.fill = const []});
  final List<KdOp> stroke;
  final List<KdOp> fill;
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
    final s = size ?? theme.size ?? 24;
    final c = color ?? theme.color ?? const Color(0xFF000000);
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
/// Geometry measured from `assets/signet.svg` (48-grid, scaled to 24): the
/// mark fills the whole box, no margin. Frame is drawn as four rects —
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
