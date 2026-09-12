import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kreiseck_design/kreiseck_design.dart';

void main() {
  String ascii(Uint8List b, int at, int len) => String.fromCharCodes(b.sublist(at, at + len));

  group('kdRenderWav', () {
    test('writes a playable 16-bit mono WAV as long as its notes', () {
      const sound = KdSound(wave: KdWave.sine, gain: 0.2, notes: [KdNote(440, 100), KdNote(880, 50)]);
      final wav = kdRenderWav(sound);
      final frames = ((100 + 50) / 1000 * kdSampleRate).round();

      expect(ascii(wav, 0, 4), 'RIFF');
      expect(ascii(wav, 8, 8), 'WAVEfmt ');
      expect(ascii(wav, 36, 4), 'data');
      final head = ByteData.sublistView(wav);
      expect(head.getUint16(22, Endian.little), 1, reason: 'mono');
      expect(head.getUint32(24, Endian.little), kdSampleRate);
      expect(head.getUint16(34, Endian.little), 16, reason: 'bits per sample');
      expect(head.getUint32(40, Endian.little), frames * 2);
      expect(wav.length, 44 + frames * 2);
    });

    test('is struck and decays: silent at both ends, loudest early, never clipping', () {
      const sound = KdSound(wave: KdWave.sine, gain: 0.5, notes: [KdNote(440, 200)]);
      final data = ByteData.sublistView(kdRenderWav(sound));
      final samples = [for (var i = 44; i < data.lengthInBytes; i += 2) data.getInt16(i, Endian.little)];

      expect(samples.first.abs(), lessThan(400), reason: 'the attack starts at silence');
      expect(samples.last.abs(), lessThan(400), reason: 'decayed away by the end');
      final loudestEarly = samples.take(samples.length ~/ 4).map((s) => s.abs()).reduce((a, b) => a > b ? a : b);
      final loudestLate = samples.skip(samples.length * 3 ~/ 4).map((s) => s.abs()).reduce((a, b) => a > b ? a : b);
      expect(loudestEarly, greaterThan(loudestLate * 4));
      expect(samples.every((s) => s.abs() <= 32767), isTrue);
    });

    test('a gliding note really rises: its wave crosses zero more often at the end', () {
      const glide = KdSound(wave: KdWave.sine, gain: 0.5, notes: [KdNote(300, 400, to: 1800)]);
      final data = ByteData.sublistView(kdRenderWav(glide));
      final samples = [for (var i = 44; i < data.lengthInBytes; i += 2) data.getInt16(i, Endian.little)];
      int crossings(Iterable<int> xs) {
        var n = 0;
        int? last;
        for (final s in xs) {
          if (s == 0) continue;
          if (last != null && (s > 0) != (last > 0)) n++;
          last = s;
        }
        return n;
      }

      final early = crossings(samples.take(samples.length ~/ 3));
      final late = crossings(samples.skip(samples.length * 2 ~/ 3));
      expect(late, greaterThan(early * 2), reason: 'the glide has risen by the end');

      // A note without a target holds its pitch.
      const flat = KdSound(wave: KdWave.sine, gain: 0.5, notes: [KdNote(300, 400)]);
      final f = ByteData.sublistView(kdRenderWav(flat));
      final flatSamples = [for (var i = 44; i < f.lengthInBytes; i += 2) f.getInt16(i, Endian.little)];
      final flatEarly = crossings(flatSamples.take(flatSamples.length ~/ 3));
      final flatLate = crossings(flatSamples.skip(flatSamples.length * 2 ~/ 3));
      expect((flatLate - flatEarly).abs(), lessThan(4), reason: 'a plain note keeps its pitch');
    });

    test('every tone in the data renders', () {
      for (final entry in KdSounds.byName.entries) {
        expect(kdRenderWav(entry.value).length, greaterThan(44), reason: entry.key);
      }
    });
  });

  group('hold', () {
    testWidgets('stops at the hold point and stays; without it the run reaches the end', (tester) async {
      await tester.pumpWidget(const MaterialApp(home: Center(child: KdLogoMotion(animation: KdLogoAnimations.confirm, hold: true))));
      final held = tester.state<KdLogoMotionState>(find.byType(KdLogoMotion));
      await tester.pumpAndSettle();
      final stop = KdLogoAnimations.confirm.hold! / KdLogoAnimations.confirm.duration;
      expect(held.controller.value, closeTo(stop, 0.001));
      expect(held.controller.isAnimating, isFalse, reason: 'it stays there');

      await tester.pumpWidget(const MaterialApp(key: ValueKey('ohne'), home: Center(child: KdLogoMotion(animation: KdLogoAnimations.confirm))));
      await tester.pumpAndSettle();
      expect(tester.state<KdLogoMotionState>(find.byType(KdLogoMotion)).controller.value, 1);
    });

    testWidgets('a held run fires only the cues up to that point', (tester) async {
      final seen = <double>[];
      await tester.pumpWidget(MaterialApp(
        home: Center(child: KdLogoMotion(animation: KdLogoAnimations.heartbeat, hold: false, onCue: (c) => seen.add(c.at))),
      ));
      await tester.pumpAndSettle();
      expect(seen, KdLogoAnimations.heartbeat.cues.map((c) => c.at).toList());
    });
  });

  group('cues', () {
    testWidgets('fire once each, in order, and taps only when asked for', (tester) async {
      final seen = <String>[];
      final taps = <String>[];
      tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(SystemChannels.platform, (call) async {
        if (call.method == 'HapticFeedback.vibrate') taps.add('${call.arguments}');
        return null;
      });

      await tester.pumpWidget(MaterialApp(
        home: Center(child: KdLogoMotion(animation: KdLogoAnimations.error, onCue: (c) => seen.add('${c.at}'))),
      ));
      await tester.pumpAndSettle();

      expect(seen, KdLogoAnimations.error.cues.map((c) => '${c.at}').toList());
      expect(taps, isEmpty, reason: 'haptics are off by default');

      seen.clear();
      await tester.pumpWidget(MaterialApp(
        key: const ValueKey('mit-haptik'),
        home: Center(child: KdLogoMotion(animation: KdLogoAnimations.confirm, haptics: true, onCue: (c) => seen.add('${c.at}'))),
      ));
      await tester.pumpAndSettle();
      expect(seen.length, KdLogoAnimations.confirm.cues.length);
      expect(taps, isNotEmpty);

      tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(SystemChannels.platform, null);
    });
  });
}
