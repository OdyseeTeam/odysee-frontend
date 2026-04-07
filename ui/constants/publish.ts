export const LANG_NONE = 'none';
export const PAYWALL = Object.freeze({
  // const version of Paywall type. Values must match.
  FREE: 'free',
  USDC: 'usdc',
  FIAT: 'fiat',
  SDK: 'sdk',
});
export const NO_FILE = '---';
export const BITRATE = Object.freeze({
  RECOMMENDED: 9500000,
  MAX: 19500000,
});
export const PIPELINE_CONCURRENCY = Object.freeze({
  converting: 1,
  optimizing: 1,
  uploading: 3,
});
