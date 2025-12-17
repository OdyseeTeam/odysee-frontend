/* eslint-disable no-restricted-globals */

// Shared ring-buffer layout (must match ui/.../videojs-live-captions/plugin.js)
const SHARED_META_WRITE_INDEX = 0;
const SHARED_META_LENGTH = 1;
const SHARED_META_SEQ = 2;
const SHARED_META_CAPACITY = 3;
const SHARED_META_SAMPLE_RATE = 4;
const SHARED_META_TOTAL_SAMPLES = 5;

class LinearResampler {
  constructor(inRate, outRate) {
    this.inRate = inRate;
    this.outRate = outRate;
    this.ratio = inRate / outRate;
    this.buffer = new Float32Array(0);
    this.pos = 0;
  }

  reset(inRate, outRate) {
    this.inRate = inRate;
    this.outRate = outRate;
    this.ratio = inRate / outRate;
    this.buffer = new Float32Array(0);
    this.pos = 0;
  }

  process(input) {
    if (!input || input.length === 0) return null;
    if (this.inRate === this.outRate) return input;

    const merged = new Float32Array(this.buffer.length + input.length);
    merged.set(this.buffer, 0);
    merged.set(input, this.buffer.length);

    let pos = this.pos;
    const outLength = Math.max(0, Math.floor((merged.length - pos - 1) / this.ratio));
    if (!outLength) {
      this.buffer = merged;
      this.pos = pos;
      return null;
    }

    const output = new Float32Array(outLength);
    for (let i = 0; i < outLength; i++) {
      const idx = Math.floor(pos);
      const frac = pos - idx;
      const s0 = merged[idx];
      const s1 = merged[idx + 1];
      output[i] = s0 + (s1 - s0) * frac;
      pos += this.ratio;
    }

    const keepFrom = Math.floor(pos);
    this.buffer = merged.slice(keepFrom);
    this.pos = pos - keepFrom;

    return output;
  }
}

class WhisperLiveCaptionsAudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();

    const opts = (options && options.processorOptions) || {};
    this.debug = !!opts.debug;

    const shared = opts.sharedAudio || null;
    this.metaView = shared && shared.meta ? new Int32Array(shared.meta) : null;
    this.samplesView = shared && shared.samples ? new Float32Array(shared.samples) : null;
    this.capacity =
      (this.metaView && Atomics.load(this.metaView, SHARED_META_CAPACITY)) ||
      (shared && shared.capacity) ||
      (this.samplesView ? this.samplesView.length : 0) ||
      0;

    this.targetSampleRate = (shared && shared.sampleRate) || opts.targetSampleRate || 16000;
    this.resampler = new LinearResampler(sampleRate, this.targetSampleRate);

    this.lastReportAt = 0;
    this.reportEveryMs = 250;
    this.rmsStride = 16;
  }

  write(samples) {
    if (!this.metaView || !this.samplesView || !samples || samples.length === 0) return;
    const meta = this.metaView;
    const buf = this.samplesView;
    const cap = this.capacity;
    const n = samples.length;

    Atomics.add(meta, SHARED_META_SEQ, 1); // begin write (odd)

    if (n >= cap) {
      const tail = samples.subarray(n - cap);
      buf.set(tail, 0);
      Atomics.store(meta, SHARED_META_WRITE_INDEX, 0);
      Atomics.store(meta, SHARED_META_LENGTH, cap);
      Atomics.add(meta, SHARED_META_TOTAL_SAMPLES, n);
      Atomics.add(meta, SHARED_META_SEQ, 1); // end write (even)
      Atomics.notify(meta, SHARED_META_SEQ, 1);
      return;
    }

    const writeIndex = Atomics.load(meta, SHARED_META_WRITE_INDEX);
    const firstPart = Math.min(n, cap - writeIndex);
    buf.set(samples.subarray(0, firstPart), writeIndex);

    const remaining = n - firstPart;
    if (remaining > 0) {
      buf.set(samples.subarray(firstPart), 0);
    }

    const nextWrite = (writeIndex + n) % cap;
    const prevLen = Atomics.load(meta, SHARED_META_LENGTH);
    const nextLen = Math.min(cap, prevLen + n);
    Atomics.store(meta, SHARED_META_WRITE_INDEX, nextWrite);
    Atomics.store(meta, SHARED_META_LENGTH, nextLen);
    Atomics.add(meta, SHARED_META_TOTAL_SAMPLES, n);
    Atomics.add(meta, SHARED_META_SEQ, 1); // end write (even)
    Atomics.notify(meta, SHARED_META_SEQ, 1);
  }

  computeRmsPeak(input) {
    if (!input || input.length === 0) return { rms: 0, peak: 0 };
    const stride = this.rmsStride;
    let sum = 0;
    let peak = 0;
    let count = 0;
    for (let i = 0; i < input.length; i += stride) {
      const v = input[i];
      sum += v * v;
      const av = v < 0 ? -v : v;
      if (av > peak) peak = av;
      count += 1;
    }
    const denom = Math.max(1, count);
    return { rms: Math.sqrt(sum / denom), peak };
  }

  maybeReport(inputSamples, outputSamples) {
    if (!this.debug || !this.metaView) return;
    const t = currentTime * 1000;
    if (t - this.lastReportAt < this.reportEveryMs) return;
    this.lastReportAt = t;

    try {
      const total = Atomics.load(this.metaView, SHARED_META_TOTAL_SAMPLES);
      const seq = Atomics.load(this.metaView, SHARED_META_SEQ);
      const len = Atomics.load(this.metaView, SHARED_META_LENGTH);
      const vad = this.computeRmsPeak(inputSamples);
      this.port.postMessage({
        type: 'stats',
        inputSamples: inputSamples ? inputSamples.length : 0,
        outputSamples: outputSamples ? outputSamples.length : 0,
        audioContextSampleRate: sampleRate,
        targetSampleRate: this.targetSampleRate,
        totalSamples: total,
        ringLength: len,
        seq,
        rms: vad.rms,
        peak: vad.peak,
      });
    } catch {}
  }

  process(inputs, outputs) {
    const input = inputs && inputs[0];
    const ch0 = input && input[0];

    // Keep output silent (avoid double playback).
    try {
      const out = outputs && outputs[0];
      if (out && out[0]) out[0].fill(0);
    } catch {}

    if (!ch0 || !this.metaView || !this.samplesView) return true;

    // Reset resampler if AudioContext sample rate changes (shouldn't, but safe).
    if (this.resampler && this.resampler.inRate !== sampleRate) {
      this.resampler.reset(sampleRate, this.targetSampleRate);
    }

    const output = this.resampler ? this.resampler.process(ch0) : ch0;
    if (output && output.length) {
      this.write(output);
    }
    this.maybeReport(ch0, output);
    return true;
  }
}

registerProcessor('whisper-live-captions-audio', WhisperLiveCaptionsAudioProcessor);

