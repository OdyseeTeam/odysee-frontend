const { ODYSEE_HYPERBEAM_NODE_API } = require('../../config.cjs');

const HYPERBEAM_NODE_TIMEOUT_MS = 15000;

function hyperbeamNodeBase() {
  return (ODYSEE_HYPERBEAM_NODE_API || '').replace(/\/+$/, '');
}

function hyperbeamNodeConfigured() {
  return Boolean(hyperbeamNodeBase());
}

function hyperbeamNodePath(key, uri) {
  const base = deviceBase(key === 'media' ? '~lbry-stream@1.0' : '~lbry-claim@1.0');
  if (!base) return '';

  return `${base}/${key}?uri64=${encodeURIComponent(base64Url(uri))}`;
}

function deviceBase(device) {
  const base = hyperbeamNodeBase();
  return base ? `${base}/${device}` : '';
}

function methodDevice(method) {
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
  )
    return '~lbry-claim@1.0';
  if (['channel_list', 'channel_sign'].includes(method)) return '~lbry-channel@1.0';
  if (['stream_list', 'blob_list'].includes(method)) return '~lbry-stream@1.0';
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
  )
    return '~odysee-comment@1.0';
  if (['search', 'recsys_fyp', 'recsys_entry'].includes(method)) return '~odysee-search@1.0';
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
  )
    return '~odysee-product-events@1.0';
  if (['livestream', 'livestream_whip'].includes(method)) return '~odysee-livestream@1.0';
  return '~odysee-internal-apis@1.0';
}

function hyperbeamNodeJsonPath(key, paramName, value) {
  const base = deviceBase(methodDevice(key));
  if (!base) return '';

  const encoded = base64Url(JSON.stringify(value));
  return {
    body: { [paramName]: encoded },
    postUrl: `${base}/${key}`,
    url: `${base}/${key}?${paramName}=${encodeURIComponent(encoded)}`,
  };
}

function base64Url(value) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function hyperbeamNodeRequestHeaders(extraHeaders) {
  const headers = { accept: 'application/json' };
  ['X-Lbry-Auth-Token', 'X-Odysee-User-Id', 'Authorization'].forEach((key) => {
    const value = extraHeaders && extraHeaders[key];
    if (value) headers[key] = value;
  });
  return headers;
}

async function resolveHyperbeamNodeUri(uri, extraHeaders) {
  if (!ODYSEE_HYPERBEAM_NODE_API) return null;

  const url = hyperbeamNodePath('resolve', uri);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HYPERBEAM_NODE_TIMEOUT_MS);
  let response;

  try {
    response = await fetch(url, {
      method: 'GET',
      headers: hyperbeamNodeRequestHeaders(extraHeaders),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function hyperbeamNodeResolve(params, extraHeaders) {
  if (!ODYSEE_HYPERBEAM_NODE_API) return null;

  const urls = Array.isArray(params?.urls) ? params.urls : params?.urls ? [params.urls] : [];
  if (!urls.length) return null;

  return hyperbeamNodeFetchJson(hyperbeamNodeJsonPath('resolve', 'urls64', urls), extraHeaders);
}

async function hyperbeamNodeClaimSearch(params, extraHeaders) {
  if (!ODYSEE_HYPERBEAM_NODE_API) return null;

  return hyperbeamNodeFetchJson(hyperbeamNodeJsonPath('claim_search', 'params64', params || {}), extraHeaders);
}

async function hyperbeamNodeSdkCall(method, params, extraHeaders) {
  if (!ODYSEE_HYPERBEAM_NODE_API) return null;

  const base = deviceBase(methodDevice(method));
  const encoded = base64Url(JSON.stringify(params || {}));
  return hyperbeamNodeFetchJson(
    {
      body: { params64: encoded },
      postUrl: `${base}/${method}`,
      url: `${base}/${method}?params64=${encodeURIComponent(encoded)}`,
    },
    extraHeaders
  );
}

async function hyperbeamNodeFetchJson(request, extraHeaders) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HYPERBEAM_NODE_TIMEOUT_MS);
  const url = typeof request === 'string' ? request : request.url;
  const usePost = typeof request === 'object' && url.length > 1800;
  const fetchUrl = usePost ? request.postUrl || url.split('?')[0] : url;

  try {
    const response = await fetch(fetchUrl, {
      method: usePost ? 'POST' : 'GET',
      headers: {
        ...hyperbeamNodeRequestHeaders(extraHeaders),
        ...(usePost ? { 'content-type': 'application/json' } : {}),
      },
      ...(usePost ? { body: JSON.stringify(request.body) } : {}),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HyperBEAM device ${response.status}`);
    }

    return response.json().then(unwrapJsonRpcResult);
  } finally {
    clearTimeout(timeout);
  }
}

function unwrapJsonRpcResult(json) {
  if (json?.error) {
    throw new Error(json.error.message || json.error);
  }

  return json && Object.prototype.hasOwnProperty.call(json, 'result') ? json.result : json;
}

function hyperbeamNodeMediaUrl(uri) {
  if (!ODYSEE_HYPERBEAM_NODE_API) return '';
  return hyperbeamNodePath('media', uri);
}

module.exports = {
  hyperbeamNodeConfigured,
  hyperbeamNodeClaimSearch,
  hyperbeamNodeMediaUrl,
  hyperbeamNodeResolve,
  hyperbeamNodeSdkCall,
  resolveHyperbeamNodeUri,
};
