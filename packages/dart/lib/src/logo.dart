import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import 'icon.dart';
import 'logo_animate.dart';
import 'logo_data.dart';
import 'sound.dart';
import 'theme.dart';
import 'tokens.dart';

/// The Kasseneck logo drawn from geometry: no asset, no font. At rest the
/// mark is painted as the three brand paths (byte for byte the brand file)
/// and the wordmark as Archivo 600 outlines — the same pixels as the SVG. Only
/// while a cell or glyph style departs from rest does the painter switch to
/// per-element drawing, so anti-aliasing seams between cells never show on a
/// static logo.
///
/// Colours: `ink` carries frame and wordmark, `accent` the corner, and
/// `highlight` is what a tinted cell or glyph blends toward — a light petrol
/// by default, because ink and brand petrol are both too dark to read as a
/// running light against each other.

/// Default of `highlight`.
const Color kdLogoHighlight = Color(0xFF139E9B);

Color _mix(Color a, Color b, double t) => t <= 0 ? a : t >= 1 ? b : Color.lerp(a, b, t)!;

/// Element colour: its base, blended toward the brand petrol by `accent`, then toward the highlight by `tint`.
Color _paint(Color base, Color accent, Color highlight, KdLogoStyle s) => _mix(_mix(base, accent, s.accent), highlight, s.tint);

Color _withOpacity(Color c, double opacity) => opacity >= 1 ? c : c.withValues(alpha: c.a * opacity.clamp(0, 1));

bool _allRest(List<KdLogoStyle>? styles) => styles == null || styles.every((s) => s.isRest);
bool _noPixels(List<KdLogoStyle>? pixels) => pixels == null || pixels.every((s) => s.opacity <= 0 || s.scale <= 0);

final _pathCache = <List<KdOp>, Path>{};
Path _path(List<KdOp> ops) => _pathCache.putIfAbsent(ops, () => kdPathOf(ops)..fillType = PathFillType.evenOdd);

/// Paints the mark into a 48-unit box scaled by [scale] at [origin].
void paintSignet(Canvas canvas, {required Offset origin, required double scale, required Color ink, required Color accent, Color highlight = kdLogoHighlight, List<KdLogoStyle>? cells, List<KdLogoStyle>? pixels, bool alwaysCells = false}) {
  canvas.save();
  canvas.translate(origin.dx, origin.dy);
  canvas.scale(scale);
  if (!alwaysCells && _allRest(cells)) {
    final inkPaint = Paint()..color = ink;
    for (final ops in KdLogoData.frame) canvas.drawPath(_path(ops), inkPaint);
    canvas.drawPath(_path(KdLogoData.corner), Paint()..color = accent);
  } else {
    const u = KdLogoData.unit;
    for (final cell in KdLogoData.cells) {
      final s = cells == null ? KdLogoStyle.rest : cells[cell.index];
      if (s.opacity <= 0 || s.scale <= 0) continue;
      final base = _paint(cell.part == KdLogoPart.frame ? ink : accent, accent, highlight, s);
      final cx = (cell.col + 0.5) * u + s.dx * u, cy = (cell.row + 0.5) * u + s.dy * u;
      final half = u * s.scale / 2;
      canvas.drawRect(Rect.fromLTRB(cx - half, cy - half, cx + half, cy + half), Paint()..color = _withOpacity(base, s.opacity));
    }
  }
  if (!_noPixels(pixels)) {
    const u = KdLogoData.unit;
    for (var i = 0; i < pixels!.length; i++) {
      final s = pixels[i];
      if (s.opacity <= 0 || s.scale <= 0) continue;
      final cx = (i % KdLogoData.grid + 0.5) * u + s.dx * u, cy = (i ~/ KdLogoData.grid + 0.5) * u + s.dy * u;
      final half = u * s.scale / 2;
      canvas.drawRect(Rect.fromLTRB(cx - half, cy - half, cx + half, cy + half), Paint()..color = _withOpacity(_paint(ink, accent, highlight, s), s.opacity));
    }
  }
  canvas.restore();
}

/// Paints the wordmark glyphs in logo-box coordinates (x from 69) scaled by
/// [scale] at [origin]; [shift] moves the box left, e.g. −69 for a wordmark
/// that starts at its own edge.
void paintWordmark(Canvas canvas, {required Offset origin, required double scale, required Color ink, required Color accent, Color highlight = kdLogoHighlight, List<KdLogoStyle>? glyphs, double shift = 0}) {
  canvas.save();
  canvas.translate(origin.dx, origin.dy);
  canvas.scale(scale);
  canvas.translate(shift, 0);
  if (_allRest(glyphs)) {
    final paint = Paint()..color = ink;
    for (final g in KdLogoData.glyphs) canvas.drawPath(_path(g.ops), paint);
  } else {
    const u = KdLogoData.unit;
    for (var i = 0; i < KdLogoData.glyphs.length; i++) {
      final g = KdLogoData.glyphs[i];
      final s = glyphs![i];
      if (s.opacity <= 0 || s.scale <= 0) continue;
      final c = g.bounds.center;
      canvas.save();
      canvas.translate(c.dx + s.dx * u, c.dy + s.dy * u);
      canvas.scale(s.scale);
      canvas.translate(-c.dx, -c.dy);
      canvas.drawPath(_path(g.ops), Paint()..color = _withOpacity(_paint(ink, accent, highlight, s), s.opacity));
      canvas.restore();
    }
  }
  canvas.restore();
}

class KdSignetPainter extends CustomPainter {
  KdSignetPainter({required this.ink, required this.accent, this.highlight = kdLogoHighlight, this.cells, this.pixels, this.alwaysCells = false});
  final Color ink;
  final Color accent;
  final Color highlight;
  final List<KdLogoStyle>? cells;
  final List<KdLogoStyle>? pixels;
  @visibleForTesting
  final bool alwaysCells;

  @override
  void paint(Canvas canvas, Size size) =>
      paintSignet(canvas, origin: Offset.zero, scale: size.width / 48, ink: ink, accent: accent, highlight: highlight, cells: cells, pixels: pixels, alwaysCells: alwaysCells);

  @override
  bool shouldRepaint(KdSignetPainter old) =>
      old.ink != ink || old.accent != accent || old.highlight != highlight || old.alwaysCells != alwaysCells || !listEquals(old.cells, cells) || !listEquals(old.pixels, pixels);
}

class KdLogoPainter extends CustomPainter {
  KdLogoPainter({required this.ink, required this.accent, this.highlight = kdLogoHighlight, this.cells, this.glyphs, this.pixels});
  final Color ink;
  final Color accent;
  final Color highlight;
  final List<KdLogoStyle>? cells;
  final List<KdLogoStyle>? glyphs;
  final List<KdLogoStyle>? pixels;

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.height / KdLogoData.height;
    paintSignet(canvas, origin: Offset.zero, scale: scale, ink: ink, accent: accent, highlight: highlight, cells: cells, pixels: pixels);
    paintWordmark(canvas, origin: Offset.zero, scale: scale, ink: ink, accent: accent, highlight: highlight, glyphs: glyphs);
  }

  @override
  bool shouldRepaint(KdLogoPainter old) =>
      old.ink != ink || old.accent != accent || old.highlight != highlight || !listEquals(old.cells, cells) || !listEquals(old.glyphs, glyphs) || !listEquals(old.pixels, pixels);
}

class KdWordmarkPainter extends CustomPainter {
  KdWordmarkPainter({required this.ink, required this.accent, this.highlight = kdLogoHighlight, this.glyphs});
  final Color ink;
  final Color accent;
  final Color highlight;
  final List<KdLogoStyle>? glyphs;

  @override
  void paint(Canvas canvas, Size size) => paintWordmark(canvas,
      origin: Offset.zero, scale: size.height / KdLogoData.height, ink: ink, accent: accent, highlight: highlight, glyphs: glyphs, shift: -kdWordmarkStart);

  @override
  bool shouldRepaint(KdWordmarkPainter old) => old.ink != ink || old.accent != accent || old.highlight != highlight || !listEquals(old.glyphs, glyphs);
}

/// Where the wordmark starts in the logo box (the text origin of the brand file).
const double kdWordmarkStart = 69;

/// Width of the wordmark alone, in logo-box units.
const double kdWordmarkWidth = KdLogoData.width - kdWordmarkStart;

({Color ink, Color accent}) _colours(BuildContext context, Color? ink, Color? accent) => (
      ink: ink ?? IconTheme.of(context).color ?? const Color(0xFF000000),
      accent: accent ?? Theme.of(context).colorScheme.primary,
    );

/// The mark alone. Defaults: frame in the ambient icon colour, corner in the
/// brand colour. [cells] (32 styles, see [kdSampleLogo]) animates it.
class KdSignet extends StatelessWidget {
  const KdSignet({super.key, this.size = 40, this.frame, this.square, this.highlight = kdLogoHighlight, this.cells, this.pixels, this.semanticLabel});
  final double size;
  final Color? frame;
  final Color? square;
  final Color highlight;
  final List<KdLogoStyle>? cells;
  /// 64 styles for the pixel layer, invisible at rest.
  final List<KdLogoStyle>? pixels;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final c = _colours(context, frame, square);
    return Semantics(
      label: semanticLabel,
      excludeSemantics: semanticLabel == null,
      child: SizedBox(width: size, height: size, child: CustomPaint(painter: KdSignetPainter(ink: c.ink, accent: c.accent, highlight: highlight, cells: cells, pixels: pixels))),
    );
  }
}

/// The wordmark alone, [height] tall (the logo box height; the letters are
/// 53/48 of it in cap size).
class KdWordmark extends StatelessWidget {
  const KdWordmark({super.key, this.height = 28, this.ink, this.accent, this.highlight = kdLogoHighlight, this.glyphs});
  final double height;
  final Color? ink;
  final Color? accent;
  final Color highlight;
  final List<KdLogoStyle>? glyphs;

  @override
  Widget build(BuildContext context) {
    final c = _colours(context, ink, accent);
    final scale = height / KdLogoData.height;
    return SizedBox(
      width: kdWordmarkWidth * scale,
      height: height,
      child: CustomPaint(painter: KdWordmarkPainter(ink: c.ink, accent: c.accent, highlight: highlight, glyphs: glyphs)),
    );
  }
}

/// Mark and wordmark side by side, [height] tall, 332/48 as wide.
class KdLogo extends StatelessWidget {
  const KdLogo({super.key, this.height = 28, this.ink, this.accent, this.highlight = kdLogoHighlight, this.cells, this.glyphs, this.pixels, this.semanticLabel = 'Kasseneck'});
  final double height;
  final Color? ink;
  final Color? accent;
  final Color highlight;
  final List<KdLogoStyle>? cells;
  final List<KdLogoStyle>? glyphs;
  final List<KdLogoStyle>? pixels;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final c = _colours(context, ink, accent);
    final scale = height / KdLogoData.height;
    return Semantics(
      label: semanticLabel,
      excludeSemantics: semanticLabel == null,
      child: SizedBox(
        width: KdLogoData.width * scale,
        height: height,
        child: CustomPaint(painter: KdLogoPainter(ink: c.ink, accent: c.accent, highlight: highlight, cells: cells, glyphs: glyphs, pixels: pixels)),
      ),
    );
  }
}

/// Plays one of [KdLogoAnimations] on the logo (or the mark alone with
/// [wordmark] false). Looping animations repeat unless [loop] says otherwise;
/// [onDone] fires once a non-looping run ends.
/// The colour a named role has on this surface; the light petrol when the
/// animation names none.
Color _roleColour(BuildContext context, String? role) {
  if (role == null) return kdLogoHighlight;
  final mode = Theme.of(context).brightness == Brightness.dark ? KdMode.dark : KdMode.light;
  return kdColor(mode, role);
}

class KdLogoMotion extends StatefulWidget {
  const KdLogoMotion({
    super.key,
    required this.animation,
    this.height = 28,
    this.wordmark = true,
    this.ink,
    this.accent,
    this.highlight,
    this.loop,
    this.autoplay = true,
    this.onDone,
    this.haptics = false,
    this.hold = false,
    this.onCue,
  });
  final KdLogoAnimation animation;
  final double height;
  final bool wordmark;
  final Color? ink;
  final Color? accent;
  /// What a tinted element blends toward. Left out, an animation that names a
  /// colour role (a confirmation is 'success', an error 'danger') is drawn in
  /// that role for the ambient brightness; any other animation keeps the light
  /// petrol.
  final Color? highlight;
  final bool? loop;
  final bool autoplay;
  final VoidCallback? onDone;
  /// Tap the device at the animation's cues. Off by default.
  final bool haptics;
  /// Stop at the animation's hold point and stay there — the check keeps
  /// standing, the cross keeps showing.
  final bool hold;
  /// Every cue as the playhead passes it — where the sound half belongs: hand
  /// `KdSounds.byName[cue.sound]` to `kdRenderWav` and play the bytes with
  /// whatever the app already uses, so this package stays free of audio.
  final void Function(KdLogoCue cue)? onCue;

  @override
  State<KdLogoMotion> createState() => KdLogoMotionState();
}

class KdLogoMotionState extends State<KdLogoMotion> with SingleTickerProviderStateMixin {
  late final AnimationController controller = AnimationController(vsync: this, duration: Duration(milliseconds: widget.animation.duration.round()));

  /// Where the run ends: the hold point when asked for, otherwise the end.
  double get _stop => widget.hold && widget.animation.hold != null ? widget.animation.hold! / widget.animation.duration : 1;

  // Holding ends the run at the hold point, so it cannot also loop.
  bool get _loops => (widget.loop ?? widget.animation.loop) && _stop == 1;

  /// The order of every shuffled track for this run; a new one per [play].
  int seed = 0;

  /// How many cues of the current round have fired.
  int _fired = 0;

  void _passCues(double ms) {
    final cues = widget.animation.cues;
    while (_fired < cues.length && cues[_fired].at <= ms) {
      final cue = cues[_fired++];
      if (widget.haptics && cue.haptic != null) kdTapHaptic(cue.haptic!);
      widget.onCue?.call(cue);
    }
  }

  @override
  void initState() {
    super.initState();
    controller.addStatusListener((status) {
      if (status == AnimationStatus.completed && !_loops) widget.onDone?.call();
    });
    if (widget.autoplay) play();
  }

  @override
  void didUpdateWidget(KdLogoMotion old) {
    super.didUpdateWidget(old);
    if (old.animation != widget.animation || old.loop != widget.loop || old.hold != widget.hold) {
      controller.duration = Duration(milliseconds: widget.animation.duration.round());
      play();
    }
  }

  /// Starts from the beginning.
  void play() {
    seed = math.Random().nextInt(0x100000000);
    _fired = 0;
    controller.reset();
    if (_loops) {
      controller.repeat();
    } else {
      controller.animateTo(_stop, duration: Duration(milliseconds: (controller.duration!.inMilliseconds * _stop).round()), curve: Curves.linear);
    }
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: controller,
        builder: (context, _) {
          final s = kdSampleLogo(widget.animation, controller.value, seed: seed);
          // A loop arms its cues again every round, so a repeating animation
          // keeps its beat.
          final ms = controller.value * widget.animation.duration;
          if (_fired > 0 && ms < widget.animation.cues[_fired - 1].at) _fired = 0;
          _passCues(ms);
          final signal = widget.highlight ?? _roleColour(context, widget.animation.highlight);
          return widget.wordmark
              ? KdLogo(height: widget.height, ink: widget.ink, accent: widget.accent, highlight: signal, cells: s.cells, glyphs: s.glyphs, pixels: s.pixels)
              : KdSignet(size: widget.height, frame: widget.ink, square: widget.accent, highlight: signal, cells: s.cells, pixels: s.pixels);
        },
      );
}
