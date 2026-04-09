import React from 'react';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import { useAppDispatch, useAppSelector } from 'redux/hooks';
import { useNavigate } from 'react-router-dom';
import { doToast } from 'redux/actions/notifications';
import { getLivestreamWhipIngestUrl } from 'constants/livestream';
import {
  getWebrtcPublishEncodingOptions,
  getWebrtcPublishVideoConstraints,
  type WebrtcPublishVideoCodecPreference,
} from 'constants/webrtcPublish';
import { platform } from 'util/platform';
import { startWhipPublish, updateWhipVideoEncodingPolicy } from 'util/livestreamWhip';
import { LIVESTREAM_SERVER_API } from 'config';
import { useLivestreamPublish } from 'contexts/livestreamPublish';
import * as SETTINGS from 'constants/settings';
import { selectClientSetting } from 'redux/selectors/settings';
import { doSetClientSetting } from 'redux/actions/settings';
import { selectPrefsReady } from 'redux/selectors/sync';
import usePersistedState from 'effects/use-persisted-state';
import {
  makeSelectLivestreamsForChannelId,
  selectViewersForId,
  selectActiveLivestreamForChannel,
} from 'redux/selectors/livestream';
import { doFetchChannelIsLiveForId } from 'redux/actions/livestream';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectClaimIdForUri } from 'redux/selectors/claims';
import ClaimPreview from 'component/claimPreview';
import LivestreamP2PSeed from 'component/livestreamP2PSeed';
import LivestreamConnectingAnimation from 'component/livestreamConnectingAnimation';
import useLivestreamMetrics from 'effects/use-livestream-metrics';
import classnames from 'classnames';
import describeUnknown from 'util/describeUnknown';
import LivestreamSourceSelector from 'component/livestreamSourceSelector/view';
import type { VideoSource, AudioSource } from 'component/livestreamSourceSelector/view';
import LivestreamCompositor from 'component/livestreamCompositor/view';
import LivestreamCropSelector from 'component/livestreamCropSelector/view';
import LivestreamSourceSettings from 'component/livestreamSourceSettings/view';
import type { CompositorLayer } from 'component/livestreamCompositor/view';
import { AudioMixer } from 'util/audioMixer';
import './style.scss';

type Props = {
  streamKey: string | null;
  livestreamEnabled: boolean;
  hasApprovedLivestreamClaim: boolean;
  presetId: import('constants/webrtcPublish').WebrtcPublishPresetId;
  signature?: string;
  signingTs?: string;
};

type Status = 'idle' | 'requesting_permission' | 'preview' | 'connecting' | 'live' | 'stopping' | 'error';
type MediaTrackConstraintsWithResizeMode = MediaTrackConstraints & {
  resizeMode?: 'none' | 'crop-and-scale';
};

const STUDIO_DEBUG = process.env.NODE_ENV === 'development';

function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === 'AbortError';
}

function formatBitrate(value: number | null): string {
  if (value == null) return '--';
  if (value >= 1000) return `${(value / 1000).toFixed(1)} Mbps`;
  return `${Math.round(value)} kbps`;
}

function formatCodecLabel(mimeType: string, sdpFmtpLine?: string): string {
  const lowerMime = mimeType.toLowerCase();
  if (lowerMime === 'video/h264') {
    if (sdpFmtpLine?.toLowerCase().includes('profile-level-id=42e01f')) return 'H.264 (baseline)';
    return 'H.264';
  }
  const codec = mimeType.split('/')[1] || mimeType;
  if (codec.toLowerCase() === 'opus') return 'Opus';
  return codec.toUpperCase();
}

function computeBitrateKbps(
  currentBytes: number | undefined,
  previousBytes: number | undefined,
  currentTimestampMs: number | undefined,
  previousTimestampMs: number | undefined
): number | null {
  if (
    currentBytes == null ||
    previousBytes == null ||
    currentTimestampMs == null ||
    previousTimestampMs == null ||
    currentTimestampMs <= previousTimestampMs
  )
    return null;
  const byteDiff = currentBytes - previousBytes;
  const secondDiff = (currentTimestampMs - previousTimestampMs) / 1000;
  if (byteDiff < 0 || secondDiff <= 0) return null;
  return (byteDiff * 8) / secondDiff / 1000;
}

function getIdealConstraintValue(value: ConstrainULong | ConstrainDouble | undefined): number | null {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'ideal' in value && typeof value.ideal === 'number') {
    return value.ideal;
  }
  return null;
}

function getCameraConstraintAttempts(
  presetId: import('constants/webrtcPublish').WebrtcPublishPresetId,
  facingMode?: 'user' | 'environment'
): MediaTrackConstraints[] {
  const base = getWebrtcPublishVideoConstraints(presetId, facingMode) as MediaTrackConstraintsWithResizeMode;
  const targetWidth = getIdealConstraintValue(base.width);
  const targetHeight = getIdealConstraintValue(base.height);
  const targetFps = getIdealConstraintValue(base.frameRate);
  const sharedCameraPrefs = {
    facingMode: base.facingMode,
  } satisfies Partial<MediaTrackConstraintsWithResizeMode>;

  if (!targetWidth || !targetHeight || !targetFps) return [base];

  const exactNativeMode = {
    ...sharedCameraPrefs,
    width: { exact: targetWidth },
    height: { exact: targetHeight },
    frameRate: { exact: targetFps },
    resizeMode: 'none',
  } satisfies MediaTrackConstraintsWithResizeMode;

  const strictNativeMode = {
    ...sharedCameraPrefs,
    width: { exact: targetWidth },
    height: { exact: targetHeight },
    frameRate: { min: targetFps, ideal: targetFps },
    resizeMode: 'none',
  } satisfies MediaTrackConstraintsWithResizeMode;

  const exactVgaMode = {
    ...sharedCameraPrefs,
    width: { exact: 640 },
    height: { exact: 480 },
    frameRate: { exact: targetFps },
    resizeMode: 'none',
  } satisfies MediaTrackConstraintsWithResizeMode;

  const strictVgaMode = {
    ...sharedCameraPrefs,
    width: { exact: 640 },
    height: { exact: 480 },
    frameRate: { min: targetFps, ideal: targetFps },
    resizeMode: 'none',
  } satisfies MediaTrackConstraintsWithResizeMode;

  const strictBaseScalable = {
    ...base,
    frameRate: { min: targetFps, ideal: targetFps },
  } satisfies MediaTrackConstraintsWithResizeMode;

  const lowerResolutionStrictScalable = {
    ...sharedCameraPrefs,
    width: { ideal: 854 },
    height: { ideal: 480 },
    frameRate: { min: targetFps, ideal: targetFps },
  } satisfies MediaTrackConstraintsWithResizeMode;

  const lowerResolutionSoftScalable = {
    ...sharedCameraPrefs,
    width: { ideal: 854 },
    height: { ideal: 480 },
    frameRate: { ideal: targetFps },
  } satisfies MediaTrackConstraintsWithResizeMode;

  const forgivingBase = {
    ...sharedCameraPrefs,
    width: { ideal: targetWidth },
    height: { ideal: targetHeight },
    frameRate: { ideal: targetFps },
  } satisfies MediaTrackConstraints;

  return [
    exactNativeMode,
    strictNativeMode,
    exactVgaMode,
    strictVgaMode,
    strictBaseScalable,
    base,
    lowerResolutionStrictScalable,
    lowerResolutionSoftScalable,
    forgivingBase,
  ];
}

function logCameraTrackInfo(track: MediaStreamTrack | undefined) {
  if (!track) return;

  const settings = track.getSettings();
  const capabilities = typeof track.getCapabilities === 'function' ? track.getCapabilities() : undefined;

  if (STUDIO_DEBUG) console.log('[Studio] Camera settings:', settings); // eslint-disable-line no-console
  if (capabilities) {
    if (STUDIO_DEBUG) console.log('[Studio] Camera capabilities:', capabilities); // eslint-disable-line no-console
  }
}

/** Convert raw resolution like "1920x1080" to friendly "1080p" label. */
function formatResolutionLabel(resolution: string | null): string | null {
  if (!resolution) return null;
  const match = resolution.match(/(\d+)x(\d+)/);
  if (!match) return resolution;
  const height = parseInt(match[2], 10);
  if (height >= 1080) return '1080p';
  if (height >= 720) return '720p';
  if (height >= 480) return '480p';
  if (height >= 360) return '360p';
  return `${height}p`;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatFpsLabel(fps: number | null | undefined): string | null {
  if (fps == null || !Number.isFinite(fps) || fps <= 0) return null;
  return `${Math.round(fps)} fps`;
}

function formatQualityLimitationSummary(
  reason: string | null | undefined,
  durations: Record<string, number> | null | undefined
): string | null {
  if (!reason || !durations) return reason || null;

  const total = Object.values(durations).reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
  const current = durations[reason];
  if (!total || !Number.isFinite(current)) return reason;

  return `${reason} ${Math.round((current / total) * 100)}%`;
}

function classifyEncoderImplementation(
  encoderImplementation: string | null | undefined
): 'hardware' | 'software' | 'unknown' {
  if (!encoderImplementation) return 'unknown';

  const normalized = encoderImplementation.toLowerCase();
  const hardwareTokens = [
    'mediafoundationvideoencodeaccelerator',
    'externalencoder',
    'nvenc',
    'quicksync',
    'amf',
    'videotoolbox',
    'vaapi',
    'v4l2',
    'amdh264encoder',
    'amd h264 encoder',
    'amdh265encoder',
    'amd h265 encoder',
  ];
  const softwareTokens = ['libvpx', 'openh264', 'software', 'ffmpeg'];

  if (hardwareTokens.some((token) => normalized.includes(token))) return 'hardware';
  if (softwareTokens.some((token) => normalized.includes(token))) return 'software';
  return 'unknown';
}

function StreamPreview({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  const mirrorRef = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const mirror = mirrorRef.current;
    const src = canvasRef.current;
    if (!mirror || !src) return;
    let frame: number;
    const draw = () => {
      if (src.width > 0 && src.height > 0) {
        if (mirror.width !== src.width || mirror.height !== src.height) {
          mirror.width = src.width;
          mirror.height = src.height;
        }
        const ctx = mirror.getContext('2d');
        if (ctx) ctx.drawImage(src, 0, 0);
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [canvasRef]);
  return <canvas ref={mirrorRef} className="livestream-studio__preview-canvas" />;
}

function getCodecAttemptOrder(
  preferredCodec: WebrtcPublishVideoCodecPreference | undefined
): WebrtcPublishVideoCodecPreference[] {
  if (!preferredCodec || preferredCodec === 'auto') {
    return ['auto', 'h264'];
  }

  if (preferredCodec === 'h264') {
    return ['h264', 'auto'];
  }

  return [preferredCodec, 'auto', 'h264'];
}

export default function LivestreamStudio(props: Props) {
  const { streamKey, livestreamEnabled, hasApprovedLivestreamClaim, presetId, signature, signingTs } = props;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const publishCtx = useLivestreamPublish();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const connectAbortRef = React.useRef<AbortController | null>(null);
  const statsBaselineRef = React.useRef<{
    timestampMs?: number;
    videoBytes?: number;
    audioBytes?: number;
  }>({});

  // Read status from context (persists across navigation)
  const ctxStatus = publishCtx.state.status;
  const ctxMediaStream = publishCtx.state.mediaStream;

  // Local UI state derived from context
  const [micEnabled, setMicEnabled] = React.useState(true);
  const [cameraEnabled, setCameraEnabled] = React.useState(true);
  const [facingMode, setFacingMode] = React.useState<'user' | 'environment'>('user');
  const [compositorLayers, setCompositorLayers] = React.useState<CompositorLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = React.useState<string | null>(null);
  const [previewTab, setPreviewTab] = React.useState<'preview' | 'compositor' | string>('preview');
  const [activeVideoIds, setActiveVideoIds] = React.useState<Set<string>>(new Set());
  const [activeAudioIds, setActiveAudioIds] = React.useState<Set<string>>(new Set());
  const sourceStreamsRef = React.useRef<Map<string, MediaStream>>(new Map());
  const audioMixerRef = React.useRef<AudioMixer | null>(null);
  const compositorCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const isMobile = platform.isMobile();
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [previewFrameFps, setPreviewFrameFps] = React.useState<number | null>(null);
  const encoderLoggedRef = React.useRef(false);
  const [justWentLive, setJustWentLive] = React.useState(false);
  const prevStatusRef = React.useRef<Status>(ctxStatus as Status);
  const prevPresetRef = React.useRef(presetId);
  const adaptivePolicyRef = React.useRef<'balanced' | 'maintain-framerate'>('maintain-framerate');

  // Convenience aliases
  const status = ctxStatus as Status;
  const mediaStream = ctxMediaStream;
  const setStatus = publishCtx.actions.setStatus;
  const setMediaStream = publishCtx.actions.setMediaStream;
  const setErrorMessage = publishCtx.actions.setErrorMessage;
  const errorMessage = publishCtx.state.errorMessage;

  // Claim context
  const activeChannelClaim = useAppSelector(selectActiveChannelClaim);
  const channelId = activeChannelClaim?.claim_id;
  const selectMyLivestreamClaims = React.useMemo(
    () => (channelId ? makeSelectLivestreamsForChannelId(channelId) : () => []),
    [channelId]
  );
  const myLivestreamClaims = useAppSelector(selectMyLivestreamClaims);
  const nextStreamClaim = myLivestreamClaims?.[0];
  const nextStreamUri = nextStreamClaim?.permanent_url;

  // Server-side stream metrics
  const channelName = activeChannelClaim?.name;
  const serverMetrics = useLivestreamMetrics(channelId, channelName, signature, signingTs, status === 'live');

  // Detect when server says stream is no longer live (e.g. connection silently dropped)
  const metricsNotLiveCountRef = React.useRef(0);
  React.useEffect(() => {
    if (status !== 'live') {
      metricsNotLiveCountRef.current = 0;
      return;
    }
    // serverMetrics is null on first render; only act when we get a definitive `live: false`
    if (serverMetrics && !serverMetrics.live) {
      metricsNotLiveCountRef.current += 1;
      // Require 3 consecutive not-live polls (15s) to avoid false positives
      if (metricsNotLiveCountRef.current >= 3) {
        if (STUDIO_DEBUG) console.warn('[Studio] Server reports stream no longer live'); // eslint-disable-line no-console
        dispatch(
          doToast({
            isError: true,
            message: __('Stream connection lost. The server reports the stream is no longer active.'),
          })
        );
        publishCtx.actions.stopStream({
          preservePreview: Boolean(cameraAutoStart),
        });
      }
    } else {
      metricsNotLiveCountRef.current = 0;
    }
  }, [serverMetrics]); // eslint-disable-line react-hooks/exhaustive-deps

  // P2P seed: streamer acts as first peer in the P2P swarm (uses shared P2P_DELIVERY setting)
  const activeLivestream = useAppSelector((state) => selectActiveLivestreamForChannel(state, channelId));
  // Use the public (non-LLHLS) URL for seeding, with ?format=ts to match what viewers load
  const rawHlsVideoUrl = activeLivestream?.videoUrlPublic || activeLivestream?.videoUrl;
  const hlsVideoUrl =
    rawHlsVideoUrl && !rawHlsVideoUrl.includes('format=ts')
      ? `${rawHlsVideoUrl}${rawHlsVideoUrl.includes('?') ? '&' : '?'}format=ts`
      : rawHlsVideoUrl;
  const p2pTrackerUrl = activeLivestream?.p2pTrackerUrl || null;
  const p2pSwarmId = activeLivestream?.p2pSwarmId || null;
  const p2pEnabled = useAppSelector((state) => selectClientSetting(state, SETTINGS.P2P_DELIVERY));
  const prefsReady = useAppSelector(selectPrefsReady);
  const [showP2pConfirm, setShowP2pConfirm] = React.useState(false);

  // Detect if another stream is already active on this channel (e.g. RTMP, or another browser tab)
  const existingStreamActive = Boolean(
    activeLivestream && status !== 'live' && status !== 'connecting' && status !== 'stopping'
  );

  // Viewer count from commentron WebSocket (actual HLS viewer count, not OME's always-1)
  const activeClaimId = useAppSelector((state) =>
    nextStreamUri ? selectClaimIdForUri(state, nextStreamUri) : undefined
  );
  const totalViewers =
    useAppSelector((state) => (activeClaimId ? selectViewersForId(state, activeClaimId) : undefined)) ?? 0;

  // Poll livestream status: detects existing streams + gets HLS URL for P2P seeding
  React.useEffect(() => {
    if (!channelId) return;
    dispatch(doFetchChannelIsLiveForId(channelId));
    const interval = setInterval(() => {
      dispatch(doFetchChannelIsLiveForId(channelId));
    }, 15000);
    return () => clearInterval(interval);
  }, [channelId, dispatch]);

  React.useEffect(() => {
    if (!channelId || status !== 'live' || !p2pEnabled || hlsVideoUrl) return;

    dispatch(doFetchChannelIsLiveForId(channelId));

    const retryInterval = setInterval(() => {
      dispatch(doFetchChannelIsLiveForId(channelId));
    }, 3000);

    return () => clearInterval(retryInterval);
  }, [channelId, dispatch, hlsVideoUrl, p2pEnabled, status]);

  // Debug P2P seed conditions
  React.useEffect(() => {
    if (status === 'live') {
      if (STUDIO_DEBUG)
        console.log('[P2P Seed] Conditions:', {
          p2pEnabled,
          isLive: status === 'live',
          selectedVideoUrl: hlsVideoUrl || null,
          preferredVideoUrl: activeLivestream?.videoUrl || null,
          publicVideoUrl: activeLivestream?.videoUrlPublic || null,
          trackerUrl: p2pTrackerUrl,
          swarmId: p2pSwarmId,
        }); // eslint-disable-line no-console
    }
  }, [activeLivestream, p2pEnabled, status, hlsVideoUrl, p2pSwarmId, p2pTrackerUrl]);

  // Runtime stats
  const [runtimeStats, setRuntimeStats] = React.useState({
    videoCodec: null as string | null,
    audioCodec: null as string | null,
    videoBitrateKbps: null as number | null,
    audioBitrateKbps: null as number | null,
    fps: null as number | null,
    resolution: null as string | null,
    connectionState: 'idle',
    encoderImpl: null as string | null,
    avgEncodeMs: null as number | null,
    qualityLimitationReason: null as string | null,
    qualityLimitationDurations: null as Record<string, number> | null,
  });

  const whipUrl = streamKey ? getLivestreamWhipIngestUrl(streamKey) : null;
  const browserPublishSupported =
    typeof navigator !== 'undefined' &&
    typeof RTCPeerConnection !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function';
  const canStartStream =
    browserPublishSupported &&
    livestreamEnabled &&
    hasApprovedLivestreamClaim &&
    Boolean(streamKey && whipUrl && LIVESTREAM_SERVER_API);

  // Camera auto-start: remember if user previously allowed camera
  const [cameraAutoStart, setCameraAutoStart] = usePersistedState('livestream-camera-autostart', false) as [
    boolean,
    (v: boolean) => void,
  ];
  const [cameraAutoStarting, setCameraAutoStarting] = React.useState(Boolean(cameraAutoStart));

  // Auto-request camera on mount if previously allowed
  const autoRequestedRef = React.useRef(false);
  React.useEffect(() => {
    if (autoRequestedRef.current || mediaStream || !browserPublishSupported || !livestreamEnabled) return;
    if (status !== 'idle') return;

    if (cameraAutoStart) {
      autoRequestedRef.current = true;
      setCameraAutoStarting(true);
      requestCameraPreview().finally(() => setCameraAutoStarting(false));
      return;
    }

    // Not auto-start - check browser permission as fallback
    autoRequestedRef.current = true;
    setCameraAutoStarting(false);
    navigator.permissions
      ?.query?.({ name: 'camera' as PermissionName })
      .then((result) => {
        if (result.state === 'granted') {
          requestCameraPreview();
        }
      })
      .catch(() => {});
  }, [browserPublishSupported, livestreamEnabled, status, cameraAutoStart]); // eslint-disable-line react-hooks/exhaustive-deps

  async function requestCameraStream(overrideFacingMode?: 'user' | 'environment') {
    const attempts = getCameraConstraintAttempts(presetId, overrideFacingMode ?? facingMode);
    let lastError: unknown;

    for (let index = 0; index < attempts.length; index += 1) {
      const videoConstraints = attempts[index];
      if (STUDIO_DEBUG) console.log('[Studio] Requesting camera:', JSON.stringify(videoConstraints)); // eslint-disable-line no-console

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        const videoTrack = stream.getVideoTracks()[0];
        const videoSettings = videoTrack?.getSettings();
        console.log(
          '[Studio] Camera:',
          videoSettings?.width + 'x' + videoSettings?.height,
          '@',
          Math.round(videoSettings?.frameRate || 0) + 'fps'
        ); // eslint-disable-line no-console
        logCameraTrackInfo(videoTrack);
        return stream;
      } catch (e: unknown) {
        lastError = e;
        const isConstraintFailure =
          e instanceof DOMException &&
          (e.name === 'OverconstrainedError' || e.name === 'NotFoundError' || e.name === 'ConstraintNotSatisfiedError');

        if (isConstraintFailure && index < attempts.length - 1) {
          if (STUDIO_DEBUG) console.warn('[Studio] Camera constraint fallback:', e); // eslint-disable-line no-console
          continue;
        }

        throw e;
      }
    }

    throw lastError instanceof Error ? lastError : new Error(describeUnknown(lastError));
  }

  async function requestCameraPreview() {
    setErrorMessage(null);
    try {
      const stream = await requestCameraStream();
      stream.getAudioTracks().forEach((t) => {
        t.enabled = micEnabled;
      });
      setMediaStream(stream);
      setStatus('preview');
      // Remember that camera was successfully opened for auto-start next time
      setCameraAutoStart(true);
    } catch (e: unknown) {
      const msg = describeUnknown(e);
      setErrorMessage(msg);
      // If permission denied, clear the auto-start flag
      if (e instanceof DOMException && e.name === 'NotAllowedError') {
        setCameraAutoStart(false);
      }
    }
  }

  async function flipCamera() {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setErrorMessage(null);
    try {
      const nextStream = await requestCameraStream(nextFacing);
      nextStream.getAudioTracks().forEach((t) => {
        t.enabled = micEnabled;
      });
      nextStream.getVideoTracks().forEach((t) => {
        t.enabled = cameraEnabled;
      });
      // Stop old tracks only after new stream is ready
      mediaStream?.getTracks().forEach((t) => t.stop());
      setMediaStream(nextStream);
      setFacingMode(nextFacing);
    } catch (e: unknown) {
      const msg = describeUnknown(e);
      setErrorMessage(msg);
    }
  }

  function getOutputWidth(): number {
    const preset = getWebrtcPublishVideoConstraints(presetId);
    const w = preset.width;
    return typeof w === 'number' ? w : w && typeof w === 'object' && 'ideal' in w ? w.ideal : 1280;
  }
  function getOutputHeight(): number {
    const preset = getWebrtcPublishVideoConstraints(presetId);
    const h = preset.height;
    return typeof h === 'number' ? h : h && typeof h === 'object' && 'ideal' in h ? h.ideal : 720;
  }

  function buildCompositorStream(): MediaStream {
    const canvas = compositorCanvasRef.current;
    if (!canvas) return new MediaStream();
    const videoStream = canvas.captureStream(30);
    if (!audioMixerRef.current) audioMixerRef.current = new AudioMixer();
    const audioStream = audioMixerRef.current.getOutputStream();
    const combined = new MediaStream([...videoStream.getVideoTracks(), ...audioStream.getAudioTracks()]);
    return combined;
  }

  async function handleToggleVideo(source: VideoSource) {
    setErrorMessage(null);
    let id = source.deviceId;

    if (activeVideoIds.has(id)) {
      const stream = sourceStreamsRef.current.get(id);
      if (stream) {
        stream.getVideoTracks().forEach((t) => t.stop());
        sourceStreamsRef.current.delete(id);
      }
      setActiveVideoIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setCompositorLayers((prev) => prev.filter((l) => l.id !== id));
      if (selectedLayerId === id) setSelectedLayerId(null);
      updateOutputStream();
      return;
    }

    try {
      let stream: MediaStream;
      if (source.kind === 'image') {
        const file = await new Promise<File | null>((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.addEventListener('change', () => resolve(input.files?.[0] || null));
          input.click();
        });
        if (!file) return;
        const img = new Image();
        const url = URL.createObjectURL(file);
        await new Promise<void>((resolve) => {
          img.addEventListener('load', () => resolve());
          img.src = url;
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        stream = canvas.captureStream(0);
        source = { ...source, deviceId: `__image_${Date.now()}__`, label: file.name.replace(/\.[^.]+$/, '') };
        id = source.deviceId;
      } else if (source.kind === 'screen') {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        stream.getVideoTracks()[0]?.addEventListener('ended', () => {
          handleToggleVideo(source);
        });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: source.deviceId } },
          audio: false,
        });
      }
      sourceStreamsRef.current.set(id, stream);
      setActiveVideoIds((prev) => new Set(prev).add(id));

      const outW = getOutputWidth();
      const outH = getOutputHeight();
      const track = stream.getVideoTracks()[0];

      const resolveSourceSize = (): Promise<{ w: number; h: number }> =>
        new Promise((resolve) => {
          const settings = track?.getSettings();
          if (settings?.width && settings?.height) {
            resolve({ w: settings.width, h: settings.height });
            return;
          }
          const tempVideo = document.createElement('video');
          tempVideo.muted = true;
          tempVideo.playsInline = true;
          tempVideo.srcObject = new MediaStream([track]);
          tempVideo.addEventListener('loadedmetadata', () => {
            resolve({ w: tempVideo.videoWidth || outW, h: tempVideo.videoHeight || outH });
            tempVideo.srcObject = null;
          });
          tempVideo.play().catch(() => resolve({ w: outW, h: outH }));
          setTimeout(() => resolve({ w: outW, h: outH }), 2000);
        });

      const { w: srcW, h: srcH } = await resolveSourceSize();
      const scale = Math.min(outW / srcW, outH / srcH);
      const layerW = Math.round(srcW * scale);
      const layerH = Math.round(srcH * scale);

      const newLayer: CompositorLayer = {
        id,
        label: source.label,
        stream,
        x: Math.round((outW - layerW) / 2),
        y: Math.round((outH - layerH) / 2),
        width: layerW,
        height: layerH,
        aspectRatio: srcW / srcH,
        zIndex: compositorLayers.length,
        visible: true,
      };
      setCompositorLayers((prev) => [...prev, newLayer]);
      setSelectedLayerId(id);

      if (status === 'idle') setStatus('preview');
      updateOutputStream();
    } catch (e: unknown) {
      if (!isAbortError(e)) setErrorMessage(describeUnknown(e));
    }
  }

  async function handleToggleAudio(source: AudioSource) {
    setErrorMessage(null);
    const id = source.deviceId;

    if (!audioMixerRef.current) audioMixerRef.current = new AudioMixer();
    const mixer = audioMixerRef.current;

    if (activeAudioIds.has(id)) {
      mixer.removeSource(id);
      const stream = sourceStreamsRef.current.get(`audio-${id}`);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        sourceStreamsRef.current.delete(`audio-${id}`);
      }
      setActiveAudioIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      updateOutputStream();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: id }, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      sourceStreamsRef.current.set(`audio-${id}`, stream);
      mixer.addSource(id, stream);
      setActiveAudioIds((prev) => new Set(prev).add(id));
      updateOutputStream();
    } catch (e: unknown) {
      if (!isAbortError(e)) setErrorMessage(describeUnknown(e));
    }
  }

  function updateOutputStream() {
    if (compositorCanvasRef.current && (activeVideoIds.size > 0 || activeAudioIds.size > 0)) {
      const combined = buildCompositorStream();
      setMediaStream(combined);
    }
  }

  function handleLayerUpdate(id: string, updates: Partial<CompositorLayer>) {
    setCompositorLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  }

  // Detect connecting→live transition for the flash animation
  React.useEffect(() => {
    const previousPreset = prevPresetRef.current;
    prevPresetRef.current = presetId;

    if (previousPreset === presetId) return;
    if (status !== 'preview' || !mediaStream) return;

    let canceled = false;
    const currentStream = mediaStream;

    void (async () => {
      setErrorMessage(null);
      try {
        const nextStream = await requestCameraStream();
        if (canceled) {
          nextStream.getTracks().forEach((track) => track.stop());
          return;
        }

        nextStream.getAudioTracks().forEach((track) => {
          track.enabled = micEnabled;
        });
        nextStream.getVideoTracks().forEach((track) => {
          track.enabled = cameraEnabled;
        });
        setMediaStream(nextStream);
        currentStream.getTracks().forEach((track) => track.stop());
      } catch (e: unknown) {
        if (canceled) return;
        const msg = describeUnknown(e);
        setErrorMessage(msg);
      }
    })();

    return () => {
      canceled = true;
    };
  }, [presetId]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (prevStatusRef.current === 'connecting' && status === 'live') {
      setJustWentLive(true);
      const timer = setTimeout(() => setJustWentLive(false), 900);
      return () => clearTimeout(timer);
    }
    prevStatusRef.current = status;
  }, [status]);

  // Set claim URI on context
  React.useEffect(() => {
    publishCtx.actions.setClaimUri(nextStreamUri || null);
  }, [nextStreamUri]); // eslint-disable-line react-hooks/exhaustive-deps

  // Attach stream to video element when component mounts (or remounts after navigation)
  React.useEffect(() => {
    const el = videoRef.current;
    if (el) {
      el.srcObject = mediaStream || null;
      if (mediaStream) el.play().catch(() => {});
    }
  }, [mediaStream]);

  React.useEffect(() => {
    const video = videoRef.current as
      | (HTMLVideoElement & {
          requestVideoFrameCallback?: (cb: (now: number, metadata: any) => void) => number;
          cancelVideoFrameCallback?: (handle: number) => void;
        })
      | null;

    if (!mediaStream || !video || typeof video.requestVideoFrameCallback !== 'function') {
      setPreviewFrameFps(null);
      return;
    }

    let callbackId: number | null = null;
    let frameCount = 0;
    let windowStart = 0;
    let canceled = false;

    const onFrame = (now: number) => {
      if (canceled) return;
      if (!windowStart) windowStart = now;
      frameCount += 1;

      const elapsed = now - windowStart;
      if (elapsed >= 1000) {
        setPreviewFrameFps(Math.round((frameCount * 1000) / elapsed));
        frameCount = 0;
        windowStart = now;
      }

      callbackId = video.requestVideoFrameCallback(onFrame);
    };

    callbackId = video.requestVideoFrameCallback(onFrame);

    return () => {
      canceled = true;
      if (callbackId != null && typeof video.cancelVideoFrameCallback === 'function') {
        video.cancelVideoFrameCallback(callbackId);
      }
      setPreviewFrameFps(null);
    };
  }, [mediaStream]);

  // Mic toggle
  React.useEffect(() => {
    if (!mediaStream) return;
    mediaStream.getAudioTracks().forEach((t) => {
      t.enabled = micEnabled;
    });
  }, [micEnabled, mediaStream]);

  // Camera toggle
  React.useEffect(() => {
    if (!mediaStream) return;
    mediaStream.getVideoTracks().forEach((t) => {
      t.enabled = cameraEnabled;
    });
  }, [cameraEnabled, mediaStream]);

  // Warn before closing/refreshing while live
  React.useEffect(() => {
    if (status !== 'live' && status !== 'connecting') return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [status]);

  // Monitor ICE connection state — detect when the stream actually dies
  React.useEffect(() => {
    if (status !== 'live') return;
    const pc = publishCtx.refs.pcRef.current;
    if (!pc) return;

    const onIceChange = () => {
      const state = pc.iceConnectionState;
      if (STUDIO_DEBUG) console.log('[Studio] ICE state:', state); // eslint-disable-line no-console
      if (state === 'failed' || state === 'closed') {
        dispatch(doToast({ isError: true, message: __('Stream connection lost.') }));
        publishCtx.actions.stopStream({
          preservePreview: Boolean(cameraAutoStart),
        });
      }
    };
    pc.addEventListener('iceconnectionstatechange', onIceChange);
    return () => pc.removeEventListener('iceconnectionstatechange', onIceChange);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Elapsed time counter - reads from persistent context liveStartedAt
  const liveStartedAt = publishCtx.state.liveStartedAt;
  React.useEffect(() => {
    if (status === 'live' && liveStartedAt) {
      setElapsedSeconds(Math.floor((Date.now() - liveStartedAt) / 1000));
      const interval = window.setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - liveStartedAt) / 1000));
      }, 1000);
      return () => window.clearInterval(interval);
    } else {
      setElapsedSeconds(0);
      adaptivePolicyRef.current = 'maintain-framerate';
      encoderLoggedRef.current = false;
    }
  }, [status]);

  // Stats collection while live
  React.useEffect(() => {
    if (status !== 'live') {
      statsBaselineRef.current = {};
      setRuntimeStats({
        videoCodec: null,
        audioCodec: null,
        videoBitrateKbps: null,
        audioBitrateKbps: null,
        fps: null,
        resolution: null,
        connectionState: status === 'connecting' ? 'connecting' : 'idle',
        encoderImpl: null,
        avgEncodeMs: null,
        qualityLimitationReason: null,
        qualityLimitationDurations: null,
      });
      return;
    }
    const pc = publishCtx.refs.pcRef.current;
    if (!pc) return;

    let canceled = false;
    const collectStats = async () => {
      try {
        const stats = await pc.getStats();
        if (canceled) return;
        let videoOutbound: Record<string, any> | null = null;
        let audioOutbound: Record<string, any> | null = null;
        const codecs = new Map<string, Record<string, any>>();

        stats.forEach((report) => {
          const current = report as Record<string, any>;
          if (current.type === 'codec') {
            codecs.set(current.id, current);
            return;
          }
          if (current.type !== 'outbound-rtp' || current.isRemote) return;
          const kind = current.kind || current.mediaType;
          if (kind === 'video' && !videoOutbound) videoOutbound = current;
          else if (kind === 'audio' && !audioOutbound) audioOutbound = current;
        });

        const timestampMs = Number(videoOutbound?.timestamp ?? audioOutbound?.timestamp ?? Date.now()) || Date.now();
        const previous = statsBaselineRef.current;
        const localVideoSettings = mediaStream?.getVideoTracks()[0]?.getSettings();

        const newStats = {
          connectionState: pc.connectionState || 'live',
          videoCodec: videoOutbound?.codecId
            ? formatCodecLabel(
                codecs.get(videoOutbound.codecId)?.mimeType || '',
                codecs.get(videoOutbound.codecId)?.sdpFmtpLine
              )
            : null,
          audioCodec: audioOutbound?.codecId
            ? formatCodecLabel(
                codecs.get(audioOutbound.codecId)?.mimeType || '',
                codecs.get(audioOutbound.codecId)?.sdpFmtpLine
              )
            : null,
          videoBitrateKbps: computeBitrateKbps(
            videoOutbound?.bytesSent,
            previous.videoBytes,
            timestampMs,
            previous.timestampMs
          ),
          audioBitrateKbps: computeBitrateKbps(
            audioOutbound?.bytesSent,
            previous.audioBytes,
            timestampMs,
            previous.timestampMs
          ),
          fps: typeof videoOutbound?.framesPerSecond === 'number' ? Math.round(videoOutbound.framesPerSecond) : null,
          // @ts-ignore - encoderImplementation exists on RTCOutboundRtpStreamStats in Chrome
          encoderImpl: videoOutbound?.encoderImplementation || null,
          avgEncodeMs:
            typeof videoOutbound?.totalEncodeTime === 'number' &&
            typeof videoOutbound?.framesEncoded === 'number' &&
            videoOutbound.framesEncoded > 0
              ? Math.round((videoOutbound.totalEncodeTime / videoOutbound.framesEncoded) * 1000)
              : null,
          qualityLimitationReason: videoOutbound?.qualityLimitationReason || null,
          qualityLimitationDurations: videoOutbound?.qualityLimitationDurations || null,
          resolution:
            videoOutbound?.frameWidth && videoOutbound?.frameHeight
              ? `${videoOutbound.frameWidth}x${videoOutbound.frameHeight}`
              : localVideoSettings?.width && localVideoSettings?.height
                ? `${localVideoSettings.width}x${localVideoSettings.height}`
                : null,
        };

        setRuntimeStats(newStats);
        publishCtx.actions.updateStats(newStats);

        // Log encoder info once (hardware vs software)
        if ((newStats as any).encoderImpl && !encoderLoggedRef.current) {
          encoderLoggedRef.current = true;
          const impl = (newStats as any).encoderImpl;
          const acceleration = classifyEncoderImplementation(impl);
          console.log(`[Studio] Encoder: ${impl} (${acceleration.toUpperCase()})`); // eslint-disable-line no-console
        }

        const encoderAcceleration = classifyEncoderImplementation((newStats as any).encoderImpl);
        const shouldPreferFramerate =
          encoderAcceleration === 'hardware' ||
          encoderAcceleration === 'software' ||
          newStats.qualityLimitationReason === 'cpu';

        if (shouldPreferFramerate && adaptivePolicyRef.current !== 'maintain-framerate') {
          adaptivePolicyRef.current = 'maintain-framerate';
          void updateWhipVideoEncodingPolicy(pc, {
            degradationPreference: 'maintain-framerate',
          });
          if (STUDIO_DEBUG) console.log('[Studio] Switching to maintain-framerate'); // eslint-disable-line no-console
        } else if (!shouldPreferFramerate && adaptivePolicyRef.current !== 'balanced') {
          adaptivePolicyRef.current = 'balanced';
          void updateWhipVideoEncodingPolicy(pc, {
            degradationPreference: 'balanced',
          });
        }

        statsBaselineRef.current = {
          timestampMs,
          videoBytes: typeof videoOutbound?.bytesSent === 'number' ? videoOutbound.bytesSent : previous.videoBytes,
          audioBytes: typeof audioOutbound?.bytesSent === 'number' ? audioOutbound.bytesSent : previous.audioBytes,
        };
      } catch {} // eslint-disable-line no-empty
    };

    void collectStats();
    const interval = window.setInterval(() => void collectStats(), 1500);
    return () => {
      canceled = true;
      window.clearInterval(interval);
    };
  }, [status, mediaStream]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Actions ----

  async function handleGoLive() {
    if (status === 'idle' || status === 'error') {
      setErrorMessage(null);

      let stream: MediaStream;
      if (compositorLayers.length > 0) {
        stream = buildCompositorStream();
        setMediaStream(stream);
      } else {
        setStatus('requesting_permission');
        try {
          stream = await requestCameraStream();
          stream.getAudioTracks().forEach((t) => {
            t.enabled = micEnabled;
          });
          setMediaStream(stream);
        } catch (e: unknown) {
          setErrorMessage(describeUnknown(e));
          setStatus('error');
          return;
        }
      }

      if (!canStartStream) {
        setStatus('preview');
        return;
      }

      try {
        setStatus('connecting');
        const ac = new AbortController();
        connectAbortRef.current = ac;
        const enc = getWebrtcPublishEncodingOptions(presetId);
        const codecAttempts = getCodecAttemptOrder(undefined);
        let lastErr: unknown;
        for (const codec of codecAttempts) {
          if (ac.signal.aborted) break;
          try {
            if (STUDIO_DEBUG) console.log(`[Studio] Trying codec: ${codec}`); // eslint-disable-line no-console
            const { pc, resourceUrl } = await startWhipPublish(whipUrl, stream, {
              signal: ac.signal,
              maxVideoBitrateBps: enc.maxVideoBitrateBps,
              maxVideoFramerate: enc.maxVideoFramerate,
              maxVideoWidth: enc.maxVideoWidth,
              maxVideoHeight: enc.maxVideoHeight,
              videoCodecPreference: codec,
              degradationPreference: 'maintain-framerate',
            });
            connectAbortRef.current = null;
            publishCtx.actions.setPc(pc);
            publishCtx.actions.setResourceUrl(resourceUrl);
            publishCtx.actions.updateStats({ liveStartedAt: Date.now() });

            setStatus('live');
            dispatch(doToast({ message: __('You are live!') }));
            return;
          } catch (e: unknown) {
            lastErr = e;
            if (isAbortError(e)) break;
            // Network errors (Failed to fetch) - don't try next codec, just fail
            // Only try next codec for actual negotiation/codec errors
            const isNetworkError =
              e instanceof TypeError && (e.message.includes('fetch') || e.message.includes('network'));
            if (isNetworkError) {
              console.warn(`[Studio] Network error on codec ${codec}, not retrying other codecs`, e); // eslint-disable-line no-console
              break;
            }
            console.warn(`[Studio] Codec ${codec} failed, trying next...`, e); // eslint-disable-line no-console
          }
        }
        connectAbortRef.current = null;
        if (isAbortError(lastErr)) {
          setStatus(publishCtx.state.mediaStream ? 'preview' : 'idle');
          return;
        }
        const msg = describeUnknown(lastErr);
        setErrorMessage(msg);
        setStatus(publishCtx.state.mediaStream ? 'preview' : 'error');
        publishCtx.actions.setPc(null);
        publishCtx.actions.setResourceUrl(null);
        dispatch(
          doToast({
            isError: true,
            message: __('Failed to start stream. Check permissions and try again.'),
          })
        );
      } catch (e: unknown) {
        connectAbortRef.current = null;
        if (isAbortError(e)) {
          setStatus(publishCtx.state.mediaStream ? 'preview' : 'idle');
          return;
        }
        const msg = describeUnknown(e);
        setErrorMessage(msg);
        setStatus('error');
        dispatch(
          doToast({
            isError: true,
            message: __('Could not access camera or microphone.'),
          })
        );
      }
    } else if (status === 'preview') {
      const liveStream = compositorLayers.length > 0 ? buildCompositorStream() : mediaStream;
      if (!liveStream || !whipUrl) return;
      setMediaStream(liveStream);
      setErrorMessage(null);
      setStatus('connecting');
      const ac = new AbortController();
      connectAbortRef.current = ac;
      const enc = getWebrtcPublishEncodingOptions(presetId);
      const codecAttempts = getCodecAttemptOrder(undefined);
      let lastErr: unknown;
      for (const codec of codecAttempts) {
        if (ac.signal.aborted) break;
        try {
          console.log(`[Studio] Trying codec preference: ${codec}`); // eslint-disable-line no-console
          const { pc, resourceUrl } = await startWhipPublish(whipUrl, liveStream, {
            signal: ac.signal,
            maxVideoBitrateBps: enc.maxVideoBitrateBps,
            maxVideoFramerate: enc.maxVideoFramerate,
            videoCodecPreference: codec,
            degradationPreference: 'maintain-framerate',
          });
          connectAbortRef.current = null;
          publishCtx.actions.setPc(pc);
          publishCtx.actions.setResourceUrl(resourceUrl);
          publishCtx.actions.updateStats({ liveStartedAt: Date.now() });
          setStatus('live');
          dispatch(doToast({ message: __('You are live!') }));
          return;
        } catch (e: unknown) {
          lastErr = e;
          if (isAbortError(e)) break;
          const isNetworkError =
            e instanceof TypeError && (e.message.includes('fetch') || e.message.includes('network'));
          if (isNetworkError) {
            console.warn(`[Studio] Network error on codec ${codec}, not retrying other codecs`, e); // eslint-disable-line no-console
            break;
          }
          console.warn(`[Studio] Codec ${codec} failed, trying next...`, e); // eslint-disable-line no-console
        }
      }
      connectAbortRef.current = null;
      if (isAbortError(lastErr)) {
        setStatus('preview');
        return;
      }
      const msg = describeUnknown(lastErr);
      setErrorMessage(msg);
      setStatus('preview');
      publishCtx.actions.setPc(null);
      publishCtx.actions.setResourceUrl(null);
      dispatch(doToast({ isError: true, message: __('Connection failed. Try again.') }));
    }
  }

  async function handleStop() {
    await publishCtx.actions.stopStream({
      preservePreview: Boolean(cameraAutoStart),
    });
    dispatch(doToast({ message: __('Stream ended.') }));
  }

  function handleCancel() {
    connectAbortRef.current?.abort();
    connectAbortRef.current = null;
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      setMediaStream(null);
    }
    publishCtx.actions.setPc(null);
    publishCtx.actions.setResourceUrl(null);
    setStatus('idle');
    setErrorMessage(null);
  }

  const isLive = status === 'live';
  const isConnecting = status === 'connecting';
  const isStopping = status === 'stopping';
  const hasCamera = compositorLayers.length > 0 || Boolean(mediaStream);

  const disabledReason = !browserPublishSupported
    ? __('Your browser does not support WebRTC streaming.')
    : !livestreamEnabled
      ? __('Livestreaming is disabled for this account.')
      : !hasApprovedLivestreamClaim
        ? __('Create a livestream claim first using the Create / Edit tab.')
        : !LIVESTREAM_SERVER_API
          ? __('Streaming server not configured.')
          : null;

  if (!livestreamEnabled) {
    return (
      <div className="livestream-studio">
        <div className="livestream-studio__disabled">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          <p>{__('Livestreaming is disabled for this account. Contact support for assistance.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="livestream-studio"
      onMouseDown={(e) => {
        if (!(e.target as HTMLElement).closest('.livestream-compositor')) {
          setSelectedLayerId(null);
        }
      }}
    >
      {/* Main Stage + Sources */}
      <div className="livestream-studio__stage-row">
        <div className="livestream-studio__stage">
          <div className="livestream-studio__preview-tabs">
            <button
              className={classnames('livestream-studio__preview-tab', {
                'livestream-studio__preview-tab--active': previewTab === 'preview',
              })}
              onClick={() => setPreviewTab('preview')}
            >
              {__('Preview')}
            </button>
            <button
              className={classnames('livestream-studio__preview-tab', {
                'livestream-studio__preview-tab--active': previewTab === 'compositor',
              })}
              onClick={() => setPreviewTab('compositor')}
            >
              {__('Compositor')}
            </button>
            {compositorLayers
              .filter((l) => !l.minimized)
              .map((layer) => (
                <button
                  key={layer.id}
                  className={classnames('livestream-studio__preview-tab', {
                    'livestream-studio__preview-tab--active': previewTab === layer.id,
                  })}
                  onClick={() => setPreviewTab(layer.id)}
                >
                  {layer.label}
                </button>
              ))}
          </div>

          <div
            className={classnames('livestream-studio__preview', {
              'livestream-studio__preview--active': hasCamera,
              'livestream-studio__preview--live': isLive,
              'livestream-studio__preview--portrait': isMobile && facingMode === 'user',
            })}
          >
            {previewTab === 'preview' && <StreamPreview canvasRef={compositorCanvasRef} />}
            {previewTab !== 'compositor' &&
              previewTab !== 'preview' &&
              (() => {
                const layer = compositorLayers.find((l) => l.id === previewTab);
                if (!layer) return null;
                const cssFilters: string[] = [];
                if (layer.brightness != null && layer.brightness !== 100)
                  cssFilters.push(`brightness(${layer.brightness}%)`);
                if (layer.contrast != null && layer.contrast !== 100) cssFilters.push(`contrast(${layer.contrast}%)`);
                if (layer.saturation != null && layer.saturation !== 100)
                  cssFilters.push(`saturate(${layer.saturation}%)`);
                return (
                  <LivestreamCropSelector
                    stream={layer.stream}
                    videoStyle={{
                      filter: cssFilters.length > 0 ? cssFilters.join(' ') : undefined,
                      opacity: layer.opacity ?? 1,
                      borderRadius: layer.borderRadius ? `${layer.borderRadius}px` : undefined,
                    }}
                    crop={layer.crop}
                    onCropChange={(crop) => {
                      handleLayerUpdate(layer.id, {
                        crop,
                        aspectRatio: crop
                          ? crop.sw / crop.sh
                          : layer.stream.getVideoTracks()[0]?.getSettings()?.width /
                              layer.stream.getVideoTracks()[0]?.getSettings()?.height || layer.aspectRatio,
                      });
                    }}
                  />
                );
              })()}
            <div
              style={
                previewTab !== 'compositor' ? { position: 'absolute', opacity: 0, pointerEvents: 'none' } : undefined
              }
            >
              <LivestreamCompositor
                layers={compositorLayers}
                onLayerUpdate={handleLayerUpdate}
                onLayerSelect={setSelectedLayerId}
                onLayerRemove={(id) => {
                  const stream = sourceStreamsRef.current.get(id);
                  if (stream) {
                    stream.getVideoTracks().forEach((t) => t.stop());
                    sourceStreamsRef.current.delete(id);
                  }
                  setActiveVideoIds((prev) => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                  });
                  setCompositorLayers((prev) => prev.filter((l) => l.id !== id));
                  if (selectedLayerId === id) setSelectedLayerId(null);
                  updateOutputStream();
                }}
                selectedLayerId={selectedLayerId}
                outputWidth={getOutputWidth()}
                outputHeight={getOutputHeight()}
                canvasRef={compositorCanvasRef}
              />
            </div>

            {/* Connecting animation overlay (only during WHIP connection, not camera request) */}
            {isConnecting && <LivestreamConnectingAnimation status="connecting" />}

            {/* Flash transition when going live */}
            {justWentLive && <LivestreamConnectingAnimation status="connecting" onLive />}

            {hasCamera && (
              <div className="livestream-studio__preview-overlay">
                <div className="livestream-studio__overlay-bottom">
                  {isLive && (
                    <>
                      {/* Viewers (only if > 0) */}
                      {totalViewers > 0 && (
                        <span className="livestream-studio__pill">
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          {totalViewers}
                        </span>
                      )}
                    </>
                  )}
                  {(() => {
                    const cs = mediaStream?.getVideoTracks()[0]?.getSettings();
                    const fps = isLive
                      ? formatFpsLabel(runtimeStats.fps ?? cs?.frameRate)
                      : formatFpsLabel(previewFrameFps ?? cs?.frameRate ?? runtimeStats.fps);
                    return fps ? <span className="livestream-studio__pill">{fps}</span> : null;
                  })()}
                  {/* Resolution */}
                  {(() => {
                    const outW = getOutputWidth();
                    const outH = getOutputHeight();
                    const res = formatResolutionLabel(`${outW}x${outH}`);
                    return res ? <span className="livestream-studio__pill">{res}</span> : null;
                  })()}
                  {isLive && (
                    <>
                      {/* Bitrate from server metrics or client stats */}
                      {(() => {
                        const bps =
                          serverMetrics?.live && serverMetrics.throughput
                            ? serverMetrics.throughput.in_bps / 1000
                            : runtimeStats.videoBitrateKbps;
                        return bps != null && bps > 0 ? (
                          <span className="livestream-studio__pill">
                            <svg
                              width="9"
                              height="9"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="12" y1="19" x2="12" y2="5" />
                              <polyline points="5 12 12 5 19 12" />
                            </svg>
                            {formatBitrate(bps)}
                          </span>
                        ) : null;
                      })()}
                      {/* Codec pill */}
                      {runtimeStats.videoCodec && (
                        <span className="livestream-studio__pill" title={runtimeStats.encoderImpl || ''}>
                          {runtimeStats.videoCodec}
                          {runtimeStats.encoderImpl && (
                            <span className="livestream-studio__pill-hw">
                              {classifyEncoderImplementation(runtimeStats.encoderImpl) === 'hardware' ? 'HW' : 'SW'}
                            </span>
                          )}
                        </span>
                      )}
                      {runtimeStats.qualityLimitationReason && runtimeStats.qualityLimitationReason !== 'none' && (
                        <span
                          className="livestream-studio__pill"
                          title={JSON.stringify(runtimeStats.qualityLimitationDurations || {})}
                        >
                          {formatQualityLimitationSummary(
                            runtimeStats.qualityLimitationReason,
                            runtimeStats.qualityLimitationDurations
                          )}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {!hasCamera && (
              <div className="livestream-studio__placeholder">
                {cameraAutoStarting && !errorMessage && (
                  <p className="livestream-studio__placeholder-text" style={{ opacity: 0.5 }}>
                    {__('Starting camera...')}
                  </p>
                )}
                {!cameraAutoStarting && !errorMessage && (
                  <>
                    <div className="livestream-studio__placeholder-icon">
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M23 7l-7 5 7 5V7z" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                    </div>
                    {disabledReason ? (
                      <p className="livestream-studio__placeholder-text">{disabledReason}</p>
                    ) : (
                      <button
                        className="livestream-studio__allow-camera-btn"
                        onClick={requestCameraPreview}
                        disabled={status === 'requesting_permission'}
                      >
                        {status === 'requesting_permission' ? __('Requesting...') : __('Allow Camera Preview')}
                      </button>
                    )}
                  </>
                )}
                {errorMessage && (
                  <>
                    <div className="livestream-studio__placeholder-icon livestream-studio__placeholder-icon--error">
                      <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="1" y1="1" x2="23" y2="23" />
                        <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
                      </svg>
                    </div>
                    <p className="livestream-studio__placeholder-error">{errorMessage}</p>
                    <button className="livestream-studio__allow-camera-btn" onClick={requestCameraPreview}>
                      {__('Try Again')}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Controls bar */}
          {hasCamera && (
            <div className="livestream-studio__taskbar">
              <button
                className={classnames('livestream-studio__control-btn', {
                  'livestream-studio__control-btn--off': !micEnabled,
                })}
                onClick={() => setMicEnabled(!micEnabled)}
                disabled={isStopping}
                title={micEnabled ? __('Mute microphone') : __('Unmute microphone')}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {micEnabled ? (
                    <>
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </>
                  ) : (
                    <>
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.5-.35 2.18" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </>
                  )}
                </svg>
              </button>

              <button
                className={classnames('livestream-studio__control-btn', {
                  'livestream-studio__control-btn--off': !cameraEnabled,
                })}
                onClick={() => setCameraEnabled(!cameraEnabled)}
                disabled={isStopping}
                title={cameraEnabled ? __('Turn off camera') : __('Turn on camera')}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {cameraEnabled ? (
                    <>
                      <path d="M23 7l-7 5 7 5V7z" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </>
                  ) : (
                    <>
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m2-3h6l2 3h4a2 2 0 0 1 2 2v9.34" />
                    </>
                  )}
                </svg>
              </button>

              {isMobile && (
                <button
                  className="livestream-studio__control-btn"
                  onClick={flipCamera}
                  disabled={isStopping}
                  title={facingMode === 'user' ? __('Switch to rear camera') : __('Switch to front camera')}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <path d="M9 13a3 3 0 0 0 3 3" />
                    <path d="M15 13a3 3 0 0 0-3-3" />
                    <path d="M9 10l-1-1" />
                    <path d="M15 16l1 1" />
                  </svg>
                </button>
              )}

              <div className="livestream-studio__taskbar-spacer" />

              {compositorLayers
                .filter((l) => l.minimized)
                .map((layer) => (
                  <button
                    key={layer.id}
                    className={classnames('livestream-studio__taskbar-item', {
                      'livestream-studio__taskbar-item--active': layer.id === selectedLayerId,
                    })}
                    onClick={() => {
                      setCompositorLayers((prev) =>
                        prev.map((l) => (l.id === layer.id ? { ...l, minimized: false, visible: true } : l))
                      );
                      setSelectedLayerId(layer.id);
                    }}
                    title={layer.label}
                  >
                    {layer.label}
                  </button>
                ))}

              {(isLive || p2pEnabled) && (
                <button
                  className={classnames('livestream-studio__control-btn livestream-studio__control-btn--p2p', {
                    'livestream-studio__control-btn--p2p-active': p2pEnabled,
                    'livestream-studio__control-btn--p2p-pulse': p2pEnabled,
                  })}
                  onClick={() => {
                    if (p2pEnabled) {
                      dispatch(doSetClientSetting(SETTINGS.P2P_DELIVERY, false, prefsReady));
                    } else {
                      setShowP2pConfirm(true);
                    }
                  }}
                  title={p2pEnabled ? __('P2P seeding active - click to disable') : __('Enable P2P seeding')}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </button>
              )}

              {(isLive || isConnecting) && (
                <Button
                  button="primary"
                  className="livestream-studio__stop-btn"
                  onClick={isConnecting ? handleCancel : handleStop}
                  disabled={isStopping}
                  label={isStopping ? __('Ending...') : isConnecting ? __('Cancel') : __('End Stream')}
                />
              )}
            </div>
          )}
        </div>

        {(() => {
          const sourceTabLayer =
            previewTab !== 'preview' && previewTab !== 'compositor'
              ? compositorLayers.find((l) => l.id === previewTab)
              : null;
          if (sourceTabLayer) {
            return (
              <LivestreamSourceSettings
                layer={sourceTabLayer}
                onUpdate={(updates) => handleLayerUpdate(sourceTabLayer.id, updates)}
              />
            );
          }
          return (
            <LivestreamSourceSelector
              activeVideoIds={activeVideoIds}
              activeAudioIds={activeAudioIds}
              activeVideoOrder={[...compositorLayers].sort((a, b) => b.zIndex - a.zIndex).map((l) => l.id)}
              activeImageSources={compositorLayers
                .filter((l) => l.id.startsWith('__image_'))
                .map((l) => ({ deviceId: l.id, label: l.label, kind: 'image' as const }))}
              onToggleVideo={handleToggleVideo}
              onToggleAudio={handleToggleAudio}
              onReorderVideo={(fromId, toId) => {
                setCompositorLayers((prev) => {
                  const sorted = [...prev].sort((a, b) => b.zIndex - a.zIndex);
                  const fromIdx = sorted.findIndex((l) => l.id === fromId);
                  const toIdx = sorted.findIndex((l) => l.id === toId);
                  if (fromIdx === -1 || toIdx === -1) return prev;
                  const [moved] = sorted.splice(fromIdx, 1);
                  sorted.splice(toIdx, 0, moved);
                  return sorted.map((l, i) => ({ ...l, zIndex: sorted.length - 1 - i }));
                });
              }}
              disabled={status === 'connecting' || status === 'stopping'}
            />
          );
        })()}
      </div>

      {/* Primary Action */}
      <div className="livestream-studio__action-area">
        {(status === 'idle' || status === 'error' || status === 'preview' || status === 'requesting_permission') && (
          <>
            <Button
              button="primary"
              className="livestream-studio__go-live-btn"
              onClick={handleGoLive}
              disabled={Boolean(disabledReason) || status === 'requesting_permission' || existingStreamActive}
              label={
                existingStreamActive
                  ? __('Stream already active')
                  : status === 'requesting_permission'
                    ? __('Starting camera...')
                    : status === 'preview'
                      ? canStartStream
                        ? __('Go Live')
                        : __('Preview Only (no claim published)')
                      : __('Go Live')
              }
              icon={status !== 'requesting_permission' ? ICONS.LIVESTREAM : undefined}
            />
            {existingStreamActive && (
              <p className="livestream-studio__hint-msg">
                {__('A stream is already live on this channel. End it before starting a new one.')}
              </p>
            )}
          </>
        )}
        {errorMessage && (status === 'error' || status === 'preview') && (
          <p className="livestream-studio__error-msg">{errorMessage}</p>
        )}
        {disabledReason && !hasCamera && <p className="livestream-studio__hint-msg">{disabledReason}</p>}
      </div>

      {/* P2P seeding banner for streamer - hidden once enabled */}
      {isLive && !p2pEnabled && !showP2pConfirm && (
        <div className="livestream-studio__p2p-banner">
          <div className="livestream-studio__p2p-banner-icon">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div className="livestream-studio__p2p-banner-text">
            <span className="livestream-studio__p2p-banner-title">{__('Help viewers with P2P')}</span>
            <span className="livestream-studio__p2p-banner-sub">
              {__('Seed your stream directly to viewers via peer-to-peer. Reduces server load.')}
            </span>
          </div>
          <button className="livestream-studio__p2p-banner-btn" onClick={() => setShowP2pConfirm(true)}>
            {__('Enable')}
          </button>
        </div>
      )}

      {/* Claim Preview - AFTER the button */}
      {nextStreamUri && (
        <div className="livestream-studio__claim-section">
          <div className="livestream-studio__claim-header">
            <span className="livestream-studio__claim-label">
              {__('Streaming to')}
              {existingStreamActive && !isLive && (
                <span className="livestream-studio__claim-live-badge">{__('LIVE')}</span>
              )}
            </span>
            <div className="livestream-studio__claim-actions">
              <button
                className="livestream-studio__claim-action"
                onClick={() => navigate(`/$/${PAGES.LIVESTREAM}?t=Publish`)}
                title={__('Edit this stream')}
              >
                {__('Edit')}
              </button>
              <button
                className="livestream-studio__claim-action"
                onClick={() => navigate(`/$/${PAGES.LIVESTREAM}?t=Publish&new=1`)}
                title={__('Create a new livestream')}
              >
                {__('New')}
              </button>
            </div>
          </div>
          <div className="livestream-studio__claim-card">
            <ClaimPreview uri={nextStreamUri} type="small" />
          </div>
        </div>
      )}

      {!nextStreamUri && (
        <div className="livestream-studio__no-claim">
          <p>{__('No livestream claim found.')}</p>
          <Button
            button="link"
            label={__('Create one now')}
            onClick={() => navigate(`/$/${PAGES.LIVESTREAM}?t=Publish`)}
          />
        </div>
      )}

      {/* Hidden P2P seed player - makes streamer the first peer */}
      <LivestreamP2PSeed
        videoUrl={hlsVideoUrl || ''}
        active={p2pEnabled && isLive && Boolean(hlsVideoUrl)}
        trackerUrl={p2pTrackerUrl}
        swarmId={p2pSwarmId}
      />

      {/* P2P confirmation dialog */}
      {showP2pConfirm && (
        <div className="livestream-studio__p2p-confirm">
          <div className="livestream-studio__p2p-confirm-card">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            <h4>{__('Enable P2P delivery?')}</h4>
            <p>
              {__(
                'Your stream will be shared peer-to-peer with viewers. This reduces server load but your IP address may be visible to viewers. This also applies when you watch other livestreams.'
              )}
            </p>
            <div className="livestream-studio__p2p-confirm-actions">
              <button
                className="livestream-studio__p2p-confirm-btn livestream-studio__p2p-confirm-btn--primary"
                onClick={() => {
                  dispatch(doSetClientSetting(SETTINGS.P2P_DELIVERY, true, prefsReady));
                  setShowP2pConfirm(false);
                }}
              >
                {__('Always')}
              </button>
              <button
                className="livestream-studio__p2p-confirm-btn livestream-studio__p2p-confirm-btn--outline"
                onClick={() => {
                  // Session only - set in redux but don't push to wallet
                  dispatch(doSetClientSetting(SETTINGS.P2P_DELIVERY, true));
                  setShowP2pConfirm(false);
                }}
              >
                {__('Try now')}
              </button>
              <button
                className="livestream-studio__p2p-confirm-btn livestream-studio__p2p-confirm-btn--secondary"
                onClick={() => setShowP2pConfirm(false)}
              >
                {__('Not now')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
