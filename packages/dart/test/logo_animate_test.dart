import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kreiseck_design/kreiseck_design.dart';

/// The twin contract for the animations: the golden holds samples of every
/// animation taken through the JavaScript reference; this replays them here.
void main() {
  late Map<String, dynamic> golden;
  setUpAll(() {
    golden = (jsonDecode(File('../../golden/kasseneck.json').readAsStringSync()) as Map<String, dynamic>)['logo'] as Map<String, dynamic>;
  });

  test('every golden animation exists here and nothing more', () {
    final names = (golden['animations'] as Map<String, dynamic>).keys.toSet();
    expect(KdLogoAnimations.byName.keys.toSet(), equals(names));
    expect(KdLogoAnimations.all.map((a) => a.name).toSet(), equals(names));
  });

  test('every sample of every animation matches the golden to the thousandth', () {
    final anims = golden['animations'] as Map<String, dynamic>;
    var checked = 0;
    for (final entry in anims.entries) {
      final anim = KdLogoAnimations.byName[entry.key]!;
      final meta = entry.value as Map<String, dynamic>;
      expect(anim.duration, equals((meta['duration'] as num).toDouble()), reason: entry.key);
      expect(anim.loop, equals(meta['loop']), reason: entry.key);
      expect(anim.label, equals(meta['de']), reason: entry.key);
      final samples = meta['samples'] as Map<String, dynamic>;
      for (final s in samples.entries) {
        final expected = (s.value as String).split(',').map(int.parse).toList();
        final got = kdSampleLogo(anim, double.parse(s.key)).flatten();
        expect(got, equals(expected), reason: '${entry.key} at t=${s.key}');
        checked++;
      }
    }
    expect(checked, greaterThanOrEqualTo(8 * 7));
  });

  test('the sample is proven to bite: a shifted keyframe no longer matches', () {
    final anim = KdLogoAnimations.rain;
    final meta = (golden['animations'] as Map<String, dynamic>)['rain'] as Map<String, dynamic>;
    final expected = ((meta['samples'] as Map<String, dynamic>)['0.5'] as String).split(',').map(int.parse).toList();
    final tampered = KdLogoAnimation(
      name: anim.name, label: anim.label, scenario: anim.scenario, duration: anim.duration, loop: anim.loop,
      tracks: [
        for (final t in anim.tracks)
          KdLogoTrack(
            kind: t.kind, indices: t.indices, start: t.start + 40, stagger: t.stagger, duration: t.duration,
            easing: t.easing, wrap: t.wrap, before: t.before, after: t.after, keyframes: t.keyframes,
          ),
      ],
    );
    expect(kdSampleLogo(tampered, 0.5).flatten(), isNot(equals(expected)));
  });

  test('the PRNG is the twin of the web one: seed 7 shuffles 0..31 into the golden order', () {
    final expected = (golden['shuffle7'] as String).split(',').map(int.parse).toList();
    expect(kdShuffle(List.generate(32, (i) => i), 7), equals(expected));
    expect(kdShuffle(List.generate(32, (i) => i), 8), isNot(equals(expected)));
  });

  test('a shuffled track plays a different order per seed, the same for the same seed', () {
    final anim = KdLogoAnimations.scatter;
    expect(anim.tracks.any((t) => t.shuffle), isTrue);
    final a = kdSampleLogo(anim, 0.2, seed: 1).flatten();
    final b = kdSampleLogo(anim, 0.2, seed: 1).flatten();
    final c = kdSampleLogo(anim, 0.2, seed: 2).flatten();
    expect(a, equals(b));
    expect(a, isNot(equals(c)));
  });

  test('easings map 0 to 0 and 1 to 1', () {
    for (final e in KdEasing.values) {
      expect(kdEase(e, 0), 0, reason: e.name);
      expect(kdEase(e, 1), 1, reason: e.name);
    }
  });

  test('flatten rounds like JavaScript: half goes up, also below zero', () {
    const s = KdLogoStyle(dx: -0.0005, dy: 0.0005, opacity: 0.9995);
    final f = KdLogoSample([s], [], []).flatten();
    expect(f, equals([1000, 1000, 0, 1, 0, 0]));
  });
}
