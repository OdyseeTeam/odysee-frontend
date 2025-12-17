// @flow
/* global SharedArrayBuffer, Atomics */
import videojs from 'video.js';
import { VJS_EVENTS } from 'constants/player';

const VERSION = '0.1.0';

const TARGET_SAMPLE_RATE = 16000;
const DEFAULT_CAPTURE_SECONDS = 30;
const DEFAULT_WINDOW_SECONDS = 4;
const DEFAULT_STEP_SECONDS = 2;
const DEFAULT_MAX_CUE_AGE_SECONDS = 10 * 60;
const TIMER_POLL_MS = 250;
const AUDIO_STALL_MS = 2000;
const AUDIO_RECONNECT_COOLDOWN_MS = 5000;
const DEFAULT_SKIP_SILENCE = true;
const DEFAULT_SILENCE_RMS_THRESHOLD = 0.002;
const DEFAULT_SILENCE_PEAK_THRESHOLD = 0.02;
const DEFAULT_VAD_SECONDS = 1;
const DEFAULT_VAD_HANGOVER_SECONDS = 2;
const DEFAULT_MAX_DUTY_CYCLE = 1;
const DEFAULT_RETURN_TIMESTAMPS = true;
const DEFAULT_CUE_LEAD_SECONDS = 0.05;
const DEFAULT_DEVICE = 'auto';
const DEFAULT_MODEL = 'Xenova/whisper-tiny.en';
const DEFAULT_TRANSFORMERS_URL = '/public/transformers/transformers.js';
const DEFAULT_WORKER_URL = '/public/whisper-live-captions-worker.js';
const DEFAULT_AUDIO_WORKLET_URL = '/public/whisper-live-captions-audio-worklet.js';
const DEFAULT_USE_SHARED_AUDIO = true;
const DEBUG_STORAGE_KEY = 'LIVE_CAPTIONS_DEBUG';

type Options = {
  enabled?: boolean,
  model?: string,
  device?: string,
  transformersUrl?: string,
  workerUrl?: string,
  windowSeconds?: number,
  stepSeconds?: number,
  workerAutopull?: boolean,
  maxCueAgeSeconds?: number,
  language?: string,
  cueLeadSeconds?: number,
  wasmNumThreads?: ?number,
  skipSilence?: boolean,
  silenceRmsThreshold?: number,
  silencePeakThreshold?: number,
  vadSeconds?: number,
  vadHangoverSeconds?: number,
  maxDutyCycle?: number,
  returnTimestamps?: boolean | 'word' | 'char',
  useSharedAudio?: boolean,
  audioWorkletUrl?: string,
  useAudioWorklet?: boolean,
  debug?: boolean,
};

const defaultOptions: Options = {
  enabled: false,
  model: DEFAULT_MODEL,
  device: DEFAULT_DEVICE,
  transformersUrl: DEFAULT_TRANSFORMERS_URL,
  workerUrl: DEFAULT_WORKER_URL,
  windowSeconds: DEFAULT_WINDOW_SECONDS,
  stepSeconds: DEFAULT_STEP_SECONDS,
  workerAutopull: true,
  maxCueAgeSeconds: DEFAULT_MAX_CUE_AGE_SECONDS,
  language: 'en',
  cueLeadSeconds: DEFAULT_CUE_LEAD_SECONDS,
  wasmNumThreads: null,
  skipSilence: DEFAULT_SKIP_SILENCE,
  silenceRmsThreshold: DEFAULT_SILENCE_RMS_THRESHOLD,
  silencePeakThreshold: DEFAULT_SILENCE_PEAK_THRESHOLD,
  vadSeconds: DEFAULT_VAD_SECONDS,
  vadHangoverSeconds: DEFAULT_VAD_HANGOVER_SECONDS,
  maxDutyCycle: DEFAULT_MAX_DUTY_CYCLE,
  returnTimestamps: DEFAULT_RETURN_TIMESTAMPS,
  useSharedAudio: DEFAULT_USE_SHARED_AUDIO,
  audioWorkletUrl: DEFAULT_AUDIO_WORKLET_URL,
  useAudioWorklet: true,
};

class LinearResampler {
  inRate: number;
  outRate: number;
  ratio: number;
  buffer: Float32Array;
  pos: number;

  constructor(inRate: number, outRate: number) {
    this.inRate = inRate;
    this.outRate = outRate;
    this.ratio = inRate / outRate;
    this.buffer = new Float32Array(0);
    this.pos = 0;
  }

  reset() {
    this.buffer = new Float32Array(0);
    this.pos = 0;
  }

  process(input: Float32Array): Float32Array {
    if (this.inRate === this.outRate) {
      return input;
    }

    const merged = new Float32Array(this.buffer.length + input.length);
    merged.set(this.buffer, 0);
    merged.set(input, this.buffer.length);

    let pos = this.pos;
    const outLength = Math.max(0, Math.floor((merged.length - pos - 1) / this.ratio));
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

class Float32RingBuffer {
  buffer: Float32Array;
  capacity: number;
  writeIndex: number;
  length: number;

  constructor(capacity: number) {
    this.buffer = new Float32Array(capacity);
    this.capacity = capacity;
    this.writeIndex = 0;
    this.length = 0;
  }

  reset() {
    this.writeIndex = 0;
    this.length = 0;
  }

  push(data: Float32Array) {
    if (!data || data.length === 0) return;

    const cap = this.capacity;
    const n = data.length;

    if (n >= cap) {
      // Keep only the newest `cap` samples.
      const tail = data.subarray(n - cap);
      this.buffer.set(tail, 0);
      this.writeIndex = 0;
      this.length = cap;
      return;
    }

    const firstPart = Math.min(n, cap - this.writeIndex);
    this.buffer.set(data.subarray(0, firstPart), this.writeIndex);

    const remaining = n - firstPart;
    if (remaining > 0) {
      this.buffer.set(data.subarray(firstPart), 0);
    }

    this.writeIndex = (this.writeIndex + n) % cap;
    this.length = Math.min(cap, this.length + n);
  }

  getLast(sampleCount: number): ?Float32Array {
    if (sampleCount <= 0) return null;
    if (this.length < sampleCount) return null;

    const cap = this.capacity;
    const start = (this.writeIndex - sampleCount + cap) % cap;
    const out = new Float32Array(sampleCount);

    if (start + sampleCount <= cap) {
      out.set(this.buffer.subarray(start, start + sampleCount), 0);
      return out;
    }

    const firstPart = cap - start;
    out.set(this.buffer.subarray(start, cap), 0);
    out.set(this.buffer.subarray(0, sampleCount - firstPart), firstPart);
    return out;
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function computeRmsPeak(input: Float32Array, stride: number = 8): { rms: number, peak: number } {
  if (!input || input.length === 0) return { rms: 0, peak: 0 };
  const step = Math.max(1, stride);
  let sum = 0;
  let peak = 0;
  let count = 0;
  for (let i = 0; i < input.length; i += step) {
    const v = input[i];
    const abs = v < 0 ? -v : v;
    sum += v * v;
    if (abs > peak) peak = abs;
    count += 1;
  }
  const denom = Math.max(1, count);
  return { rms: Math.sqrt(sum / denom), peak };
}

const SHARED_META_WRITE_INDEX = 0;
const SHARED_META_LENGTH = 1;
const SHARED_META_SEQ = 2;
const SHARED_META_CAPACITY = 3;
const SHARED_META_SAMPLE_RATE = 4;
const SHARED_META_TOTAL_SAMPLES = 5;
const SHARED_META_SIZE = 8;

function canUseSharedAudio(options: Options) {
  if (options && options.useSharedAudio === false) return false;
  try {
    // $FlowFixMe
    const coi =
      typeof window !== 'undefined' && typeof window.crossOriginIsolated === 'boolean'
        ? window.crossOriginIsolated
        : false;
    return coi && typeof SharedArrayBuffer !== 'undefined' && typeof Atomics !== 'undefined';
  } catch {
    return false;
  }
}

function canUseWorkerAutopull(options: Options) {
  if (options && options.workerAutopull === false) return false;
  return canUseSharedAudio(options);
}

function isDebugEnabled(options: Options) {
  if (options && options.debug === true) return true;
  if (options && options.debug === false) return false;

  try {
    // $FlowFixMe
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem(DEBUG_STORAGE_KEY) : null;
    if (!v) return false;
    const norm = String(v).toLowerCase();
    return norm === '1' || norm === 'true' || norm === 'yes' || norm === 'on';
  } catch {
    return false;
  }
}

function appendQuery(url: string, query: string) {
  if (!url) return url;
  if (!query) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}${query}`;
}

function trySetCrossOrigin(player: any) {
  try {
    const techEl = player?.tech_?.el && player.tech_.el();
    if (techEl && techEl.setAttribute) {
      techEl.setAttribute('crossorigin', 'anonymous');
      // $FlowFixMe
      techEl.crossOrigin = 'anonymous';
    }
  } catch {}
}

function getMediaElement(player: any): ?HTMLMediaElement {
  // $FlowFixMe: videojs tech element is an HTMLMediaElement (video or audio).
  const techEl = player?.tech_?.el && player.tech_.el();
  if (techEl && typeof techEl.tagName === 'string') {
    return techEl;
  }
  // Fallback: look inside the player element.
  // $FlowFixMe
  const el: ?HTMLElement = player?.el && player.el();
  // $FlowFixMe
  return el ? el.querySelector('video, audio') : null;
}

function isTrackInList(list: any, track: any): boolean {
  if (!list || typeof list.length !== 'number') return false;
  for (let i = 0; i < list.length; i++) {
    if (list[i] === track) return true;
  }
  return false;
}

function getRemoteTextTrackCandidates(player: any): Array<any> {
  if (!player) return [];
  try {
    // $FlowFixMe
    if (typeof player.remoteTextTrackEls === 'function') {
      const list = player.remoteTextTrackEls();
      if (list && typeof list.length === 'number') {
        const out = [];
        for (let i = 0; i < list.length; i++) out.push(list[i]);
        return out;
      }
    }
  } catch {}
  try {
    // $FlowFixMe
    if (typeof player.remoteTextTracks === 'function') {
      const list = player.remoteTextTracks();
      if (list && typeof list.length === 'number') {
        const out = [];
        for (let i = 0; i < list.length; i++) out.push(list[i]);
        return out;
      }
    }
  } catch {}
  return [];
}

function findRemoteTextTrackElByTrack(player: any, track: any): any {
  if (!player || !track) return null;
  try {
    // $FlowFixMe
    if (typeof player.remoteTextTrackEls === 'function') {
      const list = player.remoteTextTrackEls();
      if (list && typeof list.length === 'number') {
        for (let i = 0; i < list.length; i++) {
          const el = list[i];
          if (el && el.track === track) return el;
        }
      }
    }
  } catch {}
  return null;
}

function removeRemoteTextTrackSafe(player: any, remoteOrTrack: any): boolean {
  if (!player || !remoteOrTrack) return false;
  let removed = false;
  try {
    // $FlowFixMe
    if (typeof player.removeRemoteTextTrack === 'function') {
      player.removeRemoteTextTrack(remoteOrTrack);
      removed = true;
    }
  } catch {}

  const track = remoteOrTrack && remoteOrTrack.track ? remoteOrTrack.track : remoteOrTrack;
  const el = findRemoteTextTrackElByTrack(player, track);
  if (el && el !== remoteOrTrack) {
    try {
      // $FlowFixMe
      if (typeof player.removeRemoteTextTrack === 'function') {
        player.removeRemoteTextTrack(el);
        removed = true;
      }
    } catch {}
  }

  if (!removed && track && track !== remoteOrTrack) {
    try {
      // $FlowFixMe
      if (typeof player.removeRemoteTextTrack === 'function') {
        player.removeRemoteTextTrack(track);
        removed = true;
      }
    } catch {}
  }

  return removed;
}

function isCaptionsTrackAttached(player: any, track: any): boolean {
  if (!player || !track) return false;
  let checked = false;
  try {
    // $FlowFixMe
    if (typeof player.textTracks === 'function') {
      const list = player.textTracks();
      if (list && typeof list.length === 'number') {
        checked = true;
        if (isTrackInList(list, track)) return true;
      }
    }
  } catch {}
  try {
    // $FlowFixMe
    if (typeof player.remoteTextTrackEls === 'function') {
      const list = player.remoteTextTrackEls();
      if (list && typeof list.length === 'number') {
        checked = true;
        for (let i = 0; i < list.length; i++) {
          const remoteEl = list[i];
          if (!remoteEl) continue;
          if (remoteEl === track) return true;
          if (remoteEl.track === track) return true;
        }
      }
    }
  } catch {}
  try {
    // $FlowFixMe
    if (typeof player.remoteTextTracks === 'function') {
      const list = player.remoteTextTracks();
      if (list && typeof list.length === 'number') {
        checked = true;
        for (let i = 0; i < list.length; i++) {
          const remote = list[i];
          if (!remote) continue;
          if (remote === track) return true;
          if (remote.track === track) return true;
        }
      }
    }
  } catch {}
  // If we couldn't inspect any lists, assume attached to avoid duplicating tracks.
  return !checked;
}

function isLiveCaptionsTrack(track: any, label: string): boolean {
  if (!track) return false;
  try {
    // $FlowFixMe
    if (track.__liveCaptions === true) return true;
  } catch {}
  try {
    // $FlowFixMe
    const kind = typeof track.kind === 'string' ? track.kind : '';
    // $FlowFixMe
    const tl = typeof track.label === 'string' ? track.label : '';
    return kind === 'captions' && tl === label;
  } catch {
    return false;
  }
}

function isLiveCaptionsRemote(remote: any, label: string): boolean {
  if (!remote) return false;
  try {
    // $FlowFixMe
    if (remote.__liveCaptions === true) return true;
  } catch {}
  try {
    const track = remote.track || remote;
    if (isLiveCaptionsTrack(track, label)) return true;
  } catch {}
  try {
    // Some Video.js builds store metadata on the remote wrapper.
    // $FlowFixMe
    const rl = typeof remote.label === 'string' ? remote.label : '';
    return rl === label;
  } catch {
    return false;
  }
}

function getLiveCaptionsLabel(player: any): string {
  const existing = player && player.__liveCaptionsTrackLabel;
  if (existing && typeof existing === 'string') return existing;
  const label = __('Live captions (local)');
  if (player) player.__liveCaptionsTrackLabel = label;
  return label;
}

function dedupeLiveCaptionsRemoteTracks(player: any, label: string): any {
  if (!player || !label) return null;
  let kept = null;
  try {
    const list = getRemoteTextTrackCandidates(player);
    if (!list || typeof list.length !== 'number') return null;

    const preferred = player.__liveCaptionsRemoteTrack;
    if (preferred && isLiveCaptionsRemote(preferred, label)) {
      for (let i = 0; i < list.length; i++) {
        if (list[i] === preferred) {
          kept = preferred;
          break;
        }
      }
    }

    if (!kept && player.__liveCaptionsTrack) {
      const preferredTrack = player.__liveCaptionsTrack;
      for (let i = 0; i < list.length; i++) {
        const remote = list[i];
        if (!isLiveCaptionsRemote(remote, label)) continue;
        const rt = remote && remote.track ? remote.track : remote;
        if (rt === preferredTrack) {
          kept = remote;
          break;
        }
      }
    }

    for (let i = 0; i < list.length; i++) {
      const remote = list[i];
      if (!isLiveCaptionsRemote(remote, label)) continue;
      if (!kept) {
        kept = remote;
      } else {
        removeRemoteTextTrackSafe(player, remote);
      }
    }
  } catch {}
  if (kept && player) {
    try {
      // $FlowFixMe
      kept.__liveCaptions = true;
      // $FlowFixMe
      const kt = kept.track || kept;
      // $FlowFixMe
      if (kt) kt.__liveCaptions = true;
    } catch {}
    try {
      // Prefer storing the remote wrapper/element when available.
      // $FlowFixMe
      if (kept.track) player.__liveCaptionsRemoteTrack = kept;
      // $FlowFixMe
      player.__liveCaptionsTrack = kept.track || kept;
    } catch {}
  }
  return kept;
}

function removeAllLiveCaptionsRemoteTracks(player: any) {
  if (!player) return;
  const label = getLiveCaptionsLabel(player);
  try {
    const list = getRemoteTextTrackCandidates(player);
    if (list && typeof list.length === 'number') {
      for (let i = list.length - 1; i >= 0; i--) {
        const remote = list[i];
        if (!isLiveCaptionsRemote(remote, label)) continue;
        removeRemoteTextTrackSafe(player, remote);
      }
    }
  } catch {}
  try {
    delete player.__liveCaptionsTrack;
    delete player.__liveCaptionsRemoteTrack;
  } catch {}
}

function createOrReuseCaptionsTrack(player: any, language: string) {
  const label = getLiveCaptionsLabel(player);

  // Remove duplicates first and reuse an existing track if present.
  const keptRemote = dedupeLiveCaptionsRemoteTracks(player, label);
  const keptTrack = keptRemote && (keptRemote.track || keptRemote);
  if (keptTrack && isCaptionsTrackAttached(player, keptTrack)) {
    player.__liveCaptionsTrack = keptTrack;
    if (keptRemote && keptRemote.track) {
      player.__liveCaptionsRemoteTrack = keptRemote;
    }
    try {
      // $FlowFixMe
      if (keptRemote) keptRemote.__liveCaptions = true;
      // $FlowFixMe
      keptTrack.__liveCaptions = true;
    } catch {}
    return keptTrack;
  }

  // Reuse a cached reference (avoid creating duplicates while Video.js is still wiring track lists).
  if (player.__liveCaptionsTrack) {
    const cached = player.__liveCaptionsTrack;
    if (isCaptionsTrackAttached(player, cached)) return cached;
    try {
      delete player.__liveCaptionsTrack;
      delete player.__liveCaptionsRemoteTrack;
    } catch {}
  }

  // Reuse any already-attached track (e.g. after tech swaps).
  try {
    // $FlowFixMe
    if (typeof player.textTracks === 'function') {
      const list = player.textTracks();
      if (list && typeof list.length === 'number') {
        for (let i = 0; i < list.length; i++) {
          const t = list[i];
          if (isLiveCaptionsTrack(t, label)) {
            player.__liveCaptionsTrack = t;
            try {
              // $FlowFixMe
              t.__liveCaptions = true;
              // $FlowFixMe
              t.mode = 'showing';
            } catch {}
            return t;
          }
        }
      }
    }
  } catch {}

  const remote = player.addRemoteTextTrack(
    {
      kind: 'captions',
      label,
      language,
    },
    false
  );
  const track = remote && remote.track;
  if (track) {
    // $FlowFixMe
    track.mode = 'showing';
    player.__liveCaptionsTrack = track;
    player.__liveCaptionsRemoteTrack = remote;
    try {
      // $FlowFixMe
      remote.__liveCaptions = true;
      // $FlowFixMe
      track.__liveCaptions = true;
    } catch {}
  }
  return track;
}

function removeCuesFromTime(track: any, fromTime: number) {
  const cues = track && track.cues;
  if (!cues || typeof cues.length !== 'number') return;

  for (let i = cues.length - 1; i >= 0; i--) {
    const cue = cues[i];
    if (cue && cue.endTime >= fromTime) {
      try {
        track.removeCue(cue);
      } catch {}
    }
  }
}

function ensureCaptionsTrackShowing(player: any, language: string) {
  const track = createOrReuseCaptionsTrack(player, language);
  if (!track) return null;
  try {
    // $FlowFixMe
    track.mode = 'showing';
  } catch {}
  // Some Video.js menu components may immediately disable newly-added tracks based on prior selection.
  // Re-assert async to keep live captions visible.
  try {
    setTimeout(() => {
      try {
        // $FlowFixMe
        if (track && track.mode !== 'showing') track.mode = 'showing';
      } catch {}
      tryUpdateTextTrackDisplay(player);
    }, 0);
  } catch {}
  return track;
}

function tryUpdateTextTrackDisplay(player: any) {
  if (!player) return;
  try {
    // $FlowFixMe
    const display =
      (typeof player.getChild === 'function' && player.getChild('TextTrackDisplay')) || player.textTrackDisplay;
    if (display && typeof display.updateDisplay === 'function') {
      display.updateDisplay();
    }
  } catch {}
}

function pruneOldCues(track: any, minEndTime: number) {
  const cues = track && track.cues;
  if (!cues || typeof cues.length !== 'number') return;

  for (let i = cues.length - 1; i >= 0; i--) {
    const cue = cues[i];
    if (cue && cue.endTime < minEndTime) {
      try {
        track.removeCue(cue);
      } catch {}
    }
  }
}

function liveCaptions(options: Options = {}) {
  const player: any = this;

  trySetCrossOrigin(player);

  if (player.__liveCaptionsApi) {
    if (options && typeof options === 'object') {
      player.__liveCaptionsApi.updateOptions(options);
      if (typeof options.enabled === 'boolean') {
        options.enabled ? player.__liveCaptionsApi.enable() : player.__liveCaptionsApi.disable();
      }
    }
    return player.__liveCaptionsApi;
  }

  const merged: Options = videojs.mergeOptions(defaultOptions, options || {});

  const state: any = {
    enabled: false,
    worker: null,
    workerReady: false,
    workerLoading: false,
    inflight: false,
    inflightRequestId: null,
    requestId: 0,
    timerId: null,
    throttleUntilMs: 0,
    lastSendWallMs: 0,
    voiceHangoverUntil: 0,
    audioContext: null,
    mediaElement: null,
    mediaStream: null,
    sourceNode: null,
    processorNode: null,
    resampler: null,
    ring: new Float32RingBuffer(DEFAULT_CAPTURE_SECONDS * TARGET_SAMPLE_RATE),
    options: merged,
    debugLastStatus: '',
    debugLastAudioAt: 0,
    debugLastAudioRms: 0,
    debugLastAudioPeak: 0,
    debugLastVadRms: 0,
    debugLastVadPeak: 0,
    debugLastInSamples: 0,
    debugLastOutSamples: 0,
    debugTotalOutSamples: 0,
    backendInfo: null,
    revQuery: '',
    forceAudioReconnect: false,
    forceAudioReconnectReason: '',
    lastAudioGraphRestartWallMs: 0,
    lastCurrentSrc: '',
    sharedAudio: null,
    sharedVadStride: 8,
    workletNode: null,
    workletLoadPromise: null,
    workletFailed: false,
    autopullActive: false,
    lastPlaybackPlaying: null,
    debugLastWorkletStatsAt: 0,
    debugLastWorkletSeq: null,
    debugLastWorkletTotalSamples: null,
    debugLastWorkletRingLength: null,
    hasEverPlayed: false,
    srcChangeCount: 0,
  };

  function debugLog(...args: Array<any>) {
    if (!isDebugEnabled(state.options)) return;
    // eslint-disable-next-line no-console
    console.log('[LiveCaptions]', ...args);
  }

  function debugSetStatus(status: string, data?: any) {
    if (!isDebugEnabled(state.options)) return;
    if (status === state.debugLastStatus) return;
    state.debugLastStatus = status;
    debugLog(status, data);
  }

  function triggerState(enabled: boolean) {
    try {
      player.trigger(VJS_EVENTS.LIVE_CAPTIONS_STATE, enabled);
    } catch {}
  }

  function ensureWorker() {
    if (state.worker || state.workerLoading) return;

    state.workerLoading = true;

    const buildRev = process.env.BUILD_REV || '';
    if (!state.revQuery) {
      const devCacheBust = process.env.NODE_ENV === 'development' ? `cb=${Date.now()}` : '';
      state.revQuery = devCacheBust ? `rev=${buildRev}&${devCacheBust}` : `rev=${buildRev}`;
    }
    const revQuery = state.revQuery;
    const workerUrl = appendQuery(state.options.workerUrl || DEFAULT_WORKER_URL, revQuery);
    // $FlowFixMe
    const worker = new Worker(workerUrl, { type: 'module' });
    state.worker = worker;
    debugLog('Worker created', { workerUrl });

    worker.onmessage = (event) => {
      const msg: any = event && event.data;
      if (!msg || typeof msg.type !== 'string') return;

      if (msg.type === 'ready') {
        state.workerReady = true;
        state.workerLoading = false;
        state.backendInfo = msg.backendInfo || null;
        debugLog('Worker ready', msg);
        startAutopullIfPossible();
        if (state.backendInfo) {
          const bi = state.backendInfo;
          debugLog('Backend info', {
            primary: bi.primary,
            apis: bi.apis || null,
            sessionsSummary: bi.sessionsSummary || null,
            runtimeWebglContexts: bi.runtimeWebglContexts || null,
            crossOriginIsolated: bi.crossOriginIsolated,
            hasNavigatorGPU: bi.hasNavigatorGPU,
            hasOffscreenCanvas: bi.hasOffscreenCanvas,
            hasSharedArrayBuffer: bi.hasSharedArrayBuffer,
            webgpu: bi.webgpu || null,
            ortAssets: bi.ortAssets || null,
            onnx: bi.onnx || null,
            webglContext: bi.webglContext || null,
            wasm: bi.wasm || null,
            webgl: bi.webgl || null,
          });
        }
      } else if (msg.type === 'result') {
        debugLog('Worker result', {
          autopull: !!msg.autopull,
          id: msg.id,
          segments: Array.isArray(msg.segments) ? msg.segments.length : null,
          text: typeof msg.text === 'string' ? msg.text.slice(0, 80) : null,
        });

        const isAutopullMessage = !!msg.autopull || (state.autopullActive && state.inflightRequestId === null);
        if (isAutopullMessage) {
          handleResult(msg);
          return;
        }

        const shouldApply = state.inflightRequestId !== null && msg.id === state.inflightRequestId;
        state.inflight = false;
        state.inflightRequestId = null;
        if (shouldApply) {
          handleResult(msg);
        }
      } else if (msg.type === 'progress') {
        debugLog('Worker progress', msg);
      } else if (msg.type === 'debug') {
        debugLog('Worker debug', msg);
      } else if (msg.type === 'autopull') {
        debugLog('Worker autopull', msg);
      } else if (msg.type === 'audio_watchdog') {
        debugLog('Worker audio_watchdog', msg);
        if (state.enabled) {
          state.forceAudioReconnect = true;
          state.forceAudioReconnectReason = `worker_watchdog_${msg && msg.reason ? String(msg.reason) : 'unknown'}`;
          resetForTimeDiscontinuity();
          ensureAudioGraph();
          startAutopullIfPossible();
        }
      } else if (msg.type === 'error') {
        state.inflight = false;
        state.inflightRequestId = null;
        state.workerLoading = false;
        state.workerReady = false;
        debugSetStatus('worker_error', msg && msg.error);
        // eslint-disable-next-line no-console
        console.error('Live captions worker error:', msg.error || msg);
      }
    };

    worker.onerror = (err) => {
      state.inflight = false;
      state.inflightRequestId = null;
      state.workerLoading = false;
      state.workerReady = false;
      debugSetStatus('worker_failed', err);
      // eslint-disable-next-line no-console
      console.error('Live captions worker failed:', err);
    };

    worker.postMessage({
      type: 'load',
      model: state.options.model || DEFAULT_MODEL,
      device: state.options.device || DEFAULT_DEVICE,
      transformersUrl: appendQuery(state.options.transformersUrl || DEFAULT_TRANSFORMERS_URL, revQuery),
      debug: isDebugEnabled(state.options),
      wasmNumThreads: state.options.wasmNumThreads,
      sharedAudio:
        state.sharedAudio && state.sharedAudio.meta && state.sharedAudio.samples
          ? {
              meta: state.sharedAudio.meta,
              samples: state.sharedAudio.samples,
              capacity: state.sharedAudio.capacity,
              sampleRate: TARGET_SAMPLE_RATE,
            }
          : null,
    });
  }

  function initSharedAudioIfPossible() {
    if (state.sharedAudio) return;
    if (!canUseSharedAudio(state.options)) return;

    try {
      const capacity = DEFAULT_CAPTURE_SECONDS * TARGET_SAMPLE_RATE;
      // $FlowFixMe
      const samples = new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * capacity);
      // $FlowFixMe
      const meta = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * SHARED_META_SIZE);
      const metaView = new Int32Array(meta);
      Atomics.store(metaView, SHARED_META_WRITE_INDEX, 0);
      Atomics.store(metaView, SHARED_META_LENGTH, 0);
      Atomics.store(metaView, SHARED_META_SEQ, 0);
      Atomics.store(metaView, SHARED_META_CAPACITY, capacity);
      Atomics.store(metaView, SHARED_META_SAMPLE_RATE, TARGET_SAMPLE_RATE);
      Atomics.store(metaView, SHARED_META_TOTAL_SAMPLES, 0);

      state.sharedAudio = { meta, samples, capacity, metaView, samplesView: new Float32Array(samples) };
      debugLog('shared_audio_ready', { capacity, sampleRate: TARGET_SAMPLE_RATE });

      try {
        if (state.worker) {
          state.worker.postMessage({
            type: 'audio_shared',
            sharedAudio: { meta, samples, capacity, sampleRate: TARGET_SAMPLE_RATE },
          });
        }
      } catch {}

      startAutopullIfPossible();
    } catch (e) {
      debugLog('shared_audio_failed', { error: String(e && e.message ? e.message : e) });
      state.sharedAudio = null;
    }
  }

  function sharedWrite(samples: Float32Array) {
    const shared = state.sharedAudio;
    if (!shared || !samples || samples.length === 0) return;

    const cap = shared.capacity;
    const meta = shared.metaView;
    const buf = shared.samplesView;
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

  function sharedReset() {
    const shared = state.sharedAudio;
    if (!shared) return;
    try {
      Atomics.add(shared.metaView, SHARED_META_SEQ, 1);
      Atomics.store(shared.metaView, SHARED_META_WRITE_INDEX, 0);
      Atomics.store(shared.metaView, SHARED_META_LENGTH, 0);
      Atomics.store(shared.metaView, SHARED_META_TOTAL_SAMPLES, 0);
      Atomics.add(shared.metaView, SHARED_META_SEQ, 1);
      Atomics.notify(shared.metaView, SHARED_META_SEQ, 1);
    } catch {}
  }

  function sharedSnapshot() {
    const shared = state.sharedAudio;
    if (!shared) return null;
    const meta = shared.metaView;
    const cap = shared.capacity;

    for (let i = 0; i < 6; i++) {
      const seq1 = Atomics.load(meta, SHARED_META_SEQ);
      if (seq1 & 1) continue;
      const writeIndex = Atomics.load(meta, SHARED_META_WRITE_INDEX);
      const len = Atomics.load(meta, SHARED_META_LENGTH);
      const seq2 = Atomics.load(meta, SHARED_META_SEQ);
      if (seq1 === seq2 && !(seq2 & 1)) return { writeIndex, len, cap, seq: seq2 };
    }

    return {
      writeIndex: Atomics.load(meta, SHARED_META_WRITE_INDEX),
      len: Atomics.load(meta, SHARED_META_LENGTH),
      cap,
      seq: Atomics.load(meta, SHARED_META_SEQ),
    };
  }

  function sharedComputeRmsPeak(sampleCount: number, stride: number = 8) {
    const shared = state.sharedAudio;
    if (!shared) return { rms: 0, peak: 0 };

    const snap = sharedSnapshot();
    if (!snap || snap.len < sampleCount || sampleCount <= 0) return { rms: 0, peak: 0 };

    const cap = snap.cap;
    const start = (snap.writeIndex - sampleCount + cap) % cap;
    const step = Math.max(1, stride);
    let sum = 0;
    let peak = 0;
    let count = 0;

    for (let i = 0; i < sampleCount; i += step) {
      const idx = (start + i) % cap;
      const v = shared.samplesView[idx];
      const abs = v < 0 ? -v : v;
      sum += v * v;
      if (abs > peak) peak = abs;
      count += 1;
    }

    const denom = Math.max(1, count);
    return { rms: Math.sqrt(sum / denom), peak };
  }

  function sharedAudioPayload() {
    return state.sharedAudio && state.sharedAudio.meta && state.sharedAudio.samples
      ? {
          meta: state.sharedAudio.meta,
          samples: state.sharedAudio.samples,
          capacity: state.sharedAudio.capacity,
          sampleRate: TARGET_SAMPLE_RATE,
        }
      : null;
  }

  function autopullConfigPayload() {
    const opts = state.options || {};
    return {
      windowSeconds: opts.windowSeconds || DEFAULT_WINDOW_SECONDS,
      stepSeconds: opts.stepSeconds || DEFAULT_STEP_SECONDS,
      vadSeconds: typeof opts.vadSeconds === 'number' ? opts.vadSeconds : DEFAULT_VAD_SECONDS,
      vadHangoverSeconds:
        typeof opts.vadHangoverSeconds === 'number' ? opts.vadHangoverSeconds : DEFAULT_VAD_HANGOVER_SECONDS,
      skipSilence: opts.skipSilence !== false,
      silenceRmsThreshold:
        typeof opts.silenceRmsThreshold === 'number' ? opts.silenceRmsThreshold : DEFAULT_SILENCE_RMS_THRESHOLD,
      silencePeakThreshold:
        typeof opts.silencePeakThreshold === 'number' ? opts.silencePeakThreshold : DEFAULT_SILENCE_PEAK_THRESHOLD,
      maxDutyCycle: typeof opts.maxDutyCycle === 'number' ? opts.maxDutyCycle : DEFAULT_MAX_DUTY_CYCLE,
      returnTimestamps:
        typeof opts.returnTimestamps !== 'undefined' ? opts.returnTimestamps : DEFAULT_RETURN_TIMESTAMPS,
      model: opts.model || DEFAULT_MODEL,
      device: opts.device || DEFAULT_DEVICE,
      transformersUrl: appendQuery(opts.transformersUrl || DEFAULT_TRANSFORMERS_URL, state.revQuery),
      wasmNumThreads: opts.wasmNumThreads,
    };
  }

  function sendAutopullPlayback(playing: boolean, reset: boolean = false) {
    if (!state.autopullActive || !state.worker) return;
    if (state.lastPlaybackPlaying === playing && !reset) return;
    state.lastPlaybackPlaying = playing;
    try {
      state.worker.postMessage({ type: 'auto_playback', playing: !!playing, reset: !!reset });
    } catch {}
  }

  function sendAutopullReset() {
    if (!state.autopullActive || !state.worker) return;
    try {
      state.worker.postMessage({ type: 'auto_reset' });
    } catch {}
  }

  function stopAutopull() {
    if (!state.autopullActive) return;
    state.autopullActive = false;
    state.lastPlaybackPlaying = null;
    try {
      if (state.worker) state.worker.postMessage({ type: 'auto_stop' });
    } catch {}
    if (state.enabled) startTimer();
  }

  function startAutopullIfPossible() {
    if (!state.enabled) return;
    if (!state.worker || !state.workerReady) return;
    if (!state.sharedAudio) return;
    if (!canUseWorkerAutopull(state.options)) {
      stopAutopull();
      return;
    }

    const playing = (() => {
      try {
        // $FlowFixMe
        return !(player && typeof player.paused === 'function' ? player.paused() : false);
      } catch {
        return true;
      }
    })();

    const payload = {
      type: 'auto_start',
      debug: isDebugEnabled(state.options),
      playing,
      config: autopullConfigPayload(),
      sharedAudio: sharedAudioPayload(),
    };

    try {
      if (!state.autopullActive) {
        state.autopullActive = true;
        stopTimer();
        state.worker.postMessage(payload);
      } else {
        state.worker.postMessage({ type: 'auto_config', config: autopullConfigPayload() });
      }
    } catch {}

    sendAutopullPlayback(playing);
  }

  function ensureAudioGraph() {
    initSharedAudioIfPossible();
    const mediaEl = getMediaElement(player);
    if (!mediaEl) {
      debugSetStatus('no_media_element');
      return;
    }

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) {
      debugSetStatus('no_audiocontext');
      return;
    }

    const nowWallMs = Date.now();

    // Reuse an existing AudioContext if we already created one.
    // $FlowFixMe
    let ctx: any = state.audioContext;
    try {
      if (ctx && ctx.state === 'closed') {
        ctx = null;
        state.audioContext = null;
        state.workletNode = null;
        state.workletLoadPromise = null;
      }
    } catch {}

    if (!ctx) {
      try {
        // Try to avoid extra resampling work by requesting 16kHz.
        // $FlowFixMe
        ctx = new AudioContextCtor({ sampleRate: TARGET_SAMPLE_RATE });
      } catch {
        // $FlowFixMe
        ctx = new AudioContextCtor();
      }
      state.audioContext = ctx;
      debugLog('AudioContext created', {
        requestedSampleRate: TARGET_SAMPLE_RATE,
        sampleRate: ctx.sampleRate,
        state: ctx.state,
      });
    }

    if (!state.resampler || state.resampler.inRate !== (ctx.sampleRate || 48000)) {
      state.resampler = new LinearResampler(ctx.sampleRate || 48000, TARGET_SAMPLE_RATE);
    }

    function ensureScriptProcessor() {
      if (state.processorNode) return;
      try {
        // $FlowFixMe
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        state.processorNode = processor;

        processor.onaudioprocess = (e) => {
          if (!state.enabled) return;
          if (!e || !e.inputBuffer) return;
          try {
            const input = e.inputBuffer.getChannelData(0);
            state.debugLastInSamples = input ? input.length : 0;

            // Lightweight RMS/peak sampling for debugging.
            if (input && input.length) {
              let sum = 0;
              let peak = 0;
              const stride = 16;
              for (let i = 0; i < input.length; i += stride) {
                const v = input[i];
                sum += v * v;
                const av = Math.abs(v);
                if (av > peak) peak = av;
              }
              const denom = Math.max(1, Math.floor(input.length / stride));
              state.debugLastAudioRms = Math.sqrt(sum / denom);
              state.debugLastAudioPeak = peak;
              state.debugLastAudioAt = Date.now();
            }

            const chunk16k = state.resampler ? state.resampler.process(input) : input;
            if (chunk16k && chunk16k.length) {
              if (state.sharedAudio) {
                sharedWrite(chunk16k);
              } else {
                state.ring.push(chunk16k);
              }
              state.debugLastOutSamples = chunk16k.length;
              state.debugTotalOutSamples += chunk16k.length;
            }
          } catch {}
        };

        try {
          processor.connect(ctx.destination);
        } catch {}
      } catch (err) {
        debugSetStatus('audio_capture_failed', err);
        // eslint-disable-next-line no-console
        console.error('Live captions audio capture failed:', err);
      }
    }

    const wantsWorklet = !!state.sharedAudio && state.options.useAudioWorklet !== false;
    // $FlowFixMe
    const canWorklet =
      wantsWorklet && !state.workletFailed && ctx.audioWorklet && typeof AudioWorkletNode !== 'undefined';

    if (canWorklet) {
      // Ensure worklet module is loaded, then attach the node. (No ScriptProcessorNode needed.)
      if (!state.workletNode && !state.workletLoadPromise) {
        const workletUrl = appendQuery(state.options.audioWorkletUrl || DEFAULT_AUDIO_WORKLET_URL, state.revQuery);
        debugLog('loading_audio_worklet', { workletUrl });
        state.workletLoadPromise = ctx.audioWorklet
          .addModule(workletUrl)
          .then(() => {
            state.workletLoadPromise = null;
            if (!state.enabled) return;
            if (!state.sharedAudio) return;
            if (state.workletNode) return;

            try {
              // $FlowFixMe
              const node = new AudioWorkletNode(ctx, 'whisper-live-captions-audio', {
                numberOfInputs: 1,
                numberOfOutputs: 1,
                outputChannelCount: [1],
                processorOptions: {
                  sharedAudio: {
                    meta: state.sharedAudio.meta,
                    samples: state.sharedAudio.samples,
                    capacity: state.sharedAudio.capacity,
                    sampleRate: TARGET_SAMPLE_RATE,
                  },
                  targetSampleRate: TARGET_SAMPLE_RATE,
                  debug: isDebugEnabled(state.options),
                },
              });
              state.workletNode = node;

              try {
                node.port.onmessage = (e) => {
                  const data = e && e.data;
                  if (!data || typeof data.type !== 'string') return;
                  if (data.type === 'stats') {
                    state.debugLastAudioAt = Date.now();
                    if (typeof data.rms === 'number') state.debugLastAudioRms = data.rms;
                    if (typeof data.peak === 'number') state.debugLastAudioPeak = data.peak;
                    if (typeof data.inputSamples === 'number') state.debugLastInSamples = data.inputSamples;
                    if (typeof data.outputSamples === 'number') state.debugLastOutSamples = data.outputSamples;
                    if (typeof data.seq === 'number') state.debugLastWorkletSeq = data.seq;
                    if (typeof data.totalSamples === 'number') state.debugLastWorkletTotalSamples = data.totalSamples;
                    if (typeof data.ringLength === 'number') state.debugLastWorkletRingLength = data.ringLength;

                    const nowWall = Date.now();
                    if (
                      isDebugEnabled(state.options) &&
                      (!state.debugLastWorkletStatsAt || nowWall - state.debugLastWorkletStatsAt > 2000)
                    ) {
                      state.debugLastWorkletStatsAt = nowWall;
                      debugLog('audio_worklet_stats', {
                        rms: state.debugLastAudioRms,
                        peak: state.debugLastAudioPeak,
                        seq: state.debugLastWorkletSeq,
                        totalSamples: state.debugLastWorkletTotalSamples,
                        ringLength: state.debugLastWorkletRingLength,
                        inSamples: state.debugLastInSamples,
                        outSamples: state.debugLastOutSamples,
                      });
                    }
                  }
                };
              } catch {}

              try {
                // Keep the worklet alive by connecting to destination (it outputs silence).
                node.connect(ctx.destination);
              } catch {}

              // Connect source if we already have one.
              try {
                if (state.sourceNode) {
                  // $FlowFixMe
                  state.sourceNode.disconnect();
                  // $FlowFixMe
                  state.sourceNode.connect(node);
                }
              } catch {}

              // Drop the ScriptProcessor fallback once the worklet is ready (reduce main-thread cost).
              try {
                if (state.processorNode) {
                  // $FlowFixMe
                  state.processorNode.onaudioprocess = null;
                  // $FlowFixMe
                  state.processorNode.disconnect();
                }
              } catch {}
              state.processorNode = null;

              debugLog('audio_worklet_ready', {
                targetSampleRate: TARGET_SAMPLE_RATE,
                audioContextSampleRate: ctx.sampleRate,
              });
            } catch (e) {
              state.workletFailed = true;
              debugSetStatus('audio_worklet_failed', { error: String(e && e.message ? e.message : e) });
              try {
                setTimeout(() => {
                  if (state.enabled) ensureAudioGraph();
                }, 0);
              } catch {}
            }
          })
          .catch((err) => {
            state.workletLoadPromise = null;
            state.workletFailed = true;
            debugSetStatus('audio_worklet_failed', err);
            try {
              setTimeout(() => {
                if (state.enabled) ensureAudioGraph();
              }, 0);
            } catch {}
          });
      }

      // While the worklet is loading, keep a ScriptProcessor fallback connected so the shared ring starts filling.
      if (!state.workletNode) {
        ensureScriptProcessor();
      }
    } else {
      // Ensure a ScriptProcessorNode exists (fallback).
      ensureScriptProcessor();
    }

    function hasLiveAudioTracks(stream: any) {
      try {
        // $FlowFixMe
        const tracks = stream && stream.getAudioTracks ? stream.getAudioTracks() : [];
        if (!tracks || tracks.length === 0) return false;
        return tracks.some((t) => t && t.readyState === 'live');
      } catch {
        return false;
      }
    }

    const mediaChanged = state.mediaElement && state.mediaElement !== mediaEl;
    const streamIsValid = state.mediaStream && hasLiveAudioTracks(state.mediaStream);
    const shouldReconnect = !!state.forceAudioReconnect || mediaChanged || !streamIsValid || !state.sourceNode;

    if (shouldReconnect) {
      if (
        state.lastAudioGraphRestartWallMs &&
        nowWallMs - state.lastAudioGraphRestartWallMs < AUDIO_RECONNECT_COOLDOWN_MS
      ) {
        return;
      }
      state.lastAudioGraphRestartWallMs = nowWallMs;

      debugLog('restarting_audio_graph', {
        reason:
          state.forceAudioReconnectReason ||
          (mediaChanged ? 'media_changed' : !streamIsValid ? 'stream_invalid' : 'unknown'),
        mediaChanged: !!mediaChanged,
        hadStream: !!state.mediaStream,
      });

      // Detach previous source/stream (keep the AudioContext and processor alive).
      try {
        if (state.sourceNode) {
          // $FlowFixMe
          state.sourceNode.disconnect();
        }
      } catch {}
      state.sourceNode = null;
      state.mediaStream = null;
      state.mediaElement = mediaEl;
      state.ring.reset();
      sharedReset();

      try {
        // Prefer captureStream so we don't interfere with the player's audio output.
        // $FlowFixMe
        const stream =
          (mediaEl && mediaEl.captureStream && mediaEl.captureStream()) ||
          // $FlowFixMe
          (mediaEl && mediaEl.mozCaptureStream && mediaEl.mozCaptureStream()) ||
          null;

        if (!stream) {
          throw new Error('captureStream() unsupported');
        }

        state.mediaStream = stream;
        try {
          // $FlowFixMe
          const tracks = stream.getAudioTracks ? stream.getAudioTracks() : [];
          debugLog('captureStream', { audioTracks: tracks ? tracks.length : 0 });
          if (!tracks || tracks.length === 0) {
            debugSetStatus('no_audio_tracks_in_captureStream');
          } else {
            tracks.forEach((t) => {
              try {
                if (t) {
                  // $FlowFixMe
                  t.onended = () => {
                    state.forceAudioReconnect = true;
                    state.forceAudioReconnectReason = 'audio_track_ended';
                    // If we are in worker-autopull mode (no polling), proactively reconnect.
                    try {
                      setTimeout(() => {
                        if (state.enabled) {
                          ensureAudioGraph();
                          startAutopullIfPossible();
                        }
                      }, 0);
                    } catch {}
                  };
                }
              } catch {}
            });
          }
        } catch {}

        // $FlowFixMe
        const source = ctx.createMediaStreamSource(stream);
        state.sourceNode = source;

        try {
          if (canWorklet && state.workletNode) {
            // $FlowFixMe
            source.connect(state.workletNode);
          } else if (state.processorNode) {
            // $FlowFixMe
            source.connect(state.processorNode);
          }
        } catch {}

        state.forceAudioReconnect = false;
        state.forceAudioReconnectReason = '';
      } catch (err) {
        state.forceAudioReconnect = true;
        state.forceAudioReconnectReason = state.forceAudioReconnectReason || 'audio_capture_failed';
        debugSetStatus('audio_capture_failed', err);
        // eslint-disable-next-line no-console
        console.error('Live captions audio capture failed:', err);
      }
    }

    try {
      // $FlowFixMe
      if (ctx && ctx.state === 'suspended' && ctx.resume) ctx.resume();
    } catch {}
  }

  function stopAudioGraph() {
    try {
      if (state.processorNode) {
        // $FlowFixMe
        state.processorNode.onaudioprocess = null;
        // $FlowFixMe
        state.processorNode.disconnect();
      }
    } catch {}

    try {
      if (state.workletNode) {
        // $FlowFixMe
        state.workletNode.disconnect();
      }
    } catch {}

    try {
      if (state.sourceNode) {
        // $FlowFixMe
        state.sourceNode.disconnect();
      }
    } catch {}

    try {
      if (state.audioContext && state.audioContext.close) {
        state.audioContext.close();
      }
    } catch {}

    state.audioContext = null;
    state.mediaElement = null;
    state.mediaStream = null;
    state.sourceNode = null;
    state.processorNode = null;
    state.resampler = null;
    state.workletNode = null;
    state.workletLoadPromise = null;
    state.ring.reset();
    sharedReset();
  }

  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function startTimer() {
    if (state.autopullActive) return;
    if (state.timerId) return;
    state.timerId = setInterval(tick, TIMER_POLL_MS);
  }

  function tick() {
    if (!state.enabled) return;
    if (state.autopullActive) return;
    if (!state.workerReady) {
      debugSetStatus('waiting_worker_ready', { workerLoading: state.workerLoading });
      return;
    }
    if (state.inflight) {
      debugSetStatus('waiting_inflight');
      return;
    }

    const mediaEl = getMediaElement(player) || state.mediaElement;
    if (!mediaEl) {
      debugSetStatus('no_media_element');
      return;
    }
    if (mediaEl.paused) {
      debugSetStatus('paused');
      return;
    }

    const nowWallMs = Date.now();

    let currentSrc = '';
    try {
      // Prefer Video.js API (handles tech swapping), then fall back to the element.
      // $FlowFixMe
      currentSrc =
        (typeof player.currentSrc === 'function' && player.currentSrc()) || mediaEl.currentSrc || mediaEl.src || '';
    } catch {}
    if (currentSrc && state.lastCurrentSrc && currentSrc !== state.lastCurrentSrc) {
      state.forceAudioReconnect = true;
      state.forceAudioReconnectReason = 'current_src_changed';
      resetForTimeDiscontinuity();
    }
    if (currentSrc) state.lastCurrentSrc = currentSrc;

    if (state.debugLastAudioAt && nowWallMs - state.debugLastAudioAt > AUDIO_STALL_MS) {
      state.forceAudioReconnect = true;
      state.forceAudioReconnectReason = 'audio_stalled';
    }

    ensureAudioGraph();

    if (state.throttleUntilMs && nowWallMs < state.throttleUntilMs) {
      debugSetStatus('throttled', { msLeft: state.throttleUntilMs - nowWallMs });
      return;
    }

    const stepSeconds = clamp(state.options.stepSeconds || DEFAULT_STEP_SECONDS, 0.5, 10);
    if (state.lastSendWallMs && nowWallMs - state.lastSendWallMs < stepSeconds * 1000) {
      debugSetStatus('waiting_step', { stepSeconds });
      return;
    }

    const windowSeconds = clamp(state.options.windowSeconds || DEFAULT_WINDOW_SECONDS, 2, 30);
    const neededSamples = Math.floor(windowSeconds * TARGET_SAMPLE_RATE);
    const now = player.currentTime();
    if (!isFinite(now)) {
      debugSetStatus('invalid_currentTime', { now });
      return;
    }

    const useShared = !!state.sharedAudio && canUseSharedAudio(state.options);
    let audio: any = null;

    if (useShared) {
      const snap = sharedSnapshot();
      const haveSeconds = snap ? snap.len / TARGET_SAMPLE_RATE : 0;
      if (!snap || snap.len < neededSamples) {
        debugSetStatus('buffering_audio', { haveSeconds, needSeconds: windowSeconds });
        return;
      }
    } else {
      audio = state.ring.getLast(neededSamples);
      if (!audio) {
        const haveSeconds = state.ring.length / TARGET_SAMPLE_RATE;
        debugSetStatus('buffering_audio', { haveSeconds, needSeconds: windowSeconds });
        return;
      }
    }

    const silenceRmsThreshold = clamp(
      typeof state.options.silenceRmsThreshold === 'number'
        ? state.options.silenceRmsThreshold
        : DEFAULT_SILENCE_RMS_THRESHOLD,
      0,
      1
    );
    const silencePeakThreshold = clamp(
      typeof state.options.silencePeakThreshold === 'number'
        ? state.options.silencePeakThreshold
        : DEFAULT_SILENCE_PEAK_THRESHOLD,
      0,
      1
    );
    const vadSeconds = clamp(
      typeof state.options.vadSeconds === 'number' ? state.options.vadSeconds : DEFAULT_VAD_SECONDS,
      0.05,
      windowSeconds
    );
    const vadSamples = Math.max(1, Math.floor(vadSeconds * TARGET_SAMPLE_RATE));
    const vad = useShared
      ? sharedComputeRmsPeak(vadSamples, state.sharedVadStride || 8)
      : computeRmsPeak(audio.subarray(Math.max(0, audio.length - vadSamples)), 8);
    state.debugLastVadRms = vad.rms;
    state.debugLastVadPeak = vad.peak;

    const isSilent = vad.rms < silenceRmsThreshold && vad.peak < silencePeakThreshold;
    const hangoverSeconds = clamp(
      typeof state.options.vadHangoverSeconds === 'number'
        ? state.options.vadHangoverSeconds
        : DEFAULT_VAD_HANGOVER_SECONDS,
      0,
      10
    );
    if (!isSilent) {
      state.voiceHangoverUntil = Math.max(state.voiceHangoverUntil, now + hangoverSeconds);
    } else if (state.options.skipSilence !== false && now > state.voiceHangoverUntil) {
      debugSetStatus('skipping_silence', {
        windowSeconds,
        vadSeconds,
        rms: vad.rms,
        peak: vad.peak,
        silenceRmsThreshold,
        silencePeakThreshold,
      });
      return;
    }

    const windowStart = Math.max(0, now - windowSeconds);
    state.inflight = true;
    state.requestId += 1;
    const id = state.requestId;
    state.inflightRequestId = id;
    const prevSendWallMs = state.lastSendWallMs;
    state.lastSendWallMs = nowWallMs;
    debugSetStatus('sending', {
      id,
      now,
      windowStart,
      windowSeconds,
      stepSeconds,
      sinceLastSendMs: prevSendWallMs ? nowWallMs - prevSendWallMs : null,
      samples: useShared ? neededSamples : audio.length,
      rms: state.debugLastAudioRms,
      peak: state.debugLastAudioPeak,
      vadRms: state.debugLastVadRms,
      vadPeak: state.debugLastVadPeak,
      lastAudioMsAgo: state.debugLastAudioAt ? Date.now() - state.debugLastAudioAt : null,
    });

    const returnTimestamps: any =
      typeof state.options.returnTimestamps !== 'undefined' ? state.options.returnTimestamps : true;

    // Transfer the buffer to avoid a clone cost.
    state.worker &&
      (useShared
        ? state.worker.postMessage({
            type: 'transcribe',
            id,
            useSharedAudio: true,
            sampleCount: neededSamples,
            sampleRate: TARGET_SAMPLE_RATE,
            windowStart,
            windowEnd: now,
            returnTimestamps,
            model: state.options.model || DEFAULT_MODEL,
            device: state.options.device || DEFAULT_DEVICE,
            transformersUrl: appendQuery(state.options.transformersUrl || DEFAULT_TRANSFORMERS_URL, state.revQuery),
            wasmNumThreads: state.options.wasmNumThreads,
          })
        : state.worker.postMessage(
            {
              type: 'transcribe',
              id,
              audioBuffer: audio.buffer,
              sampleRate: TARGET_SAMPLE_RATE,
              windowStart,
              windowEnd: now,
              returnTimestamps,
              model: state.options.model || DEFAULT_MODEL,
              device: state.options.device || DEFAULT_DEVICE,
              transformersUrl: appendQuery(state.options.transformersUrl || DEFAULT_TRANSFORMERS_URL, state.revQuery),
              wasmNumThreads: state.options.wasmNumThreads,
            },
            // $FlowFixMe
            [audio.buffer]
          ));
  }

  function handleResult(msg: any) {
    const {
      windowStart,
      windowEnd,
      segments,
      text: rawText,
      inferenceMs,
      autopull,
      audioWindowStart,
      audioWindowEnd,
      vadRms,
      vadPeak,
    } = msg || {};
    if (!state.enabled) return;

    const maxDutyCycle = clamp(
      typeof state.options.maxDutyCycle === 'number' ? state.options.maxDutyCycle : DEFAULT_MAX_DUTY_CYCLE,
      0.1,
      1
    );
    if (maxDutyCycle < 1 && typeof inferenceMs === 'number' && isFinite(inferenceMs) && inferenceMs > 0) {
      const idleMs = Math.max(0, Math.round(inferenceMs * (1 / maxDutyCycle - 1)));
      if (idleMs > 0) {
        state.throttleUntilMs = Date.now() + idleMs;
      }
    }

    const segs = Array.isArray(segments) ? segments : [];
    if (segs.length === 0 && (!rawText || typeof rawText !== 'string' || !rawText.trim())) {
      debugSetStatus('empty_result');
      return;
    }

    const track = ensureCaptionsTrackShowing(player, state.options.language || 'en');
    if (!track) {
      debugSetStatus('no_text_track');
      return;
    }

    const applyNow = player.currentTime();
    const endTime = typeof windowEnd === 'number' && isFinite(windowEnd) ? windowEnd : applyNow;
    const cueLeadSeconds = clamp(
      typeof state.options.cueLeadSeconds === 'number' ? state.options.cueLeadSeconds : DEFAULT_CUE_LEAD_SECONDS,
      0,
      1
    );
    const latencySeconds = isFinite(applyNow) && isFinite(endTime) ? Math.max(0, applyNow - endTime) : null;

    debugSetStatus('received', {
      windowStart,
      windowEnd,
      applyNow,
      latencySeconds,
      inferenceMs: typeof inferenceMs === 'number' ? inferenceMs : null,
      autopull: !!autopull,
      audioWindowStart: typeof audioWindowStart === 'number' ? audioWindowStart : null,
      audioWindowEnd: typeof audioWindowEnd === 'number' ? audioWindowEnd : null,
      vadRms: typeof vadRms === 'number' ? vadRms : null,
      vadPeak: typeof vadPeak === 'number' ? vadPeak : null,
      segments: segs.length,
      text: typeof rawText === 'string' ? rawText.slice(0, 80) : null,
    });

    const duration = player.duration && player.duration();
    const maxEnd = isFinite(duration) ? duration : Number.POSITIVE_INFINITY;

    const CueCtor = window.VTTCue || window.WebKitVTTCue || window.TextTrackCue;
    if (!CueCtor) {
      debugSetStatus('no_cue_ctor');
      return;
    }

    const stepSeconds = clamp(state.options.stepSeconds || DEFAULT_STEP_SECONDS, 0.5, 10);
    const inferenceSeconds = typeof inferenceMs === 'number' && isFinite(inferenceMs) ? inferenceMs / 1000 : 0;
    const holdSeconds = clamp(Math.max(stepSeconds, inferenceSeconds) + 0.25, 0.5, 15);

    const mergedText =
      typeof rawText === 'string' && rawText.trim()
        ? rawText.trim()
        : segs
            .map((s) => (s && typeof s.text === 'string' ? s.text.trim() : ''))
            .filter(Boolean)
            .join(' ')
            .trim();

    if (!mergedText) {
      debugSetStatus('empty_result');
      return;
    }

    const start = isFinite(applyNow) ? Math.max(0, applyNow - cueLeadSeconds) : 0;
    let end = isFinite(applyNow) ? Math.max(start + 0.05, applyNow + holdSeconds) : Math.max(start + 0.05, start + 2);

    if (isFinite(maxEnd)) {
      if (start >= maxEnd) return;
      end = Math.min(end, maxEnd);
    }

    const cueStart = start;
    const cueEnd = Math.max(end, cueStart + 0.05);

    // Keep a single rolling cue for "live" captions (avoid missing text when the model returns many segments).
    removeCuesFromTime(track, 0);

    if (cueStart <= maxEnd) {
      try {
        // $FlowFixMe
        const cue = new CueCtor(cueStart, cueEnd, mergedText);
        track.addCue(cue);
        tryUpdateTextTrackDisplay(player);
        if (isDebugEnabled(state.options)) {
          debugLog('Cue applied', {
            cueStart,
            cueEnd,
            applyNow,
            text: mergedText.slice(0, 80),
            mode: track && track.mode,
          });
        }
      } catch (e) {
        debugLog('Failed to add cue', {
          start: cueStart,
          end: cueEnd,
          text: mergedText,
          error: String(e && e.message ? e.message : e),
        });
      }
    }

    // Prune any leftover cues (should be near-zero since we clear each tick).
    const maxAge = state.options.maxCueAgeSeconds || DEFAULT_MAX_CUE_AGE_SECONDS;
    const pruneNow = isFinite(applyNow) ? applyNow : isFinite(endTime) ? endTime : 0;
    const minEndTime = Math.max(0, pruneNow - maxAge);
    pruneOldCues(track, minEndTime);
    debugLog('Track cues', { count: track && track.cues ? track.cues.length : null });
  }

  function resetForTimeDiscontinuity() {
    if (!state.enabled) return;
    state.inflight = false;
    state.inflightRequestId = null;
    state.throttleUntilMs = 0;
    state.lastSendWallMs = 0;
    state.voiceHangoverUntil = 0;
    state.ring.reset();
    sharedReset();
    sendAutopullReset();
    ensureCaptionsTrackShowing(player, state.options.language || 'en');
    tryUpdateTextTrackDisplay(player);
    const track = player.__liveCaptionsTrack;
    if (track) {
      removeCuesFromTime(track, 0);
    }
  }

  function enable() {
    if (state.enabled) return;
    state.enabled = true;
    triggerState(true);

    ensureCaptionsTrackShowing(player, state.options.language || 'en');

    ensureWorker();
    ensureAudioGraph();
    startAutopullIfPossible();
    startTimer();
  }

  function disable() {
    if (!state.enabled) return;
    state.enabled = false;
    state.inflight = false;
    state.inflightRequestId = null;
    state.throttleUntilMs = 0;
    state.lastSendWallMs = 0;
    state.voiceHangoverUntil = 0;
    triggerState(false);
    stopAutopull();
    stopTimer();
    stopAudioGraph();

    const track = player.__liveCaptionsTrack;
    if (track) {
      // $FlowFixMe
      track.mode = 'disabled';
    }
  }

  function toggle() {
    state.enabled ? disable() : enable();
  }

  function destroy() {
    disable();
    removeAllLiveCaptionsRemoteTracks(player);
    try {
      if (state.worker) state.worker.terminate();
    } catch {}
    state.worker = null;
    state.workerReady = false;
    state.workerLoading = false;
    delete player.__liveCaptionsApi;
  }

  function updateOptions(next: Options) {
    const prevStep = state.options && state.options.stepSeconds;
    const prevModel = state.options && state.options.model;
    const prevDevice = state.options && state.options.device;
    const prevTransformersUrl = state.options && state.options.transformersUrl;
    const prevDebug = isDebugEnabled(state.options);
    const prevWasmNumThreads = state.options && state.options.wasmNumThreads;

    state.options = videojs.mergeOptions(state.options || {}, next || {});
    const nextStep = state.options && state.options.stepSeconds;
    if (state.enabled && !state.autopullActive && prevStep !== nextStep) {
      stopTimer();
      startTimer();
    }
    if (state.enabled) {
      startAutopullIfPossible();
    }

    const nextModel = state.options && state.options.model;
    const nextDevice = state.options && state.options.device;
    const nextTransformersUrl = state.options && state.options.transformersUrl;
    const nextDebug = isDebugEnabled(state.options);
    const nextWasmNumThreads = state.options && state.options.wasmNumThreads;

    const shouldReloadWorker =
      prevModel !== nextModel ||
      prevDevice !== nextDevice ||
      prevTransformersUrl !== nextTransformersUrl ||
      prevDebug !== nextDebug ||
      prevWasmNumThreads !== nextWasmNumThreads;

    if (shouldReloadWorker && state.worker) {
      state.workerReady = false;
      state.workerLoading = true;
      state.inflight = false;
      state.inflightRequestId = null;
      debugSetStatus('reloading_worker', {
        model: nextModel || DEFAULT_MODEL,
        device: nextDevice || DEFAULT_DEVICE,
        wasmNumThreads: nextWasmNumThreads,
      });
      try {
        state.worker.postMessage({
          type: 'load',
          model: nextModel || DEFAULT_MODEL,
          device: nextDevice || DEFAULT_DEVICE,
          transformersUrl: appendQuery(nextTransformersUrl || DEFAULT_TRANSFORMERS_URL, state.revQuery),
          debug: nextDebug,
          wasmNumThreads: nextWasmNumThreads,
          sharedAudio:
            state.sharedAudio && state.sharedAudio.meta && state.sharedAudio.samples
              ? {
                  meta: state.sharedAudio.meta,
                  samples: state.sharedAudio.samples,
                  capacity: state.sharedAudio.capacity,
                  sampleRate: TARGET_SAMPLE_RATE,
                }
              : null,
        });
      } catch {}
    }
  }

  const api = {
    enable,
    disable,
    toggle,
    destroy,
    isEnabled: () => state.enabled,
    updateOptions,
  };

  player.__liveCaptionsApi = api;

  player.on(VJS_EVENTS.PLAYER_CLOSED, () => {
    stopAutopull();
    stopTimer();
    stopAudioGraph();
    state.inflight = false;
    state.inflightRequestId = null;
    state.throttleUntilMs = 0;
    state.lastSendWallMs = 0;
    state.voiceHangoverUntil = 0;
  });

  player.on(VJS_EVENTS.SRC_CHANGED, () => {
    state.srcChangeCount += 1;
    state.forceAudioReconnect = true;
    state.forceAudioReconnectReason = 'src_changed';
    if (!state.enabled) return;
    resetForTimeDiscontinuity();
    ensureAudioGraph();
    startAutopullIfPossible();
    // Tech swaps can temporarily detach tracks; re-assert once the new media is ready.
    try {
      setTimeout(() => {
        if (!state.enabled) return;
        ensureCaptionsTrackShowing(player, state.options.language || 'en');
        tryUpdateTextTrackDisplay(player);
      }, 300);
    } catch {}
  });

  player.on('seeking', resetForTimeDiscontinuity);
  player.on('ratechange', resetForTimeDiscontinuity);
  player.on('play', () => {
    state.hasEverPlayed = true;
    if (!state.enabled) return;
    ensureAudioGraph();
    startAutopullIfPossible();
    sendAutopullPlayback(true);
    ensureCaptionsTrackShowing(player, state.options.language || 'en');
    tryUpdateTextTrackDisplay(player);
  });
  player.on('pause', () => {
    if (!state.enabled) return;
    sendAutopullPlayback(false);
  });
  player.on('loadedmetadata', () => {
    if (!state.enabled) return;
    ensureCaptionsTrackShowing(player, state.options.language || 'en');
    tryUpdateTextTrackDisplay(player);
  });
  player.on('loadeddata', () => {
    if (!state.enabled) return;
    ensureCaptionsTrackShowing(player, state.options.language || 'en');
    tryUpdateTextTrackDisplay(player);
  });
  player.on('loadstart', () => {
    if (!state.enabled) return;
    // Tech swaps can temporarily detach tracks; re-assert after the new media is ready.
    ensureCaptionsTrackShowing(player, state.options.language || 'en');
    tryUpdateTextTrackDisplay(player);
    try {
      setTimeout(() => {
        if (!state.enabled) return;
        ensureCaptionsTrackShowing(player, state.options.language || 'en');
        tryUpdateTextTrackDisplay(player);
      }, 300);
    } catch {}
  });

  if (merged.enabled) {
    enable();
  } else {
    triggerState(false);
  }

  return api;
}

videojs.registerPlugin('liveCaptions', liveCaptions);
liveCaptions.VERSION = VERSION;

export default liveCaptions;
