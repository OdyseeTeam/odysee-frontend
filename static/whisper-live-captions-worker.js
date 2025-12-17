/* eslint-disable no-restricted-globals */

const WORKER_VERSION = '0.2.0';

let pipeline = null;
let env = null;
let apis = null;
let transcriber = null;
let currentModel = null;
let wasmBasePath = null;
let initPromise = null;
let debugEnabled = false;
let lastProgressAt = 0;
let offscreenInstrumented = false;
let seenOffscreenContexts = null;
let isWebglSupportProbe = false;
let runtimeWebglContexts = null;
let defaultWasmNumThreads = null;
let currentWasmNumThreads = null;
let currentDevice = null;
let currentDeviceApplied = false;
let webgpuInstrumented = false;
let webgpuStats = null;
let fetchInstrumented = false;
let ortAssets = null;
let sharedAudio = null;
let sharedAudioScratch = null;

const SHARED_META_WRITE_INDEX = 0;
const SHARED_META_LENGTH = 1;
const SHARED_META_SEQ = 2;
const SHARED_META_CAPACITY = 3;
const SHARED_META_SAMPLE_RATE = 4;
const SHARED_META_TOTAL_SAMPLES = 5;

let autopull = {
  generation: 0,
  active: false,
  playing: true,
  config: null,
  lastCheckTotalSamples: 0,
  lastInferenceTotalSamples: 0,
  throttleUntilMs: 0,
  voiceHangoverUntilSec: 0,
  nextId: 0,
  running: false,
  lastSeq: null,
  lastSeqAtMs: 0,
  lastWatchdogReportAtMs: 0,
  lastStatusReportAtMs: 0,
  zeroAudioSinceMs: 0,
};

function nowMs() {
  // eslint-disable-next-line no-restricted-globals
  return typeof performance !== 'undefined' && performance && typeof performance.now === 'function' ? performance.now() : Date.now();
}

function post(type, payload) {
  self.postMessage({ type, ...(payload || {}) });
}

function debug(message, data) {
  if (!debugEnabled) return;
  post('debug', { message, data });
}

function recordOrtAsset(url) {
  if (!ortAssets) return;
  if (!url || typeof url !== 'string') return;

  let name = url;
  try {
    const u = new URL(url, self.location && self.location.href ? self.location.href : undefined);
    name = u.pathname ? u.pathname.split('/').pop() || url : url;
  } catch {
    try {
      const p = url.split('?')[0];
      name = p.split('/').pop() || url;
    } catch {}
  }

  const clean = String(name || '').split('?')[0];
  if (!clean) return;

  if (/\.wasm$/i.test(clean)) {
    if (!ortAssets.wasm.includes(clean)) ortAssets.wasm.push(clean);
    if (ortAssets.wasm.length > 8) ortAssets.wasm.shift();
  } else if (/\.mjs$/i.test(clean) || /\.js$/i.test(clean)) {
    if (!ortAssets.js.includes(clean)) ortAssets.js.push(clean);
    if (ortAssets.js.length > 8) ortAssets.js.shift();
  }

  ortAssets.last = clean;
}

function instrumentFetch() {
  if (fetchInstrumented) return;
  fetchInstrumented = true;
  ortAssets = { wasm: [], js: [], last: null };

  try {
    // eslint-disable-next-line no-restricted-globals
    const originalFetch = typeof fetch === 'function' ? fetch : null;
    if (!originalFetch) return;

    // $FlowFixMe: override for debug instrumentation.
    self.fetch = async (input, init) => {
      try {
        const url = typeof input === 'string' ? input : input && typeof input.url === 'string' ? input.url : null;
        if (url && /ort-.*\.(wasm|mjs|js)(\?|$)/i.test(url)) {
          recordOrtAsset(url);
        }
      } catch {}
      return originalFetch(input, init);
    };

    debug('Instrumented fetch()', {});
  } catch (e) {
    debug('Failed to instrument fetch()', { error: String(e && e.message ? e.message : e) });
  }
}

function setSharedAudioFromMessage(shared) {
  if (!shared || typeof shared !== 'object') return;
  try {
    const meta = shared.meta;
    const samples = shared.samples;
    if (!meta || !samples) return;
    // eslint-disable-next-line no-restricted-globals
    const metaView = new Int32Array(meta);
    // eslint-disable-next-line no-restricted-globals
    const samplesView = new Float32Array(samples);
    const cap = Atomics.load(metaView, SHARED_META_CAPACITY) || shared.capacity || samplesView.length || 0;
    const sr = Atomics.load(metaView, SHARED_META_SAMPLE_RATE) || shared.sampleRate || 16000;
    sharedAudio = { meta, samples, metaView, samplesView, capacity: cap, sampleRate: sr };
    sharedAudioScratch = null;
    debug('Shared audio attached', { capacity: cap, sampleRate: sr });
  } catch (e) {
    debug('Failed to attach shared audio', { error: String(e && e.message ? e.message : e) });
  }
}

function readSharedLast(sampleCount) {
  if (!sharedAudio || !sharedAudio.metaView || !sharedAudio.samplesView) return null;
  const meta = sharedAudio.metaView;
  const cap = sharedAudio.capacity || Atomics.load(meta, SHARED_META_CAPACITY) || sharedAudio.samplesView.length;
  if (!cap || sampleCount <= 0) return null;

  const needed = Math.min(sampleCount, cap);
  if (!sharedAudioScratch || sharedAudioScratch.length !== needed) {
    sharedAudioScratch = new Float32Array(needed);
  }

  for (let attempt = 0; attempt < 6; attempt++) {
    const seq1 = Atomics.load(meta, SHARED_META_SEQ);
    if (seq1 & 1) continue;

    const writeIndex = Atomics.load(meta, SHARED_META_WRITE_INDEX);
    const len = Atomics.load(meta, SHARED_META_LENGTH);
    if (len < needed) return null;

    const start = (writeIndex - needed + cap) % cap;
    const samples = sharedAudio.samplesView;

    if (start + needed <= cap) {
      sharedAudioScratch.set(samples.subarray(start, start + needed), 0);
    } else {
      const firstPart = cap - start;
      sharedAudioScratch.set(samples.subarray(start, cap), 0);
      sharedAudioScratch.set(samples.subarray(0, needed - firstPart), firstPart);
    }

    const seq2 = Atomics.load(meta, SHARED_META_SEQ);
    if (seq1 === seq2 && !(seq2 & 1)) return sharedAudioScratch;
  }

  return sharedAudioScratch;
}

function sharedSnapshot() {
  if (!sharedAudio || !sharedAudio.metaView) return null;
  const meta = sharedAudio.metaView;
  const cap = sharedAudio.capacity || Atomics.load(meta, SHARED_META_CAPACITY) || 0;
  const sr = sharedAudio.sampleRate || Atomics.load(meta, SHARED_META_SAMPLE_RATE) || 16000;

  for (let attempt = 0; attempt < 6; attempt++) {
    const seq1 = Atomics.load(meta, SHARED_META_SEQ);
    if (seq1 & 1) continue;
    const writeIndex = Atomics.load(meta, SHARED_META_WRITE_INDEX);
    const len = Atomics.load(meta, SHARED_META_LENGTH);
    const totalSamples = Atomics.load(meta, SHARED_META_TOTAL_SAMPLES);
    const seq2 = Atomics.load(meta, SHARED_META_SEQ);
    if (seq1 === seq2 && !(seq2 & 1)) return { writeIndex, len, cap, sampleRate: sr, totalSamples, seq: seq2 };
  }

  return {
    writeIndex: Atomics.load(meta, SHARED_META_WRITE_INDEX),
    len: Atomics.load(meta, SHARED_META_LENGTH),
    cap,
    sampleRate: sr,
    totalSamples: Atomics.load(meta, SHARED_META_TOTAL_SAMPLES),
    seq: Atomics.load(meta, SHARED_META_SEQ),
  };
}

function computeSharedRmsPeak(sampleCount, stride = 8) {
  if (!sharedAudio || !sharedAudio.samplesView) return { rms: 0, peak: 0 };
  const snap = sharedSnapshot();
  if (!snap || !snap.len || snap.len < sampleCount || sampleCount <= 0) return { rms: 0, peak: 0 };

  const cap = snap.cap;
  const start = (snap.writeIndex - sampleCount + cap) % cap;
  const step = Math.max(1, stride | 0);
  const buf = sharedAudio.samplesView;
  let sum = 0;
  let peak = 0;
  let count = 0;
  for (let i = 0; i < sampleCount; i += step) {
    const idx = (start + i) % cap;
    const v = buf[idx];
    sum += v * v;
    const av = v < 0 ? -v : v;
    if (av > peak) peak = av;
    count += 1;
  }
  const denom = Math.max(1, count);
  return { rms: Math.sqrt(sum / denom), peak };
}

function clampNumber(v, min, max) {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : min;
  return Math.min(max, Math.max(min, n));
}

function numberOr(v, fallback) {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function sleep(ms) {
  const t = Math.max(0, Math.floor(ms || 0));
  return new Promise((resolve) => setTimeout(resolve, t));
}

async function waitForSharedSeqChange(timeoutMs) {
  if (!sharedAudio || !sharedAudio.metaView) {
    await sleep(timeoutMs);
    return;
  }
  const meta = sharedAudio.metaView;
  const expected = Atomics.load(meta, SHARED_META_SEQ);
  const ms = Math.max(0, Math.floor(timeoutMs || 0));
  try {
    if (typeof Atomics.waitAsync === 'function') {
      const res = Atomics.waitAsync(meta, SHARED_META_SEQ, expected, ms);
      const value = res && typeof res === 'object' ? res.value : null;
      if (value && typeof value.then === 'function') {
        await value;
      }
      return;
    }
  } catch {}

  // Fallback: short sleep to avoid blocking message handling.
  await sleep(Math.min(250, ms || 0));
}

function normalizeAutopullConfig(msg) {
  const c = (msg && msg.config && typeof msg.config === 'object' ? msg.config : msg) || {};
  const windowSeconds = clampNumber(numberOr(c.windowSeconds, 4), 2, 30);
  return {
    windowSeconds,
    stepSeconds: clampNumber(numberOr(c.stepSeconds, 2), 0.5, 10),
    vadSeconds: clampNumber(numberOr(c.vadSeconds, 1), 0.05, windowSeconds),
    vadHangoverSeconds: clampNumber(numberOr(c.vadHangoverSeconds, 2), 0, 10),
    silenceRmsThreshold: clampNumber(numberOr(c.silenceRmsThreshold, 0.002), 0, 1),
    silencePeakThreshold: clampNumber(numberOr(c.silencePeakThreshold, 0.02), 0, 1),
    skipSilence: c.skipSilence !== false,
    maxDutyCycle: clampNumber(numberOr(c.maxDutyCycle, 1), 0.1, 1),
    returnTimestamps: typeof c.returnTimestamps !== 'undefined' ? c.returnTimestamps : true,
    model: typeof c.model === 'string' && c.model ? c.model : currentModel || 'Xenova/whisper-tiny.en',
    device: c.device,
    transformersUrl: c.transformersUrl,
    wasmNumThreads: c.wasmNumThreads,
  };
}

function resetAutopullCounters() {
  autopull.lastCheckTotalSamples = 0;
  autopull.lastInferenceTotalSamples = 0;
  autopull.throttleUntilMs = 0;
  autopull.voiceHangoverUntilSec = 0;
  autopull.lastSeq = null;
  autopull.lastSeqAtMs = 0;
  autopull.lastWatchdogReportAtMs = 0;
  autopull.lastStatusReportAtMs = 0;
  autopull.zeroAudioSinceMs = 0;
}

async function runAutopullLoop() {
  if (autopull.running) return;
  autopull.running = true;
  autopull.generation += 1;
  const runId = autopull.generation;
  debug('Autopull loop started', { generation: runId });

  try {
    while (autopull.active && autopull.generation === runId) {
      if (!autopull.playing) {
        const t = nowMs();
        if (debugEnabled && (!autopull.lastStatusReportAtMs || t - autopull.lastStatusReportAtMs > 1500)) {
          autopull.lastStatusReportAtMs = t;
          debug('Autopull waiting (paused)', {});
        }
        await waitForSharedSeqChange(500);
        continue;
      }
      if (!sharedAudio || !sharedAudio.metaView) {
        const t = nowMs();
        if (debugEnabled && (!autopull.lastStatusReportAtMs || t - autopull.lastStatusReportAtMs > 1500)) {
          autopull.lastStatusReportAtMs = t;
          debug('Autopull waiting (no shared audio)', {});
        }
        await sleep(250);
        continue;
      }

      const cfg = autopull.config || normalizeAutopullConfig({});
      const snap = sharedSnapshot();
      if (!snap || !snap.sampleRate) {
        await waitForSharedSeqChange(250);
        continue;
      }

      const sr = snap.sampleRate || 16000;
      const windowSamples = Math.floor(cfg.windowSeconds * sr);
      const stepSamples = Math.max(1, Math.floor(cfg.stepSeconds * sr));
      const nowTotal = snap.totalSamples || 0;

      // Ensure we have a full window in the ring.
      if (snap.len < windowSamples) {
        const t = nowMs();
        if (debugEnabled && (!autopull.lastStatusReportAtMs || t - autopull.lastStatusReportAtMs > 1000)) {
          autopull.lastStatusReportAtMs = t;
          debug('Autopull buffering audio', {
            haveSeconds: Math.round((snap.len / sr) * 1000) / 1000,
            needSeconds: cfg.windowSeconds,
            ringLen: snap.len,
            windowSamples,
            totalSamples: nowTotal,
            seq: snap.seq,
          });
        }
        await waitForSharedSeqChange(250);
        continue;
      }

      const nowPerf = nowMs();
      // Watchdog: if audio stops flowing while playback is "playing", ask the main thread to reconnect.
      if (typeof snap.seq === 'number' && Number.isFinite(snap.seq)) {
        if (autopull.lastSeq === null) {
          autopull.lastSeq = snap.seq;
          autopull.lastSeqAtMs = nowPerf;
        } else if (snap.seq !== autopull.lastSeq) {
          autopull.lastSeq = snap.seq;
          autopull.lastSeqAtMs = nowPerf;
        } else if (autopull.lastSeqAtMs && nowPerf - autopull.lastSeqAtMs > 2000) {
          if (!autopull.lastWatchdogReportAtMs || nowPerf - autopull.lastWatchdogReportAtMs > 5000) {
            autopull.lastWatchdogReportAtMs = nowPerf;
            post('audio_watchdog', { reason: 'stalled', msSinceSeq: Math.round(nowPerf - autopull.lastSeqAtMs), seq: snap.seq });
          }
        }
      }
      if (autopull.throttleUntilMs && nowPerf < autopull.throttleUntilMs) {
        await sleep(Math.min(500, autopull.throttleUntilMs - nowPerf));
        continue;
      }

      // VAD checks can run more frequently than inference to reduce perceived latency.
      const vadCheckEverySeconds = Math.min(0.5, Math.max(0.25, cfg.stepSeconds));
      const vadCheckEverySamples = Math.max(1, Math.floor(vadCheckEverySeconds * sr));
      if (autopull.lastCheckTotalSamples && nowTotal - autopull.lastCheckTotalSamples < vadCheckEverySamples) {
        const remaining = vadCheckEverySamples - (nowTotal - autopull.lastCheckTotalSamples);
        await waitForSharedSeqChange(Math.min(250, Math.max(20, Math.ceil((remaining / sr) * 1000))));
        continue;
      }

      const vadSamples = Math.max(1, Math.floor(clampNumber(cfg.vadSeconds, 0.05, cfg.windowSeconds) * sr));
      const vad = computeSharedRmsPeak(vadSamples, 8);
      const isSilent = vad.rms < cfg.silenceRmsThreshold && vad.peak < cfg.silencePeakThreshold;
      const audioNowSec = nowTotal / sr;

      // Watchdog: sustained all-zero audio is often a broken capture path (e.g., after quality switch).
      const isAllZero = vad.rms === 0 && vad.peak === 0;
      if (isAllZero) {
        if (!autopull.zeroAudioSinceMs) autopull.zeroAudioSinceMs = nowPerf;
        if (nowPerf - autopull.zeroAudioSinceMs > 3000) {
          if (!autopull.lastWatchdogReportAtMs || nowPerf - autopull.lastWatchdogReportAtMs > 5000) {
            autopull.lastWatchdogReportAtMs = nowPerf;
            post('audio_watchdog', {
              reason: 'all_zero_audio',
              msSinceZero: Math.round(nowPerf - autopull.zeroAudioSinceMs),
              rms: vad.rms,
              peak: vad.peak,
            });
          }
        }
      } else {
        autopull.zeroAudioSinceMs = 0;
      }

      if (!isSilent) {
        autopull.voiceHangoverUntilSec = Math.max(autopull.voiceHangoverUntilSec, audioNowSec + cfg.vadHangoverSeconds);
      } else if (cfg.skipSilence && audioNowSec > autopull.voiceHangoverUntilSec) {
        autopull.lastCheckTotalSamples = nowTotal;
        debug('Autopull skip silence', {
          rms: vad.rms,
          peak: vad.peak,
          silenceRmsThreshold: cfg.silenceRmsThreshold,
          silencePeakThreshold: cfg.silencePeakThreshold,
        });
        continue;
      }

      // Step gating for inference.
      if (autopull.lastInferenceTotalSamples && nowTotal - autopull.lastInferenceTotalSamples < stepSamples) {
        autopull.lastCheckTotalSamples = nowTotal;
        continue;
      }

      const ok = await ensureInitialized({
        model: cfg.model || currentModel || 'Xenova/whisper-tiny.en',
        device: cfg.device,
        transformersUrl: cfg.transformersUrl,
        wasmNumThreads: cfg.wasmNumThreads,
      });
      if (!ok || !transcriber) {
        await sleep(250);
        continue;
      }

      const audio = readSharedLast(windowSamples);
      if (!audio) {
        await waitForSharedSeqChange(250);
        continue;
      }

      const t0 = nowMs();
      const output = await transcriber(audio, {
        return_timestamps: cfg.returnTimestamps === 'word' || cfg.returnTimestamps === 'char' ? cfg.returnTimestamps : !!cfg.returnTimestamps,
        sampling_rate: sr,
      });
      const t1 = nowMs();
      const inferenceMs = Math.round(t1 - t0);

      const chunks = Array.isArray(output && output.chunks) ? output.chunks : [];
      let segments = chunks.map((c) => {
        const ts = c && c.timestamp;
        const start = Array.isArray(ts) ? parseTimestampValue(ts[0]) : null;
        const end = Array.isArray(ts) ? parseTimestampValue(ts[1]) : null;
        return { start, end, text: c && c.text ? c.text : '' };
      });

      if ((!segments || segments.length === 0) && output && typeof output.text === 'string' && output.text.trim()) {
        const approxDuration = windowSamples / sr;
        segments = [{ start: 0, end: Math.max(1, approxDuration), text: output.text }];
      }

      autopull.nextId += 1;
      autopull.lastInferenceTotalSamples = nowTotal;
      autopull.lastCheckTotalSamples = nowTotal;
      autopull.lastStatusReportAtMs = nowMs();

      if (cfg.maxDutyCycle < 1 && inferenceMs > 0) {
        const idleMs = Math.max(0, Math.round(inferenceMs * (1 / cfg.maxDutyCycle - 1)));
        if (idleMs > 0) autopull.throttleUntilMs = nowMs() + idleMs;
      }

      debug('Autopull transcribe done', {
        id: autopull.nextId,
        samples: audio.length,
        sampleRate: sr,
        ms: inferenceMs,
        hasChunks: chunks.length > 0,
        segments: segments ? segments.length : 0,
        text: output && typeof output.text === 'string' ? output.text.slice(0, 80) : null,
      });

      post('result', {
        id: autopull.nextId,
        segments,
        text: output && typeof output.text === 'string' ? output.text : '',
        inferenceMs,
        autopull: true,
        audioWindowStart: Math.max(0, audioNowSec - cfg.windowSeconds),
        audioWindowEnd: audioNowSec,
        vadRms: vad.rms,
        vadPeak: vad.peak,
      });
    }
  } catch (e) {
    debug('Autopull loop error', { error: String(e && e.message ? e.message : e) });
    post('error', { error: String(e && e.message ? e.message : e) });
  } finally {
    autopull.running = false;
    debug('Autopull loop stopped', { generation: runId });
  }
}

function instrumentWebGPU() {
  if (webgpuInstrumented) return;
  webgpuInstrumented = true;
  webgpuStats = {
    requestAdapterCalls: 0,
    adapterOk: false,
    requestDeviceCalls: 0,
    deviceOk: false,
    lastError: null,
  };

  try {
    // eslint-disable-next-line no-restricted-globals
    const hasGPU = typeof navigator !== 'undefined' && navigator && navigator.gpu && typeof navigator.gpu.requestAdapter === 'function';
    if (!hasGPU) {
      debug('WebGPU unavailable for instrumentation', {});
      return;
    }

    // eslint-disable-next-line no-restricted-globals
    const gpu = navigator.gpu;
    if (!gpu || typeof gpu.requestAdapter !== 'function') return;

    const originalRequestAdapter = gpu.requestAdapter.bind(gpu);
    // $FlowFixMe: override for debug instrumentation.
    gpu.requestAdapter = async (...args) => {
      webgpuStats.requestAdapterCalls += 1;
      try {
        const adapter = await originalRequestAdapter(...args);
        if (adapter) {
          webgpuStats.adapterOk = true;
          try {
            if (typeof adapter.requestDevice === 'function' && !adapter.__liveCaptionsInstrumented) {
              const originalRequestDevice = adapter.requestDevice.bind(adapter);
              // $FlowFixMe: override for debug instrumentation.
              adapter.requestDevice = async (...deviceArgs) => {
                webgpuStats.requestDeviceCalls += 1;
                try {
                  const device = await originalRequestDevice(...deviceArgs);
                  if (device) webgpuStats.deviceOk = true;
                  return device;
                } catch (e) {
                  webgpuStats.lastError = String(e && e.message ? e.message : e);
                  throw e;
                }
              };
              // $FlowFixMe
              adapter.__liveCaptionsInstrumented = true;
            }
          } catch {}
        }
        return adapter;
      } catch (e) {
        webgpuStats.lastError = String(e && e.message ? e.message : e);
        throw e;
      }
    };

    debug('Instrumented navigator.gpu.requestAdapter', {});
  } catch (e) {
    debug('Failed to instrument WebGPU', { error: String(e && e.message ? e.message : e) });
  }
}

function instrumentOffscreenCanvas() {
  if (offscreenInstrumented) return;
  offscreenInstrumented = true;
  try {
    if (typeof OffscreenCanvas === 'undefined') {
      debug('OffscreenCanvas unavailable', {});
      return;
    }
    const proto = OffscreenCanvas && OffscreenCanvas.prototype;
    if (!proto || typeof proto.getContext !== 'function') {
      debug('OffscreenCanvas.getContext unavailable', {});
      return;
    }

    seenOffscreenContexts = new Set();
    runtimeWebglContexts = new Set();
    const original = proto.getContext;
    // $FlowFixMe: override for debug instrumentation.
    proto.getContext = function getContext(type, ...args) {
      // $FlowFixMe
      const ctx = original.call(this, type, ...args);
      try {
        const norm = typeof type === 'string' ? type.toLowerCase() : '';
        if (norm === 'webgl' || norm === 'webgl2') {
          if (seenOffscreenContexts && !seenOffscreenContexts.has(norm)) {
            seenOffscreenContexts.add(norm);
          }
          if (!isWebglSupportProbe && runtimeWebglContexts && ctx && !runtimeWebglContexts.has(norm)) {
            runtimeWebglContexts.add(norm);
            debug('OffscreenCanvas.getContext called', { type: norm, ok: true });
          }
        }
      } catch {}
      return ctx;
    };

    debug('Instrumented OffscreenCanvas.getContext', {});
  } catch (e) {
    debug('Failed to instrument OffscreenCanvas', { error: String(e && e.message ? e.message : e) });
  }
}

function toFiniteNumberOrNull(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parseTimeStringToSeconds(v) {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s) return null;

  const asNumber = Number(s);
  if (Number.isFinite(asNumber)) return asNumber;

  const parts = s.split(':').map((x) => x.trim());
  if (parts.length !== 2 && parts.length !== 3) return null;

  const last = Number(parts[parts.length - 1]);
  const mid = Number(parts[parts.length - 2]);
  const first = parts.length === 3 ? Number(parts[0]) : 0;
  if (![first, mid, last].every((x) => Number.isFinite(x))) return null;

  return first * 3600 + mid * 60 + last;
}

function parseTimestampValue(v) {
  const asNumber = toFiniteNumberOrNull(v);
  if (asNumber !== null) return asNumber;
  const asTime = parseTimeStringToSeconds(v);
  return asTime !== null ? asTime : null;
}

function normalizeWasmNumThreads(v) {
  const n = toFiniteNumberOrNull(v);
  if (n === null) return null;
  const rounded = Math.round(n);
  if (!Number.isFinite(rounded) || rounded <= 0) return null;
  return Math.max(1, Math.min(16, rounded));
}

function normalizeDevice(v) {
  if (typeof v !== 'string') return null;
  const norm = v.trim().toLowerCase();
  return norm || null;
}

function describeSession(session) {
  try {
    const handler = session && session.handler;
    const handlerName = handler && handler.constructor ? handler.constructor.name : null;
    let backend = null;

    if (handler) {
      if (typeof handler.backend === 'string') {
        backend = handler.backend;
      } else if (handler.backend && typeof handler.backend.name === 'string') {
        backend = handler.backend.name;
      } else if (typeof handler.backendName === 'string') {
        backend = handler.backendName;
      }
    }

    if (!backend && handlerName && typeof handlerName === 'string') {
      if (/webgpu/i.test(handlerName)) backend = 'webgpu';
      else if (/webgl/i.test(handlerName)) backend = 'webgl';
      else if (/wasm/i.test(handlerName)) backend = 'wasm';
      else if (/cpu/i.test(handlerName)) backend = 'cpu';
    }

    return { backend, handlerName };
  } catch {
    return { backend: null, handlerName: null };
  }
}

function detectBackendInfo(pipelineInstance) {
  try {
    const hasNavigatorGPU =
      // eslint-disable-next-line no-restricted-globals
      typeof navigator !== 'undefined' && navigator && typeof navigator.gpu !== 'undefined' && !!navigator.gpu;
    // eslint-disable-next-line no-restricted-globals
    const isCOI = typeof self !== 'undefined' && typeof self.crossOriginIsolated === 'boolean' ? self.crossOriginIsolated : false;
    // eslint-disable-next-line no-restricted-globals
    const hasOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';

    const model = pipelineInstance && pipelineInstance.model;
    const sessions = [];
    const modelKeys = model && (typeof model === 'object' || typeof model === 'function') ? Object.keys(model) : [];
    const candidateKeys = new Set(
      modelKeys.concat([
        'session',
        'decoder_session',
        'encoder_session',
        'decoder_merged_session',
        'decoderMergedSession',
        'encoderSession',
        'decoderSession',
      ])
    );

    if (model && (typeof model === 'object' || typeof model === 'function')) {
      candidateKeys.forEach((k) => {
        try {
          const v = model[k];
          if (v && (typeof v === 'object' || typeof v === 'function') && typeof v.run === 'function') {
            const d = describeSession(v);
            sessions.push({ key: k, backend: d.backend, handlerName: d.handlerName });
          }
        } catch {}
      });
    }

    // Some builds hide sessions more deeply; do a bounded traversal to find more candidates.
    try {
      const visited = new Set();
      const queue = [{ value: model, path: 'model', depth: 0 }];
      const MAX_DEPTH = 4;
      const MAX_NODES = 800;
      while (queue.length && visited.size < MAX_NODES) {
        const { value, path, depth } = queue.shift();
        if (!value || (typeof value !== 'object' && typeof value !== 'function')) continue;
        if (visited.has(value)) continue;
        visited.add(value);

        try {
          if (typeof value.run === 'function') {
            const d = describeSession(value);
            sessions.push({ key: path, backend: d.backend, handlerName: d.handlerName });
          }
        } catch {}

        if (depth >= MAX_DEPTH) continue;
        let keys = [];
        try {
          keys = Object.keys(value);
        } catch {}
        for (let i = 0; i < Math.min(keys.length, 60); i++) {
          const k = keys[i];
          if (!k) continue;
          try {
            const child = value[k];
            queue.push({ value: child, path: `${path}.${k}`, depth: depth + 1 });
          } catch {}
        }
      }
    } catch {}

    const uniqueSessions = [];
    const seenKeys = new Set();
    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      const k = s && typeof s.key !== 'undefined' ? String(s.key) : '';
      if (!k || seenKeys.has(k)) continue;
      seenKeys.add(k);
      uniqueSessions.push(s);
      if (uniqueSessions.length >= 40) break;
    }

    const backends = uniqueSessions.map((s) => s.backend).filter(Boolean);
    const primary = backends.includes('webgpu')
      ? 'webgpu'
      : backends.includes('webgl')
        ? 'webgl'
        : backends.includes('wasm')
          ? 'wasm'
          : backends.includes('cpu')
            ? 'cpu'
            : backends[0] || null;

    let wasm = null;
    let webgl = null;
    let onnxAvailableBackends = null;
    let onnxExecutionProviders = null;
    let onnxHasWebgpu = false;
    try {
      const onnxEnv = env && env.backends && env.backends.onnx;
      if (onnxEnv && (typeof onnxEnv === 'object' || typeof onnxEnv === 'function')) {
        onnxAvailableBackends = Object.keys(onnxEnv).filter((k) => {
          try {
            const v = onnxEnv[k];
            return v && (typeof v === 'object' || typeof v === 'function');
          } catch {
            return false;
          }
        });
        // Some versions expose `executionProviders` on env; include for debugging.
        if (Array.isArray(onnxEnv.executionProviders)) {
          onnxExecutionProviders = onnxEnv.executionProviders.slice();
        }
        onnxHasWebgpu = !!onnxEnv.webgpu;
      }
      const wasmEnv = onnxEnv && onnxEnv.wasm;
      if (wasmEnv) {
        wasm = {
          numThreads: wasmEnv.numThreads,
          simd: typeof wasmEnv.simd !== 'undefined' ? wasmEnv.simd : 'auto',
          proxy: wasmEnv.proxy,
        };
      }
      const webglEnv = onnxEnv && onnxEnv.webgl;
      if (webglEnv) {
        webgl = {
          contextId: webglEnv.contextId,
          pack: webglEnv.pack,
          async: webglEnv.async,
          matmulMaxBatchSize: webglEnv.matmulMaxBatchSize,
          textureCacheMode: webglEnv.textureCacheMode,
        };
      }
    } catch {}

    let webglContext = null;
    try {
      // eslint-disable-next-line no-restricted-globals
      if (typeof OffscreenCanvas !== 'undefined') {
        // eslint-disable-next-line no-restricted-globals
        const canvas = new OffscreenCanvas(1, 1);
        isWebglSupportProbe = true;
        // $FlowFixMe: getContext exists but isn't in Flow's libdef here.
        const gl2 = canvas.getContext && canvas.getContext('webgl2');
        // $FlowFixMe
        const gl = gl2 || (canvas.getContext && canvas.getContext('webgl'));
        isWebglSupportProbe = false;

        let renderer = null;
        let vendor = null;
        let isSoftware = null;
        try {
          if (gl && typeof gl.getParameter === 'function') {
            const dbg = gl.getExtension && gl.getExtension('WEBGL_debug_renderer_info');
            const rendererParam = dbg && dbg.UNMASKED_RENDERER_WEBGL ? dbg.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
            const vendorParam = dbg && dbg.UNMASKED_VENDOR_WEBGL ? dbg.UNMASKED_VENDOR_WEBGL : gl.VENDOR;
            renderer = gl.getParameter(rendererParam);
            vendor = gl.getParameter(vendorParam);
            const rendererStr = renderer ? String(renderer) : '';
            isSoftware = /swiftshader|llvmpipe|software/i.test(rendererStr);
          }
        } catch {}

        webglContext = {
          supported: !!gl,
          contextType: gl2 ? 'webgl2' : gl ? 'webgl' : null,
          renderer,
          vendor,
          isSoftware,
        };
      } else {
        webglContext = { supported: false, contextType: null };
      }
    } catch {
      isWebglSupportProbe = false;
      webglContext = { supported: false, contextType: null };
    }

    const sessionsSummary = uniqueSessions.map((s) => `${String(s.key)}:${String(s.backend || 'unknown')}:${String(s.handlerName || '')}`);
    const runtimeWebgl = runtimeWebglContexts ? Array.from(runtimeWebglContexts) : [];

    let primaryOrNull = primary;

    // If WebGPU was successfully initialized (even if sessions are opaque), treat it as primary.
    const webgpuUsed = !!(webgpuStats && (webgpuStats.deviceOk || webgpuStats.adapterOk));
    if (!primaryOrNull && webgpuUsed) {
      primaryOrNull = 'webgpu';
    }

    if (!primaryOrNull && runtimeWebgl.length > 0) {
      primaryOrNull = 'webgl';
    } else if (!primaryOrNull) {
      // If we didn't see any GPU backend initialization, the remaining provider is WASM (CPU).
      primaryOrNull = 'wasm';
    }

    return {
      primary: primaryOrNull,
      sessions: uniqueSessions,
      sessionsSummary,
      modelKeys: modelKeys.slice(0, 30),
      apis: apis
        ? {
            IS_BROWSER_ENV: apis.IS_BROWSER_ENV,
            IS_WEBWORKER_ENV: apis.IS_WEBWORKER_ENV,
            IS_WEBGPU_AVAILABLE: apis.IS_WEBGPU_AVAILABLE,
            IS_WEBNN_AVAILABLE: apis.IS_WEBNN_AVAILABLE,
          }
        : null,
      hasNavigatorGPU,
      crossOriginIsolated: isCOI,
      hasOffscreenCanvas,
      hasSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
      webgpu: webgpuStats,
      ortAssets,
      onnx: {
        availableBackends: onnxAvailableBackends,
        executionProviders: onnxExecutionProviders,
        hasWebGPUBackend: onnxHasWebgpu,
      },
      wasm,
      webgl,
      webglContext,
      runtimeWebglContexts: runtimeWebgl,
    };
  } catch {
    return null;
  }
}

function buildTransformersCandidates(transformersUrl) {
  const urls = [];
  if (Array.isArray(transformersUrl)) {
    urls.push(...transformersUrl.filter(Boolean));
  } else if (typeof transformersUrl === 'string') {
    urls.push(transformersUrl);
  }

  const hasPrefix = (prefix) => urls.some((u) => typeof u === 'string' && u.startsWith(prefix));

  if (!hasPrefix('/public/transformers/transformers.js')) {
    urls.unshift('/public/transformers/transformers.js');
  }
  if (!hasPrefix('/public/transformers/transformers.min.js')) {
    urls.push('/public/transformers/transformers.min.js');
  }
  if (!urls.includes('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js')) {
    urls.push('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js');
  }
  if (!urls.includes('https://cdn.jsdelivr.net/npm/@huggingface/transformers/dist/transformers.min.js')) {
    urls.push('https://cdn.jsdelivr.net/npm/@huggingface/transformers/dist/transformers.min.js');
  }
  if (!urls.includes('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js')) {
    urls.push('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js');
  }
  if (!urls.includes('https://cdn.jsdelivr.net/npm/@xenova/transformers/dist/transformers.min.js')) {
    urls.push('https://cdn.jsdelivr.net/npm/@xenova/transformers/dist/transformers.min.js');
  }

  return urls;
}

function wasmBaseForTransformersUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('/public/transformers/')) return '/public/transformers/';

  // If importing from jsdelivr dist, assets still live in /dist/.
  const match = url.match(/^https:\/\/cdn\.jsdelivr\.net\/npm\/(@[^/]+\/transformers)(@[^/]+)?/);
  if (match) {
    const pkg = match[1];
    const suffix = match[2] || '';
    return `https://cdn.jsdelivr.net/npm/${pkg}${suffix}/dist/`;
  }

  return null;
}

async function loadTransformers(transformersUrl) {
  const candidates = buildTransformersCandidates(transformersUrl);
  const errors = [];

  for (let i = 0; i < candidates.length; i++) {
    const url = candidates[i];
    try {
      debug('Loading transformers runtime', { url });
      // Use ESM dynamic import (works in module workers; should also work in classic).
      // eslint-disable-next-line no-unused-vars
      const mod = await import(url);

      pipeline = (mod && mod.pipeline) || (mod && mod.default && mod.default.pipeline) || null;
      env = (mod && mod.env) || (mod && mod.default && mod.default.env) || null;
      apis = (mod && mod.apis) || (mod && mod.default && mod.default.apis) || null;

      // Some builds may attach to global scope instead of exporting.
      if ((!pipeline || !env) && self && self.transformers) {
        // eslint-disable-next-line no-restricted-globals
        const t = self.transformers;
        pipeline = pipeline || t.pipeline || null;
        env = env || t.env || null;
        apis = apis || t.apis || null;
      }

      if (!pipeline || !env) {
        throw new Error('Missing exports (pipeline/env)');
      }

      // Prefer remote models and browser caching.
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      // Ensure ONNX wasm assets resolve, even if the backend falls back from WebGPU.
      wasmBasePath = wasmBaseForTransformersUrl(url);
      if (wasmBasePath && env.backends && env.backends.onnx && env.backends.onnx.wasm) {
        env.backends.onnx.wasm.wasmPaths = wasmBasePath;
      }

      try {
        const wasmEnv = env && env.backends && env.backends.onnx && env.backends.onnx.wasm;
        if (wasmEnv && typeof wasmEnv.numThreads === 'number') {
          defaultWasmNumThreads = wasmEnv.numThreads;
        }
      } catch {}

      debug('Transformers runtime loaded', { url, wasmBasePath });
      return true;
    } catch (e) {
      debug('Transformers runtime load failed', { url, error: String(e && e.message ? e.message : e) });
      errors.push(`${url} -> ${String(e && e.message ? e.message : e)}`);
    }
  }

  post('error', { error: `Failed to load transformers:\n${errors.join('\n')}` });
  return false;
}

async function ensureInitialized({ model, transformersUrl, wasmNumThreads, device }) {
  const requestedThreads = normalizeWasmNumThreads(wasmNumThreads);
  const requestedDevice = normalizeDevice(device) || 'auto';

  if (debugEnabled || requestedDevice === 'auto' || requestedDevice === 'gpu' || requestedDevice === 'webgpu') {
    instrumentWebGPU();
  }
  if (debugEnabled) {
    instrumentFetch();
  }

  if (!pipeline || !env) {
    if (!initPromise) {
      initPromise = loadTransformers(transformersUrl);
    }
    const ok = await initPromise;
    if (!ok) return false;
  }

  const effectiveThreads = requestedThreads !== null ? requestedThreads : defaultWasmNumThreads;

  if (transcriber && currentModel === model && currentWasmNumThreads === effectiveThreads && currentDevice === requestedDevice) {
    return true;
  }

  try {
    const wasmEnv = env && env.backends && env.backends.onnx && env.backends.onnx.wasm;
    if (wasmEnv && effectiveThreads && typeof effectiveThreads === 'number') {
      wasmEnv.numThreads = effectiveThreads;
    }
    currentWasmNumThreads = effectiveThreads;

    if (debugEnabled && requestedThreads !== null) {
      // eslint-disable-next-line no-restricted-globals
      const isCOI = typeof self !== 'undefined' && typeof self.crossOriginIsolated === 'boolean' ? self.crossOriginIsolated : false;
      debug('WASM threads requested', {
        requested: requestedThreads,
        effective: effectiveThreads,
        crossOriginIsolated: isCOI,
        hasSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
      });
    }
  } catch {}

  currentModel = model;
  debug('Initializing ASR pipeline', { model, device: requestedDevice, wasmNumThreads: currentWasmNumThreads });
  if (debugEnabled) {
    instrumentOffscreenCanvas();
  }

  const basePipelineOptions = {
    quantized: true,
    progress_callback: (progress) => {
      const t = nowMs();
      if (!debugEnabled) return;
      if (t - lastProgressAt < 250) return;
      lastProgressAt = t;
      post('progress', progress);
    },
  };

  let deviceApplied = true;
  try {
    transcriber = await pipeline('automatic-speech-recognition', model, {
      ...basePipelineOptions,
      device: requestedDevice,
    });
  } catch (e) {
    // Backward compatibility: older Transformers.js builds may not support `device`.
    debug('ASR pipeline init failed (device), retrying without device', {
      model,
      device: requestedDevice,
      error: String(e && e.message ? e.message : e),
    });
    deviceApplied = false;
    transcriber = await pipeline('automatic-speech-recognition', model, basePipelineOptions);
  }
  currentDevice = requestedDevice;
  currentDeviceApplied = deviceApplied;
  debug('ASR pipeline ready', { model });
  return true;
}

self.onmessage = async (event) => {
  const msg = event && event.data;
  if (!msg || typeof msg.type !== 'string') return;

  try {
    if (msg.type === 'audio_shared') {
      if (msg.sharedAudio) setSharedAudioFromMessage(msg.sharedAudio);
      return;
    }

    if (msg.type === 'load') {
      if (typeof msg.debug === 'boolean') {
        debugEnabled = msg.debug;
      }
      if (msg.sharedAudio) setSharedAudioFromMessage(msg.sharedAudio);
      const ok = await ensureInitialized({
        model: msg.model || 'Xenova/whisper-tiny.en',
        device: msg.device,
        transformersUrl: msg.transformersUrl,
        wasmNumThreads: msg.wasmNumThreads,
      });
      if (ok) {
        const backendInfo = detectBackendInfo(transcriber);
        debug('Ready', {
          workerVersion: WORKER_VERSION,
          model: currentModel,
          device: currentDevice,
          deviceApplied: currentDeviceApplied,
          wasmBasePath,
          backendInfo,
        });
        post('ready', { workerVersion: WORKER_VERSION, model: currentModel, device: currentDevice, deviceApplied: currentDeviceApplied, wasmBasePath, backendInfo });
      }
      return;
    }

    if (msg.type === 'auto_start') {
      if (typeof msg.debug === 'boolean') {
        debugEnabled = msg.debug;
      }
      if (msg.sharedAudio) setSharedAudioFromMessage(msg.sharedAudio);
      autopull.config = normalizeAutopullConfig(msg);
      autopull.playing = msg.playing !== false;
      autopull.active = true;
      resetAutopullCounters();
      debug('Autopull start', {
        config: autopull.config,
        playing: autopull.playing,
        hasWaitAsync: typeof Atomics.waitAsync === 'function',
      });
      runAutopullLoop();
      post('autopull', { status: 'started', generation: autopull.generation });
      return;
    }

    if (msg.type === 'auto_stop') {
      autopull.active = false;
      debug('Autopull stop', {});
      post('autopull', { status: 'stopped', generation: autopull.generation });
      return;
    }

    if (msg.type === 'auto_playback') {
      const playing = !!msg.playing;
      autopull.playing = playing;
      if (msg.reset) resetAutopullCounters();
      debug('Autopull playback', { playing, reset: !!msg.reset });
      return;
    }

    if (msg.type === 'auto_config') {
      const update = msg && msg.config && typeof msg.config === 'object' ? msg.config : msg || {};
      autopull.config = normalizeAutopullConfig({ ...(autopull.config || {}), ...update });
      debug('Autopull config', { config: autopull.config });
      return;
    }

    if (msg.type === 'auto_reset') {
      resetAutopullCounters();
      debug('Autopull reset', {});
      return;
    }

    if (msg.type === 'transcribe') {
      const ok = await ensureInitialized({
        model: msg.model || currentModel || 'Xenova/whisper-tiny.en',
        device: msg.device,
        transformersUrl: msg.transformersUrl,
        wasmNumThreads: msg.wasmNumThreads,
      });
      if (!ok || !transcriber) return;

      const useShared = !!msg.useSharedAudio;
      const sharedCount = typeof msg.sampleCount === 'number' && Number.isFinite(msg.sampleCount) ? Math.max(0, Math.floor(msg.sampleCount)) : 0;
      const audio = useShared ? readSharedLast(sharedCount) : msg.audioBuffer ? new Float32Array(msg.audioBuffer) : null;
      if (!audio) {
        debug('No audio available for transcription', { useShared, sharedCount, hasAudioBuffer: !!msg.audioBuffer });
        return;
      }
      const t0 = nowMs();
      const output = await transcriber(audio, {
        // Some models only return timestamp chunks when using a string mode; `true` works in newer versions.
        return_timestamps: msg.returnTimestamps === 'word' || msg.returnTimestamps === 'char' ? msg.returnTimestamps : !!msg.returnTimestamps,
        sampling_rate: msg.sampleRate || 16000,
      });
      const t1 = nowMs();

      const chunks = Array.isArray(output && output.chunks) ? output.chunks : [];
      let segments = chunks.map((c) => {
        const ts = c && c.timestamp;
        const start = Array.isArray(ts) ? parseTimestampValue(ts[0]) : null;
        const end = Array.isArray(ts) ? parseTimestampValue(ts[1]) : null;
        return { start, end, text: c && c.text ? c.text : '' };
      });

      // Fallback: show *something* even if timestamps aren't available.
      if ((!segments || segments.length === 0) && output && typeof output.text === 'string' && output.text.trim()) {
        const sr = msg.sampleRate || 16000;
        const approxDuration =
          typeof msg.windowStart === 'number' && typeof msg.windowEnd === 'number'
            ? Math.max(0, msg.windowEnd - msg.windowStart)
            : audio.length / sr;
        segments = [{ start: 0, end: Math.max(1, approxDuration), text: output.text }];
      }

      debug('Transcribe done', {
        id: msg.id,
        samples: audio.length,
        sampleRate: msg.sampleRate || 16000,
        ms: Math.round(t1 - t0),
        hasChunks: chunks.length > 0,
        segments: segments ? segments.length : 0,
        usedSharedAudio: !!useShared,
        text: output && typeof output.text === 'string' ? output.text.slice(0, 80) : null,
      });

      post('result', {
        id: msg.id,
        windowStart: msg.windowStart,
        windowEnd: msg.windowEnd,
        segments,
        text: output && typeof output.text === 'string' ? output.text : '',
        inferenceMs: Math.round(t1 - t0),
      });
      return;
    }
  } catch (e) {
    debug('Worker error', { error: String(e && e.message ? e.message : e) });
    post('error', { error: String(e && e.message ? e.message : e) });
  }
};
