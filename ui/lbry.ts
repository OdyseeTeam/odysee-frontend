import analytics from 'analytics';
import { FETCH_TIMEOUT, SDK_FETCH_TIMEOUT } from 'constants/errors';
import { NO_AUTH, X_LBRY_AUTH_TOKEN } from 'constants/token';
import fetchWithTimeout from 'util/fetch';
import { PROXY_URL_NO_CF } from 'config';
import { getAuthToken } from 'util/saved-passwords';
import {
  HYPERBEAM_DEVICE,
  hyperbeamNodeBase,
  hyperbeamSdkPostParams64,
  isHyperbeamMethodEnabled,
} from 'util/hyperbeamDevices';
import { isHyperbeamFullMode, shouldSendHyperbeamAuthHeaders } from 'util/hyperbeamMode';

import 'proxy-polyfill';

const CHECK_DAEMON_STARTED_TRY_NUMBER = 200;
const ERR_LOG_METHOD_WHITELIST = ['support_create'];
// Basic LBRY sdk connection config
// Offers a proxy to call LBRY sdk methods
const Lbry: LbryTypes = {
  isConnected: false,
  connectPromise: null,
  daemonConnectionString: 'http://localhost:5279',
  alternateConnectionString: PROXY_URL_NO_CF,
  methodsUsingAlternateConnectionString: ['txo_list'],
  methodsWithNoArtificialTimeout: ['txo_list'],
  apiRequestHeaders: {
    'Content-Type': 'application/json-rpc',
  },
  // Allow overriding daemon connection string (e.g. to `/api/proxy` for lbryweb)
  setDaemonConnectionString: (value: string) => {
    Lbry.daemonConnectionString = value;
  },
  setApiHeader: (key: string, value: string) => {
    Lbry.apiRequestHeaders = Object.assign(Lbry.apiRequestHeaders, {
      [key]: value,
    });
  },
  unsetApiHeader: (key) => {
    Object.keys(Lbry.apiRequestHeaders).includes(key) && delete Lbry.apiRequestHeaders[key];
  },
  // Allow overriding Lbry methods
  overrides: {},
  setOverride: (methodName, newMethod) => {
    Lbry.overrides[methodName] = newMethod;
  },
  getApiRequestHeaders: () => Lbry.apiRequestHeaders,
  // Returns a human readable media type based on the content type or extension of a file that is returned by the sdk
  getMediaType: (contentType: string | null | undefined, fileName: string | null | undefined) => {
    if (fileName) {
      const formats = [
        [/\.(mp4|m4v|webm|flv|f4v|ogv)$/i, 'video'],
        [/\.(mp3|m4a|aac|wav|flac|ogg|opus)$/i, 'audio'],
        [/\.(jpeg|jpg|png|gif|svg|webp)$/i, 'image'],
        [/\.(h|go|ja|java|js|jsx|c|cpp|cs|css|rb|scss|sh|php|py)$/i, 'script'],
        [/\.(html|json|csv|txt|log|md|markdown|docx|pdf|xml|yml|yaml)$/i, 'document'],
        [/\.(pdf|odf|doc|docx|epub|org|rtf)$/i, 'e-book'],
        [/\.(stl|obj|fbx|gcode)$/i, '3D-file'],
        [/\.(cbr|cbt|cbz)$/i, 'comic-book'],
        [/\.(lbry)$/i, 'application'],
      ];
      const res = formats.reduce((ret, testpair) => {
        switch ((testpair[0] as RegExp).test(ret)) {
          case true:
            return testpair[1];

          default:
            return ret;
        }
      }, fileName);
      return res === fileName ? 'unknown' : res;
    } else if (contentType) {
      return /^[^/]+/.exec(contentType)[0];
    }

    return 'unknown';
  },
  //
  // Lbry SDK Methods
  // https://lbry.tech/api/sdk
  //
  status: (params = {}) => daemonCallWithResult('status', params),
  stop: () => daemonCallWithResult('stop', {}),
  version: () => daemonCallWithResult('version', {}),
  // Claim fetching and manipulation
  resolve: (params) => daemonCallWithResult('resolve', params, handleAuthentication),
  get: (params) => daemonCallWithResult('get', params),
  claim_search: (params) => daemonCallWithResult('claim_search', params, claimSearchParamHook),
  claim_list: (params) => daemonCallWithResult('claim_list', params),
  channel_create: (params) => daemonCallWithResult('channel_create', params),
  channel_update: (params) => daemonCallWithResult('channel_update', params),
  channel_import: (params) => daemonCallWithResult('channel_import', params),
  channel_list: (params) => daemonCallWithResult('channel_list', params),
  stream_abandon: (params) => daemonCallWithResult('stream_abandon', params),
  stream_list: (params) => daemonCallWithResult('stream_list', params),
  channel_abandon: (params) => daemonCallWithResult('channel_abandon', params),
  channel_sign: (params) => daemonCallWithResult('channel_sign', params),
  support_create: (params) => daemonCallWithResult('support_create', params),
  support_list: (params) => daemonCallWithResult('support_list', params),
  stream_repost: (params) => daemonCallWithResult('stream_repost', params),
  collection_resolve: (params) => daemonCallWithResult('collection_resolve', params),
  collection_list: (params) => daemonCallWithResult('collection_list', params),
  collection_create: (params) => daemonCallWithResult('collection_create', params),
  collection_update: (params) => daemonCallWithResult('collection_update', params),
  // File fetching and manipulation
  file_list: (params = {}) => daemonCallWithResult('file_list', params),
  file_delete: (params = {}) => daemonCallWithResult('file_delete', params),
  file_set_status: (params = {}) => daemonCallWithResult('file_set_status', params),
  blob_delete: (params = {}) => daemonCallWithResult('blob_delete', params),
  blob_list: (params = {}) => daemonCallWithResult('blob_list', params),
  file_reflect: (params = {}) => daemonCallWithResult('file_reflect', params),
  // Wallet utilities
  wallet_balance: (params = {}) => daemonCallWithResult('wallet_balance', params),
  wallet_decrypt: () => daemonCallWithResult('wallet_decrypt', {}),
  wallet_encrypt: (params = {}) => daemonCallWithResult('wallet_encrypt', params),
  wallet_unlock: (params = {}) => daemonCallWithResult('wallet_unlock', params),
  wallet_list: (params = {}) => daemonCallWithResult('wallet_list', params),
  wallet_send: (params = {}) => daemonCallWithResult('wallet_send', params),
  wallet_status: (params = {}) => daemonCallWithResult('wallet_status', params),
  address_is_mine: (params = {}) => daemonCallWithResult('address_is_mine', params),
  address_unused: (params = {}) => daemonCallWithResult('address_unused', params),
  address_list: (params = {}) => daemonCallWithResult('address_list', params),
  transaction_list: (params = {}) => daemonCallWithResult('transaction_list', params),
  utxo_release: (params = {}) => daemonCallWithResult('utxo_release', params),
  support_abandon: (params = {}) => daemonCallWithResult('support_abandon', params),
  purchase_list: (params = {}) => daemonCallWithResult('purchase_list', params),
  txo_list: (params = {}) => daemonCallWithResult('txo_list', params),
  account_list: (params = {}) => daemonCallWithResult('account_list', params),
  account_set: (params = {}) => daemonCallWithResult('account_set', params),
  sync_hash: (params = {}) => daemonCallWithResult('sync_hash', params),
  sync_apply: (params = {}) => daemonCallWithResult('sync_apply', params),
  sync_get: (params = {}) => daemonCallWithResult('sync_get', params),
  sync_set: (params = {}) => daemonCallWithResult('sync_set', params),
  // Preferences
  preference_get: (params = {}) => daemonCallWithResult('preference_get', params),
  preference_set: (params = {}) => daemonCallWithResult('preference_set', params),
  // Comments
  comment_list: (params = {}) => daemonCallWithResult('comment_list', params),
  comment_create: (params = {}) => daemonCallWithResult('comment_create', params),
  comment_hide: (params = {}) => daemonCallWithResult('comment_hide', params),
  comment_abandon: (params = {}) => daemonCallWithResult('comment_abandon', params),
  comment_update: (params = {}) => daemonCallWithResult('comment_update', params),
  // Desktop only?
  ffmpeg_find: (params = {}) => daemonCallWithResult('ffmpeg_find', params),
  settings_get: (params?: {}) => daemonCallWithResult('settings_get', params),
  settings_set: (params: {}) => daemonCallWithResult('settings_set', params),
  settings_clear: (params?: {}) => daemonCallWithResult('settings_clear', params),
  // Connect to the sdk
  connect: () => {
    if (Lbry.connectPromise === null) {
      Lbry.connectPromise = new Promise((resolve, reject) => {
        let tryNum = 0;

        // Check every half second to see if the daemon is accepting connections
        function checkDaemonStarted() {
          tryNum += 1;
          Lbry.status()
            .then(resolve)
            .catch(() => {
              if (tryNum <= CHECK_DAEMON_STARTED_TRY_NUMBER) {
                setTimeout(checkDaemonStarted, tryNum < 50 ? 400 : 1000);
              } else {
                reject(new Error('Unable to connect to LBRY'));
              }
            });
        }

        checkDaemonStarted();
      });
    }

    return Lbry.connectPromise;
  },
  publish: (params = {}) =>
    new Promise((resolve, reject) => {
      if (Lbry.overrides.publish) {
        Lbry.overrides.publish(params).then(resolve, reject);
      } else {
        apiCall('publish', params, resolve, reject);
      }
    }),
};
const ApiFailureMgr = {
  MAX_FAILED_ATTEMPTS: 5,
  MAX_FAILED_GAP_MS: 500,
  BLOCKED_DURATION_MS: 60000,
  METHODS_TO_LOG: ['claim_search'],
  // Can check all, but narrow do claim_search only for now.
  failureTimestamps: {},
  // { [key: string]: Array<timestamps: number> }
  logFailure: function (method: string, params: {} | null | undefined, timestamp: number) {
    if (this.isListedMethod(method)) {
      const key = this.getKey(method, params);
      const ts = this.failureTimestamps[key] || [];
      ts.push(timestamp);
      this.failureTimestamps[key] = ts;
    }
  },
  logSuccess: function (method: string, params: {} | null | undefined) {
    if (this.isListedMethod(method)) {
      const key = this.getKey(method, params);
      delete this.failureTimestamps[key];
    }
  },
  isFailingAndShouldDrop: function (method: string, params: {} | null | undefined) {
    if (this.isListedMethod(method)) {
      const key = this.getKey(method, params);
      const fts = this.failureTimestamps[key];

      if (fts && fts.length > this.MAX_FAILED_ATTEMPTS) {
        const ts2 = fts[fts.length - 1];
        const ts1 = fts[fts.length - this.MAX_FAILED_ATTEMPTS];
        const successivelyFailed = ts2 - ts1 < this.MAX_FAILED_GAP_MS;
        return successivelyFailed && Date.now() - ts2 < this.BLOCKED_DURATION_MS;
      }
    }

    return false;
  },
  getKey: function (method: string, params: {} | null | undefined) {
    return method + '/' + JSON.stringify(params || {});
  },
  isListedMethod: function (method: string) {
    return this.METHODS_TO_LOG.includes(method);
  },
};

/**
 * Returns a customized error message for known scenarios.
 */
function resolveFetchErrorMsg(method: string, response: Response | string) {
  if (typeof response === 'object') {
    // prettier-ignore
    switch (response.status) {
      case 504: // Gateway timeout

      case 524:
        // Cloudflare: a timeout occurred
        switch (method) {
          case 'publish':
            return __('[Publish]: Your action timed out, but may have been completed. Refresh and check your Uploads or Wallet page to confirm after a few minutes.');

          default:
            return `${method}: ${response.statusText} (${response.status})`;
        }

      default:
        return `${method}: ${response.statusText} (${response.status})`;
    }
  } else if (response === FETCH_TIMEOUT) {
    return `${method}: ${SDK_FETCH_TIMEOUT}`; // Don't translate as clients will do a string match.
  } else {
    return `${method}: fetch failed.`;
  }
}

function checkAndParse(response: Response, method: string) {
  if (!response.ok) {
    const errMsg = resolveFetchErrorMsg(method, response);
    throw Error(errMsg);
  }

  if (response.status >= 200 && response.status < 300) {
    return response.json();
  }

  return response
    .json()
    .then((json) => {
      if (json.error) {
        const errorMessage = typeof json.error === 'object' ? json.error.message : json.error;
        return Promise.reject(new Error(errorMessage));
      } else {
        return Promise.reject(new Error('Protocol error with unknown response signature'));
      }
    })
    .catch(() => {
      // If not parsable, throw the initial response rather than letting
      // the json failure ("unexpected token at..") pass through.
      return Promise.reject(new Error(`${method}: ${response.statusText} (${response.status}, JSON)`));
    });
}

export function apiCall(
  method: string,
  params: {} | null | undefined,
  resolve: (...args: Array<any>) => any,
  reject: (...args: Array<any>) => any
) {
  const nodeRead = hyperbeamNodeSdkCall(method, params);
  if (nodeRead) {
    return nodeRead.then(resolve, reject);
  }

  let apiRequestHeaders = Lbry.apiRequestHeaders;

  if (params && params[NO_AUTH]) {
    apiRequestHeaders = Object.assign({}, Lbry.apiRequestHeaders);
    delete apiRequestHeaders[X_LBRY_AUTH_TOKEN];
    delete params[NO_AUTH];
  }

  const counter = new Date().getTime();
  const options = {
    method: 'POST',
    headers: apiRequestHeaders,
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: counter,
    }),
  };

  if (ApiFailureMgr.isFailingAndShouldDrop(method, params)) {
    return Promise.reject('Dropped due to successive failures.');
  }

  const baseConnectionString = Lbry.methodsUsingAlternateConnectionString.includes(method)
    ? Lbry.alternateConnectionString
    : Lbry.daemonConnectionString;
  const connectionString = `${baseConnectionString}?m=${method}`;
  const SDK_FETCH_TIMEOUT_MS = 60000;
  const fetchPromise = Lbry.methodsWithNoArtificialTimeout.includes(method)
    ? fetch(connectionString, options)
    : fetchWithTimeout(SDK_FETCH_TIMEOUT_MS, fetch(connectionString, options));
  return fetchPromise
    .then((response) => checkAndParse(response as Response, method))
    .then((response) => {
      const error = response.error || (response.result && response.result.error);

      if (error) {
        ApiFailureMgr.logFailure(method, params, counter);
        return reject(error);
      } else {
        ApiFailureMgr.logSuccess(method, params);
        return resolve(response.result);
      }
    })
    .catch((err) => {
      ApiFailureMgr.logFailure(method, params, counter);

      if (err?.message === FETCH_TIMEOUT) {
        if (ERR_LOG_METHOD_WHITELIST.includes(method)) {
          analytics.error(`${method}: timed out after ${SDK_FETCH_TIMEOUT_MS / 1000}s`);
        }

        reject(resolveFetchErrorMsg(method, FETCH_TIMEOUT));
      } else {
        reject(err);
      }
    });
}

function hyperbeamNodeSdkCall(method: string, params: any): Promise<any> | null {
  const localFullModeResult = hyperbeamFullModeLocalSdkResult(method, params);
  if (localFullModeResult) {
    return localFullModeResult;
  }

  switch (method) {
    case 'resolve': {
      const urls = Array.isArray(params?.urls)
        ? params.urls
        : params?.urls
          ? [params.urls]
          : Array.isArray(params?.uris)
            ? params.uris
            : params?.uris
              ? [params.uris]
              : params?.uri
                ? [params.uri]
                : [];
      return urls.length ? hyperbeamNodeFetchJson('resolve', 'urls64', urls) : null;
    }
    case 'claim_search':
      return hyperbeamNodeFetchJson(
        'claim_search',
        'params64',
        stripHyperbeamNodeOnlyParams(claimSearchParamHook(params || {}))
      );
    case 'status':
    case 'version':
    case 'get':
    case 'collection_resolve':
    case 'collection_list':
    case 'claim_list':
    case 'channel_list':
    case 'channel_sign':
    case 'stream_list':
    case 'support_list':
    case 'transaction_show':
    case 'file_list':
    case 'blob_list':
    case 'wallet_balance':
    case 'wallet_list':
    case 'preference_get':
    case 'preference_set':
    case 'wallet_status':
    case 'wallet_unlock':
    case 'wallet_lock':
    case 'wallet_encrypt':
    case 'wallet_decrypt':
    case 'purchase_list':
    case 'account_list':
    case 'settings_get':
    case 'settings_set':
    case 'settings_clear':
    case 'ffmpeg_find':
    case 'address_is_mine':
    case 'address_unused':
    case 'address_list':
    case 'transaction_list':
    case 'txo_list':
    case 'sync_hash':
    case 'sync_apply':
    case 'sync_get':
    case 'sync_set':
      return hyperbeamNodeFetchJson(method, 'params64', stripHyperbeamNodeOnlyParams(params || {}));
    default:
      return null;
  }
}

export function debugHyperbeamNode(data: any) {
  if (isHyperbeamFullMode()) return;

  try {
    fetch(
      `${hyperbeamNodeBase()}/${HYPERBEAM_DEVICE.odysee}/sdk?method=debug&params64=${base64Url(JSON.stringify(data || {}))}`,
      {
        method: 'POST',
        headers: { accept: 'application/json' },
      }
    ).catch(() => {});
  } catch (e) {}
}

function stripHyperbeamNodeOnlyParams(params: Record<string, any>) {
  const clean = { ...params };
  delete clean[NO_AUTH];
  return clean;
}

function hyperbeamNodeFetchJson(key: string, paramName: string, value: any): Promise<any> | null {
  if (isHyperbeamFullMode()) {
    const request = hyperbeamSdkPostParams64(key, value, hyperbeamNodeRequestHeaders(), paramName);
    if (!request) return null;

    return fetchWithTimeout(60000, request).then((response: Response | string) => {
      if (typeof response !== 'object') {
        throw new Error(`${key}: HyperBEAM SDK fallback fetch failed`);
      }

      return checkAndParse(response, key).then(unwrapJsonRpcResult);
    });
  }

  if (!isHyperbeamMethodEnabled(key)) return null;

  const request = hyperbeamSdkPostParams64(key, value, hyperbeamNodeRequestHeaders(), paramName);
  if (!request) return null;

  return fetchWithTimeout(60000, request).then((response: Response | string) => {
    if (typeof response !== 'object') {
      throw new Error(`${key}: HyperBEAM SDK fallback fetch failed`);
    }

    return checkAndParse(response, key).then(unwrapJsonRpcResult);
  });
}

function hyperbeamNodeRequestHeaders() {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (!shouldSendHyperbeamAuthHeaders()) return headers;

  const savedAuthToken = getAuthToken();
  if (savedAuthToken) headers[X_LBRY_AUTH_TOKEN] = savedAuthToken;

  [X_LBRY_AUTH_TOKEN, 'X-Odysee-User-Id', 'Authorization'].forEach((key) => {
    const value = Lbry.apiRequestHeaders[key];
    if (value) headers[key] = value;
  });
  return headers;
}

function hasHyperbeamAuthToken() {
  return Boolean(getAuthToken() || Lbry.apiRequestHeaders[X_LBRY_AUTH_TOKEN]);
}

function hyperbeamFullModeLocalSdkResult(method: string, params: any): Promise<any> | null {
  if (!isHyperbeamFullMode()) return null;

  switch (method) {
    case 'channel_sign':
      return Promise.reject(new Error('channel_sign requires authentication'));
    case 'preference_get':
    case 'preference_set':
    case 'settings_get':
    case 'settings_set':
    case 'settings_clear':
    case 'sync_get':
    case 'sync_set':
    case 'sync_apply':
      return Promise.resolve({});
    case 'sync_hash':
      return Promise.resolve(null);
    case 'wallet_balance':
      return Promise.resolve({});
    case 'wallet_status':
      return Promise.resolve({ is_encrypted: false, is_locked: false });
    case 'wallet_list':
    case 'account_list':
    case 'channel_list':
    case 'collection_list':
    case 'purchase_list':
    case 'file_list':
    case 'stream_list':
    case 'blob_list':
    case 'address_list':
    case 'transaction_list':
    case 'txo_list':
      return Promise.resolve(emptyHyperbeamListResult(params));
    case 'address_is_mine':
      return Promise.resolve(false);
    case 'address_unused':
      return Promise.resolve('');
    case 'wallet_unlock':
    case 'wallet_lock':
    case 'wallet_encrypt':
    case 'wallet_decrypt':
    case 'ffmpeg_find':
      return Promise.reject(new Error(`${method} requires authentication`));
    default:
      return null;
  }
}

function emptyHyperbeamListResult(params: any) {
  return {
    items: [],
    page: Number(params?.page || 1),
    page_size: Number(params?.page_size || 20),
    total_items: 0,
    total_pages: 0,
  };
}

function unwrapJsonRpcResult(json: any) {
  if (json?.error) {
    throw new Error(json.error.message || json.error);
  }

  return json && Object.prototype.hasOwnProperty.call(json, 'result') ? json.result : json;
}

function base64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function daemonCallWithResult(
  name: string,
  params: {} = {},
  paramOverrideHook: ((arg0: {}) => {}) | null = null
): Promise<any> {
  return new Promise((resolve, reject) => {
    apiCall(
      name,
      paramOverrideHook ? paramOverrideHook(params) : params,
      (result) => {
        resolve(result);
      },
      reject
    );
  });
}

// This is only for a fallback
// If there is a Lbry method that is being called by an app, it should be added to /flow-typed/Lbry.js
const lbryProxy = new Proxy(Lbry, {
  get(target: LbryTypes, name: string) {
    if (name in target) {
      return target[name];
    }

    return (params = {}) =>
      new Promise((resolve, reject) => {
        apiCall(name, params, resolve, reject);
      });
  },
});
const SEARCH_OPTIONS_THAT_REQUIRE_AUTH = ['include_purchase_receipt', 'include_is_my_output'];

/**
 * daemonCallWithResult param-override hook that adds NO_AUTH to the params if
 * it was determined that the api call doesn't require auth tokens. This
 * improves caching on the server side.
 *
 * Subsequent processing down the line will remove X_LBRY_AUTH_TOKEN if NO_AUTH
 * is present. This hook is mainly meant for 'resolve' and 'claim_search'.
 *
 * @param options
 * @returns
 */
function handleAuthentication(options: any) {
  const authRequired = SEARCH_OPTIONS_THAT_REQUIRE_AUTH.some((k) => options.hasOwnProperty(k));
  return authRequired ? options : { ...options, [NO_AUTH]: true };
}

/**
 * daemonCallWithResult param-override hook for claim_search.
 * @param options
 * @returns
 */
function claimSearchParamHook(options: any) {
  // 1. Handle auth vs no_auth
  const finalOptions = handleAuthentication(options);
  // 2. Limit [not_channel_ids]
  const LIMIT = 2048 - 1;
  const ids = finalOptions.not_channel_ids;

  if (ids && ids.length > LIMIT) {
    finalOptions.not_channel_ids = ids.slice(0, LIMIT);
  }

  const ids2 = finalOptions.claim_ids;

  if (ids2 && ids2.length > LIMIT) {
    finalOptions.claim_ids = ids2.slice(0, LIMIT);
  }

  return finalOptions;
}

export default lbryProxy;
