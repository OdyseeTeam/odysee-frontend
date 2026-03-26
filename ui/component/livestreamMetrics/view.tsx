import React from 'react';
import classnames from 'classnames';
import {
  type StreamMetrics,
  formatBps,
  formatResolution,
  formatCodec,
  formatVideoBitrate,
  formatAudioBitrate,
  formatSourceType,
} from 'util/livestreamMetrics';
import './style.scss';

type Mode = 'compact' | 'overlay' | 'full' | 'card';

type Props = {
  metrics: StreamMetrics | null;
  mode: Mode;
  className?: string;
};

// --- Compact mode (slim inline bar under video / in floating dock) ---
function CompactMetrics({ metrics }: { metrics: StreamMetrics }) {
  if (!metrics.live) return null;

  const tp = metrics.throughput;

  return (
    <div className="stream-metrics stream-metrics--compact">
      {/* Source type */}
      {metrics.source_type && (
        <span className="stream-metrics__chip">
          {formatSourceType(metrics.source_type)}
        </span>
      )}
      {/* Video info */}
      {metrics.video && (
        <span className="stream-metrics__chip">
          {formatResolution(metrics.video)} {formatCodec(metrics.video.codec)}
        </span>
      )}
      {/* Ingest bitrate */}
      {tp && tp.in_bps > 0 && (
        <span className="stream-metrics__chip" title={`avg ${formatBps(tp.avg_in_bps)}`}>
          {/* Arrow up icon */}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
          {formatBps(tp.in_bps)}
        </span>
      )}
      {/* Health dot */}
      <span
        className={classnames('stream-metrics__health-dot', {
          'stream-metrics__health-dot--good': tp && tp.in_bps > 0,
          'stream-metrics__health-dot--unknown': !tp || tp.in_bps <= 0,
        })}
      />
    </div>
  );
}

// --- Overlay mode (WebRTC publisher preview) ---
// Shows: viewer badge, source type badge
function OverlayMetrics({ metrics }: { metrics: StreamMetrics }) {
  if (!metrics.live) return null;

  const viewers = metrics.viewers?.total ?? 0;

  return (
    <div className="stream-metrics stream-metrics--overlay">
      <span className="stream-metrics__viewers-badge">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span>{viewers}</span>
      </span>
      {metrics.source_type && (
        <span className="stream-metrics__source-badge">
          {formatSourceType(metrics.source_type)}
        </span>
      )}
    </div>
  );
}

// --- Full mode (creator's own claim page) ---
// Shows: viewer breakdown, throughput, codec info, resolution
function FullMetrics({ metrics }: { metrics: StreamMetrics }) {
  if (!metrics.live) {
    return (
      <div className="stream-metrics stream-metrics--full stream-metrics--offline">
        <span className="stream-metrics__offline-label">{__('Stream offline')}</span>
      </div>
    );
  }

  const viewers = metrics.viewers;
  const tp = metrics.throughput;

  return (
    <div className="stream-metrics stream-metrics--full">
      {/* Top row: viewers + source */}
      <div className="stream-metrics__full-header">
        <div className="stream-metrics__full-viewers">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="stream-metrics__full-viewer-count">{viewers?.total ?? 0}</span>
          <span className="stream-metrics__full-viewer-label">{__('viewers')}</span>
        </div>
        {metrics.source_type && (
          <span className="stream-metrics__full-source">{formatSourceType(metrics.source_type)}</span>
        )}
      </div>

      {/* Grid of stats */}
      <div className="stream-metrics__full-grid">
        {viewers && (viewers.llhls > 0 || viewers.webrtc > 0) && (
          <div className="stream-metrics__full-stat">
            <span className="stream-metrics__full-stat-label">{__('Viewer breakdown')}</span>
            <span className="stream-metrics__full-stat-value">
              {viewers.llhls} LLHLS / {viewers.webrtc} WebRTC
            </span>
          </div>
        )}

        {metrics.video && (
          <div className="stream-metrics__full-stat">
            <span className="stream-metrics__full-stat-label">{__('Video')}</span>
            <span className="stream-metrics__full-stat-value">
              {formatCodec(metrics.video.codec)} {formatResolution(metrics.video)} @ {metrics.video.framerate}fps
            </span>
          </div>
        )}

        {metrics.video && (
          <div className="stream-metrics__full-stat">
            <span className="stream-metrics__full-stat-label">{__('Video bitrate')}</span>
            <span className="stream-metrics__full-stat-value">{formatVideoBitrate(metrics.video)}</span>
          </div>
        )}

        {metrics.audio && (
          <div className="stream-metrics__full-stat">
            <span className="stream-metrics__full-stat-label">{__('Audio')}</span>
            <span className="stream-metrics__full-stat-value">
              {formatCodec(metrics.audio.codec)} {formatAudioBitrate(metrics.audio)}
            </span>
          </div>
        )}

        {tp && (
          <div className="stream-metrics__full-stat">
            <span className="stream-metrics__full-stat-label">{__('Throughput in')}</span>
            <span className="stream-metrics__full-stat-value">
              {formatBps(tp.in_bps)}
              <span className="stream-metrics__full-stat-sub">avg {formatBps(tp.avg_in_bps)}</span>
            </span>
          </div>
        )}

        {tp && (
          <div className="stream-metrics__full-stat">
            <span className="stream-metrics__full-stat-label">{__('Throughput out')}</span>
            <span className="stream-metrics__full-stat-value">
              {formatBps(tp.out_bps)}
              <span className="stream-metrics__full-stat-sub">avg {formatBps(tp.avg_out_bps)}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Card mode (RTMP setup page) ---
// Clean card with stream health info
function CardMetrics({ metrics }: { metrics: StreamMetrics }) {
  if (!metrics.live) {
    return (
      <div className="stream-metrics stream-metrics--card stream-metrics--card-offline">
        <div className="stream-metrics__card-header">
          <span className="stream-metrics__card-dot stream-metrics__card-dot--offline" />
          <span className="stream-metrics__card-title">{__('Stream Health')}</span>
        </div>
        <p className="stream-metrics__card-offline-text">{__('Not currently streaming via RTMP.')}</p>
      </div>
    );
  }

  const viewers = metrics.viewers;
  const tp = metrics.throughput;

  return (
    <div className="stream-metrics stream-metrics--card">
      <div className="stream-metrics__card-header">
        <span className="stream-metrics__card-dot stream-metrics__card-dot--live" />
        <span className="stream-metrics__card-title">{__('Stream Health')}</span>
        {metrics.source_type && (
          <span className="stream-metrics__card-source">{formatSourceType(metrics.source_type)}</span>
        )}
        <span className="stream-metrics__card-viewers">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {viewers?.total ?? 0}
        </span>
      </div>

      <div className="stream-metrics__card-grid">
        {metrics.video && (
          <div className="stream-metrics__card-stat">
            <span className="stream-metrics__card-stat-label">{__('Video')}</span>
            <span className="stream-metrics__card-stat-value">
              {formatCodec(metrics.video.codec)} {formatResolution(metrics.video)}
            </span>
          </div>
        )}

        {metrics.video && (
          <div className="stream-metrics__card-stat">
            <span className="stream-metrics__card-stat-label">{__('Bitrate')}</span>
            <span className="stream-metrics__card-stat-value">{formatVideoBitrate(metrics.video)}</span>
          </div>
        )}

        {metrics.video && (
          <div className="stream-metrics__card-stat">
            <span className="stream-metrics__card-stat-label">{__('FPS')}</span>
            <span className="stream-metrics__card-stat-value">{metrics.video.framerate}</span>
          </div>
        )}

        {metrics.audio && (
          <div className="stream-metrics__card-stat">
            <span className="stream-metrics__card-stat-label">{__('Audio')}</span>
            <span className="stream-metrics__card-stat-value">
              {formatCodec(metrics.audio.codec)} {formatAudioBitrate(metrics.audio)}
            </span>
          </div>
        )}

        {tp && (
          <div className="stream-metrics__card-stat">
            <span className="stream-metrics__card-stat-label">{__('In')}</span>
            <span className="stream-metrics__card-stat-value">{formatBps(tp.in_bps)}</span>
          </div>
        )}

        {tp && (
          <div className="stream-metrics__card-stat">
            <span className="stream-metrics__card-stat-label">{__('Out')}</span>
            <span className="stream-metrics__card-stat-value">{formatBps(tp.out_bps)}</span>
          </div>
        )}

        {viewers && (viewers.llhls > 0 || viewers.webrtc > 0) && (
          <div className="stream-metrics__card-stat stream-metrics__card-stat--wide">
            <span className="stream-metrics__card-stat-label">{__('Viewers')}</span>
            <span className="stream-metrics__card-stat-value">
              {viewers.llhls} LLHLS / {viewers.webrtc} WebRTC
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main component ---

export default function LivestreamMetrics(props: Props) {
  const { metrics, mode, className } = props;

  if (!metrics) return null;

  const wrapClass = className ? `${className}` : undefined;

  switch (mode) {
    case 'compact':
      return (
        <div className={wrapClass}>
          <CompactMetrics metrics={metrics} />
        </div>
      );
    case 'overlay':
      return (
        <div className={wrapClass}>
          <OverlayMetrics metrics={metrics} />
        </div>
      );
    case 'full':
      return (
        <div className={wrapClass}>
          <FullMetrics metrics={metrics} />
        </div>
      );
    case 'card':
      return (
        <div className={wrapClass}>
          <CardMetrics metrics={metrics} />
        </div>
      );
    default:
      return null;
  }
}
