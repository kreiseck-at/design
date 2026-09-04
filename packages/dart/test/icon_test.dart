import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kreiseck_design/kreiseck_design.dart';

void main() {
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

  testWidgets('golden: six till icons at 24 and 40', (tester) async {
    final icons = [KdIcons.receipt, KdIcons.receiptVoid, KdIcons.cashDrawer, KdIcons.paperRoll, KdIcons.signatureUnit, KdIcons.pos];
    await tester.pumpWidget(MaterialApp(home: Scaffold(backgroundColor: Colors.white, body: Column(children: [
      Row(children: [for (final i in icons) KdIcon(i, size: 24, color: Colors.black)]),
      Row(children: [for (final i in icons) KdIcon(i, size: 40, color: const Color(0xFF136B6B))]),
    ]))));
    await expectLater(find.byType(Column), matchesGoldenFile('goldens/till_icons.png'));
  });
}
