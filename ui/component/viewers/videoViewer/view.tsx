import React, { useEffect, useState, useContext, useCallback } from 'react';
import { flushSync } from 'react-dom';
import VideoJs from './internal/videojs';
import analytics from 'analytics';
import { EmbedContext } from 'contexts/embed';
import classnames from 'classnames';
import { FORCE_CONTENT_TYPE_PLAYER } from 'constants/claim';
import FileViewerEmbeddedEnded from './internal/fileViewerEmbeddedEnded';
import ClaimPreviewTile from 'component/claimPreviewTile';
import FileReactions from 'component/fileReactions';
import { useLocation } from 'react-router-dom';
import debounce from 'util/debounce';
import useInterval from 'effects/use-interval';
import { isClaimUnlisted } from 'util/claim';
import { platform } from 'util/platform';
import { LocalStorage } from 'util/storage';
import { useIsMobile } from 'effects/use-screensize';
import { isEmbedPath } from 'util/embed';
import { fullscreenElement as getFullscreenElement, requestFullscreen } from 'util/full-screen';
import { ODYSEE_HYPERBEAM_NODE_API } from '../../../../config';
import { HYPERBEAM_DEVICE, hyperbeamDeviceUrl } from 'util/hyperbeamDevices';

const PLAY_POSITION_SAVE_INTERVAL_MS = 15000;
const POSITION_SYNC_INTERVAL_MS = 30000;
const HYPERBEAM_STARTUP_MAX_VISIBLE_MS = 3400;
const HYPERBEAM_STARTUP_READY_EVENT = 'odysee-hyperbeam-startup-ready';
const IS_IOS = platform.isIOS();
const DQ_SETTING_PROMOTED_KEY = 'initial-quality-change';
const PLAYLIST_FULLSCREEN_KEY = 'playlist-preserve-fullscreen';

function hyperbeamNodeMediaUrl(uri?: string) {
  if (!uri) return '';
  return hyperbeamNodePath('media', uri);
}

function hyperbeamNodeResolveUrl(uri?: string) {
  if (!uri) return '';
  return hyperbeamNodePath('resolve', uri);
}

function hyperbeamNodeDescriptorUrl(sdHash?: string) {
  if (!sdHash) return '';
  return hyperbeamDeviceUrl(HYPERBEAM_DEVICE.streamDescriptor, 'descriptor', { sd_hash: sdHash });
}

function hyperbeamNodePath(key: 'resolve' | 'media', uri: string) {
  return hyperbeamDeviceUrl(key === 'media' ? HYPERBEAM_DEVICE.stream : HYPERBEAM_DEVICE.claim, key, {
    uri64: base64Url(uri),
  });
}

function base64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function isHyperbeamNodeMediaUrl(value?: string) {
  return Boolean(value && value.includes('/media?uri64='));
}

type HyperbeamNodeDebugLevel = 'info' | 'ok' | 'warn' | 'error';

type HyperbeamNodeDebugEvent = {
  time: string;
  label: string;
  level: HyperbeamNodeDebugLevel;
  data?: any;
};

type HyperbeamNodeDebugSnapshot = {
  status: string;
  level: HyperbeamNodeDebugLevel;
  video?: any;
};

type StartupGraphNode = {
  id: number;
  x: number;
  y: number;
  delayMs: number;
};

type StartupGraphLine = {
  id: string;
  fromId: number;
  toId: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  delayMs: number;
  mesh?: boolean;
};

type StartupGraphPacket = {
  id: string;
  points: Array<{ x: number; y: number }>;
  delayMs: number;
  durationMs: number;
};

type StartupGraphOrigin = {
  x: number;
  y: number;
  size: number;
};

function startupGraphClampX(value: number) {
  return Math.max(7, Math.min(93, value));
}

function startupGraphClampY(value: number) {
  return Math.max(9, Math.min(78, value));
}

function startupPlayClampY(value: number) {
  return Math.max(9, Math.min(91, value));
}

function startupGraphDistance(a: StartupGraphNode, b: StartupGraphNode) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function hyperbeamNodeDebugLevelColor(level: HyperbeamNodeDebugLevel) {
  if (level === 'ok') return '#22c55e';
  if (level === 'warn') return '#ffb020';
  if (level === 'error') return '#ff4d7d';
  return '#de0050';
}

function videoBufferedRanges(node: HTMLVideoElement) {
  const ranges = [];
  for (let i = 0; i < node.buffered.length; i += 1) {
    ranges.push({
      start: Number(node.buffered.start(i).toFixed(3)),
      end: Number(node.buffered.end(i).toFixed(3)),
    });
  }
  return ranges;
}

function videoDebugState(node: HTMLVideoElement) {
  const error = node.error;

  return {
    currentSrc: node.currentSrc || node.src,
    currentTime: Number(node.currentTime.toFixed(3)),
    duration: isFinite(node.duration) ? Number(node.duration.toFixed(3)) : null,
    readyState: node.readyState,
    networkState: node.networkState,
    paused: node.paused,
    ended: node.ended,
    seeking: node.seeking,
    muted: node.muted,
    playbackRate: node.playbackRate,
    buffered: videoBufferedRanges(node),
    error: error ? { code: error.code, message: error.message } : null,
    documentHidden: document.hidden,
    online: navigator.onLine,
  };
}

function hyperbeamNodeMediaHeaders(response: Response) {
  return {
    status: response.status,
    ok: response.ok,
    sourceLayer: response.headers.get('x-odysee-source-layer'),
    contentType: response.headers.get('content-type'),
    contentLength: response.headers.get('content-length'),
    contentRange: response.headers.get('content-range'),
    acceptRanges: response.headers.get('accept-ranges'),
    mediaMs: response.headers.get('x-odysee-media-ms'),
    mediaBlobs: response.headers.get('x-odysee-media-blobs'),
    mediaRange: response.headers.get('x-odysee-media-range'),
  };
}

function hyperbeamClaimSdHash(claim: any): string | undefined {
  return (
    claim?.value?.source?.sd_hash ||
    claim?.value?.stream?.source?.sd_hash ||
    claim?.stream_source?.sd_hash ||
    claim?.source?.sd_hash
  );
}

function hyperbeamVerificationStatus(body: any): string | undefined {
  return (
    body?.verification?.status ||
    body?.['source-layer']?.verification?.status ||
    body?.sourceLayer?.verification?.status ||
    body?.source_layer?.verification?.status
  );
}

function hyperbeamDescriptorFields(body: any): any {
  return body?.fields || body?.result?.fields || body?.response?.fields;
}

function hyperbeamDescriptorVerification(body: any, expectedSdHash?: string) {
  const fields = hyperbeamDescriptorFields(body);
  const actualSdHash = fields?.sd_hash || body?.verification?.sd_hash;
  const status = hyperbeamVerificationStatus(body);
  const checks = {
    expectedSdHash,
    descriptorSdHash: actualSdHash,
    descriptorHashMatchesClaim: Boolean(expectedSdHash && actualSdHash && expectedSdHash === actualSdHash),
    descriptorStatus: status || 'missing',
    descriptorVerified: status === 'verified',
    blobCount: Array.isArray(fields?.blobs) ? Math.max(0, fields.blobs.length - 1) : null,
  };

  return {
    ...checks,
    verified: checks.descriptorHashMatchesClaim && checks.descriptorVerified,
  };
}

function hyperbeamMediaRangeVerification(result: any, expectedSdHash?: string) {
  const sourceLayer = result?.sourceLayer;
  const mediaBlobs = Number(result?.mediaBlobs);
  return {
    expectedSdHash,
    status: result?.status,
    byteLength: result?.byteLength,
    sourceLayer,
    mediaRange: result?.mediaRange,
    mediaBlobs: result?.mediaBlobs,
    rangeStatusOk: result?.status === 206,
    nativeVerifiedRange: sourceLayer === 'native' && Number.isFinite(mediaBlobs) && mediaBlobs > 0,
    verified: result?.status === 206 && sourceLayer === 'native' && Number.isFinite(mediaBlobs) && mediaBlobs > 0,
  };
}

async function hyperbeamNodeMediaProbe(playerSource: string, range?: string) {
  const response = await fetch(playerSource, range ? { headers: { Range: range } } : { method: 'HEAD' });
  const headers = hyperbeamNodeMediaHeaders(response);
  if (!range) return headers;

  const contentType = response.headers.get('content-type') || '';
  const body =
    contentType.includes('application/json') || !response.ok
      ? await response
          .text()
          .then((text) => text.slice(0, 800))
          .catch(() => null)
      : null;

  return {
    ...headers,
    requestedRange: range,
    body,
  };
}

function createStartupGraph(rootDelayMs = 0) {
  const nodes: Array<StartupGraphNode> = [{ id: 0, x: 50, y: 50, delayMs: rootDelayMs }];
  const lines: Array<StartupGraphLine> = [];
  const queue = [0];
  let id = 1;

  while (queue.length && id < 24) {
    const parentId = queue.shift();
    const parent = nodes.find((node) => node.id === parentId) || nodes[0];
    const branchCount = parent.id === 0 ? 4 : 1 + Math.floor(Math.random() * 2);

    for (let i = 0; i < branchCount && id < 24; i += 1) {
      const distance = 13 + Math.random() * 14;
      const angle =
        parent.id === 0 ? (Math.PI * 2 * i) / branchCount + Math.random() * 0.45 : Math.random() * Math.PI * 2;
      const lineDelayMs = parent.delayMs + 95 + i * 55;
      const child = {
        id,
        x: startupGraphClampX(parent.x + Math.cos(angle) * distance),
        y: startupGraphClampY(parent.y + Math.sin(angle) * distance),
        delayMs: lineDelayMs + 130,
      };

      nodes.push(child);
      lines.push({
        id: `${parent.id}-${child.id}`,
        fromId: parent.id,
        toId: child.id,
        x1: parent.x,
        y1: parent.y,
        x2: child.x,
        y2: child.y,
        delayMs: lineDelayMs,
      });

      if (child.id < 13) queue.push(child.id);
      id += 1;
    }
  }

  const linkedNodePairs = new Set(lines.map((line) => [line.fromId, line.toId].sort((a, b) => a - b).join('-')));

  nodes.slice(2).forEach((node) => {
    const nearestVisibleNeighbor = nodes
      .slice(1, node.id)
      .filter((candidate) => !linkedNodePairs.has([node.id, candidate.id].sort((a, b) => a - b).join('-')))
      .sort((a, b) => startupGraphDistance(node, a) - startupGraphDistance(node, b))[0];

    if (!nearestVisibleNeighbor) return;
    const pairId = [node.id, nearestVisibleNeighbor.id].sort((a, b) => a - b).join('-');
    linkedNodePairs.add(pairId);
    lines.push({
      id: `mesh-near-${pairId}`,
      fromId: node.id,
      toId: nearestVisibleNeighbor.id,
      x1: node.x,
      y1: node.y,
      x2: nearestVisibleNeighbor.x,
      y2: nearestVisibleNeighbor.y,
      delayMs: Math.max(node.delayMs, nearestVisibleNeighbor.delayMs) + 95 + (node.id % 3) * 50,
      mesh: true,
    });
  });

  for (let i = 0; i < 10; i += 1) {
    const a = nodes[1 + Math.floor(Math.random() * Math.max(1, nodes.length - 1))];
    const b = nodes[1 + Math.floor(Math.random() * Math.max(1, nodes.length - 1))];
    if (!a || !b || a.id === b.id) continue;
    const pairId = [a.id, b.id].sort((left, right) => left - right).join('-');
    if (linkedNodePairs.has(pairId)) continue;
    linkedNodePairs.add(pairId);
    lines.push({
      id: `mesh-${i}-${pairId}`,
      fromId: a.id,
      toId: b.id,
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      delayMs: Math.max(a.delayMs, b.delayMs) + 120 + Math.floor(Math.random() * 220),
      mesh: true,
    });
  }

  const adjacency = new Map<number, Array<{ nodeId: number; line: StartupGraphLine; distance: number }>>();
  nodes.forEach((node) => adjacency.set(node.id, []));
  lines.forEach((line) => {
    const a = nodes[line.fromId];
    const b = nodes[line.toId];
    if (!a || !b) return;
    const distance = startupGraphDistance(a, b);
    adjacency.get(line.fromId)?.push({ nodeId: line.toId, line, distance });
    adjacency.get(line.toId)?.push({ nodeId: line.fromId, line, distance });
  });

  const shortestDistance = new Map<number, number>(nodes.map((node) => [node.id, Number.POSITIVE_INFINITY]));
  const shortestPrevious = new Map<number, { nodeId: number; line: StartupGraphLine }>();
  shortestDistance.set(0, 0);
  const unsettled = new Set(nodes.map((node) => node.id));

  while (unsettled.size) {
    let currentId = -1;
    let currentDistance = Number.POSITIVE_INFINITY;
    unsettled.forEach((nodeId) => {
      const distance = shortestDistance.get(nodeId) ?? Number.POSITIVE_INFINITY;
      if (distance < currentDistance) {
        currentDistance = distance;
        currentId = nodeId;
      }
    });
    if (currentId === -1) break;
    unsettled.delete(currentId);

    adjacency.get(currentId)?.forEach(({ nodeId, line, distance }) => {
      const nextDistance = currentDistance + distance;
      if (nextDistance < (shortestDistance.get(nodeId) ?? Number.POSITIVE_INFINITY)) {
        shortestDistance.set(nodeId, nextDistance);
        shortestPrevious.set(nodeId, { nodeId: currentId, line });
      }
    });
  }

  const packets: Array<StartupGraphPacket> = nodes.slice(1).flatMap((node) => {
    const points = [{ x: node.x, y: node.y }];
    const pathLines: Array<StartupGraphLine> = [];
    let currentId = node.id;

    while (currentId !== 0 && points.length < 7) {
      const previous = shortestPrevious.get(currentId);
      if (!previous) break;
      const previousNode = nodes[previous.nodeId];
      if (!previousNode) break;
      pathLines.push(previous.line);
      points.push({ x: previousNode.x, y: previousNode.y });
      currentId = previous.nodeId;
    }

    if (currentId !== 0 || points.length < 2) return [];

    const pathReadyAt = Math.max(node.delayMs, ...pathLines.map((line) => line.delayMs));
    return [
      {
        id: `packet-path-${node.id}`,
        points,
        delayMs: pathReadyAt + 80 + Math.floor(Math.random() * 160),
        durationMs: 420 * (points.length - 1) + Math.floor(Math.random() * 500),
      },
    ];
  });

  return { nodes, lines, packets };
}

function HyperbeamNodeStartupGraph({
  graphKey,
  origin,
  showPlayMorph,
}: {
  graphKey: number;
  origin: StartupGraphOrigin;
  showPlayMorph: boolean;
}) {
  const graph = React.useMemo(() => createStartupGraph(0), [graphKey]);
  const [elapsedMs, setElapsedMs] = React.useState(0);

  React.useEffect(() => {
    const startedAt = performance.now();
    setElapsedMs(0);
    const interval = window.setInterval(() => {
      setElapsedMs(performance.now() - startedAt);
    }, 90);

    return () => window.clearInterval(interval);
  }, [graphKey]);

  const visibleLines = graph.lines.filter((line) => elapsedMs >= line.delayMs);
  const visibleNodes = graph.nodes.filter((node) => elapsedMs >= node.delayMs);
  const visiblePackets = graph.packets.filter((packet) => elapsedMs >= packet.delayMs);

  return (
    <div
      className="odysee-hyperbeam-startup"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 9,
      }}
    >
      {showPlayMorph && (
        <div
          className="odysee-hyperbeam-startup__play"
          style={
            {
              '--play-x': `${origin.x}%`,
              '--play-y': `${origin.y}%`,
              '--play-size': `${origin.size}px`,
            } as React.CSSProperties
          }
        >
          <span />
        </div>
      )}
      <svg className="odysee-hyperbeam-startup__graph" viewBox="0 0 100 100" preserveAspectRatio="none">
        {visibleLines.map((line) => (
          <line
            key={line.id}
            className={
              line.mesh
                ? 'odysee-hyperbeam-startup__line odysee-hyperbeam-startup__line--mesh'
                : 'odysee-hyperbeam-startup__line'
            }
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            pathLength={1}
          />
        ))}
      </svg>
      {visibleNodes.map((node) => (
        <span
          key={node.id}
          className={
            node.id === 0
              ? 'odysee-hyperbeam-startup__node odysee-hyperbeam-startup__node--root'
              : 'odysee-hyperbeam-startup__node'
          }
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            width: node.id === 0 ? 13 : 6,
            height: node.id === 0 ? 13 : 6,
          }}
        />
      ))}
      {visiblePackets.map((packet) => (
        <span
          key={`receive-${packet.id}`}
          className="odysee-hyperbeam-startup__root-receive"
          style={
            {
              '--receive-delay': '0ms',
              '--receive-duration': `${packet.durationMs}ms`,
            } as React.CSSProperties
          }
        />
      ))}
      {visiblePackets.map((packet) => (
        <span
          key={packet.id}
          className={`odysee-hyperbeam-startup__packet odysee-hyperbeam-startup__packet--${Math.min(6, packet.points.length)}`}
          style={
            {
              '--packet-x1': `${packet.points[0]?.x || 50}%`,
              '--packet-y1': `${packet.points[0]?.y || 50}%`,
              '--packet-x2': `${packet.points[1]?.x || packet.points[0]?.x || 50}%`,
              '--packet-y2': `${packet.points[1]?.y || packet.points[0]?.y || 50}%`,
              '--packet-x3': `${packet.points[2]?.x || packet.points[1]?.x || packet.points[0]?.x || 50}%`,
              '--packet-y3': `${packet.points[2]?.y || packet.points[1]?.y || packet.points[0]?.y || 50}%`,
              '--packet-x4': `${packet.points[3]?.x || packet.points[2]?.x || packet.points[1]?.x || 50}%`,
              '--packet-y4': `${packet.points[3]?.y || packet.points[2]?.y || packet.points[1]?.y || 50}%`,
              '--packet-x5': `${packet.points[4]?.x || packet.points[3]?.x || packet.points[2]?.x || 50}%`,
              '--packet-y5': `${packet.points[4]?.y || packet.points[3]?.y || packet.points[2]?.y || 50}%`,
              '--packet-x6': `${packet.points[5]?.x || packet.points[4]?.x || packet.points[3]?.x || 50}%`,
              '--packet-y6': `${packet.points[5]?.y || packet.points[4]?.y || packet.points[3]?.y || 50}%`,
              '--packet-duration': `${packet.durationMs}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

function isPlaylistPlayerFullscreen() {
  const fsTarget = document.querySelector('.player-fullscreen-target');
  const fullscreenElement = getFullscreenElement();

  return Boolean(
    fsTarget &&
    fullscreenElement &&
    (fullscreenElement === fsTarget || fsTarget.contains(fullscreenElement) || fullscreenElement.contains(fsTarget))
  );
}

type Props = {
  uri: string;
  source?: string;
  contentType?: string;
  embedded?: boolean;
  changeVolume: (volume: number) => void;
  changeMute: (muted: boolean) => void;
  videoPlaybackRate: number;
  thumbnail?: string;
  position?: number;
  claim?: any;
  muted: boolean;
  volume: number;
  autoplayNext?: boolean;
  autoplayIfEmbedded?: boolean;
  doAnalyticsBuffer?: (...args: any[]) => void;
  doAnalyticsViewForUri?: (...args: any[]) => void;
  claimRewards?: (...args: any[]) => void;
  savePosition?: (uri: string, position: number) => void;
  clearPosition: (uri: string) => void;
  toggleVideoTheaterMode: () => void;
  toggleAutoplayNext: () => void;
  floatingPlayer?: boolean;
  toggleFloatingPlayer: () => void;
  autoplayMedia?: boolean;
  toggleAutoplayMedia: () => void;
  setVideoPlaybackRate: (rate: number) => void;
  authenticated?: boolean;
  userId?: string | number;
  shareTelemetry?: boolean;
  doPlayNextUri: (params: { uri: string; collectionId?: string; navigateInline?: boolean }) => void;
  recomendedContent?: string[];
  nextPlaylistUri?: string | null;
  videoTheaterMode?: boolean;
  isMarkdownOrComment?: boolean;
  isLivestreamClaim?: boolean;
  activeLivestreamForChannel?: any;
  defaultQuality?: string | null;
  doToast?: (...args: any[]) => void;
  doSetContentHistoryItem: (uri: string) => void;
  isPurchasableContent?: boolean;
  isRentableContent?: boolean;
  isProtectedContent?: boolean;
  isDownloadDisabled?: boolean;
  doSetShowAutoplayCountdownForUri: (params: { uri: string; show: boolean }) => void;
  doSetVideoSourceLoaded: (uri: string) => void;
  doSyncLastPosition?: (uri: string, position: number) => void;
  autoPlayNextShort?: boolean;
  isFloating?: boolean;
  playNextUri?: string | null;
  playPreviousUri?: string | null;
};

function VideoViewer(props: Props) {
  const {
    uri,
    playNextUri,
    playPreviousUri,
    source,
    contentType,
    embedded,
    changeVolume,
    changeMute,
    videoPlaybackRate,
    thumbnail,
    position,
    claim,
    muted,
    volume,
    autoplayNext,
    autoplayIfEmbedded,
    doAnalyticsBuffer,
    doAnalyticsViewForUri,
    claimRewards,
    savePosition,
    clearPosition,
    toggleVideoTheaterMode,
    toggleAutoplayNext,
    floatingPlayer,
    toggleFloatingPlayer,
    autoplayMedia,
    toggleAutoplayMedia,
    setVideoPlaybackRate,
    authenticated,
    userId,
    shareTelemetry,
    doPlayNextUri,
    recomendedContent,
    nextPlaylistUri,
    videoTheaterMode,
    isMarkdownOrComment,
    isLivestreamClaim,
    activeLivestreamForChannel,
    defaultQuality,
    doToast,
    doSetContentHistoryItem,
    isPurchasableContent,
    isRentableContent,
    isProtectedContent,
    isDownloadDisabled,
    doSetShowAutoplayCountdownForUri,
    doSetVideoSourceLoaded,
    doSyncLastPosition,
    autoPlayNextShort,
    isFloating,
  } = props;

  const videoEnded = React.useRef(false);
  const isMobile = useIsMobile();

  const shouldPlayRecommended = !nextPlaylistUri && playNextUri && autoplayNext;
  const [showRecommendationOverlay, setShowRecommendationOverlay] = useState(false);

  const dqSettingUsedBefore = Boolean(defaultQuality);
  const dqSettingPromoted = LocalStorage.getItem(DQ_SETTING_PROMOTED_KEY) === 'true';
  const promoteDqSetting = React.useRef(!dqSettingPromoted && !dqSettingUsedBefore);

  const canPlayNext = Boolean(playNextUri || shouldPlayRecommended);
  const canPlayPrevious = Boolean(playPreviousUri);

  const claimId = claim && claim.claim_id;
  const channelClaimId = claim && claim.signing_channel && claim.signing_channel.claim_id;
  const channelTitle =
    (claim && claim.signing_channel && claim.signing_channel.value && claim.signing_channel.value.title) || '';
  const isAudio = Boolean(contentType?.includes('audio'));
  const forcePlayer = Boolean(contentType && FORCE_CONTENT_TYPE_PLAYER.includes(contentType));
  const playerSource = !isLivestreamClaim && !isProtectedContent && !isAudio ? hyperbeamNodeMediaUrl(uri) : source;
  const enableInlineHyperbeamNodeDebug = false;

  const { search } = useLocation();

  const urlParams = new URLSearchParams(search);
  const timeParam = urlParams.get('t');

  const [isPlaying, setIsPlaying] = useState(false);
  const [hyperbeamNodeStartupVisible, setHyperbeamNodeStartupVisible] = useState(false);
  const [hyperbeamNodeStartupKey, setHyperbeamNodeStartupKey] = useState(0);
  const [hyperbeamNodeStartupOrigin, setHyperbeamNodeStartupOrigin] = useState<StartupGraphOrigin>({
    x: 50,
    y: 50,
    size: 78,
  });
  const [hyperbeamNodeStartupShowPlayMorph, setHyperbeamNodeStartupShowPlayMorph] = useState(false);
  const [hyperbeamNodeDebugOpen, setHyperbeamNodeDebugOpen] = useState(true);
  const [hyperbeamNodeDebugEvents, setHyperbeamNodeDebugEvents] = useState<Array<HyperbeamNodeDebugEvent>>([]);
  const [hyperbeamNodeDebugSnapshot, setHyperbeamNodeDebugSnapshot] = useState<HyperbeamNodeDebugSnapshot>({
    status: 'waiting for HyperBEAM media',
    level: 'info',
  });
  const hyperbeamNodeDebugLogRef = React.useRef<HTMLDivElement | null>(null);
  const hyperbeamNodeFailureProbeRef = React.useRef<string | null>(null);
  const fileViewerRef = React.useRef<HTMLDivElement | null>(null);
  const hyperbeamNodeStartupVisibleRef = React.useRef(false);
  const lastHyperbeamNodeStartupAtRef = React.useRef(0);
  const hyperbeamNodePlaybackStartedRef = React.useRef(false);
  const hyperbeamNodeStartupShownAtRef = React.useRef(0);
  const hyperbeamNodeStartupHideTimerRef = React.useRef<number | null>(null);

  const hideHyperbeamNodeStartup = React.useCallback(() => {
    if (hyperbeamNodeStartupHideTimerRef.current) {
      window.clearTimeout(hyperbeamNodeStartupHideTimerRef.current);
      hyperbeamNodeStartupHideTimerRef.current = null;
    }
    hyperbeamNodePlaybackStartedRef.current = true;
    hyperbeamNodeStartupVisibleRef.current = false;
    setHyperbeamNodeStartupVisible(false);
    setHyperbeamNodeStartupShowPlayMorph(false);
    fileViewerRef.current?.querySelectorAll('.odysee-hyperbeam-startup').forEach((node) => {
      (node as HTMLElement).style.display = 'none';
    });
  }, []);

  React.useEffect(() => {
    hyperbeamNodeStartupVisibleRef.current = hyperbeamNodeStartupVisible;
  }, [hyperbeamNodeStartupVisible]);

  const measureHyperbeamNodeStartupBounds = React.useCallback(() => {
    const currentTarget = fileViewerRef.current;
    if (!currentTarget) return null;
    const playerTarget =
      currentTarget.querySelector('.video-js-parent') || currentTarget.querySelector('.odysee-skin') || currentTarget;
    const rect = playerTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }, []);

  React.useEffect(() => {
    hyperbeamNodePlaybackStartedRef.current = false;
    hyperbeamNodeStartupVisibleRef.current = false;
    hyperbeamNodeStartupShownAtRef.current = 0;
    if (hyperbeamNodeStartupHideTimerRef.current) {
      window.clearTimeout(hyperbeamNodeStartupHideTimerRef.current);
      hyperbeamNodeStartupHideTimerRef.current = null;
    }
    setHyperbeamNodeStartupVisible(false);
    setHyperbeamNodeStartupShowPlayMorph(false);
    fileViewerRef.current?.querySelectorAll('.odysee-hyperbeam-startup').forEach((node) => {
      (node as HTMLElement).style.display = 'none';
    });
  }, [playerSource, uri]);

  const pushHyperbeamNodeDebugEvent = React.useCallback(
    (label: string, data?: any, level: HyperbeamNodeDebugLevel = 'info') => {
      setHyperbeamNodeDebugEvents((events) =>
        [
          ...events,
          {
            time: new Date().toLocaleTimeString(),
            label,
            level,
            data,
          },
        ].slice(-80)
      );
    },
    []
  );

  const embedContext = useContext(EmbedContext);
  const isExternalEmbed = Boolean(embedContext) || isEmbedPath(window.location.pathname);
  const isEmbedded = isExternalEmbed || embedded;
  const showEmbedEndOverlay = embedContext && embedContext.videoEnded;

  const [videoNode, setVideoNode] = useState<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    if (!hyperbeamNodeStartupVisible || !isHyperbeamNodeMediaUrl(playerSource)) return;

    const viewer = fileViewerRef.current;
    const getActiveVideo = () => viewer?.querySelector('video') || videoNode;
    const hideIfPlaybackStarted = () => {
      const activeVideo = getActiveVideo();
      if (!activeVideo) return;

      if (activeVideo.currentTime > 0 || (!activeVideo.paused && activeVideo.readyState >= 2)) {
        hideHyperbeamNodeStartup();
      }
    };
    const eventNames = ['playing', 'timeupdate', 'loadeddata', 'canplay', 'canplaythrough'];
    eventNames.forEach((name) => viewer?.addEventListener(name, hideIfPlaybackStarted, true));
    const interval = window.setInterval(hideIfPlaybackStarted, 120);

    hideIfPlaybackStarted();

    return () => {
      eventNames.forEach((name) => viewer?.removeEventListener(name, hideIfPlaybackStarted, true));
      window.clearInterval(interval);
    };
  }, [hideHyperbeamNodeStartup, hyperbeamNodeStartupVisible, playerSource, videoNode]);

  React.useEffect(() => {
    if (!enableInlineHyperbeamNodeDebug || !ODYSEE_HYPERBEAM_NODE_API || !uri || !isHyperbeamNodeMediaUrl(playerSource))
      return;

    let cancelled = false;
    const resolveUrl = hyperbeamNodeResolveUrl(uri);

    setHyperbeamNodeDebugSnapshot({ status: 'checking HyperBEAM node', level: 'info' });
    pushHyperbeamNodeDebugEvent(
      'HyperBEAM media source selected',
      {
        uri,
        node: ODYSEE_HYPERBEAM_NODE_API,
        sourceProp: source,
        playerSource,
        resolveUrl,
      },
      'info'
    );

    const verifyReadPath = async () => {
      let expectedSdHash;

      try {
        const resolveResponse = await fetch(resolveUrl);
        const resolveResult = {
          status: resolveResponse.status,
          ok: resolveResponse.ok,
          contentType: resolveResponse.headers.get('content-type'),
          body: await resolveResponse.json().catch(() => null),
        };
        if (cancelled) return;

        expectedSdHash = hyperbeamClaimSdHash(resolveResult.body);
        pushHyperbeamNodeDebugEvent(
          'claim source hash',
          {
            status: resolveResult.status,
            ok: resolveResult.ok,
            sdHash: expectedSdHash || null,
            claimId: resolveResult.body?.claim_id || null,
            permanentUrl: resolveResult.body?.permanent_url || null,
          },
          resolveResult.ok && expectedSdHash ? 'ok' : 'error'
        );

        if (!resolveResult.ok || !expectedSdHash) {
          setHyperbeamNodeDebugSnapshot({
            status: !resolveResult.ok ? `resolve failed (${resolveResult.status})` : 'claim missing sd_hash',
            level: 'error',
          });
          return;
        }
      } catch (error) {
        if (cancelled) return;
        pushHyperbeamNodeDebugEvent('claim source hash error', String(error?.message || error), 'error');
        setHyperbeamNodeDebugSnapshot({ status: 'resolve request failed', level: 'error' });
        return;
      }

      try {
        const descriptorUrl = hyperbeamNodeDescriptorUrl(expectedSdHash);
        const descriptorResponse = await fetch(descriptorUrl);
        const descriptorBody = await descriptorResponse.json().catch(() => null);
        const descriptor = hyperbeamDescriptorVerification(descriptorBody, expectedSdHash);
        if (cancelled) return;

        pushHyperbeamNodeDebugEvent(
          'descriptor verification',
          {
            status: descriptorResponse.status,
            ok: descriptorResponse.ok,
            descriptorUrl,
            ...descriptor,
          },
          descriptorResponse.ok && descriptor.verified ? 'ok' : 'error'
        );

        if (!descriptorResponse.ok || !descriptor.verified) {
          setHyperbeamNodeDebugSnapshot({
            status: descriptorResponse.ok
              ? 'descriptor verification failed'
              : `descriptor failed (${descriptorResponse.status})`,
            level: 'error',
          });
          return;
        }
      } catch (error) {
        if (cancelled) return;
        pushHyperbeamNodeDebugEvent('descriptor verification error', String(error?.message || error), 'error');
        setHyperbeamNodeDebugSnapshot({ status: 'descriptor verification request failed', level: 'error' });
        return;
      }

      try {
        const head = await hyperbeamNodeMediaProbe(playerSource);
        if (cancelled) return;
        pushHyperbeamNodeDebugEvent('media HEAD', head, head.ok ? 'ok' : 'error');
        if (!head.ok) {
          setHyperbeamNodeDebugSnapshot({ status: `media HEAD failed (${head.status})`, level: 'error' });
          return;
        }
      } catch (error) {
        if (cancelled) return;
        pushHyperbeamNodeDebugEvent('media HEAD error', String(error?.message || error), 'error');
        setHyperbeamNodeDebugSnapshot({ status: 'media HEAD request failed', level: 'error' });
        return;
      }

      try {
        const response = await fetch(playerSource, { headers: { Range: 'bytes=0-1023' } });
        const bytes = await response.arrayBuffer().catch(() => new ArrayBuffer(0));
        const rangeResult = {
          ...hyperbeamNodeMediaHeaders(response),
          byteLength: bytes.byteLength,
        };
        const rangeVerification = hyperbeamMediaRangeVerification(rangeResult, expectedSdHash);
        if (cancelled) return;

        pushHyperbeamNodeDebugEvent(
          'media range verification',
          rangeVerification,
          rangeVerification.verified ? 'ok' : 'error'
        );
        setHyperbeamNodeDebugSnapshot({
          status: rangeVerification.verified
            ? 'HyperBEAM read path verified'
            : `range verification failed (${rangeResult.status})`,
          level: rangeVerification.verified ? 'ok' : 'error',
        });
      } catch (error) {
        if (cancelled) return;
        pushHyperbeamNodeDebugEvent('media range verification error', String(error?.message || error), 'error');
        setHyperbeamNodeDebugSnapshot({ status: 'media range verification request failed', level: 'error' });
      }
    };

    verifyReadPath();

    return () => {
      cancelled = true;
    };
  }, [playerSource, pushHyperbeamNodeDebugEvent, source, uri]);

  React.useEffect(() => {
    if (!enableInlineHyperbeamNodeDebug || !videoNode || !isHyperbeamNodeMediaUrl(playerSource)) return;

    hyperbeamNodeFailureProbeRef.current = null;

    const runFailureProbes = async (state: ReturnType<typeof videoDebugState>) => {
      const probeKey = `${playerSource}:${state.error?.code || 'error'}:${state.currentTime}:${state.readyState}`;
      if (hyperbeamNodeFailureProbeRef.current === probeKey) return;
      hyperbeamNodeFailureProbeRef.current = probeKey;

      pushHyperbeamNodeDebugEvent('media failure probe start', state, 'warn');
      try {
        const head = await hyperbeamNodeMediaProbe(playerSource);
        pushHyperbeamNodeDebugEvent('media failure HEAD', head, head.ok ? 'ok' : 'error');

        const length = Number(head.contentLength);
        if (Number.isFinite(length) && length > 0) {
          const tailStart = Math.max(0, length - 1024);
          const tail = await hyperbeamNodeMediaProbe(playerSource, `bytes=${tailStart}-`);
          pushHyperbeamNodeDebugEvent('media failure tail range', tail, tail.status === 206 ? 'ok' : 'error');
          setHyperbeamNodeDebugSnapshot({
            status: `media failure probe ${tail.status}`,
            level: tail.status === 206 ? 'warn' : 'error',
            video: state,
          });
        }
      } catch (error) {
        pushHyperbeamNodeDebugEvent('media failure probe error', String(error?.message || error), 'error');
        setHyperbeamNodeDebugSnapshot({ status: 'media failure probe failed', level: 'error', video: state });
      }
    };

    const eventNames = [
      'abort',
      'emptied',
      'loadstart',
      'loadedmetadata',
      'loadeddata',
      'canplay',
      'canplaythrough',
      'play',
      'playing',
      'timeupdate',
      'pause',
      'waiting',
      'stalled',
      'suspend',
      'seeking',
      'seeked',
      'ratechange',
      'error',
    ];
    const handler = (event: Event) => {
      const state = videoDebugState(videoNode);
      const isError = event.type === 'error' || Boolean(state.error);
      const isWarn = ['waiting', 'stalled', 'suspend', 'abort', 'emptied'].includes(event.type);
      const level = isError
        ? 'error'
        : isWarn
          ? 'warn'
          : ['canplay', 'canplaythrough', 'playing', 'loadeddata'].includes(event.type)
            ? 'ok'
            : 'info';
      if (
        ['playing', 'loadeddata', 'canplay', 'canplaythrough', 'timeupdate', 'error', 'abort'].includes(event.type) &&
        (event.type !== 'timeupdate' || state.currentTime > 0)
      ) {
        hideHyperbeamNodeStartup();
      }
      pushHyperbeamNodeDebugEvent(`video ${event.type}`, state, level);
      setHyperbeamNodeDebugSnapshot({
        status: isError ? `video error ${state.error?.code || ''}`.trim() : event.type,
        level,
        video: state,
      });
      if (event.type === 'error') {
        runFailureProbes(state);
      }
    };

    eventNames.forEach((name) => videoNode.addEventListener(name, handler));
    return () => eventNames.forEach((name) => videoNode.removeEventListener(name, handler));
  }, [hideHyperbeamNodeStartup, playerSource, pushHyperbeamNodeDebugEvent, videoNode]);

  React.useEffect(() => {
    if (!enableInlineHyperbeamNodeDebug || !videoNode || !isHyperbeamNodeMediaUrl(playerSource)) return;

    let lastTime = videoNode.currentTime;
    let unchangedTicks = 0;
    const interval = window.setInterval(() => {
      const state = videoDebugState(videoNode);
      const advanced = state.currentTime > lastTime + 0.25;
      unchangedTicks = advanced || videoNode.paused ? 0 : unchangedTicks + 1;
      lastTime = state.currentTime;

      const stalled = !videoNode.paused && unchangedTicks >= 3 && videoNode.readyState < 3;
      setHyperbeamNodeDebugSnapshot({
        status: stalled ? 'playback not advancing' : videoNode.paused ? 'video paused' : 'video playing',
        level: stalled ? 'warn' : videoNode.paused ? 'info' : 'ok',
        video: state,
      });

      if (stalled) {
        pushHyperbeamNodeDebugEvent('video progress stalled', state, 'warn');
      }
    }, 3000);

    return () => window.clearInterval(interval);
  }, [playerSource, pushHyperbeamNodeDebugEvent, videoNode]);

  React.useEffect(() => {
    if (!enableInlineHyperbeamNodeDebug || !hyperbeamNodeDebugOpen || !hyperbeamNodeDebugLogRef.current) return;

    hyperbeamNodeDebugLogRef.current.scrollTop = hyperbeamNodeDebugLogRef.current.scrollHeight;
  }, [hyperbeamNodeDebugEvents, hyperbeamNodeDebugOpen]);

  React.useEffect(() => {
    if (defaultQuality) {
      promoteDqSetting.current = false;
      if (!dqSettingPromoted) {
        LocalStorage.setItem(DQ_SETTING_PROMOTED_KEY, 'true');
      }
    }
  }, [defaultQuality, dqSettingPromoted]);

  React.useEffect(() => {
    if (isPlaying) {
      doSetContentHistoryItem(claim.permanent_url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  const handleToggleAutoplayNext = useCallback(() => toggleAutoplayNext(), [toggleAutoplayNext]);
  const handleToggleFloatingPlayer = useCallback(() => toggleFloatingPlayer(), [toggleFloatingPlayer]);
  const handleToggleAutoplayMedia = useCallback(() => toggleAutoplayMedia(), [toggleAutoplayMedia]);

  useInterval(
    () => {
      if (videoNode && isPlaying && !isLivestreamClaim) {
        handlePosition(videoNode);
      }
    },
    !isLivestreamClaim ? PLAY_POSITION_SAVE_INTERVAL_MS : null
  );

  const updateVolumeState = React.useCallback(
    debounce((volume: number, muted: boolean) => {
      changeVolume(volume);
      changeMute(muted);
    }, 500),
    []
  );

  const handlePlayNextUri = React.useCallback(
    (options?: { manual?: boolean }) => {
      const manual = options && options.manual;
      const shouldPreserveFullscreen = Boolean(nextPlaylistUri && isPlaylistPlayerFullscreen());

      if (shouldPreserveFullscreen) {
        sessionStorage.setItem(PLAYLIST_FULLSCREEN_KEY, 'true');
      }

      if (shouldPlayRecommended) {
        if (manual || IS_IOS) {
          doPlayNextUri({ uri: playNextUri });
        } else {
          doSetShowAutoplayCountdownForUri({ uri, show: true });
        }
      } else if (playNextUri) {
        doPlayNextUri({ uri: playNextUri });
      }
    },
    [doPlayNextUri, doSetShowAutoplayCountdownForUri, nextPlaylistUri, playNextUri, shouldPlayRecommended, uri]
  );

  const handlePlayPreviousUri = React.useCallback(() => {
    if (videoNode && videoNode.currentTime > 5) {
      videoNode.currentTime = 0;
    } else if (playPreviousUri) {
      doPlayNextUri({ uri: playPreviousUri });
    }
  }, [doPlayNextUri, playPreviousUri, videoNode]);

  const onVideoEndedRef = React.useRef<() => void>(() => {});

  const onVideoEnded = React.useCallback(() => {
    if (videoNode?.loop) {
      videoNode.currentTime = 0;
      videoNode.play().catch(() => {});
      return;
    }

    videoEnded.current = true;
    analytics.video.videoIsPlaying(false, window.player);

    const isShorts = !!document.querySelector('.shorts-page__container');
    if (isShorts) {
      clearPosition(uri);
      return;
    }

    if (embedContext) {
      embedContext.setVideoEnded(true);
    } else {
      if (canPlayNext) {
        handlePlayNextUri();
      } else {
        setShowRecommendationOverlay(true);
      }
    }

    clearPosition(uri);
  }, [canPlayNext, clearPosition, embedContext, handlePlayNextUri, uri]);

  React.useEffect(() => {
    onVideoEndedRef.current = onVideoEnded;
  }, [onVideoEnded]);

  const lastSyncTimeRef = React.useRef(0);

  function handlePosition(node: HTMLVideoElement, forceSync = false) {
    try {
      if (!isLivestreamClaim && uri && savePosition && node) {
        const currentTime = node.currentTime;
        savePosition(uri, currentTime);

        if (doSyncLastPosition && currentTime > 0) {
          const now = Date.now();
          if (forceSync || now - lastSyncTimeRef.current > POSITION_SYNC_INTERVAL_MS) {
            lastSyncTimeRef.current = now;
            doSyncLastPosition(uri, currentTime);
          }
        }
      }
    } catch (error) {}
  }

  const onPlayerReady = useCallback(
    (_player: any, node: HTMLVideoElement) => {
      setVideoNode(node);

      if (sessionStorage.getItem(PLAYLIST_FULLSCREEN_KEY) === 'true') {
        sessionStorage.removeItem(PLAYLIST_FULLSCREEN_KEY);
        const fsTarget = document.querySelector('.player-fullscreen-target');

        if (fsTarget && getFullscreenElement() !== fsTarget) {
          requestFullscreen(fsTarget);
        }
      }

      // Restore position
      const parsedTime = Number(timeParam);
      if (timeParam && isFinite(parsedTime) && parsedTime > 0) {
        node.currentTime = parsedTime;
      } else if (position && isFinite(position) && !isLivestreamClaim) {
        const avDuration = claim?.value?.video?.duration || claim?.value?.audio?.duration;
        node.currentTime = avDuration && position >= avDuration - 100 ? 0 : position;
      }

      // Set initial state from redux
      if (muted || autoplayIfEmbedded) {
        node.muted = true;
      }
      node.volume = volume;
      node.playbackRate = videoPlaybackRate;
      const restoreRate = () => {
        node.playbackRate = videoPlaybackRate;
      };
      node.addEventListener('canplay', restoreRate, { once: true });
      node.addEventListener('playing', restoreRate, { once: true });

      // Listen for ended event (use ref to always call the latest callback)
      const handleEnded = () => onVideoEndedRef.current();
      node.addEventListener('ended', handleEnded);

      // Track play state
      const handlePlay = () => {
        setShowRecommendationOverlay(false);
        videoEnded.current = false;
        setIsPlaying(true);
        doSetShowAutoplayCountdownForUri({ uri, show: false });
        if (embedContext) embedContext.setVideoEnded(false);
      };
      const handlePause = () => {
        if (!isHyperbeamNodeMediaUrl(playerSource) || node.readyState >= 3) {
          hideHyperbeamNodeStartup();
        }
        setIsPlaying(false);
        handlePosition(node, true);
      };
      const handlePlaying = () => {
        window.dispatchEvent(new CustomEvent(HYPERBEAM_STARTUP_READY_EVENT, { detail: { uri } }));
        hideHyperbeamNodeStartup();
      };
      const handleLoadedData = () => {
        window.dispatchEvent(new CustomEvent(HYPERBEAM_STARTUP_READY_EVENT, { detail: { uri } }));
        hideHyperbeamNodeStartup();
      };
      const handleVolumeChange = () => {
        updateVolumeState(node.volume, node.muted);
      };
      let unmounted = false;
      const handleRateChange = () => {
        if (node.readyState > 0 && !unmounted) {
          setVideoPlaybackRate(node.playbackRate);
        }
      };

      node.addEventListener('play', handlePlay);
      node.addEventListener('playing', handlePlaying);
      node.addEventListener('loadeddata', handleLoadedData);
      node.addEventListener('pause', handlePause);
      node.addEventListener('volumechange', handleVolumeChange);
      node.addEventListener('ratechange', handleRateChange);

      return () => {
        unmounted = true;
        node.removeEventListener('ended', handleEnded);
        node.removeEventListener('play', handlePlay);
        node.removeEventListener('playing', handlePlaying);
        node.removeEventListener('loadeddata', handleLoadedData);
        node.removeEventListener('pause', handlePause);
        node.removeEventListener('volumechange', handleVolumeChange);
        node.removeEventListener('ratechange', handleRateChange);
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [muted, uri, isEmbedded, autoplayIfEmbedded, playerSource, hideHyperbeamNodeStartup]
  );

  function replay() {
    if (videoNode) {
      videoNode.currentTime = 0;
      videoNode.play();
    }
  }

  const [hovered, setHovered] = useState(false);

  React.useEffect(() => {
    return () => {
      hideHyperbeamNodeStartup();
    };
  }, [hideHyperbeamNodeStartup, uri]);

  return (
    <>
      <div
        ref={fileViewerRef}
        className={classnames('file-viewer', {
          'file-viewer--is-playing': isPlaying,
          'file-viewer--ended-embed': showEmbedEndOverlay,
          'file-viewer--ended': showRecommendationOverlay,
        })}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {showEmbedEndOverlay && <FileViewerEmbeddedEnded uri={uri} doReplay={replay} />}
        {showRecommendationOverlay && (
          <div className="recommendation-overlay-wrapper">
            <div className="recommendation-overlay-grid">
              {recomendedContent &&
                recomendedContent.slice(0, 9).map((url, i) => (
                  <div
                    key={url}
                    onClick={() => {
                      i === 4 && isMobile ? replay() : doPlayNextUri({ uri: url });
                    }}
                  >
                    <ClaimPreviewTile uri={url} onClickHandledByParent />
                  </div>
                ))}
            </div>
          </div>
        )}

        <VideoJs
          source={playerSource}
          sourceType={forcePlayer ? 'video/mp4' : contentType}
          isAudio={isAudio}
          poster={isAudio ? thumbnail : ''}
          thumbnail={thumbnail}
          onPlayerReady={onPlayerReady}
          startMuted={autoplayIfEmbedded}
          showUnmuteHintWhenMuted={muted || autoplayIfEmbedded}
          toggleVideoTheaterMode={toggleVideoTheaterMode}
          claimId={claimId}
          title={claim && ((claim.value && claim.value.title) || claim.name)}
          channelTitle={channelTitle}
          userId={userId}
          shareTelemetry={shareTelemetry}
          playNext={handlePlayNextUri}
          playPrevious={handlePlayPreviousUri}
          embedded={isEmbedded}
          externalEmbed={isExternalEmbed}
          embeddedInternal={isMarkdownOrComment}
          claimValues={claim.value}
          doAnalyticsViewForUri={doAnalyticsViewForUri}
          doAnalyticsBuffer={doAnalyticsBuffer}
          claimRewards={claimRewards}
          uri={uri}
          userClaimId={claim && claim.signing_channel && claim.signing_channel.claim_id}
          isLivestreamClaim={isLivestreamClaim}
          activeLivestreamForChannel={activeLivestreamForChannel}
          defaultQuality={defaultQuality}
          doToast={doToast}
          isPurchasableContent={isPurchasableContent}
          isRentableContent={isRentableContent}
          isProtectedContent={isProtectedContent}
          isDownloadDisabled={isDownloadDisabled}
          isUnlisted={isClaimUnlisted(claim)}
          doSetVideoSourceLoaded={doSetVideoSourceLoaded}
          autoPlayNextShort={autoPlayNextShort}
          canPlayNext={canPlayNext}
          canPlayPrevious={canPlayPrevious}
          autoplayNext={autoplayNext}
          onToggleAutoplayNext={handleToggleAutoplayNext}
          floatingPlayer={floatingPlayer}
          onToggleFloatingPlayer={handleToggleFloatingPlayer}
          autoplayMedia={autoplayMedia}
          onToggleAutoplayMedia={handleToggleAutoplayMedia}
          videoTheaterMode={videoTheaterMode}
          isMarkdownOrComment={isMarkdownOrComment}
          isFloating={isFloating}
        />

        {enableInlineHyperbeamNodeDebug && ODYSEE_HYPERBEAM_NODE_API && isHyperbeamNodeMediaUrl(playerSource) && (
          <div
            className="odysee-hyperbeam-debug-console"
            style={{
              position: 'absolute',
              right: 12,
              top: 12,
              zIndex: 10,
              width: hyperbeamNodeDebugOpen ? 420 : 'auto',
              maxWidth: 'calc(100% - 24px)',
              maxHeight: '70%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: 6,
              border: '1px solid rgba(222, 0, 80, 0.58)',
              background: 'rgba(12, 10, 12, 0.94)',
              color: '#f9fafb',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 11,
              lineHeight: 1.35,
              boxShadow: '0 10px 30px rgba(0,0,0,0.42), 0 0 24px rgba(222,0,80,0.18)',
            }}
          >
            <button
              type="button"
              onClick={() => setHyperbeamNodeDebugOpen((open) => !open)}
              style={{
                width: '100%',
                border: 0,
                padding: '7px 9px',
                background: 'linear-gradient(90deg, rgba(222,0,80,0.34), rgba(222,0,80,0.12))',
                color: '#f9fafb',
                textAlign: 'left',
                cursor: 'pointer',
                font: 'inherit',
              }}
            >
              Odysee HyperBEAM devices {hyperbeamNodeDebugOpen ? 'hide' : 'show'}
            </button>
            {hyperbeamNodeDebugOpen && (
              <div ref={hyperbeamNodeDebugLogRef} style={{ padding: 9, minHeight: 0, overflow: 'auto' }}>
                <div style={{ overflowWrap: 'anywhere', marginBottom: 8, color: 'rgba(255,255,255,0.72)' }}>
                  {playerSource}
                </div>
                {hyperbeamNodeDebugEvents.map((event, index) => (
                  <div key={`${event.time}-${event.label}-${index}`} style={{ marginTop: 7 }}>
                    <strong style={{ color: hyperbeamNodeDebugLevelColor(event.level) }}>
                      {event.time} {event.label}
                    </strong>
                    {event.data !== undefined && (
                      <pre style={{ margin: '3px 0 0', whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.78)' }}>
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isEmbedded && authenticated && !showEmbedEndOverlay && (hovered || !isPlaying) && (
          <div className="embed-reactions-overlay" aria-label={__('Reactions')}>
            <FileReactions uri={uri} />
          </div>
        )}
      </div>
    </>
  );
}

export default VideoViewer;
