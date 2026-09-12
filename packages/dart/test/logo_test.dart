import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kreiseck_design/kreiseck_design.dart';

Future<List<int>> raster(CustomPainter painter, int px) async {
  final recorder = ui.PictureRecorder();
  final canvas = ui.Canvas(recorder);
  canvas.drawRect(Rect.fromLTWH(0, 0, px.toDouble(), px.toDouble()), Paint()..color = Colors.white);
  painter.paint(canvas, Size(px.toDouble(), px.toDouble()));
  final image = await recorder.endRecording().toImage(px, px);
  final bytes = await image.toByteData(format: ui.ImageByteFormat.rawRgba);
  return bytes!.buffer.asUint8List();
}

void main() {
  late Map<String, dynamic> golden;
  setUpAll(() {
    golden = (jsonDecode(File('../../golden/kasseneck.json').readAsStringSync()) as Map<String, dynamic>)['logo'] as Map<String, dynamic>;
  });

  group('geometry', () {
    test('32 cells on the 8×8 grid, 23 frame and 9 corner, as in the golden', () {
      expect(KdLogoData.grid, 8);
      expect(KdLogoData.cells.length, kdLogoCellCount);
      expect(KdLogoData.cells.where((c) => c.part == KdLogoPart.frame).length, 23);
      expect(KdLogoData.cells.where((c) => c.part == KdLogoPart.corner).length, 9);
      final expected = (golden['cells'] as List).cast<Map<String, dynamic>>();
      for (var i = 0; i < expected.length; i++) {
        final c = KdLogoData.cells[i];
        expect(c.index, i);
        expect([c.row, c.col, c.part.name], [expected[i]['row'], expected[i]['col'], expected[i]['part']]);
      }
    });
    test('nine glyphs spelling Kasseneck with the golden bounds', () {
      expect(KdLogoData.glyphs.map((g) => g.char).join(), 'Kasseneck');
      expect(KdLogoData.glyphs.length, kdLogoGlyphCount);
      final expected = (golden['glyphs'] as List).cast<Map<String, dynamic>>();
      for (var i = 0; i < expected.length; i++) {
        final b = expected[i]['bbox'] as Map<String, dynamic>;
        expect(KdLogoData.glyphs[i].bounds.left, closeTo((b['x'] as num).toDouble(), 1e-6));
        expect(KdLogoData.glyphs[i].bounds.width, closeTo((b['width'] as num).toDouble(), 1e-6));
      }
      expect(KdLogoData.width, (golden['width'] as num).toDouble());
    });
    test('the cells cover the paths: painted as cells or as paths, the pixels are the same', () async {
      // At multiples of 8 px every cell edge lands on a pixel edge, so the
      // two ways of painting the same area must agree byte for byte.
      for (final px in [48, 96, 160]) {
        final paths = await raster(KdSignetPainter(ink: Colors.black, accent: Colors.teal), px);
        final cells = await raster(KdSignetPainter(ink: Colors.black, accent: Colors.teal, alwaysCells: true), px);
        expect(cells, equals(paths), reason: '$px px');
      }
    });
    test('pixel art: the heart lights 32 fields while the mark is hidden; at rest nothing is drawn', () async {
      final mid = kdSampleLogo(KdLogoAnimations.heart, 0.4);
      expect(mid.cells.every((c) => c.opacity == 0), isTrue);
      expect(mid.pixels.where((p) => p.opacity > 0).length, 32);
      final blank = await raster(KdSignetPainter(ink: Colors.black, accent: Colors.teal, cells: mid.cells), 48);
      final art = await raster(KdSignetPainter(ink: Colors.black, accent: Colors.teal, cells: mid.cells, pixels: mid.pixels), 48);
      expect(art, isNot(equals(blank)));
      final rest = kdSampleLogo(KdLogoAnimations.heart, 1);
      final paths = await raster(KdSignetPainter(ink: Colors.black, accent: Colors.teal), 48);
      final withLayer = await raster(KdSignetPainter(ink: Colors.black, accent: Colors.teal, cells: rest.cells, pixels: rest.pixels), 48);
      expect(withLayer, equals(paths));
    });
    test('the parity test bites: one cell dropped changes the raster', () async {
      final full = await raster(KdSignetPainter(ink: Colors.black, accent: Colors.teal, alwaysCells: true), 48);
      final styles = List<KdLogoStyle>.filled(kdLogoCellCount, KdLogoStyle.rest);
      styles[0] = const KdLogoStyle(opacity: 0);
      final missing = await raster(KdSignetPainter(ink: Colors.black, accent: Colors.teal, cells: styles), 48);
      expect(missing, isNot(equals(full)));
    });
  });

  group('widgets', () {
    testWidgets('KdSignet takes frame and square colours and its size', (tester) async {
      await tester.pumpWidget(const MaterialApp(home: Center(child: KdSignet(size: 48, frame: Colors.black, square: Colors.teal))));
      final painter = tester.widget<CustomPaint>(find.descendant(of: find.byType(KdSignet), matching: find.byType(CustomPaint))).painter as KdSignetPainter;
      expect(painter.ink, Colors.black);
      expect(painter.accent, Colors.teal);
      expect(tester.getSize(find.byType(KdSignet)), const Size(48, 48));
    });
    testWidgets('KdSignet defaults to the icon colour and the brand colour', (tester) async {
      await tester.pumpWidget(MaterialApp(
        theme: ThemeData(colorScheme: const ColorScheme.light(primary: Color(0xFF136B6B))),
        home: const IconTheme(data: IconThemeData(color: Color(0xFF132A2A)), child: Center(child: KdSignet())),
      ));
      final painter = tester.widget<CustomPaint>(find.descendant(of: find.byType(KdSignet), matching: find.byType(CustomPaint))).painter as KdSignetPainter;
      expect(painter.ink, const Color(0xFF132A2A));
      expect(painter.accent, const Color(0xFF136B6B));
    });
    testWidgets('KdLogo is 332/48 as wide as it is tall; KdWordmark starts at the text origin', (tester) async {
      await tester.pumpWidget(const MaterialApp(home: Column(children: [KdLogo(height: 48), KdWordmark(height: 48)])));
      expect(tester.getSize(find.byType(KdLogo)), const Size(332, 48));
      expect(tester.getSize(find.byType(KdWordmark)), const Size(332 - 69, 48));
      expect(find.bySemanticsLabel('Kasseneck'), findsOneWidget);
    });
    testWidgets('KdLogoMotion plays to the end and reports it; a looping animation repeats', (tester) async {
      var done = 0;
      await tester.pumpWidget(MaterialApp(home: Center(child: KdLogoMotion(animation: KdLogoAnimations.rain, onDone: () => done++))));
      final state = tester.state<KdLogoMotionState>(find.byType(KdLogoMotion));
      expect(state.controller.isAnimating, isTrue);
      await tester.pump(const Duration(milliseconds: 750));
      final mid = tester.widget<KdLogo>(find.byType(KdLogo));
      expect(mid.cells!.any((s) => !s.isRest) || mid.glyphs!.any((s) => !s.isRest), isTrue);
      await tester.pumpAndSettle();
      expect(done, 1);
      expect(tester.widget<KdLogo>(find.byType(KdLogo)).glyphs!.every((s) => s.isRest), isTrue);

      await tester.pumpWidget(const MaterialApp(home: Center(child: KdLogoMotion(animation: KdLogoAnimations.breathe, wordmark: false))));
      await tester.pump(const Duration(seconds: 5));
      expect(tester.state<KdLogoMotionState>(find.byType(KdLogoMotion)).controller.isAnimating, isTrue);
      expect(find.byType(KdSignet), findsOneWidget);
      expect(find.byType(KdLogo), findsNothing);
    });
    testWidgets('an animation that names a colour role is drawn in it, light and dark; a given highlight wins', (tester) async {
      Color highlight() => (tester.widget<CustomPaint>(find.descendant(of: find.byType(KdLogo), matching: find.byType(CustomPaint))).painter as KdLogoPainter).highlight;
      // A fresh key per case: MaterialApp eases one theme into the next, so
      // reusing the tree would read a colour still on its way.
      var run = 0;
      Future<void> show(KdMode mode, Widget motion) => tester.pumpWidget(MaterialApp(key: ValueKey(run++), theme: kdTheme(mode), home: Center(child: motion)));

      // The expected colour is read from the animation itself: which role it
      // names is the data's business, not this test's.
      for (final a in [KdLogoAnimations.error, KdLogoAnimations.confirm]) {
        for (final mode in [KdMode.light, KdMode.dark]) {
          await show(mode, KdLogoMotion(animation: a));
          expect(highlight(), kdColor(mode, a.highlight!), reason: '${a.name} in $mode');
        }
      }

      // An animation with no role keeps the light petrol.
      await show(KdMode.light, const KdLogoMotion(animation: KdLogoAnimations.rain));
      expect(highlight(), kdLogoHighlight);

      // What the caller passes is what gets drawn.
      await show(KdMode.dark, const KdLogoMotion(animation: KdLogoAnimations.error, highlight: Color(0xFF00FF00)));
      expect(highlight(), const Color(0xFF00FF00));
      await tester.pumpAndSettle();
    });

    testWidgets('golden: the logo at rest, 96 tall on paper', (tester) async {
      await tester.pumpWidget(const MaterialApp(home: ColoredBox(
        color: Color(0xFFF6F8F8),
        child: Center(child: KdLogo(height: 96, ink: Color(0xFF0F2B33), accent: Color(0xFF116B6B))),
      )));
      await expectLater(find.byType(KdLogo), matchesGoldenFile('goldens/logo.png'));
    });
  });
}
