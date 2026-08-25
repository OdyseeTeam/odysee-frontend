import { beforeAll, describe, expect, it } from 'vite-plus/test';

let getInitialQualityLevelIndex: any;
let getQualityHeight: any;
let snapHeight: any;

// Landscape ladder, as an hls manifest usually orders it: lowest bitrate first.
const LADDER = [
  { width: 256, height: 144, bitrate: 200_000 },
  { width: 640, height: 360, bitrate: 800_000 },
  { width: 854, height: 480, bitrate: 1_400_000 },
  { width: 1280, height: 720, bitrate: 2_800_000 },
  { width: 1920, height: 1080, bitrate: 5_000_000 },
];

beforeAll(async () => {
  const quality = await import('../../ui/component/viewers/videoViewer/internal/quality');
  getInitialQualityLevelIndex = quality.getInitialQualityLevelIndex;
  getQualityHeight = quality.getQualityHeight;
  snapHeight = quality.snapHeight;
});

describe('getInitialQualityLevelIndex', () => {
  it('picks the highest level at or below the requested height', () => {
    expect(getInitialQualityLevelIndex(LADDER, '480')).toBe(2);
    expect(getInitialQualityLevelIndex(LADDER, '720')).toBe(3);
  });

  it('accepts a number as readily as a string', () => {
    expect(getInitialQualityLevelIndex(LADDER, 360)).toBe(1);
  });

  it('picks an exact match rather than the next one down', () => {
    expect(getInitialQualityLevelIndex(LADDER, '1080')).toBe(4);
  });

  it('falls back to the lowest level when every level exceeds the request', () => {
    expect(getInitialQualityLevelIndex(LADDER, '90')).toBe(0);
  });

  it('measures portrait levels by their shorter side', () => {
    // A 1080x1920 vertical video is 1080p, so asking for 720 must step down.
    const portrait = [
      { width: 360, height: 640, bitrate: 500_000 },
      { width: 720, height: 1280, bitrate: 2_000_000 },
      { width: 1080, height: 1920, bitrate: 4_000_000 },
    ];
    expect(getInitialQualityLevelIndex(portrait, '720')).toBe(1);
    expect(getInitialQualityLevelIndex(portrait, '360')).toBe(0);
  });

  it('returns null for preferences that are not a pixel height', () => {
    expect(getInitialQualityLevelIndex(LADDER, 'auto')).toBe(null);
    expect(getInitialQualityLevelIndex(LADDER, 'original')).toBe(null);
    expect(getInitialQualityLevelIndex(LADDER, null)).toBe(null);
    expect(getInitialQualityLevelIndex(LADDER, '0')).toBe(null);
  });

  it('returns null when there are no levels to choose from', () => {
    expect(getInitialQualityLevelIndex([], '480')).toBe(null);
    expect(getInitialQualityLevelIndex(undefined, '480')).toBe(null);
  });

  it('ignores levels carrying no usable dimensions', () => {
    const withJunk = [{ bitrate: 100 }, { width: 640, height: 360, bitrate: 800_000 }];
    expect(getInitialQualityLevelIndex(withJunk, '480')).toBe(1);
  });
});

describe('quality height helpers', () => {
  it('reads landscape height and portrait width', () => {
    expect(getQualityHeight({ width: 1280, height: 720 })).toBe(720);
    expect(getQualityHeight({ width: 1080, height: 1920 })).toBe(1080);
    expect(getQualityHeight(null)).toBe(0);
  });

  it('snaps odd heights up to the nearest common rung', () => {
    expect(snapHeight(718)).toBe(720);
    expect(snapHeight(720)).toBe(720);
    expect(snapHeight(1081)).toBe(1440);
  });
});
