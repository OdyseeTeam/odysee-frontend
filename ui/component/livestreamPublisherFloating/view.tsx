import React from 'react';
import { useLivestreamPublish } from 'contexts/livestreamPublish';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from 'redux/hooks';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectViewersForId, selectLivestreamsForChannelId } from 'redux/selectors/livestream';
import { selectClaimIdForUri, selectTitleForUri } from 'redux/selectors/claims';
import { formatLbryUrlForWeb } from 'util/url';
import * as PAGES from 'constants/pages';
import classnames from 'classnames';
import useLivestreamMetrics from 'effects/use-livestream-metrics';
import Lbry from 'lbry';
import { toHex } from 'util/hex';
import usePersistedState from 'effects/use-persisted-state';
import './style.scss';

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

export default function LivestreamPublisherFloating() {
  const { state, actions } = useLivestreamPublish();
  const { status, mediaStream, floatingPreviewEnabled, resolution, videoBitrateKbps } = state;
  const [cameraAutoStart] = usePersistedState('livestream-camera-autostart', false) as [boolean, (v: boolean) => void];
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const floatingRef = React.useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isOnLivestreamPage = location.pathname.includes(PAGES.LIVESTREAM);

  // Stream metrics
  const activeChannelClaim = useAppSelector(selectActiveChannelClaim);
  const channelId = activeChannelClaim?.claim_id;
  const channelName = activeChannelClaim?.name;
  const [sigData, setSigData] = React.useState<{ signature?: string; signing_ts?: string }>({});
  React.useEffect(() => {
    if (channelId && channelName) {
      Lbry.channel_sign({ channel_id: channelId, hexdata: toHex(channelName) })
        .then((data: any) => setSigData(data))
        .catch(() => setSigData({}));
    }
  }, [channelId, channelName]);
  const isLiveForMetrics = status === 'live' && !isOnLivestreamPage;
  const serverMetrics = useLivestreamMetrics(channelId, channelName, sigData.signature, sigData.signing_ts, isLiveForMetrics);

  // Viewer count: commentron WSS for HLS, OME for WebRTC (only if source is WebRTC)
  const myLivestreamClaims = useAppSelector((state) => selectLivestreamsForChannelId(state, channelId));
  const nextStreamUri = myLivestreamClaims?.[0]?.permanent_url;
  const activeClaimId = useAppSelector((state) => nextStreamUri ? selectClaimIdForUri(state, nextStreamUri) : undefined);
  const commentronViewers = useAppSelector((state) => activeClaimId ? selectViewersForId(state, activeClaimId) : undefined);
  const isWebRtcSource = serverMetrics?.source_type?.toLowerCase() === 'webrtc';
  const webrtcViewers = isWebRtcSource ? (serverMetrics?.viewers?.webrtc ?? 0) : 0;
  const totalViewers = (commentronViewers ?? 0) + webrtcViewers;

  // Claim title for info bar
  const claimTitle = useAppSelector((state) => nextStreamUri ? selectTitleForUri(state, nextStreamUri) : undefined);
  const claimNavigateUrl = nextStreamUri ? formatLbryUrlForWeb(nextStreamUri) : null;
  const isStreaming = status === 'live' || status === 'connecting' || status === 'preview';
  const showFullPreview = isStreaming && mediaStream && floatingPreviewEnabled && !isOnLivestreamPage;
  const showMinimalPill = isStreaming && mediaStream && !floatingPreviewEnabled && !isOnLivestreamPage;

  // Attach media stream to video element
  React.useEffect(() => {
    const el = videoRef.current;
    if (el && mediaStream && showFullPreview) {
      el.srcObject = mediaStream;
      el.play().catch(() => {});
    }
    return () => {
      if (el) el.srcObject = null;
    };
  }, [mediaStream, showFullPreview]);

  // ---- Dragging (for full preview only) ----
  const dragRef = React.useRef({
    active: false,
    dragging: false,
    pointerId: 0,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    lastX: 0,
    lastY: 0,
  });
  const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null);

  React.useEffect(() => {
    if (!showFullPreview) return;
    const node = floatingRef.current;
    if (!node) return;

    function clamp(x: number, y: number) {
      const w = node!.offsetWidth;
      const h = node!.offsetHeight;
      const maxX = window.innerWidth - w - 16;
      const maxY = window.innerHeight - h - 16;
      return {
        x: Math.max(16, Math.min(x, maxX)),
        y: Math.max(16, Math.min(y, maxY)),
      };
    }

    function onPointerDown(e: PointerEvent) {
      if ((e.target as Element)?.closest?.('button')) return;
      const d = dragRef.current;
      const rect = node!.getBoundingClientRect();
      d.active = true;
      d.dragging = false;
      d.pointerId = e.pointerId;
      d.startX = e.clientX;
      d.startY = e.clientY;
      d.origX = rect.left;
      d.origY = rect.top;
      d.lastX = rect.left;
      d.lastY = rect.top;
    }

    function onPointerMove(e: PointerEvent) {
      const d = dragRef.current;
      if (!d.active) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (!d.dragging && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        d.dragging = true;
        try { node!.setPointerCapture(d.pointerId); } catch {} // eslint-disable-line no-empty
      }
      if (!d.dragging) return;
      e.preventDefault();
      const c = clamp(d.origX + dx, d.origY + dy);
      d.lastX = c.x;
      d.lastY = c.y;
      node!.style.left = c.x + 'px';
      node!.style.top = c.y + 'px';
      node!.style.right = 'auto';
      node!.style.bottom = 'auto';
    }

    function onPointerUp() {
      const d = dragRef.current;
      if (!d.active) return;
      const wasDrag = d.dragging;
      d.active = false;
      d.dragging = false;
      try { node!.releasePointerCapture(d.pointerId); } catch {} // eslint-disable-line no-empty
      if (wasDrag) {
        setPos({ x: d.lastX, y: d.lastY });
      }
    }

    node.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
    return () => {
      node.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
    };
  }, [showFullPreview]);

  // ---- Minimal status pill (when preview disabled but streaming) ----
  if (showMinimalPill) {
    const isLive = status === 'live';
    return (
      <div className="livestream-floating-pill">
        <span
          className={classnames('livestream-floating-pill__badge', {
            'livestream-floating-pill__badge--live': isLive,
          })}
        >
          {isLive && <span className="livestream-floating-pill__dot" />}
          {isLive ? __('LIVE') : status === 'connecting' ? __('CONNECTING') : __('PREVIEW')}
        </span>

        <button
          className="livestream-floating-pill__btn"
          onClick={() => actions.setFloatingPreviewEnabled(true)}
          title={__('Show preview')}
        >
          {/* Eye icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>

        <button
          className="livestream-floating-pill__btn"
          onClick={() => navigate(`/$/${PAGES.LIVESTREAM}`)}
          title={__('Go to stream page')}
        >
          {/* Monitor icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </button>

        {(isLive || status === 'connecting') && (
            <button
              className="livestream-floating-pill__btn livestream-floating-pill__btn--stop"
              onClick={() => actions.stopStream({ preservePreview: Boolean(cameraAutoStart) })}
              title={__('End stream')}
            >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  // ---- Full preview ----
  if (!showFullPreview) return null;

  const isLive = status === 'live';
  const posStyle = pos
    ? { left: pos.x, top: pos.y, right: 'auto' as const, bottom: 'auto' as const }
    : {};

  return (
    <div
      ref={floatingRef}
      className={classnames('livestream-floating', {
        'livestream-floating--live': isLive,
      })}
      style={posStyle}
    >
      <div className="livestream-floating__inner">
        <video
          ref={videoRef}
          className="livestream-floating__video"
          playsInline
          muted
          autoPlay
        />
        <div className="livestream-floating__overlay">
          <div className="livestream-floating__top-bar">
            <span
              className={classnames('livestream-floating__badge', {
                'livestream-floating__badge--live': isLive,
                'livestream-floating__badge--connecting': status === 'connecting',
              })}
            >
              {isLive ? __('LIVE') : status === 'connecting' ? __('CONNECTING') : __('PREVIEW')}
            </span>
            {resolution && <span className="livestream-floating__meta">{formatResolutionLabel(resolution)}</span>}
          </div>
          <div className="livestream-floating__bottom-bar">
            {status === 'live' && totalViewers > 0 && (
              <span className="livestream-floating__meta livestream-floating__meta--viewers">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                {totalViewers}
              </span>
            )}
            {serverMetrics?.live && serverMetrics.throughput && serverMetrics.throughput.in_bps > 0 ? (
              <span className="livestream-floating__meta">
                {serverMetrics.throughput.in_bps >= 1000000
                  ? `${(serverMetrics.throughput.in_bps / 1000000).toFixed(1)} Mbps`
                  : `${Math.round(serverMetrics.throughput.in_bps / 1000)} kbps`}
              </span>
            ) : videoBitrateKbps != null && videoBitrateKbps > 0 ? (
              <span className="livestream-floating__meta">
                {videoBitrateKbps >= 1000
                  ? `${(videoBitrateKbps / 1000).toFixed(1)} Mbps`
                  : `${Math.round(videoBitrateKbps)} kbps`}
              </span>
            ) : null}
          </div>
        </div>

        {/* Controls overlay - visible on hover */}
        <div className="livestream-floating__controls">
          <button
            className="livestream-floating__control-btn"
            onClick={() => navigate(`/$/${PAGES.LIVESTREAM}`)}
            title={__('Go to stream page')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </button>

          {(isLive || status === 'connecting') && (
            <button
              className="livestream-floating__control-btn livestream-floating__control-btn--stop"
              onClick={() => actions.stopStream({ preservePreview: Boolean(cameraAutoStart) })}
              title={__('End stream')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="4" width="16" height="16" rx="2" />
              </svg>
            </button>
          )}

          <button
            className="livestream-floating__control-btn"
            onClick={() => actions.setFloatingPreviewEnabled(false)}
            title={__('Minimize to pill')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Info bar below video - title + stats */}
      {isLive && (
        <div className="livestream-floating__info-bar">
          {claimTitle && (
            <button
              className="livestream-floating__info-title"
              onClick={() => claimNavigateUrl && navigate(claimNavigateUrl)}
              title={claimTitle}
            >
              {claimTitle}
            </button>
          )}
          <div className="livestream-floating__info-stats">
            {totalViewers > 0 && (
              <span className="livestream-floating__info-pill">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                {totalViewers}
              </span>
            )}
            {(() => {
              const bps = serverMetrics?.live && serverMetrics.throughput
                ? serverMetrics.throughput.in_bps
                : (videoBitrateKbps ?? 0) * 1000;
              if (!bps || bps <= 0) return null;
              return (
                <span className="livestream-floating__info-pill">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                  {bps >= 1000000 ? `${(bps / 1000000).toFixed(1)} Mbps` : `${Math.round(bps / 1000)} kbps`}
                </span>
              );
            })()}
            {resolution && (
              <span className="livestream-floating__info-pill">{formatResolutionLabel(resolution)}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
