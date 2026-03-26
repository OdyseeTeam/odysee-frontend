import { LIVESTREAM_SERVER_API } from 'config';

// -- Types --

export type StreamMetricsVideo = {
  codec: string;
  width: number;
  height: number;
  framerate: number;
  bitrate: string;
};

export type StreamMetricsAudio = {
  codec: string;
  bitrate: string;
  samplerate: number;
  channels: number;
};

export type StreamMetricsThroughput = {
  in_bps: number;
  out_bps: number;
  avg_in_bps: number;
  avg_out_bps: number;
};

export type StreamMetricsViewers = {
  total: number;
  llhls: number;
  webrtc: number;
};

export type StreamMetrics = {
  live: boolean;
  source_type?: string;
  video?: StreamMetricsVideo;
  audio?: StreamMetricsAudio;
  throughput?: StreamMetricsThroughput;
  viewers?: StreamMetricsViewers;
};

// -- Fetch --

export async function fetchStreamMetrics(
  channelClaimId: string,
  channelName: string,
  signature: string,
  signingTs: string,
  signal?: AbortSignal
): Promise<StreamMetrics | null> {
  if (!LIVESTREAM_SERVER_API || !channelClaimId || !signature || !signingTs) return null;

  const encodedName = encodeURIComponent(channelName);
  const url =
    `${LIVESTREAM_SERVER_API}/stream/metrics` +
    `?channel_claim_id=${channelClaimId}` +
    `&channel_name=${encodedName}` +
    `&signature=${signature}` +
    `&signature_ts=${signingTs}`;

  try {
    const res = await fetch(url, { method: 'POST', signal });
    if (res.status === 503) return null; // OME not configured
    if (!res.ok) return null;
    const data: StreamMetrics = await res.json();
    return data;
  } catch {
    return null;
  }
}

// -- Formatting helpers --

export function formatBps(bps: number | undefined): string {
  if (bps == null) return '--';
  const kbps = bps / 1000;
  if (kbps >= 1000) return `${(kbps / 1000).toFixed(1)} Mbps`;
  return `${Math.round(kbps)} kbps`;
}

export function formatResolution(video: StreamMetricsVideo | undefined): string {
  if (!video) return '--';
  const h = video.height;
  if (h >= 2160) return '4K';
  if (h >= 1440) return '1440p';
  if (h >= 1080) return '1080p';
  if (h >= 720) return '720p';
  if (h >= 480) return '480p';
  if (h >= 360) return '360p';
  return `${h}p`;
}

export function formatCodec(codec: string | undefined): string {
  if (!codec) return '--';
  const upper = codec.toUpperCase();
  if (upper === 'H264') return 'H.264';
  if (upper === 'H265' || upper === 'HEVC') return 'H.265';
  if (upper === 'VP8') return 'VP8';
  if (upper === 'VP9') return 'VP9';
  if (upper === 'AV1') return 'AV1';
  return codec;
}

export function formatAudioBitrate(audio: StreamMetricsAudio | undefined): string {
  if (!audio?.bitrate) return '--';
  const kbps = parseInt(audio.bitrate, 10) / 1000;
  return `${Math.round(kbps)} kbps`;
}

export function formatVideoBitrate(video: StreamMetricsVideo | undefined): string {
  if (!video?.bitrate) return '--';
  const kbps = parseInt(video.bitrate, 10) / 1000;
  if (kbps >= 1000) return `${(kbps / 1000).toFixed(1)} Mbps`;
  return `${Math.round(kbps)} kbps`;
}

export function formatSourceType(sourceType: string | undefined): string {
  if (!sourceType) return '--';
  const lower = sourceType.toLowerCase();
  if (lower === 'rtmp') return 'RTMP';
  if (lower === 'webrtc') return 'WebRTC';
  if (lower === 'srt') return 'SRT';
  return sourceType;
}
