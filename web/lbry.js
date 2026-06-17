// Disabled flow in this copy. This copy is for uncompiled web server ES5 require()s.
require('proxy-polyfill');

const { PROXY_URL_NO_CF } = require('../config.cjs');
const {
  hyperbeamNodeConfigured,
  hyperbeamNodeClaimSearch,
  hyperbeamNodeResolve,
  hyperbeamNodeSdkCall: hyperbeamNodeGenericSdkCall,
} = require('./src/odyseeHyperbeamNode');

const CHECK_DAEMON_STARTED_TRY_NUMBER = 200;
//
// Basic LBRY sdk connection config
// Offers a proxy to call LBRY sdk methods
//
const Lbry = {
  isConnected: false,
  connectPromise: null,
  daemonConnectionString: 'http://localhost:5279',
  alternateConnectionString: PROXY_URL_NO_CF || '',
  methodsUsingAlternateConnectionString: [],
  apiRequestHeaders: {
    'Content-Type': 'application/json-rpc',
  },
  // Allow overriding daemon connection string (e.g. to `/api/proxy` for lbryweb)
  setDaemonConnectionString: (value) => {
    Lbry.daemonConnectionString = value;
  },
  setAlternateDaemonConnectionString: (value) => {
    Lbry.alternateConnectionString = value;
  },
  setApiHeader: (key, value) => {
    Lbry.apiRequestHeaders = Object.assign(Lbry.apiRequestHeaders, {
      [key]: value,
    });
  },
  unsetApiHeader: (key) => {
    Object.keys(Lbry.apiRequestHeaders).includes(key) && delete Lbry.apiRequestHeaders['key'];
  },
  // Allow overriding Lbry methods
  overrides: {},
  setOverride: (methodName, newMethod) => {
    Lbry.overrides[methodName] = newMethod;
  },
  getApiRequestHeaders: () => Lbry.apiRequestHeaders,
  // Returns a human readable media type based on the content type or extension of a file that is returned by the sdk
  getMediaType: (contentType, fileName) => {
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
        switch (testpair[0].test(ret)) {
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
  resolve: (params) => daemonCallWithResult('resolve', params),
  get: (params) => daemonCallWithResult('get', params),
  claim_search: (params) => daemonCallWithResult('claim_search', params),
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

    // Flow thinks this could be empty, but it will always reuturn a promise
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

const READ_ONLY_METHODS = new Set(['resolve', 'claim_search', 'get', 'collection_resolve', 'status']);

function checkAndParse(response) {
  if (response.status >= 200 && response.status < 300) {
    return response.json();
  }

  return response.json().then((json) => {
    let error;

    if (json.error) {
      const errorMessage = typeof json.error === 'object' ? json.error.message : json.error;
      error = new Error(errorMessage);
    } else {
      error = new Error('Protocol error with unknown response signature');
    }

    return Promise.reject(error);
  });
}

function apiCall(method, params, resolve, reject) {
  const nodeRead = hyperbeamNodeSdkCall(method, params);
  if (nodeRead) {
    return nodeRead.then(resolve, reject);
  }

  const counter = new Date().getTime();
  const options = {
    method: 'POST',
    headers: Lbry.apiRequestHeaders,
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: counter,
    }),
  };
  const primaryConnectionString = Lbry.methodsUsingAlternateConnectionString.includes(method)
    ? Lbry.alternateConnectionString
    : Lbry.daemonConnectionString;
  const alternateConnectionString =
    !Lbry.methodsUsingAlternateConnectionString.includes(method) &&
    READ_ONLY_METHODS.has(method) &&
    Lbry.alternateConnectionString &&
    Lbry.alternateConnectionString !== primaryConnectionString
      ? Lbry.alternateConnectionString
      : '';
  const call = (connectionString) => fetch(connectionString + '?m=' + method, options).then(checkAndParse);

  return call(primaryConnectionString)
    .catch((error) => {
      if (!alternateConnectionString) {
        throw error;
      }

      return call(alternateConnectionString);
    })
    .then((response) => {
      const error = response.error || (response.result && response.result.error);

      if (error) {
        return reject(error);
      }

      return resolve(response.result);
    })
    .catch(reject);
}

function hyperbeamNodeSdkCall(method, params) {
  if (!hyperbeamNodeConfigured()) return null;

  const localFullModeResult = hyperbeamFullModeLocalSdkResult(method, params);
  if (localFullModeResult) {
    return localFullModeResult;
  }

  switch (method) {
    case 'resolve':
      return hyperbeamNodeResolve(params, Lbry.apiRequestHeaders);
    case 'claim_search':
      return hyperbeamNodeClaimSearch(params, Lbry.apiRequestHeaders);
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
      return hyperbeamNodeGenericSdkCall(method, params, Lbry.apiRequestHeaders);
    default:
      return null;
  }
}

function hyperbeamFullModeLocalSdkResult(method, params) {
  if (hyperbeamMode() !== 'hyperbeam') return null;

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

function emptyHyperbeamListResult(params) {
  return {
    items: [],
    page: Number((params && params.page) || 1),
    page_size: Number((params && params.page_size) || 20),
    total_items: 0,
    total_pages: 0,
  };
}

function hyperbeamMode() {
  if (typeof window === 'undefined') return 'hyperbeam';
  const value = window.localStorage && window.localStorage.getItem('odysee-hyperbeam-mode');
  return value === 'original' || value === 'hybrid' || value === 'hyperbeam' ? value : 'hyperbeam';
}

function daemonCallWithResult(name, params = {}) {
  return new Promise((resolve, reject) => {
    apiCall(
      name,
      params,
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
  get(target, name) {
    if (name in target) {
      return target[name];
    }

    return (params = {}) =>
      new Promise((resolve, reject) => {
        apiCall(name, params, resolve, reject);
      });
  },
});
module.exports = {
  lbryProxy,
  apiCall,
};
