/** Presets for browser WHIP / WebRTC publishing (getUserMedia + outbound RTP caps). */

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
      facingMode: "user",
    },
    // 480p: 1.5 Mbps (OBS default for 480p is ~1-2 Mbps)
    maxVideoBitrateBps: 1_500_000,
    maxVideoFramerate: 30,
  },
  balanced: {
    label: "720p",
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
      facingMode: "user",
    },
    // 720p: 2.5 Mbps (OBS default for 720p is ~3-4.5 Mbps)
    maxVideoBitrateBps: 2_500_000,
    maxVideoFramerate: 30,
  },
  hd: {
    label: "1080p",
    video: {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30 },
      facingMode: "user",
    },
    // 1080p: 4 Mbps (OBS default for 1080p is ~4.5-6 Mbps)
    maxVideoBitrateBps: 4_000_000,
    maxVideoFramerate: 30,
  },
};

export function getWebrtcPublishVideoConstraints(
  presetId: WebrtcPublishPresetId,
): MediaTrackConstraints {
  return WEBRTC_PUBLISH_PRESETS[presetId].video;
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
