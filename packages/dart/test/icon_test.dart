import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kreiseck_design/kreiseck_design.dart';

void main() {
  test('KdIconData has value equality; equal data hits the same cache entry', () {
    // No `const`: each call must build a genuinely separate instance, so the
    // equality below is real value equality, not the compiler canonicalizing
    // one constant.
    KdIconData build() => KdIconData(stroke: [KdMove(4, 4), KdLine(10, 10), KdClose()]);
    final a = build();
    final b = build();
    expect(identical(a, b), isFalse, reason: 'the two icon data below are separately constructed');
    expect(a, equals(b));
    expect(a.hashCode, equals(b.hashCode));

    final before = KdIconPainter.debugStrokeCacheSize;
    final canvas = ui.Canvas(ui.PictureRecorder());
    KdIconPainter(a, color: Colors.black, strokeWidth: 1.75).paint(canvas, const Size(24, 24));
    KdIconPainter(b, color: Colors.black, strokeWidth: 1.75).paint(canvas, const Size(24, 24));
    expect(KdIconPainter.debugStrokeCacheSize, equals(before + 1),
        reason: 'painting two equal-but-distinct KdIconData must add exactly one cache entry, not two');
  });

  testWidgets('IconTheme.opacity dims the painted colour', (tester) async {
    await tester.pumpWidget(MaterialApp(home: IconTheme(
      data: const IconThemeData(color: Colors.black, opacity: 0.38),
      child: Center(child: KdIcon(KdIcons.receipt)),
    )));
    final painter = tester.widget<CustomPaint>(find.descendant(of: find.byType(KdIcon), matching: find.byType(CustomPaint))).painter as KdIconPainter;
    expect(painter.color.a, closeTo(0.38, 1e-6));
  });

  testWidgets('IconTheme.applyTextScaling scales the icon size with the text scaler', (tester) async {
    await tester.pumpWidget(MaterialApp(home: MediaQuery(
      data: const MediaQueryData(textScaler: TextScaler.linear(2)),
      child: const IconTheme(
        data: IconThemeData(size: 24, applyTextScaling: true),
        child: Center(child: KdIcon(KdIcons.receipt)),
      ),
    )));
    final box = tester.renderObject<RenderBox>(find.byType(KdIcon));
    expect(box.size, const Size(48, 48));
  });

  testWidgets('KdIcon takes size and colour from IconTheme when not given', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: IconTheme(
      data: IconThemeData(size: 32, color: Color(0xFF136B6B)),
      child: Center(child: KdIcon(KdIcons.receipt)),
    )));
    final box = tester.renderObject<RenderBox>(find.byType(KdIcon));
    expect(box.size, const Size(32, 32));
    final painter = tester.widget<CustomPaint>(find.descendant(of: find.byType(KdIcon), matching: find.byType(CustomPaint))).painter as KdIconPainter;
    expect(painter.color, const Color(0xFF136B6B));
    expect(painter.strokeWidth, closeTo(1.75 * 32 / 24, 1e-9));
  });

  testWidgets('explicit size and colour win', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: Center(child: KdIcon(KdIcons.receipt, size: 20, color: Colors.red))));
    final painter = tester.widget<CustomPaint>(find.descendant(of: find.byType(KdIcon), matching: find.byType(CustomPaint))).painter as KdIconPainter;
    expect(painter.strokeWidth, closeTo(1.75 * 20 / 24, 1e-9));
    expect(painter.color, Colors.red);
  });

  test('every icon has at least one op and stroke icons end inside the grid', () {
    expect(KdIcons.byName.length, equals(161));
    for (final entry in KdIcons.byName.entries) {
      final data = entry.value;
      expect(data.stroke.isNotEmpty || data.fill.isNotEmpty, isTrue, reason: entry.key);
      for (final op in [...data.stroke, ...data.fill]) {
        for (final p in op.points) {
          expect(p.dx, inInclusiveRange(1.5, 22.5), reason: '${entry.key} x');
          expect(p.dy, inInclusiveRange(1.5, 22.5), reason: '${entry.key} y');
        }
      }
    }
  });

  testWidgets('semanticLabel is exposed', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: KdIcon(KdIcons.receipt, semanticLabel: 'Beleg')));
    expect(find.bySemanticsLabel('Beleg'), findsOneWidget);
  });

  testWidgets('KdSignet paints frame and square in two colours', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: Center(child: KdSignet(size: 48, frame: Colors.black, square: Colors.teal))));
    final painter = tester.widget<CustomPaint>(find.descendant(of: find.byType(KdSignet), matching: find.byType(CustomPaint))).painter as KdSignetPainter;
    expect(painter.frame, Colors.black);
    expect(painter.square, Colors.teal);
    expect(tester.getSize(find.byType(KdSignet)), const Size(48, 48));
  });

  testWidgets('golden: every filled icon at 24, one row', (tester) async {
    final icons = [
      KdIcons.checkFilled,
      KdIcons.settingsFilled,
      KdIcons.receiptFilled,
      KdIcons.posFilled,
      KdIcons.infoFilled,
      KdIcons.warningFilled,
      KdIcons.errorFilled,
      KdIcons.checkCircleFilled,
      KdIcons.xCircleFilled,
      KdIcons.circleFilled,
      KdIcons.userFilled,
    ];
    await tester.pumpWidget(MaterialApp(home: Scaffold(backgroundColor: Colors.white, body: Center(
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        for (final i in icons) KdIcon(i, size: 24, color: Colors.black),
      ]),
    ))));
    await expectLater(find.byType(Row), matchesGoldenFile('goldens/filled_icons.png'));
  });

  testWidgets('golden: six till icons at 24 and 40', (tester) async {
    final icons = [KdIcons.receipt, KdIcons.receiptVoid, KdIcons.cashDrawer, KdIcons.paperRoll, KdIcons.signatureUnit, KdIcons.pos];
    await tester.pumpWidget(MaterialApp(home: Scaffold(backgroundColor: Colors.white, body: Column(children: [
      Row(children: [for (final i in icons) KdIcon(i, size: 24, color: Colors.black)]),
      Row(children: [for (final i in icons) KdIcon(i, size: 40, color: const Color(0xFF136B6B))]),
    ]))));
    await expectLater(find.byType(Column), matchesGoldenFile('goldens/till_icons.png'));
  });
}
