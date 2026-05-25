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
  isPortraitOrientation,
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
  selectLivestreamsForChannelId,
  selectPendingLivestreamsForChannelId,
  selectViewersForId,
  selectActiveLivestreamForChannel,
} from 'redux/selectors/livestream';
import { doFetchChannelIsLiveForId } from 'redux/actions/livestream';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectClaimIdForUri, selectClaimForUri } from 'redux/selectors/claims';
import { selectCommentsForUri } from 'redux/selectors/comments';
import {
  doCommentSocketConnect as doCommentSocketConnectAction,
  doCommentSocketDisconnect as doCommentSocketDisconnectAction,
} from 'redux/actions/websocket';
import { doCommentList } from 'redux/actions/comments';
import { doResolveUri } from 'redux/actions/claims';
import { formatLbryChannelName } from 'util/url';
import ClaimPreview from 'component/claimPreview';
import LivestreamP2PSeed from 'component/livestreamP2PSeed';
import LivestreamConnectingAnimation from 'component/livestreamConnectingAnimation';
import useLivestreamMetrics from 'effects/use-livestream-metrics';
import classnames from 'classnames';
import describeUnknown from 'util/describeUnknown';
import LivestreamSourceSelector from 'component/livestreamSourceSelector/view';
import type { VideoSource, AudioSource } from 'component/livestreamSourceSelector/view';
import LivestreamCompositor, { ChatWidgetEditPreview } from 'component/livestreamCompositor/view';
import LivestreamCropSelector from 'component/livestreamCropSelector/view';
import LivestreamSourceSettings from 'component/livestreamSourceSettings/view';
import SpacemanPng from './spaceman.png';
import { PLACEHOLDER_MESSAGES, PLACEHOLDER_HYPERCHATS, hyperchatColor } from 'util/livestreamChatPlaceholders';
import type { CompositorLayer } from 'component/livestreamCompositor/view';
import { AudioMixer } from 'util/audioMixer';
import './style.scss';

type Props = {
  streamKey: string | null;
  livestreamUri?: string;
  livestreamEnabled: boolean;
  hasApprovedLivestreamClaim: boolean;
  presetId: import('constants/webrtcPublish').WebrtcPublishPresetId;
  signature?: string;
  signingTs?: string;
  isFloating?: boolean;
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

  const portraitMobile = platform.isMobile() && isPortraitOrientation();
  const vgaW = portraitMobile ? 480 : 640;
  const vgaH = portraitMobile ? 640 : 480;
  const lowResW = portraitMobile ? 480 : 854;
  const lowResH = portraitMobile ? 854 : 480;

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
    width: { exact: vgaW },
    height: { exact: vgaH },
    frameRate: { exact: targetFps },
    resizeMode: 'none',
  } satisfies MediaTrackConstraintsWithResizeMode;

  const strictVgaMode = {
    ...sharedCameraPrefs,
    width: { exact: vgaW },
    height: { exact: vgaH },
    frameRate: { min: targetFps, ideal: targetFps },
    resizeMode: 'none',
  } satisfies MediaTrackConstraintsWithResizeMode;

  const strictBaseScalable = {
    ...base,
    frameRate: { min: targetFps, ideal: targetFps },
  } satisfies MediaTrackConstraintsWithResizeMode;

  const lowerResolutionStrictScalable = {
    ...sharedCameraPrefs,
    width: { ideal: lowResW },
    height: { ideal: lowResH },
    frameRate: { min: targetFps, ideal: targetFps },
  } satisfies MediaTrackConstraintsWithResizeMode;

  const lowerResolutionSoftScalable = {
    ...sharedCameraPrefs,
    width: { ideal: lowResW },
    height: { ideal: lowResH },
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

function ChatWidgetTabPreview({ layer }: { layer: CompositorLayer }) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(layer.width);
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWidth(el.getBoundingClientRect().width);
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const scale = layer.width > 0 ? width / layer.width : 1;
  return (
    <div
      ref={wrapRef}
      style={{
        position: 'absolute',
        inset: 0,
        aspectRatio: `${layer.width} / ${layer.height}`,
        margin: 'auto',
        maxWidth: '100%',
        maxHeight: '100%',
      }}
    >
      <ChatWidgetEditPreview layer={layer} scale={scale} />
    </div>
  );
}

function StreamPreview({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  const mirrorRef = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    let frame: number;
    const draw = () => {
      const mirror = mirrorRef.current;
      const src = canvasRef.current;
      if (mirror && src && src.width > 0 && src.height > 0) {
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
  _preferredCodec: WebrtcPublishVideoCodecPreference | undefined
): WebrtcPublishVideoCodecPreference[] {
  return ['h264'];
}

export default function LivestreamStudio(props: Props) {
  const { streamKey, livestreamUri, livestreamEnabled, hasApprovedLivestreamClaim, presetId, signature, signingTs } =
    props;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const publishCtx = useLivestreamPublish();
  const livestreamClaim = useAppSelector((state) =>
    livestreamUri ? selectClaimForUri(state, livestreamUri) : undefined
  );
  const liveComments = useAppSelector((state) =>
    livestreamUri ? selectCommentsForUri(state, livestreamUri) : undefined
  );
  const liveCommentsRef = React.useRef<any[]>([]);
  React.useEffect(() => {
    liveCommentsRef.current = Array.isArray(liveComments) ? liveComments : [];
  }, [liveComments]);

  React.useEffect(() => {
    if (livestreamUri) dispatch(doResolveUri(livestreamUri));
  }, [livestreamUri, dispatch]);

  React.useEffect(() => {
    if (!livestreamUri || !livestreamClaim) return;
    const claimId = livestreamClaim.claim_id;
    const channelClaim = livestreamClaim.signing_channel;
    const channelUrl = channelClaim && channelClaim.canonical_url;
    const channelName = channelClaim && formatLbryChannelName(channelUrl);
    if (!claimId || !channelName) return;
    dispatch(doCommentSocketConnectAction(livestreamUri, channelName, claimId, undefined));
    dispatch(doCommentList(livestreamUri, undefined, 1, 75, undefined, true));
    return () => {
      dispatch(doCommentSocketDisconnectAction(claimId, channelName, undefined));
    };
  }, [livestreamUri, livestreamClaim, dispatch]);
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
  React.useEffect(() => {
    compositorLayersRef.current = compositorLayers;
  }, [compositorLayers]);

  type SavedComposition = {
    id: string;
    name: string;
    thumbnail: string;
    layers: Array<Partial<CompositorLayer> & { id: string }>;
    videoSources?: VideoSource[];
    audioSources?: AudioSource[];
    widgetIds?: string[];
    savedAt: number;
  };
  const SAVED_KEY = 'livestream-saved-compositions';
  const [savedCompositions, setSavedCompositions] = React.useState<Array<SavedComposition>>(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [saveModalOpen, setSaveModalOpen] = React.useState(false);
  const [saveModalName, setSaveModalName] = React.useState('');

  function persistSaved(next: Array<SavedComposition>) {
    setSavedCompositions(next);
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    } catch {}
  }

  function handleSaveComposition() {
    const canvas = compositorCanvasRef.current;
    let thumbnail = '';
    if (canvas) {
      try {
        const tmp = document.createElement('canvas');
        tmp.width = 320;
        tmp.height = Math.round((320 * canvas.height) / canvas.width);
        const ctx = tmp.getContext('2d');
        if (ctx) {
          ctx.drawImage(canvas, 0, 0, tmp.width, tmp.height);
          // Overlay placeholder chat for chat widget layers
          const sx = tmp.width / canvas.width;
          const sy = tmp.height / canvas.height;
          for (const layer of compositorLayers) {
            if (layer.id !== '__widget_chat__' || !layer.visible) continue;
            const lx = layer.x * sx;
            const ly = layer.y * sy;
            const lw = layer.width * sx;
            const lh = layer.height * sy;
            const fontSize = (layer.chatFontSize ?? 20) * sx;
            const lineH = fontSize * (layer.chatLineHeight ?? 1.4);
            const bannerH = Math.round(fontSize * 1.1);
            const userColor = layer.chatUserColor ?? '#de0050';
            const textColor = layer.chatTextColor ?? '#ffffff';
            const padX = 8 * sx;
            const max = layer.chatMaxMessages ?? 30;
            const visible = (layer.chatHyperchatOnly ? PLACEHOLDER_HYPERCHATS : PLACEHOLDER_MESSAGES).slice(0, max);
            ctx.save();
            ctx.beginPath();
            ctx.rect(lx, ly, lw, lh);
            ctx.clip();
            const bgAlpha = layer.chatBgAlpha ?? (layer.chatBgTransparent === false ? 1 : 0);
            if (bgAlpha > 0) {
              ctx.fillStyle = layer.chatBgColor ?? '#000000';
              ctx.globalAlpha = bgAlpha;
              ctx.fillRect(lx, ly, lw, lh);
              ctx.globalAlpha = 1;
            }
            ctx.font = `${fontSize}px sans-serif`;
            ctx.textBaseline = 'top';
            let totalH = 0;
            for (const m of visible) {
              if (m.amount) totalH += lineH + bannerH + 12;
              else totalH += lineH;
            }
            const newOnTop = layer.chatNewOnTop ?? false;
            let yy = newOnTop ? ly + 8 * sy : Math.max(ly + 8 * sy, ly + lh - totalH - 8 * sy);
            const drawList = newOnTop ? [...visible].reverse() : visible;
            for (const m of drawList) {
              if (m.amount) {
                const [r, g, b] = hyperchatColor(m.amount);
                const blockTop = yy - 4 * sy;
                const blockBottom = yy + lineH + bannerH + 8 * sy;
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.08)`;
                ctx.fillRect(lx + padX, blockTop, lw - 2 * padX, blockBottom - blockTop);
                ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.lineWidth = 1;
                ctx.strokeRect(lx + padX + 0.5, blockTop + 0.5, lw - 2 * padX - 1, blockBottom - blockTop - 1);
                const grad = ctx.createLinearGradient(lx + padX, 0, lx + lw - padX, 0);
                grad.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
                grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
                ctx.fillStyle = grad;
                ctx.fillRect(lx + padX, blockTop, lw - 2 * padX, bannerH);
                ctx.fillStyle = '#fff';
                ctx.font = `700 ${Math.round(fontSize * 0.7)}px sans-serif`;
                ctx.fillText(`$${m.amount}`, lx + padX + 6, blockTop + 3);
                ctx.font = `${fontSize}px sans-serif`;
                const userText = `${m.user}: `;
                const textY = blockTop + bannerH + 4;
                ctx.fillStyle = userColor;
                ctx.fillText(userText, lx + padX + 4, textY);
                const userW = ctx.measureText(userText).width;
                ctx.fillStyle = textColor;
                ctx.fillText(m.msg, lx + padX + 4 + userW, textY);
                yy = blockBottom + 6 * sy;
              } else {
                const userText = `${m.user}: `;
                ctx.fillStyle = userColor;
                ctx.fillText(userText, lx + padX, yy);
                const userW = ctx.measureText(userText).width;
                ctx.fillStyle = textColor;
                ctx.fillText(m.msg, lx + padX + userW, yy);
                yy += lineH;
              }
            }
            ctx.restore();
          }
          thumbnail = tmp.toDataURL('image/png');
        }
      } catch {}
    }
    const layerMeta = compositorLayers.map((l) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { stream, crop, aspectRatio, ...rest } = l;
      return rest as Partial<CompositorLayer> & { id: string };
    });
    const entry: SavedComposition = {
      id: `comp_${Date.now()}`,
      name: saveModalName.trim() || `Composition ${savedCompositions.length + 1}`,
      thumbnail,
      layers: layerMeta,
      videoSources: Array.from(activeVideoIds)
        .map((vid) => activatedVideoSourcesRef.current.get(vid))
        .filter((s): s is VideoSource => Boolean(s)),
      audioSources: Array.from(activeAudioIds)
        .map((aid) => activatedAudioSourcesRef.current.get(aid))
        .filter((s): s is AudioSource => Boolean(s)),
      widgetIds: Array.from(activeWidgetIds),
      savedAt: Date.now(),
    };
    persistSaved([entry, ...savedCompositions]);
    setSaveModalOpen(false);
    setSaveModalName('');
  }

  function handleDeleteSaved(id: string) {
    persistSaved(savedCompositions.filter((c) => c.id !== id));
  }

  const loadAnimRef = React.useRef<number | null>(null);
  async function handleLoadSaved(comp: SavedComposition) {
    if (loadAnimRef.current !== null) {
      cancelAnimationFrame(loadAnimRef.current);
      loadAnimRef.current = null;
    }
    const startSnap = new Map(
      compositorLayersRef.current.map((l) => [
        l.id,
        { x: l.x, y: l.y, width: l.width, height: l.height, borderRadius: l.borderRadius || 0 },
      ])
    );

    const placeholderToPrefix: Record<string, string> = {
      __screen__: '__screen_',
      __image__: '__image_',
      __videofile__: '__videofile_',
    };
    const targetVideoIds = new Set<string>();
    const usedLayerIds = new Set<string>();
    const remappedSources: Array<VideoSource> = [];
    if (comp.videoSources) {
      for (const src of comp.videoSources) {
        let effectiveSrc = src;
        const placeholderPrefix = placeholderToPrefix[src.deviceId];
        if (placeholderPrefix) {
          const matching = comp.layers.find(
            (l) => l.id?.startsWith(placeholderPrefix) && l.id !== src.deviceId && !usedLayerIds.has(l.id)
          );
          if (matching?.id) {
            usedLayerIds.add(matching.id);
            effectiveSrc = { ...src, deviceId: matching.id };
          }
        }
        targetVideoIds.add(effectiveSrc.deviceId);
        remappedSources.push(effectiveSrc);
      }
    }
    const targetAudioIds = new Set<string>((comp.audioSources || []).map((s) => s.deviceId));
    const targetWidgetIds = new Set<string>(comp.widgetIds || []);

    const purgeVideoIds = Array.from(activeVideoIds).filter((id) => !targetVideoIds.has(id));
    for (const id of purgeVideoIds) {
      const stream = sourceStreamsRef.current.get(id);
      stream?.getTracks().forEach((t) => t.stop());
      sourceStreamsRef.current.delete(id);
      activatedVideoSourcesRef.current.delete(id);
      const screenAudioId = screenAudioByVideoIdRef.current.get(id);
      if (screenAudioId) {
        audioMixerRef.current?.removeSource(screenAudioId);
        const aud = sourceStreamsRef.current.get(`audio-${screenAudioId}`);
        aud?.getTracks().forEach((t) => t.stop());
        sourceStreamsRef.current.delete(`audio-${screenAudioId}`);
        screenAudioByVideoIdRef.current.delete(id);
      }
    }
    const purgeAudioIds = Array.from(activeAudioIds).filter((id) => !targetAudioIds.has(id));
    for (const id of purgeAudioIds) {
      audioMixerRef.current?.removeSource(id);
      const stream = sourceStreamsRef.current.get(`audio-${id}`);
      stream?.getTracks().forEach((t) => t.stop());
      sourceStreamsRef.current.delete(`audio-${id}`);
      activatedAudioSourcesRef.current.delete(id);
    }
    const purgeWidgetIds = Array.from(activeWidgetIds).filter((id) => !targetWidgetIds.has(id));
    for (const id of purgeWidgetIds) {
      const anim = widgetAnimRef.current.get(id);
      if (anim) cancelAnimationFrame(anim);
      widgetAnimRef.current.delete(id);
      widgetCanvasesRef.current.delete(id);
      const stream = sourceStreamsRef.current.get(id);
      stream?.getTracks().forEach((t) => t.stop());
      sourceStreamsRef.current.delete(id);
    }
    if (purgeVideoIds.length > 0) {
      setActiveVideoIds((prev) => {
        const next = new Set(prev);
        purgeVideoIds.forEach((id) => next.delete(id));
        return next;
      });
      setExtraVideoSources((prev) => prev.filter((s) => !purgeVideoIds.includes(s.deviceId)));
    }
    if (purgeAudioIds.length > 0) {
      setActiveAudioIds((prev) => {
        const next = new Set(prev);
        purgeAudioIds.forEach((id) => next.delete(id));
        return next;
      });
      setExtraAudioSources((prev) => prev.filter((s) => !purgeAudioIds.includes(s.deviceId)));
      setAudioVolumes((prev) => {
        const next = { ...prev };
        purgeAudioIds.forEach((id) => delete next[id]);
        return next;
      });
    }
    if (purgeWidgetIds.length > 0) {
      setActiveWidgetIds((prev) => {
        const next = new Set(prev);
        purgeWidgetIds.forEach((id) => next.delete(id));
        return next;
      });
    }

    for (const wid of targetWidgetIds) {
      if (!activeWidgetIds.has(wid)) handleToggleWidget(wid);
    }
    for (const src of remappedSources) {
      if (!activeVideoIds.has(src.deviceId)) {
        try {
          await handleToggleVideo(src);
        } catch {}
      }
    }
    if (comp.audioSources) {
      for (const src of comp.audioSources) {
        if (!activeAudioIds.has(src.deviceId)) {
          try {
            await handleToggleAudio(src);
          } catch {}
        }
      }
    }

    const targetLayerIds = new Set(comp.layers.map((l) => l.id).filter(Boolean));
    setActiveVideoIds((prev) => {
      const next = new Set<string>();
      prev.forEach((id) => {
        if (targetLayerIds.has(id)) next.add(id);
      });
      return next;
    });
    setExtraVideoSources((prev) => prev.filter((s) => targetLayerIds.has(s.deviceId)));
    for (const id of Array.from(sourceStreamsRef.current.keys())) {
      if (!targetLayerIds.has(id) && !id.startsWith('audio-')) {
        const s = sourceStreamsRef.current.get(id);
        s?.getTracks().forEach((t) => t.stop());
        sourceStreamsRef.current.delete(id);
        activatedVideoSourcesRef.current.delete(id);
      }
    }

    const outW = getOutputWidth();
    const outH = getOutputHeight();
    const clampLayer = (l: any) => {
      const w = Math.max(50, Math.min(outW, l.width || 50));
      const h = Math.max(50, Math.min(outH, l.height || 50));
      const x = Math.max(0, Math.min(outW - w, l.x ?? 0));
      const y = Math.max(0, Math.min(outH - h, l.y ?? 0));
      return { ...l, x, y, width: w, height: h };
    };

    setCompositorLayers((prev) => {
      const prevById = new Map(prev.map((p) => [p.id, p]));
      return comp.layers.map((saved) => {
        const existing = prevById.get(saved.id);
        const sharedStart = startSnap.get(saved.id);
        if (sharedStart && existing) {
          return clampLayer({
            ...existing,
            ...saved,
            x: sharedStart.x,
            y: sharedStart.y,
            width: sharedStart.width,
            height: sharedStart.height,
            borderRadius: sharedStart.borderRadius,
            crop: existing.crop,
            aspectRatio: existing.aspectRatio,
            stream: existing.stream || null,
          }) as CompositorLayer;
        }
        const baseAspect = existing?.aspectRatio;
        const savedW = saved.width;
        return clampLayer({
          ...existing,
          ...saved,
          ...(existing
            ? {
                crop: existing.crop,
                aspectRatio: existing.aspectRatio,
                ...(baseAspect && savedW ? { height: Math.round(savedW / baseAspect) } : {}),
              }
            : {}),
          stream: existing?.stream || null,
        }) as CompositorLayer;
      });
    });

    const sharedTargets = comp.layers.filter((l) => l.id && startSnap.has(l.id));
    if (sharedTargets.length === 0) return;

    const duration = 400;
    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 0.5 - 0.5 * Math.cos(t * Math.PI);
      setCompositorLayers((prev) =>
        prev.map((l) => {
          const start = startSnap.get(l.id);
          const target = sharedTargets.find((s) => s.id === l.id);
          if (!start || !target) return l;
          const lerp = (a: number, b: number) => a + (b - a) * eased;
          const rawTargetW = target.width ?? start.width;
          const rawTargetH = l.aspectRatio ? rawTargetW / l.aspectRatio : (target.height ?? start.height);
          const tW = Math.max(50, Math.min(outW, rawTargetW));
          const tH = Math.max(50, Math.min(outH, rawTargetH));
          const tX = Math.max(0, Math.min(outW - tW, target.x ?? start.x));
          const tY = Math.max(0, Math.min(outH - tH, target.y ?? start.y));
          return {
            ...l,
            x: Math.round(lerp(start.x, tX)),
            y: Math.round(lerp(start.y, tY)),
            width: Math.round(lerp(start.width, tW)),
            height: Math.round(lerp(start.height, tH)),
            borderRadius: Math.round(lerp(start.borderRadius, target.borderRadius ?? start.borderRadius)),
          };
        })
      );
      if (t < 1) {
        loadAnimRef.current = requestAnimationFrame(tick);
      } else {
        loadAnimRef.current = null;
      }
    };
    loadAnimRef.current = requestAnimationFrame(tick);
  }

  const [selectedLayerId, setSelectedLayerId] = React.useState<string | null>(null);
  const [previewTab, setPreviewTab] = React.useState<'preview' | 'compositor' | string>('preview');
  const [activeVideoIds, setActiveVideoIds] = React.useState<Set<string>>(new Set());
  const [activeAudioIds, setActiveAudioIds] = React.useState<Set<string>>(new Set());
  const [audioVolumes, setAudioVolumes] = React.useState<Record<string, number>>({});
  const [masterVolume, setMasterVolume] = React.useState<number>(1);
  const [mutedAudios, setMutedAudios] = React.useState<Set<string>>(new Set());
  const audioVolumeBeforeMuteRef = React.useRef<Record<string, number>>({});
  const sourceStreamsRef = publishCtx.refs.sourceStreamsRef;
  const mediaElementsRef = publishCtx.refs.mediaElementsRef;
  const audioMixerRef = publishCtx.refs.audioMixerRef;
  const screenAudioByVideoIdRef = publishCtx.refs.screenAudioByVideoIdRef;
  const [extraAudioSources, setExtraAudioSources] = React.useState<Array<{ deviceId: string; label: string }>>([]);
  const [extraVideoSources, setExtraVideoSources] = React.useState<VideoSource[]>([]);
  const [activeWidgetIds, setActiveWidgetIds] = React.useState<Set<string>>(new Set());
  const activatedVideoSourcesRef = publishCtx.refs.activatedVideoSourcesRef;
  const activatedAudioSourcesRef = publishCtx.refs.activatedAudioSourcesRef;
  const widgetCanvasesRef = publishCtx.refs.widgetCanvasesRef;
  const widgetAnimRef = publishCtx.refs.widgetAnimRef;
  const compositorLayersRef = React.useRef<CompositorLayer[]>([]);
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
  const myLivestreamClaims = useAppSelector((state) =>
    channelId ? selectLivestreamsForChannelId(state, channelId) : []
  ) as Array<any>;
  const pendingLivestreamClaims = useAppSelector((state) =>
    channelId ? selectPendingLivestreamsForChannelId(state, channelId) : []
  ) as Array<any>;
  const allLivestreamClaims = React.useMemo(() => {
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    return pendingLivestreamClaims.concat(myLivestreamClaims).filter((c: any) => {
      if (!c) return false;
      if (c.claim_id && seenIds.has(c.claim_id)) return false;
      if (c.name && seenNames.has(c.name)) return false;
      if (c.claim_id) seenIds.add(c.claim_id);
      if (c.name) seenNames.add(c.name);
      return true;
    });
  }, [pendingLivestreamClaims, myLivestreamClaims]);
  const nextStreamClaim = allLivestreamClaims[0];
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
  const [justEnded, setJustEnded] = React.useState(false);

  React.useEffect(() => {
    if (!justEnded) return;
    const timer = setTimeout(() => setJustEnded(false), 15000);
    return () => clearTimeout(timer);
  }, [justEnded]);

  // Detect if another stream is already active on this channel (e.g. RTMP, or another browser tab).
  // Suppress for ~15s after the user ends their own stream so the polling has time to catch up.
  const existingStreamActive = Boolean(
    activeLivestream && status !== 'live' && status !== 'connecting' && status !== 'stopping' && !justEnded
  );

  const DRAFT_KEY = 'livestream-draft-composition';
  const draftRestoredRef = React.useRef(false);

  React.useEffect(() => {
    if (!draftRestoredRef.current) return;
    const isEphemeralId = (id: string) =>
      id.startsWith('__screen_') || id.startsWith('__videofile_') || id.startsWith('__image_');
    try {
      const layerMeta = compositorLayersRef.current
        .filter((l) => !isEphemeralId(l.id))
        .map((l) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { stream, crop, aspectRatio, ...rest } = l;
          return rest as Partial<CompositorLayer> & { id: string };
        });
      const draft = {
        layers: layerMeta,
        videoSources: Array.from(activeVideoIds)
          .filter((vid) => !isEphemeralId(vid))
          .map((vid) => activatedVideoSourcesRef.current.get(vid))
          .filter((s): s is VideoSource => Boolean(s)),
        audioSources: Array.from(activeAudioIds)
          .filter(
            (aid) => !isEphemeralId(aid) && !aid.startsWith('__screen_audio_') && !aid.startsWith('__videofile_audio_')
          )
          .map((aid) => activatedAudioSourcesRef.current.get(aid))
          .filter((s): s is AudioSource => Boolean(s)),
        widgetIds: Array.from(activeWidgetIds),
        audioVolumes,
        masterVolume,
        mutedAudios: Array.from(mutedAudios),
        presetId,
        savedAt: Date.now(),
      };
      if (
        draft.layers.length === 0 &&
        draft.videoSources.length === 0 &&
        draft.audioSources.length === 0 &&
        draft.widgetIds.length === 0
      ) {
        localStorage.removeItem(DRAFT_KEY);
      } else {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      }
    } catch {}
  }, [
    compositorLayers,
    activeVideoIds,
    activeAudioIds,
    activeWidgetIds,
    audioVolumes,
    masterVolume,
    mutedAudios,
    presetId,
  ]);

  React.useEffect(() => {
    if (draftRestoredRef.current) return;
    let cancelled = false;
    const restore = async () => {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) {
          draftRestoredRef.current = true;
          return;
        }
        const draft = JSON.parse(raw);
        if (
          !draft ||
          ((!draft.layers || draft.layers.length === 0) &&
            (!draft.videoSources || draft.videoSources.length === 0) &&
            (!draft.audioSources || draft.audioSources.length === 0) &&
            (!draft.widgetIds || draft.widgetIds.length === 0))
        ) {
          draftRestoredRef.current = true;
          return;
        }
        if (cancelled) return;
        if (draft.audioVolumes) setAudioVolumes(draft.audioVolumes);
        if (typeof draft.masterVolume === 'number') setMasterVolume(draft.masterVolume);
        if (Array.isArray(draft.mutedAudios)) setMutedAudios(new Set(draft.mutedAudios));
        const isEphemeralId = (id: string) =>
          id.startsWith('__screen_') || id.startsWith('__videofile_') || id.startsWith('__image_');
        await handleLoadSaved({
          id: 'draft',
          name: 'Draft',
          thumbnail: '',
          layers: (draft.layers || []).filter((l: any) => l.id && !isEphemeralId(l.id)),
          videoSources: (draft.videoSources || []).filter((s: any) => s.deviceId && !isEphemeralId(s.deviceId)),
          audioSources: (draft.audioSources || []).filter(
            (s: any) =>
              s.deviceId &&
              !isEphemeralId(s.deviceId) &&
              !s.deviceId.startsWith('__screen_audio_') &&
              !s.deviceId.startsWith('__videofile_audio_')
          ),
          widgetIds: draft.widgetIds || [],
          savedAt: draft.savedAt || Date.now(),
        });
      } catch {}
      draftRestoredRef.current = true;
    };
    restore();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const [cameraAutoStart, setCameraAutoStart] = usePersistedState('livestream-camera-autostart', true) as [
    boolean,
    (v: boolean) => void,
  ];
  const [cameraAutoStarting] = React.useState(false);

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
      activatedVideoSourcesRef.current.delete(id);
      const stream = sourceStreamsRef.current.get(id);
      if (stream) {
        stream.getVideoTracks().forEach((t) => t.stop());
        sourceStreamsRef.current.delete(id);
      }
      const screenAudioId = screenAudioByVideoIdRef.current.get(id);
      if (screenAudioId) {
        audioMixerRef.current?.removeSource(screenAudioId);
        const audioStream = sourceStreamsRef.current.get(`audio-${screenAudioId}`);
        if (audioStream) {
          audioStream.getTracks().forEach((t) => t.stop());
          sourceStreamsRef.current.delete(`audio-${screenAudioId}`);
        }
        setActiveAudioIds((prev) => {
          const next = new Set(prev);
          next.delete(screenAudioId);
          return next;
        });
        setAudioVolumes((prev) => {
          const next = { ...prev };
          delete next[screenAudioId];
          return next;
        });
        screenAudioByVideoIdRef.current.delete(id);
        setExtraAudioSources((prev) => prev.filter((s) => s.deviceId !== screenAudioId));
      }
      setActiveVideoIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setExtraVideoSources((prev) => prev.filter((s) => s.deviceId !== id));
      const videoEl = mediaElementsRef.current.get(`video-${id}`);
      if (videoEl) {
        videoEl.pause();
        if (videoEl.src) URL.revokeObjectURL(videoEl.src);
        videoEl.removeAttribute('src');
        videoEl.load();
        mediaElementsRef.current.delete(`video-${id}`);
      }
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
        const imageId =
          source.deviceId?.startsWith('__image_') && source.deviceId !== '__image__'
            ? source.deviceId
            : `__image_${Date.now()}__`;
        source = { ...source, deviceId: imageId, label: file.name.replace(/\.[^.]+$/, '') };
        id = source.deviceId;
      } else if (source.kind === 'videofile') {
        const file = await new Promise<File | null>((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'video/*';
          input.addEventListener('change', () => resolve(input.files?.[0] || null));
          input.click();
        });
        if (!file) return;
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.loop = false;
        video.playsInline = true;
        await new Promise<void>((resolve) => {
          video.addEventListener('loadedmetadata', () => resolve(), { once: true });
        });
        stream = (video as any).captureStream ? (video as any).captureStream() : (video as any).mozCaptureStream();
        const fileLabel = file.name.replace(/\.[^.]+$/, '');
        const captureId =
          source.deviceId?.startsWith('__videofile_') && source.deviceId !== '__videofile__'
            ? source.deviceId
            : `__videofile_${Date.now()}__`;
        source = { ...source, deviceId: captureId, label: fileLabel };
        id = captureId;
        mediaElementsRef.current.set(`video-${captureId}`, video);
        setExtraVideoSources((prev) => [
          ...prev,
          { deviceId: captureId, label: fileLabel, kind: 'videofile' as const },
        ]);
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          if (!audioMixerRef.current) audioMixerRef.current = new AudioMixer();
          const fileAudioId = `__videofile_audio_${captureId}`;
          const audioStream = new MediaStream([audioTrack]);
          sourceStreamsRef.current.set(`audio-${fileAudioId}`, audioStream);
          audioMixerRef.current.addSource(fileAudioId, audioStream);
          setActiveAudioIds((prev) => new Set(prev).add(fileAudioId));
          setAudioVolumes((prev) => ({ ...prev, [fileAudioId]: prev[fileAudioId] ?? 1 }));
          screenAudioByVideoIdRef.current.set(captureId, fileAudioId);
          setExtraAudioSources((prev) => [...prev, { deviceId: fileAudioId, label: `${fileLabel} – ${__('Audio')}` }]);
        }
      } else if (source.kind === 'screen') {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const videoTrack = stream.getVideoTracks()[0];
        const settings: any = videoTrack?.getSettings?.() || {};
        const surfaceLabels: Record<string, string> = {
          monitor: __('Screen'),
          window: __('Window'),
          browser: __('Browser Tab'),
        };
        const surface = surfaceLabels[settings.displaySurface] || __('Screen');
        const rawLabel = (videoTrack?.label || '').trim();
        const looksSynthetic = /^(screen|window|web-contents-media-stream):/.test(rawLabel);
        const baseLabel = (rawLabel && !looksSynthetic ? rawLabel : '') || surface;
        const usedLabels = new Set(extraVideoSources.map((s) => s.label));
        let captureLabel = baseLabel;
        let suffix = 2;
        while (usedLabels.has(captureLabel)) {
          captureLabel = `${baseLabel} (${suffix})`;
          suffix += 1;
        }
        const captureId =
          source.deviceId?.startsWith('__screen_') && source.deviceId !== '__screen__'
            ? source.deviceId
            : `__screen_${Date.now()}__`;
        source = { ...source, deviceId: captureId, label: captureLabel };
        id = captureId;
        videoTrack?.addEventListener('ended', () => {
          handleToggleVideo(source);
        });
        setExtraVideoSources((prev) => [
          ...prev,
          { deviceId: captureId, label: captureLabel, kind: 'screen' as const },
        ]);
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          if (!audioMixerRef.current) audioMixerRef.current = new AudioMixer();
          const screenAudioId = `__screen_audio_${id}`;
          const audioStream = new MediaStream([audioTrack]);
          sourceStreamsRef.current.set(`audio-${screenAudioId}`, audioStream);
          audioMixerRef.current.addSource(screenAudioId, audioStream);
          setActiveAudioIds((prev) => new Set(prev).add(screenAudioId));
          setAudioVolumes((prev) => ({ ...prev, [screenAudioId]: prev[screenAudioId] ?? 1 }));
          screenAudioByVideoIdRef.current.set(id, screenAudioId);
          setExtraAudioSources((prev) => [
            ...prev,
            { deviceId: screenAudioId, label: `${captureLabel} – ${__('Audio')}` },
          ]);
        }
      } else {
        const existing = sourceStreamsRef.current.get(id);
        const reusable = existing && existing.getVideoTracks().some((t) => t.readyState === 'live');
        if (reusable) {
          stream = existing;
        } else {
          stream = await navigator.mediaDevices.getUserMedia({
            video: source.deviceId ? { deviceId: { exact: source.deviceId } } : true,
            audio: false,
          });
          const obtainedId = stream.getVideoTracks()[0]?.getSettings().deviceId;
          if (obtainedId && obtainedId !== id) {
            source = { ...source, deviceId: obtainedId };
            id = obtainedId;
          }
        }
      }
      sourceStreamsRef.current.set(id, stream);
      setActiveVideoIds((prev) => new Set(prev).add(id));

      const outW = getOutputWidth();
      const outH = getOutputHeight();
      const track = stream.getVideoTracks()[0];

      const resolveSourceSize = (): Promise<{ w: number; h: number }> =>
        new Promise((resolve) => {
          const settings = track?.getSettings();
          const tempVideo = document.createElement('video');
          tempVideo.muted = true;
          tempVideo.playsInline = true;
          tempVideo.srcObject = new MediaStream([track]);
          let done = false;
          const finish = (w: number, h: number) => {
            if (done) return;
            done = true;
            tempVideo.srcObject = null;
            resolve({ w, h });
          };
          tempVideo.addEventListener('loadedmetadata', () => {
            const w = tempVideo.videoWidth || settings?.width || outW;
            const h = tempVideo.videoHeight || settings?.height || outH;
            finish(w, h);
          });
          tempVideo.play().catch(() => {});
          setTimeout(() => finish(settings?.width || outW, settings?.height || outH), 2000);
        });

      const portraitMobile = platform.isMobile() && isPortraitOrientation();
      const rawSize = await resolveSourceSize();
      const needsRotation = portraitMobile && rawSize.w > rawSize.h && source.kind === 'camera';
      const srcW = needsRotation ? rawSize.h : rawSize.w;
      const srcH = needsRotation ? rawSize.w : rawSize.h;
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
        sourceRotation: needsRotation ? 90 : 0,
      };
      activatedVideoSourcesRef.current.set(id, source);
      setCompositorLayers((prev) => [...prev, newLayer]);
      setSelectedLayerId(id);

      if (status === 'idle') setStatus('preview');
      updateOutputStream();
    } catch (e: unknown) {
      const err = e as DOMException;
      if (!isAbortError(e) && err?.name !== 'NotAllowedError') setErrorMessage(describeUnknown(e));
    }
  }

  async function handleToggleAudio(source: AudioSource) {
    setErrorMessage(null);
    const id = source.deviceId;
    activatedAudioSourcesRef.current.set(id, source);

    if (!audioMixerRef.current) audioMixerRef.current = new AudioMixer();
    const mixer = audioMixerRef.current;

    if (activeAudioIds.has(id)) {
      activatedAudioSourcesRef.current.delete(id);
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
      setAudioVolumes((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (id.startsWith('__audiofile_')) {
        setExtraAudioSources((prev) => prev.filter((s) => s.deviceId !== id));
        const el = mediaElementsRef.current.get(`audio-${id}`);
        if (el) {
          el.pause();
          if (el.src) URL.revokeObjectURL(el.src);
          el.removeAttribute('src');
          el.load();
          mediaElementsRef.current.delete(`audio-${id}`);
        }
      }
      updateOutputStream();
      return;
    }

    try {
      if (source.kind === 'audiofile') {
        const file = await new Promise<File | null>((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'audio/*';
          input.addEventListener('change', () => resolve(input.files?.[0] || null));
          input.click();
        });
        if (!file) return;
        const audio = document.createElement('audio');
        audio.src = URL.createObjectURL(file);
        audio.loop = false;
        await new Promise<void>((resolve) => {
          audio.addEventListener('loadedmetadata', () => resolve(), { once: true });
        });
        const fileLabel = file.name.replace(/\.[^.]+$/, '');
        const fileId = `__audiofile_${Date.now()}__`;
        mixer.addElementSource(fileId, audio);
        mediaElementsRef.current.set(`audio-${fileId}`, audio);
        setActiveAudioIds((prev) => new Set(prev).add(fileId));
        setAudioVolumes((prev) => ({ ...prev, [fileId]: 1 }));
        setExtraAudioSources((prev) => [...prev, { deviceId: fileId, label: fileLabel }]);
        updateOutputStream();
        return;
      }

      const isPlaceholder = id.startsWith('__camera_mic_');
      const audioConstraint: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };
      if (isPlaceholder && source.groupId) {
        audioConstraint.groupId = { exact: source.groupId };
      } else if (id) {
        audioConstraint.deviceId = { exact: id };
      }
      let stream: MediaStream;
      const existingAudio = sourceStreamsRef.current.get(`audio-${id}`);
      const reusableAudio = existingAudio && existingAudio.getAudioTracks().some((t) => t.readyState === 'live');
      if (reusableAudio) {
        stream = existingAudio;
      } else {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraint });
        } catch (firstErr: unknown) {
          const err = firstErr as DOMException;
          if (err?.name === 'OverconstrainedError' || err?.name === 'NotFoundError') {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
            });
          } else {
            throw firstErr;
          }
        }
      }
      const obtainedId = stream.getAudioTracks()[0]?.getSettings().deviceId || id || `audio-${Date.now()}`;
      sourceStreamsRef.current.set(`audio-${obtainedId}`, stream);
      mixer.addSource(obtainedId, stream);
      setActiveAudioIds((prev) => new Set(prev).add(obtainedId));
      setAudioVolumes((prev) => ({ ...prev, [obtainedId]: prev[obtainedId] ?? 1 }));
      updateOutputStream();
    } catch (e: unknown) {
      if (!isAbortError(e)) setErrorMessage(describeUnknown(e));
    }
  }

  function handleAudioVolumeChange(id: string, volume: number) {
    setAudioVolumes((prev) => ({ ...prev, [id]: volume }));
    audioMixerRef.current?.setVolume(id, volume);
    if (volume > 0 && mutedAudios.has(id)) {
      setMutedAudios((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  function handleToggleAudioMute(id: string) {
    if (mutedAudios.has(id)) {
      const restored = audioVolumeBeforeMuteRef.current[id] ?? 1;
      setMutedAudios((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setAudioVolumes((prev) => ({ ...prev, [id]: restored }));
      audioMixerRef.current?.setVolume(id, restored);
    } else {
      audioVolumeBeforeMuteRef.current[id] = audioVolumes[id] ?? 1;
      setMutedAudios((prev) => new Set(prev).add(id));
      setAudioVolumes((prev) => ({ ...prev, [id]: 0 }));
      audioMixerRef.current?.setVolume(id, 0);
    }
  }

  function handleToggleLayerVisible(id: string) {
    setCompositorLayers((prev) => prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)));
  }

  function handleToggleWidget(id: string) {
    if (activeWidgetIds.has(id)) {
      const animId = widgetAnimRef.current.get(id);
      if (animId) cancelAnimationFrame(animId);
      widgetAnimRef.current.delete(id);
      widgetCanvasesRef.current.delete(id);
      sourceStreamsRef.current.delete(id);
      setCompositorLayers((prev) => prev.filter((l) => l.id !== id));
      setActiveVideoIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setActiveWidgetIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (selectedLayerId === id) setSelectedLayerId(null);
      updateOutputStream();
      return;
    }

    if (id === '__widget_chat__') {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 900;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const spacemanImg = new Image();
      spacemanImg.src = SpacemanPng;
      const hyperchats = PLACEHOLDER_HYPERCHATS;
      const messages = PLACEHOLDER_MESSAGES;
      const hyperColor = hyperchatColor;
      const draw = () => {
        const layer = compositorLayersRef.current.find((l) => l.id === id);
        if (layer && (canvas.width !== layer.width || canvas.height !== layer.height)) {
          canvas.width = Math.max(50, layer.width);
          canvas.height = Math.max(50, layer.height);
        }
        const fontSize = layer?.chatFontSize ?? 20;
        const lineHeight = layer?.chatLineHeight ?? 1.4;
        const textColor = layer?.chatTextColor ?? '#ffffff';
        const primaryDyn = getComputedStyle(document.documentElement)
          .getPropertyValue('--color-primary-dynamic')
          .trim();
        const primaryColor = primaryDyn ? `rgb(${primaryDyn})` : '#de0050';
        const userColor = layer?.chatUserColor ?? primaryColor;
        const bgColor = layer?.chatBgColor ?? '#000000';
        const borderColor = layer?.chatBorderColor ?? '#000000';
        const borderWidth = layer?.chatBorderWidth ?? 1;
        const bold = layer?.chatBold ?? false;
        const showAvatars = layer?.chatShowAvatars ?? false;
        const max = layer?.chatMaxMessages ?? 30;
        const avatarSize = Math.round(fontSize * 1.4);
        const palette = ['#748ffc', '#ffa855', '#339af0', '#ec8383'];
        const colorFor = (name: string) => {
          const c = name.charCodeAt(0);
          if (Number.isNaN(c)) return '#cccccc';
          return palette[Math.abs((c - 65) % palette.length)];
        };
        const drawAvatar = (cx: number, cy: number, name: string) => {
          ctx.beginPath();
          ctx.arc(cx + avatarSize / 2, cy + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
          ctx.fillStyle = colorFor(name);
          ctx.fill();
          if (spacemanImg.complete && spacemanImg.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx + avatarSize / 2, cy + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.clip();
            const inner = avatarSize * 0.8;
            ctx.drawImage(spacemanImg, cx + (avatarSize - inner) / 2, cy + (avatarSize - inner), inner, inner);
            ctx.restore();
          }
        };
        const realComments = liveCommentsRef.current || [];
        const realMessages: Array<{ user: string; msg: string; amount?: number }> = realComments.map((c: any) => ({
          user: c.channel_name || c.channel_url || 'anon',
          msg: c.comment || '',
          amount: c.support_amount > 0 ? c.support_amount : undefined,
        }));
        const baseList = layer?.chatHyperchatOnly
          ? realMessages.filter((m) => m.amount).slice(0, max)
          : realMessages.slice(0, max);
        const newOnTop = layer?.chatNewOnTop ?? false;
        const visible = newOnTop ? [...baseList].reverse() : baseList;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const bgAlpha = layer?.chatBgAlpha ?? (layer?.chatBgTransparent === false ? 1 : 0);
        if (bgAlpha > 0) {
          ctx.fillStyle = bgColor;
          ctx.globalAlpha = bgAlpha;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalAlpha = 1;
        }

        ctx.font = `${bold ? '700 ' : ''}${fontSize}px sans-serif`;
        ctx.textBaseline = 'top';
        ctx.lineWidth = borderWidth * 2;
        ctx.strokeStyle = borderColor;
        ctx.lineJoin = 'round';

        const padX = 16;
        const lineH = fontSize * lineHeight;
        const bannerH = Math.round(fontSize * 1.1);
        let totalH = 0;
        for (const m of visible) {
          if (m.amount) {
            const extraH = showAvatars ? Math.max(0, avatarSize - lineH) : 0;
            totalH += lineH + bannerH + 8 + extraH + 4 + 6;
          } else {
            totalH += showAvatars ? Math.max(lineH, avatarSize + 4) : lineH;
          }
        }
        let y = newOnTop ? 16 : Math.max(16, canvas.height - totalH - 16);
        for (const m of visible) {
          if (m.amount) {
            const [r, g, b] = hyperColor(m.amount);
            const blockX = padX - 8;
            const blockW = canvas.width - 2 * blockX;
            const blockTop = y - 4;
            const extraH = showAvatars ? Math.max(0, avatarSize - lineH) : 0;
            const blockBottom = y + lineH + bannerH + 8 + extraH;
            const blockH = blockBottom - blockTop;
            const radius = 6;
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.08)`;
            ctx.beginPath();
            ctx.roundRect(blockX, blockTop, blockW, blockH, radius);
            ctx.fill();
            ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(blockX + 0.5, blockTop + 0.5, blockW - 1, blockH - 1, radius);
            ctx.stroke();

            const badgeFontSize = Math.round(fontSize * 0.7);
            ctx.font = `700 ${badgeFontSize}px sans-serif`;
            const amountText = `$${m.amount}`;
            const padBadge = 8;
            const badgeW = Math.ceil(ctx.measureText(amountText).width) + padBadge * 2;
            const badgeH = bannerH;
            const badgeX = blockX;
            const badgeY = blockTop;
            const grad = ctx.createLinearGradient(badgeX, 0, badgeX + badgeW, 0);
            grad.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
            grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.6)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, [radius, radius, radius, 0]);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.textBaseline = 'middle';
            ctx.fillText(amountText, badgeX + padBadge, badgeY + badgeH / 2);
            ctx.textBaseline = 'top';

            ctx.font = `${bold ? '700 ' : ''}${fontSize}px sans-serif`;
            ctx.lineWidth = borderWidth * 2;
            ctx.strokeStyle = borderColor;
            const userText = `${m.user}: `;
            const msgY = blockTop + bannerH + 6;
            const textX = showAvatars ? padX + avatarSize + 8 : padX;
            if (showAvatars) drawAvatar(padX, msgY - 2, m.user);
            if (borderWidth > 0) ctx.strokeText(userText, textX, msgY);
            ctx.fillStyle = userColor;
            ctx.fillText(userText, textX, msgY);
            const userW = ctx.measureText(userText).width;
            if (borderWidth > 0) ctx.strokeText(m.msg, textX + userW, msgY);
            ctx.fillStyle = textColor;
            ctx.fillText(m.msg, textX + userW, msgY);
            y = blockBottom + 6;
            continue;
          }
          const userText = `${m.user}: `;
          const textX = showAvatars ? padX + avatarSize + 8 : padX;
          if (showAvatars) drawAvatar(padX, y - 2, m.user);
          if (borderWidth > 0) ctx.strokeText(userText, textX, y);
          ctx.fillStyle = userColor;
          ctx.fillText(userText, textX, y);
          const userW = ctx.measureText(userText).width;
          if (borderWidth > 0) ctx.strokeText(m.msg, textX + userW, y);
          ctx.fillStyle = textColor;
          ctx.fillText(m.msg, textX + userW, y);
          y += showAvatars ? Math.max(lineH, avatarSize + 4) : lineH;
        }
        const fadeH = Math.round(canvas.height * 0.05);
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        if (newOnTop) {
          const grad = ctx.createLinearGradient(0, canvas.height - fadeH, 0, canvas.height);
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(1, 'rgba(0,0,0,1)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, canvas.height - fadeH, canvas.width, fadeH);
        } else {
          const grad = ctx.createLinearGradient(0, 0, 0, fadeH);
          grad.addColorStop(0, 'rgba(0,0,0,1)');
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, fadeH);
        }
        ctx.restore();
        widgetAnimRef.current.set(id, requestAnimationFrame(draw));
      };
      draw();
      const stream = canvas.captureStream(30);
      widgetCanvasesRef.current.set(id, canvas);
      sourceStreamsRef.current.set(id, stream);

      const outW = getOutputWidth();
      const outH = getOutputHeight();
      const margin = 20;
      const layerW = Math.round(outW * 0.25);
      const layerH = Math.min(Math.round(layerW * 2.25), outH - 2 * margin);
      const newLayer: CompositorLayer = {
        id,
        label: __('Chat'),
        stream,
        x: outW - layerW - margin,
        y: margin,
        width: layerW,
        height: layerH,
        aspectRatio: layerW / layerH,
        zIndex: compositorLayers.length,
        visible: true,
        freeAspect: true,
      };
      setCompositorLayers((prev) => [...prev, newLayer]);
      setActiveVideoIds((prev) => new Set(prev).add(id));
      setActiveWidgetIds((prev) => new Set(prev).add(id));
      setSelectedLayerId(id);
      if (status === 'idle') setStatus('preview');
      updateOutputStream();
    }
  }

  function handleMasterVolumeChange(volume: number) {
    setMasterVolume(volume);
    audioMixerRef.current?.setMasterVolume(volume);
  }

  function updateOutputStream() {
    if (compositorCanvasRef.current && (activeVideoIds.size > 0 || activeAudioIds.size > 0)) {
      const combined = buildCompositorStream();
      setMediaStream(combined);
    }
  }

  React.useEffect(() => {
    const hasActivity = activeVideoIds.size > 0 || activeAudioIds.size > 0 || activeWidgetIds.size > 0;
    if (!hasActivity) {
      if (status === 'preview') {
        setMediaStream(null);
        setStatus('idle');
      }
      return;
    }
    const id = requestAnimationFrame(() => {
      if (!compositorCanvasRef.current) return;
      const combined = buildCompositorStream();
      if (combined.getTracks().length > 0) {
        setMediaStream(combined);
        if (status === 'idle') setStatus('preview');
      }
    });
    return () => cancelAnimationFrame(id);
  }, [activeVideoIds, activeAudioIds, activeWidgetIds, compositorLayers]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleLayerUpdate(id: string, updates: Partial<CompositorLayer>) {
    if (loadAnimRef.current !== null) {
      cancelAnimationFrame(loadAnimRef.current);
      loadAnimRef.current = null;
    }
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
        if (!/failed to fetch|networkerror|fetch/i.test(msg)) {
          setErrorMessage(msg);
        }
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
      if (!/failed to fetch|networkerror|fetch/i.test(msg)) {
        setErrorMessage(msg);
      }
      setStatus('preview');
      publishCtx.actions.setPc(null);
      publishCtx.actions.setResourceUrl(null);
      dispatch(doToast({ isError: true, message: __('Connection failed. Try again.') }));
    }
  }

  async function handleStop() {
    setJustEnded(true);
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

  const isFloating = Boolean(props.isFloating);

  return (
    <div
      className={classnames('livestream-studio', { 'livestream-studio--floating': isFloating })}
      onMouseDown={(e) => {
        if (!(e.target as HTMLElement).closest('.livestream-compositor')) {
          setSelectedLayerId(null);
        }
      }}
    >
      {/* Main Stage + Sources */}
      <div className="livestream-studio__stage-row">
        <div className="livestream-studio__stage-column">
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
                'livestream-studio__preview--portrait': isMobile && isPortraitOrientation(),
              })}
            >
              {(isFloating || previewTab === 'preview') && <StreamPreview canvasRef={compositorCanvasRef} />}
              {!isFloating &&
                previewTab !== 'compositor' &&
                previewTab !== 'preview' &&
                (() => {
                  const layer = compositorLayers.find((l) => l.id === previewTab);
                  if (!layer) return null;
                  if (layer.id === '__widget_chat__') {
                    return <ChatWidgetTabPreview layer={layer} />;
                  }
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
                      }}
                      borderRadius={layer.borderRadius}
                      layerWidth={layer.width}
                      crop={layer.crop}
                      chromaKey={
                        layer.chromaKey?.enabled
                          ? {
                              layerId: layer.id,
                              color: layer.chromaKey.color,
                              threshold: layer.chromaKey.threshold,
                              smoothness: layer.chromaKey.smoothness,
                            }
                          : undefined
                      }
                      onCropChange={(crop) => {
                        const trackSettings = layer.stream.getVideoTracks()[0]?.getSettings();
                        const sourceAr =
                          (trackSettings?.width || 0) / (trackSettings?.height || 1) || layer.aspectRatio;
                        const newAr = crop ? crop.sw / crop.sh : sourceAr;
                        const newH = layer.width / newAr;
                        handleLayerUpdate(layer.id, {
                          crop,
                          aspectRatio: newAr,
                          height: Math.round(newH),
                        });
                      }}
                    />
                  );
                })()}
              <div
                style={
                  isFloating || previewTab !== 'compositor'
                    ? { position: 'absolute', opacity: 0, pointerEvents: 'none' }
                    : undefined
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
                  getWidgetCanvas={(id) => widgetCanvasesRef.current.get(id) || null}
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
                      {disabledReason && <p className="livestream-studio__placeholder-text">{disabledReason}</p>}
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
                    'livestream-studio__control-btn--on': micEnabled,
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
                    'livestream-studio__control-btn--on': cameraEnabled,
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
              </div>
            )}
          </div>

          {savedCompositions.length > 0 && (
            <div className="livestream-sources__box livestream-studio__saved-box">
              <h3 className="livestream-sources__title">{__('Saved compositions')}</h3>
              <div className="livestream-sources__subbox">
                <div className="livestream-studio__saved-grid">
                  {savedCompositions.map((c) => (
                    <div
                      key={c.id}
                      className="livestream-studio__saved-item"
                      role="button"
                      tabIndex={0}
                      onClick={() => handleLoadSaved(c)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleLoadSaved(c);
                        }
                      }}
                      title={__('Load composition')}
                    >
                      {c.thumbnail ? (
                        <img className="livestream-studio__saved-thumb" src={c.thumbnail} alt={c.name} />
                      ) : (
                        <div className="livestream-studio__saved-thumb livestream-studio__saved-thumb--empty" />
                      )}
                      <div className="livestream-studio__saved-name" title={c.name}>
                        {c.name}
                      </div>
                      <button
                        type="button"
                        className="livestream-studio__saved-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSaved(c.id);
                        }}
                        title={__('Delete')}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="livestream-studio__sources-column">
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
                activeImageSources={[
                  ...compositorLayers
                    .filter((l) => l.id.startsWith('__image_'))
                    .map((l) => ({ deviceId: l.id, label: l.label, kind: 'image' as const })),
                  ...extraVideoSources,
                ]}
                onToggleVideo={handleToggleVideo}
                onToggleAudio={handleToggleAudio}
                onSelectLayer={(id) => setSelectedLayerId(id)}
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
                audioVolumes={audioVolumes}
                masterVolume={masterVolume}
                onAudioVolumeChange={handleAudioVolumeChange}
                onMasterVolumeChange={handleMasterVolumeChange}
                getAudioLevel={(id) => audioMixerRef.current?.getSourceLevel(id) ?? 0}
                getMasterAudioLevel={() => audioMixerRef.current?.getMasterLevel() ?? 0}
                extraAudioSources={extraAudioSources}
                getAudioElement={(id) => mediaElementsRef.current.get(`audio-${id}`) || null}
                getVideoElement={(id) => mediaElementsRef.current.get(`video-${id}`) || null}
                getLayerVisible={(id) => compositorLayers.find((l) => l.id === id)?.visible ?? true}
                onToggleLayerVisible={handleToggleLayerVisible}
                mutedAudios={mutedAudios}
                onToggleAudioMute={handleToggleAudioMute}
                needsCameraPermission={!hasCamera && !disabledReason}
                cameraPermissionRequesting={status === 'requesting_permission'}
                onRequestCameraPermission={requestCameraPreview}
                activeWidgetIds={activeWidgetIds}
                onToggleWidget={handleToggleWidget}
                disabled={status === 'connecting' || status === 'stopping'}
              />
            );
          })()}

          {/* Primary Action - below video/audio boxes */}
          <div className="livestream-studio__action-area">
            <button
              type="button"
              className="livestream-studio__save-comp-btn"
              onClick={() => setSaveModalOpen(true)}
              disabled={compositorLayers.length === 0}
            >
              {__('Save composition')}
            </button>
            {(status === 'idle' ||
              status === 'error' ||
              status === 'preview' ||
              status === 'requesting_permission') && (
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
            {isConnecting && (
              <Button
                button="primary"
                className="livestream-studio__go-live-btn livestream-studio__stop-btn"
                onClick={handleCancel}
                label={__('Cancel')}
              />
            )}
            {isLive && (
              <Button
                button="primary"
                className="livestream-studio__go-live-btn livestream-studio__stop-btn"
                onClick={handleStop}
                disabled={isStopping}
                label={__('End Stream')}
              />
            )}
            {isStopping && (
              <Button
                button="primary"
                className="livestream-studio__go-live-btn livestream-studio__stop-btn"
                disabled
                label={__('Ending stream...')}
              />
            )}
            {errorMessage && (status === 'error' || status === 'preview') && (
              <p className="livestream-studio__error-msg">{errorMessage}</p>
            )}
            {disabledReason && !hasCamera && <p className="livestream-studio__hint-msg">{disabledReason}</p>}
          </div>
        </div>
      </div>

      {saveModalOpen && (
        <div className="livestream-studio__modal-backdrop" onClick={() => setSaveModalOpen(false)}>
          <div className="livestream-studio__modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="livestream-studio__modal-title">{__('Save composition')}</h3>
            <input
              type="text"
              className="livestream-studio__modal-input"
              placeholder={__('Composition name')}
              value={saveModalName}
              onChange={(e) => setSaveModalName(e.target.value)}
              autoFocus
            />
            <div className="livestream-studio__modal-actions">
              <button type="button" className="livestream-studio__modal-cancel" onClick={() => setSaveModalOpen(false)}>
                {__('Cancel')}
              </button>
              <button type="button" className="livestream-studio__modal-save" onClick={handleSaveComposition}>
                {__('Save')}
              </button>
            </div>
          </div>
        </div>
      )}

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
          </div>
          <ClaimPreview uri={nextStreamUri} />
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
