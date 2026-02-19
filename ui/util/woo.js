// @flow
import sha256 from 'crypto-js/sha256';

export const WOO_YTID_REGEX = /^[A-Za-z0-9_-]{11}$/;
export const WOO_YTID_PATH_PARAM_PATTERN = '[A-Za-z0-9_-]{11}';
export const WOO_ROUTE_PATH_PATTERN = `/$/:ytId(${WOO_YTID_PATH_PARAM_PATTERN})`;
const WOO_TYPE_SHORT = 'short';
const WOO_TYPE_SHORTS = 'shorts';
const WOO_TYPE_LIVE = 'live';
const WOO_PATH_REGEX = new RegExp(`^/\\$/(${WOO_YTID_PATH_PARAM_PATTERN})/?$`);
const RESERVED_WOO_PATH_SEGMENTS = new Set(['memberships']);
const WOO_URI_PREFIX = 'lbry://w00-';
const WOO_CLAIM_ID_PREFIX = 'w00';
const WOO_CLAIM_ID_LENGTH = 40;
const WOO_YTID_HEX_LENGTH = 22; // 11-byte YouTube ID as ASCII hex
const WOO_CLAIM_ID_CHECKSUM_LENGTH = WOO_CLAIM_ID_LENGTH - WOO_CLAIM_ID_PREFIX.length - WOO_YTID_HEX_LENGTH;
const WOO_TIMESTAMP_HMS_REGEX = /^\d+(?::\d{1,2}){1,2}$/;
const WOO_TIMESTAMP_TOKEN_REGEX = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i;

export type WooContentType = 'short' | 'live';

function asciiToHex(input: string): string {
  let hex = '';

  for (let i = 0; i < input.length; i++) {
    const part = input.charCodeAt(i).toString(16);
    hex += part.length === 1 ? `0${part}` : part;
  }

  return hex;
}

function hexToAscii(hex: string): ?string {
  if (!hex || hex.length % 2 !== 0) return null;

  let output = '';
  for (let i = 0; i < hex.length; i += 2) {
    const byte = parseInt(hex.slice(i, i + 2), 16);
    if (Number.isNaN(byte)) return null;
    output += String.fromCharCode(byte);
  }

  return output;
}

export function getYtIdFromWooPath(pathname: ?string): ?string {
  if (!pathname) return null;

  const match = pathname.match(WOO_PATH_REGEX);
  if (!match) return null;

  const ytId = match[1];
  if (RESERVED_WOO_PATH_SEGMENTS.has(ytId)) {
    return null;
  }

  return ytId;
}

export function isWooPath(pathname: ?string): boolean {
  return Boolean(getYtIdFromWooPath(pathname));
}

export function buildWooUriFromYtId(ytId: string): string {
  return `${WOO_URI_PREFIX}${ytId}`;
}

export function buildWooWebPathFromYtId(ytId: string): string {
  return `/$/${ytId}`;
}

export function getWooYtIdFromUri(uri: ?string): ?string {
  if (!uri || !uri.startsWith(WOO_URI_PREFIX)) return null;

  const ytId = uri.slice(WOO_URI_PREFIX.length);
  return WOO_YTID_REGEX.test(ytId) ? ytId : null;
}

export function buildWooClaimIdFromYtId(ytId: string): string {
  const ytHex = asciiToHex(ytId);
  const checksum = sha256(ytId).toString().slice(0, WOO_CLAIM_ID_CHECKSUM_LENGTH);
  return `${WOO_CLAIM_ID_PREFIX}${ytHex}${checksum}`;
}

export function getWooYtIdFromClaimId(claimId: ?string): ?string {
  if (!claimId || !claimId.startsWith(WOO_CLAIM_ID_PREFIX) || claimId.length !== WOO_CLAIM_ID_LENGTH) {
    return null;
  }

  const ytHexStart = WOO_CLAIM_ID_PREFIX.length;
  const ytHexEnd = ytHexStart + WOO_YTID_HEX_LENGTH;
  const ytHex = claimId.slice(ytHexStart, ytHexEnd);
  const checksum = claimId.slice(ytHexEnd);
  const ytId = hexToAscii(ytHex);

  if (!ytId || !WOO_YTID_REGEX.test(ytId)) {
    return null;
  }

  const expectedChecksum = sha256(ytId).toString().slice(0, WOO_CLAIM_ID_CHECKSUM_LENGTH);
  if (checksum !== expectedChecksum) {
    return null;
  }

  return ytId;
}

export function isWooClaimId(claimId: ?string): boolean {
  return Boolean(getWooYtIdFromClaimId(claimId));
}

export function getWooType(typeParam: ?string): ?WooContentType {
  if (!typeParam) return null;

  const normalized = typeParam.trim().toLowerCase();
  if (normalized === WOO_TYPE_SHORTS) return WOO_TYPE_SHORT;
  if (normalized === WOO_TYPE_SHORT) return WOO_TYPE_SHORT;
  if (normalized === WOO_TYPE_LIVE) return WOO_TYPE_LIVE;

  return null;
}

export function parseWooTimestampToSeconds(timestamp: ?string): ?number {
  if (!timestamp) return null;

  const normalized = timestamp.trim().toLowerCase();
  if (!normalized) return null;

  if (/^\d+$/.test(normalized)) {
    const seconds = parseInt(normalized, 10);
    return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
  }

  if (WOO_TIMESTAMP_HMS_REGEX.test(normalized)) {
    const parts = normalized.split(':').map((part) => parseInt(part, 10));
    if (parts.some((part) => Number.isNaN(part) || part < 0)) return null;

    const sec = parts[parts.length - 1];
    const min = parts.length > 1 ? parts[parts.length - 2] : 0;
    if (sec >= 60 || min >= 60) return null;

    return parts.reduce((total, value) => total * 60 + value, 0);
  }

  const match = normalized.match(WOO_TIMESTAMP_TOKEN_REGEX);
  if (!match) return null;

  const [, hRaw, mRaw, sRaw] = match;
  if (!hRaw && !mRaw && !sRaw) return null;

  const hours = hRaw ? parseInt(hRaw, 10) : 0;
  const minutes = mRaw ? parseInt(mRaw, 10) : 0;
  const seconds = sRaw ? parseInt(sRaw, 10) : 0;

  if ([hours, minutes, seconds].some((value) => Number.isNaN(value) || value < 0)) return null;

  return hours * 3600 + minutes * 60 + seconds;
}
