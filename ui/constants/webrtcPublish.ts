/** Presets for browser WHIP / WebRTC publishing (getUserMedia + outbound RTP caps). */
import { platform } from 'util/platform';

export type WebrtcPublishPresetId = "data_saver" | "balanced" | "hd";
export type WebrtcPublishVideoCodecPreference =
  | "auto"
  | "hevc"
  | "vp9"
  | "av1"
  | "h264";

export const WEBRTC_PUBLISH_PRESET_ORDER: WebrtcPublishPresetId[] = [
  "data_saver",
  "balanced",
  "hd",
];
export const WEBRTC_PUBLISH_VIDEO_CODEC_ORDER: WebrtcPublishVideoCodecPreference[] =
  ["auto", "hevc", "vp9", "av1", "h264"];

export const WEBRTC_PUBLISH_PRESETS: Record<
  WebrtcPublishPresetId,
  {
    video: MediaTrackConstraints;
    label: string;
    /** Encoder bitrate cap (bps). Set high enough that the encoder doesn't downscale. */
    maxVideoBitrateBps: number;
    maxVideoFramerate: number;
  }
> = {
  data_saver: {
    label: "480p",
    video: {
      width: { ideal: 854 },
      height: { ideal: 480 },
      frameRate: { ideal: 30 },
    },
    // 480p: 2 Mbps leaves more headroom for motion-heavy livestreams.
    maxVideoBitrateBps: 2_000_000,
    maxVideoFramerate: 30,
  },
  balanced: {
    label: "720p",
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
    },
    // 720p: 4 Mbps gives the encoder enough headroom to keep framerate up.
    maxVideoBitrateBps: 4_000_000,
    maxVideoFramerate: 30,
  },
  hd: {
    label: "1080p",
    video: {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30 },
    },
    // 1080p: 8 Mbps is a more realistic cap for high-motion live video.
    maxVideoBitrateBps: 8_000_000,
    maxVideoFramerate: 30,
  },
};

export function getWebrtcPublishVideoConstraints(
  presetId: WebrtcPublishPresetId,
): MediaTrackConstraints {
  const video = { ...WEBRTC_PUBLISH_PRESETS[presetId].video };

  if (platform.isMobile()) {
    video.facingMode = 'user';
  }

  return video;
}

export function getWebrtcPublishEncodingOptions(
  presetId: WebrtcPublishPresetId,
): {
  maxVideoBitrateBps: number;
  maxVideoFramerate: number;
} {
  const p = WEBRTC_PUBLISH_PRESETS[presetId];
  return {
    maxVideoBitrateBps: p.maxVideoBitrateBps,
    maxVideoFramerate: p.maxVideoFramerate,
  };
}

export function getWebrtcPublishVideoCodecLabel(
  codecPreference: WebrtcPublishVideoCodecPreference,
): string {
  switch (codecPreference) {
    case "hevc":
      return "HEVC";
    case "vp9":
      return "VP9";
    case "av1":
      return "AV1";
    case "h264":
      return "H.264";
    case "auto":
    default:
      return "Auto";
  }
}
