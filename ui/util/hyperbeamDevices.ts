import { ODYSEE_HYPERBEAM_NODE_API } from 'config';
import { isHyperbeamDeviceEnabled } from 'util/hyperbeamMode';

export const HYPERBEAM_DEVICE = {
  claim: '~lbry-claim@1.0',
  channel: '~lbry-channel@1.0',
  comment: '~odysee-comment@1.0',
  internalApis: '~odysee-internal-apis@1.0',
  livestream: '~odysee-livestream@1.0',
  productEvents: '~odysee-product-events@1.0',
  search: '~odysee-search@1.0',
  stream: '~lbry-stream@1.0',
  streamDescriptor: '~lbry-stream-descriptor@1.0',
};

export function hyperbeamNodeBase() {
  return String(ODYSEE_HYPERBEAM_NODE_API || '').replace(/\/+$/, '');
}

export function hyperbeamDeviceBase(device: string) {
  const base = hyperbeamNodeBase();
  return base && isHyperbeamDeviceEnabled(device) ? `${base}/${device}` : '';
}

export function hyperbeamDeviceUrl(device: string, key: string, params: Record<string, string>) {
  const base = hyperbeamDeviceBase(device);
  if (!base) return '';

  const query = Object.entries(params)
    .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
    .join('&');
  return `${base}/${key}${query ? `?${query}` : ''}`;
}

export function base64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function hyperbeamDevicePostJson(
  device: string,
  key: string,
  body: Record<string, any>,
  headers: Record<string, string> = {}
) {
  const base = hyperbeamDeviceBase(device);
  if (!base) return null;

  return fetch(`${base}/${key}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

export function hyperbeamDevicePostParams64(
  device: string,
  key: string,
  value: any,
  headers: Record<string, string> = {},
  paramName = 'params64'
) {
  return hyperbeamDevicePostJson(device, key, { [paramName]: base64Url(JSON.stringify(value || {})) }, headers);
}

export function hyperbeamMethodDevice(method: string) {
  if (
    [
      'resolve',
      'claim_search',
      'get',
      'collection_resolve',
      'collection_list',
      'claim_list',
      'support_list',
      'transaction_show',
      'file_list',
      'purchase_list',
      'txo_list',
    ].includes(method)
  ) {
    return HYPERBEAM_DEVICE.claim;
  }

  if (['channel_list', 'channel_sign'].includes(method)) {
    return HYPERBEAM_DEVICE.channel;
  }

  if (['stream_list', 'blob_list'].includes(method)) {
    return HYPERBEAM_DEVICE.stream;
  }

  if (
    [
      'comment_list',
      'comment_by_id',
      'comment_get_channel_from_comment_id',
      'reaction_list',
      'setting_get',
      'setting_list',
      'commentron',
    ].includes(method)
  ) {
    return HYPERBEAM_DEVICE.comment;
  }

  if (['livestream', 'livestream_whip'].includes(method)) {
    return HYPERBEAM_DEVICE.livestream;
  }

  if (['search', 'recsys_fyp', 'recsys_entry'].includes(method)) {
    return HYPERBEAM_DEVICE.search;
  }

  if (
    [
      'short_url',
      'watchman_playback',
      'metric_ui',
      'report_content',
      'publish_v4',
      'publish_v4_tus',
      'thumbnail_upload',
    ].includes(method)
  ) {
    return HYPERBEAM_DEVICE.productEvents;
  }

  return HYPERBEAM_DEVICE.internalApis;
}
