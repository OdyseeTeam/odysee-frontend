import { ODYSEE_HYPERBEAM_NODE_API } from 'config';

export const HYPERBEAM_DEVICE = {
  claim: '~lbry-claim@1.0',
  channel: '~lbry-channel@1.0',
  comment: '~odysee-comment@1.0',
  internalApis: '~odysee-internal-apis@1.0',
  livestream: '~odysee-livestream@1.0',
  productEvents: '~odysee-product-events@1.0',
  search: '~odysee-search@1.0',
  stream: '~lbry-stream@1.0',
};

export function hyperbeamNodeBase() {
  return String(ODYSEE_HYPERBEAM_NODE_API || '').replace(/\/+$/, '');
}

export function hyperbeamDeviceBase(device: string) {
  const base = hyperbeamNodeBase();
  return base ? `${base}/${device}` : '';
}

export function hyperbeamDeviceUrl(device: string, key: string, params: Record<string, string>) {
  const base = hyperbeamDeviceBase(device);
  if (!base) return '';

  const query = Object.entries(params)
    .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
    .join('&');
  return `${base}/${key}${query ? `?${query}` : ''}`;
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
