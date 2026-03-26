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
import { LocalStorage } from 'util/storage';
import { startWhipPublish, stopWhipPublish, updateWhipVideoEncodingPolicy } from 'util/livestreamWhip';
import { LIVESTREAM_SERVER_API } from 'config';
import { useLivestreamPublish } from 'contexts/livestreamPublish';
import * as SETTINGS from 'constants/settings';
import { selectClientSetting } from 'redux/selectors/settings';
import { doSetClientSetting } from 'redux/actions/settings';
import { selectPrefsReady } from 'redux/selectors/sync';
import { selectLivestreamsForChannelId, selectViewersForId, selectActiveLivestreamForChannel } from 'redux/selectors/livestream';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectClaimIdForUri } from 'redux/selectors/claims';
import ClaimPreview from 'component/claimPreview';
import LivestreamP2PSeed from 'component/livestreamP2PSeed';
import LivestreamConnectingAnimation from 'component/livestreamConnectingAnimation';
import useLivestreamMetrics from 'effects/use-livestream-metrics';
import LivestreamMetrics from 'component/livestreamMetrics/view';
import classnames from 'classnames';
import './style.scss';

type Props = {
  streamKey: string | null;
  livestreamEnabled: boolean;
  hasApprovedLivestreamClaim: boolean;
  presetId: import('constants/webrtcPublish').WebrtcPublishPresetId;
  signature?: string;
  signingTs?: string;
};

type Status =
  | 'idle'
  | 'requesting_permission'
  | 'preview'
  | 'connecting'
  | 'live'
  | 'stopping'
  | 'error';

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
    currentBytes == null || previousBytes == null ||
    currentTimestampMs == null || previousTimestampMs == null ||
    currentTimestampMs <= previousTimestampMs
  ) return null;
  const byteDiff = currentBytes - previousBytes;
  const secondDiff = (currentTimestampMs - previousTimestampMs) / 1000;
  if (byteDiff < 0 || secondDiff <= 0) return null;
  return (byteDiff * 8) / secondDiff / 1000;
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

function classifyEncoderImplementation(encoderImplementation: string | null | undefined): 'hardware' | 'software' | 'unknown' {
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

const LAST_WORKING_CODEC_KEY = 'livestream-last-working-codec';

function getLastWorkingCodec(): WebrtcPublishVideoCodecPreference | null {
  try {
    const v = LocalStorage.getItem(LAST_WORKING_CODEC_KEY);
    return v ? JSON.parse(v) : null;
  } catch { return null; } // eslint-disable-line no-empty
}

function saveWorkingCodec(codec: WebrtcPublishVideoCodecPreference) {
  try { LocalStorage.setItem(LAST_WORKING_CODEC_KEY, JSON.stringify(codec)); } catch {} // eslint-disable-line no-empty
}

/** Returns ordered list of codec preferences to try: last known working → auto → h264 fallback */
function getCodecAttemptOrder(): WebrtcPublishVideoCodecPreference[] {
  const lastWorking = getLastWorkingCodec();
  const attempts: WebrtcPublishVideoCodecPreference[] = [];
  if (lastWorking && lastWorking !== 'auto') attempts.push(lastWorking);
  attempts.push('auto');
  if (!attempts.includes('h264')) attempts.push('h264');
  return attempts;
}

export default function LivestreamWebRtcPublisher(props: Props) {
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
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const encoderLoggedRef = React.useRef(false);
  const [justWentLive, setJustWentLive] = React.useState(false);
  const prevStatusRef = React.useRef<Status>(ctxStatus as Status);
  const adaptivePolicyRef = React.useRef<'balanced' | 'maintain-framerate'>('balanced');

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
  const myLivestreamClaims = useAppSelector((state) => selectLivestreamsForChannelId(state, channelId));
  const nextStreamClaim = myLivestreamClaims?.[0];
  const nextStreamUri = nextStreamClaim?.permanent_url;

  // Server-side stream metrics
  const channelName = activeChannelClaim?.name;
  const serverMetrics = useLivestreamMetrics(channelId, channelName, signature, signingTs, status === 'live');

  // P2P seed: streamer acts as first peer in the P2P swarm (uses shared P2P_DELIVERY setting)
  const activeLivestream = useAppSelector((state) => selectActiveLivestreamForChannel(state, channelId));
  const hlsVideoUrl = activeLivestream?.videoUrl;
  const p2pEnabled = useAppSelector((state) => selectClientSetting(state, SETTINGS.P2P_DELIVERY));
  const prefsReady = useAppSelector(selectPrefsReady);
  const [showP2pConfirm, setShowP2pConfirm] = React.useState(false);

  // Viewer count from commentron WebSocket (actual HLS viewer count, not OME's always-1)
  const activeClaimId = useAppSelector((state) => nextStreamUri ? selectClaimIdForUri(state, nextStreamUri) : undefined);
  const commentronViewers = useAppSelector((state) => activeClaimId ? selectViewersForId(state, activeClaimId) : undefined);
  // For WebRTC viewers, trust OME's number only when streaming via WebRTC
  const isWebRtcSource = serverMetrics?.source_type?.toLowerCase() === 'webrtc';
  const webrtcViewers = isWebRtcSource ? (serverMetrics?.viewers?.webrtc ?? 0) : 0;
  // Total: commentron (real HLS viewers) + OME WebRTC viewers (only if source is WebRTC)
  const totalViewers = (commentronViewers ?? 0) + webrtcViewers;

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
    qualityLimitationReason: null as string | null,
  });

  const whipUrl = streamKey ? getLivestreamWhipIngestUrl(streamKey) : null;
  const browserPublishSupported =
    typeof navigator !== 'undefined' &&
    typeof RTCPeerConnection !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia);
  const canStartStream =
    browserPublishSupported && livestreamEnabled && hasApprovedLivestreamClaim &&
    Boolean(streamKey && whipUrl && LIVESTREAM_SERVER_API);

  // Auto-request camera on mount if not already streaming and no disabling reason
  const autoRequestedRef = React.useRef(false);
  React.useEffect(() => {
    if (autoRequestedRef.current || mediaStream || !browserPublishSupported || !livestreamEnabled || disabledReason) return;
    if (status !== 'idle') return;
    autoRequestedRef.current = true;

    // Check if we already have permission before prompting
    navigator.permissions?.query?.({ name: 'camera' as PermissionName }).then((result) => {
      if (result.state === 'granted') {
        // Permission already granted - open camera silently
        requestCameraPreview();
      }
      // If 'prompt' or 'denied', don't auto-request - show the button instead
    }).catch(() => {
      // permissions API not available, don't auto-request
    });
  }, [browserPublishSupported, livestreamEnabled, status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function requestCameraPreview() {
    setErrorMessage(null);
    try {
      const videoConstraints = getWebrtcPublishVideoConstraints(presetId);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      stream.getAudioTracks().forEach((t) => { t.enabled = micEnabled; });
      setMediaStream(stream);
      setStatus('preview');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMessage(msg);
    }
  }

  // Detect connecting→live transition for the flash animation
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

  // Mic toggle
  React.useEffect(() => {
    if (!mediaStream) return;
    mediaStream.getAudioTracks().forEach((t) => { t.enabled = micEnabled; });
  }, [micEnabled, mediaStream]);

  // Camera toggle
  React.useEffect(() => {
    if (!mediaStream) return;
    mediaStream.getVideoTracks().forEach((t) => { t.enabled = cameraEnabled; });
  }, [cameraEnabled, mediaStream]);

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
      adaptivePolicyRef.current = 'balanced';
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
        qualityLimitationReason: null,
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
          if (current.type === 'codec') { codecs.set(current.id, current); return; }
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
            ? formatCodecLabel(codecs.get(videoOutbound.codecId)?.mimeType || '', codecs.get(videoOutbound.codecId)?.sdpFmtpLine)
            : null,
          audioCodec: audioOutbound?.codecId
            ? formatCodecLabel(codecs.get(audioOutbound.codecId)?.mimeType || '', codecs.get(audioOutbound.codecId)?.sdpFmtpLine)
            : null,
          videoBitrateKbps: computeBitrateKbps(videoOutbound?.bytesSent, previous.videoBytes, timestampMs, previous.timestampMs),
          audioBitrateKbps: computeBitrateKbps(audioOutbound?.bytesSent, previous.audioBytes, timestampMs, previous.timestampMs),
          fps: typeof videoOutbound?.framesPerSecond === 'number' ? Math.round(videoOutbound.framesPerSecond) : null,
          // @ts-ignore - encoderImplementation exists on RTCOutboundRtpStreamStats in Chrome
          encoderImpl: videoOutbound?.encoderImplementation || null,
          qualityLimitationReason: videoOutbound?.qualityLimitationReason || null,
          resolution: videoOutbound?.frameWidth && videoOutbound?.frameHeight
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
          console.log(`[WebRTC] Encoder: ${impl} (${acceleration.toUpperCase()})`); // eslint-disable-line no-console
        }

        const encoderAcceleration = classifyEncoderImplementation((newStats as any).encoderImpl);
        const shouldPreferFramerate =
          encoderAcceleration === 'software' ||
          newStats.qualityLimitationReason === 'cpu';

        if (shouldPreferFramerate && adaptivePolicyRef.current !== 'maintain-framerate') {
          adaptivePolicyRef.current = 'maintain-framerate';
          void updateWhipVideoEncodingPolicy(pc, {
            degradationPreference: 'maintain-framerate',
          });
          console.log('[WebRTC] Switching degradation preference to maintain-framerate due to CPU/software encoding'); // eslint-disable-line no-console
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
    return () => { canceled = true; window.clearInterval(interval); };
  }, [status, mediaStream]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Actions ----

  async function handleGoLive() {
    if (status === 'idle' || status === 'error') {
      setErrorMessage(null);
      setStatus('requesting_permission');
      try {
        const videoConstraints = getWebrtcPublishVideoConstraints(presetId);
        console.log('[WebRTC] Requesting camera with constraints:', JSON.stringify(videoConstraints)); // eslint-disable-line no-console
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        const videoSettings = stream.getVideoTracks()[0]?.getSettings();
        console.log('[WebRTC] Camera delivered:', videoSettings?.width + 'x' + videoSettings?.height, '@', videoSettings?.frameRate + 'fps'); // eslint-disable-line no-console
        stream.getAudioTracks().forEach((t) => { t.enabled = micEnabled; });
        setMediaStream(stream);

        if (!canStartStream) {
          setStatus('preview');
          return;
        }

        setStatus('connecting');
        const ac = new AbortController();
        connectAbortRef.current = ac;
        const enc = getWebrtcPublishEncodingOptions(presetId);
        const codecAttempts = getCodecAttemptOrder();
        let lastErr: unknown;
        for (const codec of codecAttempts) {
          if (ac.signal.aborted) break;
          try {
            console.log(`[WebRTC] Trying codec preference: ${codec}`); // eslint-disable-line no-console
            const { pc, resourceUrl } = await startWhipPublish(whipUrl!, stream, {
              signal: ac.signal,
              maxVideoBitrateBps: enc.maxVideoBitrateBps,
              maxVideoFramerate: enc.maxVideoFramerate,
              videoCodecPreference: codec,
              degradationPreference: 'balanced',
            });
            connectAbortRef.current = null;
            publishCtx.actions.setPc(pc);
            publishCtx.actions.setResourceUrl(resourceUrl);
            publishCtx.actions.updateStats({ liveStartedAt: Date.now() });
            saveWorkingCodec(codec);
            setStatus('live');
            dispatch(doToast({ message: __('You are live!') }));
            return;
          } catch (e: unknown) {
            lastErr = e;
            if (isAbortError(e)) break;
            console.warn(`[WebRTC] Codec ${codec} failed, trying next...`, e); // eslint-disable-line no-console
          }
        }
        connectAbortRef.current = null;
        if (isAbortError(lastErr)) {
          setStatus(publishCtx.state.mediaStream ? 'preview' : 'idle');
          return;
        }
        const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
        setErrorMessage(msg);
        setStatus(publishCtx.state.mediaStream ? 'preview' : 'error');
        publishCtx.actions.setPc(null);
        publishCtx.actions.setResourceUrl(null);
        dispatch(doToast({ isError: true, message: __('Failed to start stream. Check permissions and try again.') }));
      } catch (e: unknown) {
        connectAbortRef.current = null;
        if (isAbortError(e)) {
          setStatus(publishCtx.state.mediaStream ? 'preview' : 'idle');
          return;
        }
        const msg = e instanceof Error ? e.message : String(e);
        setErrorMessage(msg);
        setStatus('error');
        dispatch(doToast({ isError: true, message: __('Could not access camera or microphone.') }));
      }
    } else if (status === 'preview') {
      if (!mediaStream || !whipUrl) return;
      setErrorMessage(null);
      setStatus('connecting');
      const ac = new AbortController();
      connectAbortRef.current = ac;
      const enc = getWebrtcPublishEncodingOptions(presetId);
      const codecAttempts = getCodecAttemptOrder();
      let lastErr: unknown;
      for (const codec of codecAttempts) {
        if (ac.signal.aborted) break;
        try {
          console.log(`[WebRTC] Trying codec preference: ${codec}`); // eslint-disable-line no-console
          const { pc, resourceUrl } = await startWhipPublish(whipUrl, mediaStream, {
            signal: ac.signal,
            maxVideoBitrateBps: enc.maxVideoBitrateBps,
            maxVideoFramerate: enc.maxVideoFramerate,
            videoCodecPreference: codec,
            degradationPreference: 'balanced',
          });
          connectAbortRef.current = null;
          publishCtx.actions.setPc(pc);
          publishCtx.actions.setResourceUrl(resourceUrl);
          publishCtx.actions.updateStats({ liveStartedAt: Date.now() });
          saveWorkingCodec(codec);
          setStatus('live');
          dispatch(doToast({ message: __('You are live!') }));
          return;
        } catch (e: unknown) {
          lastErr = e;
          if (isAbortError(e)) break;
          console.warn(`[WebRTC] Codec ${codec} failed, trying next...`, e); // eslint-disable-line no-console
        }
      }
      connectAbortRef.current = null;
      if (isAbortError(lastErr)) { setStatus('preview'); return; }
      const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
      setErrorMessage(msg);
      setStatus('preview');
      publishCtx.actions.setPc(null);
      publishCtx.actions.setResourceUrl(null);
      dispatch(doToast({ isError: true, message: __('Connection failed. Try again.') }));
    }
  }

  async function handleStop() {
    await publishCtx.actions.stopStream();
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
  const hasCamera = Boolean(mediaStream);

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
      <div className="livestream-webrtc">
        <div className="livestream-webrtc__disabled">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          <p>{__('Livestreaming is disabled for this account. Contact support for assistance.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="livestream-webrtc">
      {/* Main Stage */}
      <div className="livestream-webrtc__stage">
        <div
          className={classnames('livestream-webrtc__preview', {
            'livestream-webrtc__preview--active': hasCamera,
            'livestream-webrtc__preview--live': isLive,
          })}
        >
          <video
            ref={videoRef}
            className="livestream-webrtc__video"
            playsInline
            muted
            autoPlay
          />

          {/* Connecting animation overlay (only during WHIP connection, not camera request) */}
          {isConnecting && (
            <LivestreamConnectingAnimation status="connecting" />
          )}

          {/* Flash transition when going live */}
          {justWentLive && (
            <LivestreamConnectingAnimation
              status="connecting"
              onLive
            />
          )}

          {hasCamera && (
            <div className="livestream-webrtc__preview-overlay">
              <div className="livestream-webrtc__overlay-top">
                <span
                  className={classnames('livestream-webrtc__status-badge', {
                    'livestream-webrtc__status-badge--live': isLive,
                    'livestream-webrtc__status-badge--connecting': isConnecting,
                  })}
                >
                  {isLive && (
                    <>
                      <span className="livestream-webrtc__status-dot" />
                      {__('LIVE')}
                    </>
                  )}
                  {isConnecting && __('CONNECTING...')}
                  {status === 'preview' && __('PREVIEW')}
                  {status === 'requesting_permission' && __('STARTING...')}
                </span>
                {isLive && elapsedSeconds > 0 && (
                  <span className="livestream-webrtc__elapsed">{formatElapsed(elapsedSeconds)}</span>
                )}
              </div>
              {isLive && (
                <div className="livestream-webrtc__overlay-bottom">
                  {/* Viewers (only if > 0) */}
                  {totalViewers > 0 && (
                    <span className="livestream-webrtc__pill">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      {totalViewers}
                      {isWebRtcSource && webrtcViewers > 0 && (
                        <span className="livestream-webrtc__pill-sub">+{webrtcViewers} P2P</span>
                      )}
                    </span>
                  )}
                  {/* Bitrate from server metrics or client stats */}
                  {(() => {
                    const bps = serverMetrics?.live && serverMetrics.throughput
                      ? serverMetrics.throughput.in_bps / 1000
                      : runtimeStats.videoBitrateKbps;
                    return bps != null && bps > 0 ? (
                      <span className="livestream-webrtc__pill">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="19" x2="12" y2="5" />
                          <polyline points="5 12 12 5 19 12" />
                        </svg>
                        {formatBitrate(bps)}
                      </span>
                    ) : null;
                  })()}
                  {/* Resolution */}
                  {(() => {
                    const captureSettings = mediaStream?.getVideoTracks()[0]?.getSettings();
                    const res = captureSettings?.width && captureSettings?.height
                      ? formatResolutionLabel(`${captureSettings.width}x${captureSettings.height}`)
                      : formatResolutionLabel(runtimeStats.resolution);
                    return res ? <span className="livestream-webrtc__pill">{res}</span> : null;
                  })()}
                  {/* Codec pill */}
                  {runtimeStats.videoCodec && (
                    <span className="livestream-webrtc__pill" title={runtimeStats.encoderImpl || ''}>
                      {runtimeStats.videoCodec}
                      {runtimeStats.encoderImpl && (
                        <span className="livestream-webrtc__pill-hw">
                          {classifyEncoderImplementation(runtimeStats.encoderImpl) === 'hardware' ? 'HW' : 'SW'}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {!hasCamera && (
            <div className="livestream-webrtc__placeholder">
              {!errorMessage && (
                <>
                  <div className="livestream-webrtc__placeholder-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 7l-7 5 7 5V7z" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </div>
                  {disabledReason ? (
                    <p className="livestream-webrtc__placeholder-text">{disabledReason}</p>
                  ) : (
                    <button
                      className="livestream-webrtc__allow-camera-btn"
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
                  <div className="livestream-webrtc__placeholder-icon livestream-webrtc__placeholder-icon--error">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
                    </svg>
                  </div>
                  <p className="livestream-webrtc__placeholder-error">{errorMessage}</p>
                  <button
                    className="livestream-webrtc__allow-camera-btn"
                    onClick={requestCameraPreview}
                  >
                    {__('Try Again')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Controls bar */}
        {hasCamera && (
          <div className="livestream-webrtc__controls">
            <button
              className={classnames('livestream-webrtc__control-btn', {
                'livestream-webrtc__control-btn--off': !micEnabled,
              })}
              onClick={() => setMicEnabled(!micEnabled)}
              disabled={isStopping}
              title={micEnabled ? __('Mute microphone') : __('Unmute microphone')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              className={classnames('livestream-webrtc__control-btn', {
                'livestream-webrtc__control-btn--off': !cameraEnabled,
              })}
              onClick={() => setCameraEnabled(!cameraEnabled)}
              disabled={isStopping}
              title={cameraEnabled ? __('Turn off camera') : __('Turn on camera')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

            <div className="livestream-webrtc__controls-spacer" />

            {isLive && hlsVideoUrl && (
              <button
                className={classnames('livestream-webrtc__control-btn livestream-webrtc__control-btn--p2p', {
                  'livestream-webrtc__control-btn--p2p-active': p2pEnabled,
                })}
                onClick={() => {
                  if (p2pEnabled) {
                    dispatch(doSetClientSetting(SETTINGS.P2P_DELIVERY, false, prefsReady));
                  } else {
                    setShowP2pConfirm(true);
                  }
                }}
                title={p2pEnabled ? __('P2P seeding active') : __('Enable P2P seeding')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </button>
            )}

            {(isLive || isConnecting) && (
              <Button
                button="primary"
                className="livestream-webrtc__stop-btn"
                onClick={isConnecting ? handleCancel : handleStop}
                disabled={isStopping}
                label={isStopping ? __('Ending...') : isConnecting ? __('Cancel') : __('End Stream')}
              />
            )}
          </div>
        )}
      </div>

      {/* Primary Action */}
      <div className="livestream-webrtc__action-area">
        {(status === 'idle' || status === 'error' || status === 'preview' || status === 'requesting_permission') && (
          <Button
            button="primary"
            className="livestream-webrtc__go-live-btn"
            onClick={handleGoLive}
            disabled={Boolean(disabledReason) || status === 'requesting_permission'}
            label={
              status === 'requesting_permission'
                ? __('Starting camera...')
                : status === 'preview'
                  ? canStartStream
                    ? __('Go Live')
                    : __('Preview Only (no claim published)')
                  : __('Go Live')
            }
            icon={status !== 'requesting_permission' ? ICONS.LIVESTREAM : undefined}
          />
        )}
        {errorMessage && (status === 'error' || status === 'preview') && (
          <p className="livestream-webrtc__error-msg">{errorMessage}</p>
        )}
        {disabledReason && !hasCamera && (
          <p className="livestream-webrtc__hint-msg">{disabledReason}</p>
        )}
      </div>

      {/* Claim Preview - AFTER the button */}
      {nextStreamUri && (
        <div className="livestream-webrtc__claim-section">
          <div className="livestream-webrtc__claim-header">
            <span className="livestream-webrtc__claim-label">{__('Streaming to')}</span>
            <div className="livestream-webrtc__claim-actions">
              <button
                className="livestream-webrtc__claim-action"
                onClick={() => navigate(`/$/${PAGES.LIVESTREAM}?t=Publish`)}
                title={__('Edit this stream')}
              >
                {__('Edit')}
              </button>
              <button
                className="livestream-webrtc__claim-action"
                onClick={() => navigate(`/$/${PAGES.LIVESTREAM}?t=Publish&new=1`)}
                title={__('Create a new livestream')}
              >
                {__('New')}
              </button>
            </div>
          </div>
          <div className="livestream-webrtc__claim-card">
            <ClaimPreview uri={nextStreamUri} type="small" />
          </div>
        </div>
      )}

      {!nextStreamUri && (
        <div className="livestream-webrtc__no-claim">
          <p>{__('No livestream claim found.')}</p>
          <Button
            button="link"
            label={__('Create one now')}
            onClick={() => navigate(`/$/${PAGES.LIVESTREAM}?t=Publish`)}
          />
        </div>
      )}

      {/* Hidden P2P seed player - makes streamer the first peer */}
      {hlsVideoUrl && (
        <LivestreamP2PSeed videoUrl={hlsVideoUrl} active={p2pEnabled && isLive} />
      )}

      {/* P2P confirmation dialog */}
      {showP2pConfirm && (
        <div className="livestream-webrtc__p2p-confirm">
          <div className="livestream-webrtc__p2p-confirm-card">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            <h4>{__('Enable P2P delivery?')}</h4>
            <p>
              {__('Your stream will be shared peer-to-peer with viewers. This reduces server load but your IP address may be visible to viewers. This also applies when you watch other livestreams.')}
            </p>
            <div className="livestream-webrtc__p2p-confirm-actions">
              <button
                className="livestream-webrtc__p2p-confirm-btn livestream-webrtc__p2p-confirm-btn--primary"
                onClick={() => {
                  dispatch(doSetClientSetting(SETTINGS.P2P_DELIVERY, true, prefsReady));
                  setShowP2pConfirm(false);
                }}
              >
                {__('Enable P2P')}
              </button>
              <button
                className="livestream-webrtc__p2p-confirm-btn livestream-webrtc__p2p-confirm-btn--secondary"
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
