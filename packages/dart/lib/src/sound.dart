import 'dart:math' as math;
import 'dart:typed_data';

import 'package:flutter/services.dart';

import 'logo_animate.dart';

/// Sound and touch for the logo animations.
///
/// A tone is a spec, never a file: [kdRenderWav] builds the samples from the
/// notes, so the package ships no audio and needs no audio dependency. Hand
/// the bytes to whatever player the app already has.

/// Samples per second of a rendered tone.
const int kdSampleRate = 44100;
const double _attack = 0.008;

double _wave(KdWave wave, double phase) {
  switch (wave) {
    case KdWave.sine:
      return math.sin(2 * math.pi * phase);
    case KdWave.triangle:
      return 4 * (phase - (phase + 0.5).floorToDouble()).abs() - 1;
    case KdWave.square:
      return phase % 1 < 0.5 ? 1 : -1;
    case KdWave.sawtooth:
      return 2 * (phase - (phase + 0.5).floorToDouble());
  }
}

/// The tone as a 16-bit mono WAV, ready to play. Each note is struck over
/// [_attack] seconds and decays to silence by its own end — the same envelope
/// the web package asks the browser for.
Uint8List kdRenderWav(KdSound sound) {
  final frames = <double>[];
  for (final note in sound.notes) {
    final count = (note.ms / 1000 * kdSampleRate).round();
    final seconds = note.ms / 1000;
    // The phase is summed, not computed from hz × t: a gliding note changes
    // frequency as it goes, and multiplying would jump the wave at every step.
    var phase = 0.0;
    for (var i = 0; i < count; i++) {
      final t = i / kdSampleRate;
      final rise = t < _attack ? t / _attack : 1.0;
      // Exponential decay to the same floor the browser ramps to.
      final decay = math.pow(0.0001, t / seconds).toDouble();
      // Exponential glide, the shape the browser's ramp draws.
      final hz = note.to == null ? note.hz : note.hz * math.pow(note.to! / note.hz, t / seconds);
      frames.add(_wave(sound.wave, phase) * sound.gain * rise * decay);
      phase += hz / kdSampleRate;
    }
  }
  final data = ByteData(44 + frames.length * 2);
  void ascii(int offset, String s) {
    for (var i = 0; i < s.length; i++) {
      data.setUint8(offset + i, s.codeUnitAt(i));
    }
  }

  ascii(0, 'RIFF');
  data.setUint32(4, 36 + frames.length * 2, Endian.little);
  ascii(8, 'WAVEfmt ');
  data.setUint32(16, 16, Endian.little); // PCM header length
  data.setUint16(20, 1, Endian.little); // PCM
  data.setUint16(22, 1, Endian.little); // mono
  data.setUint32(24, kdSampleRate, Endian.little);
  data.setUint32(28, kdSampleRate * 2, Endian.little); // bytes per second
  data.setUint16(32, 2, Endian.little); // bytes per frame
  data.setUint16(34, 16, Endian.little); // bits per sample
  ascii(36, 'data');
  data.setUint32(40, frames.length * 2, Endian.little);
  for (var i = 0; i < frames.length; i++) {
    final v = (frames[i].clamp(-1.0, 1.0) * 32767).round();
    data.setInt16(44 + i * 2, v, Endian.little);
  }
  return data.buffer.asUint8List();
}

/// Taps the device the way the cue asks. Flutter carries this itself, so the
/// haptic half of a cue works with nothing added.
Future<void> kdTapHaptic(KdHaptic haptic) {
  switch (haptic) {
    case KdHaptic.selection:
      return HapticFeedback.selectionClick();
    case KdHaptic.light:
      return HapticFeedback.lightImpact();
    case KdHaptic.medium:
      return HapticFeedback.mediumImpact();
    case KdHaptic.heavy:
      return HapticFeedback.heavyImpact();
  }
}
