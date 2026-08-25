// Shared between the player, which needs to pick a level before the first
// fragment loads, and the skin, which labels the quality menu.

const COMMON_HEIGHTS = [144, 240, 360, 480, 720, 1080, 1440, 2160, 4320];

export function snapHeight(h: number) {
  for (const c of COMMON_HEIGHTS) {
    if (h <= c) return c;
  }
  return h;
}

// Portrait streams (height > width) are described by their shorter dimension, so
// a 1080x1920 vertical video reads as 1080p rather than 1920p.
export function getQualityHeight(level: any) {
  return level?.width && level?.height && level.height > level.width ? level.width : level?.height || 0;
}

/**
 * Index of the highest level at or below `defaultQuality`, or the lowest level
 * available when every level is above it. Returns null when the preference is
 * not a pixel height (auto, original) or no levels carry usable dimensions.
 */
export function getInitialQualityLevelIndex(levels: any, defaultQuality: any): number | null {
  const targetHeight = Number(defaultQuality);
  if (!Number.isFinite(targetHeight) || targetHeight <= 0 || !levels?.length) {
    return null;
  }

  const candidates = levels
    .map((level: any, index: number) => ({
      index,
      height: getQualityHeight(level),
      bitrate: level?.bitrate || 0,
    }))
    .filter((level: any) => level.height > 0)
    .sort((a: any, b: any) => {
      if (b.height !== a.height) return b.height - a.height;
      return b.bitrate - a.bitrate;
    });

  return (
    candidates.find((level: any) => level.height <= targetHeight)?.index ??
    candidates[candidates.length - 1]?.index ??
    null
  );
}
