import { LIVESTREAM_SERVER_API, ODYSEE_HYPERBEAM_NODE_API } from 'config';
import { HYPERBEAM_DEVICE, hyperbeamDeviceBase, hyperbeamDeviceUrl } from 'util/hyperbeamDevices';
const Livestream = {
  url: LIVESTREAM_SERVER_API,
  enabled: Boolean(ODYSEE_HYPERBEAM_NODE_API || LIVESTREAM_SERVER_API),
} as {
  url: any;
  enabled: boolean;
  call: (resource: string, action: string, params?: Record<string, any>, method?: string) => Promise<any>;
};

function checkAndParse(response) {
  if (response.status >= 200 && response.status < 300) {
    return response.json();
  }

  if (response) {
    return response.json().then((json) => {
      let error;

      if (json.error) {
        error = new Error(json.error);
      } else {
        error = new Error('Unknown API error signature');
      }

      error.response = response; // This is primarily a hack used in actions/user.js

      return Promise.reject(error);
    });
  }
}

function makeRequest(url, options) {
  return fetch(url, options).then(checkAndParse);
}

function hyperbeamNodeBase() {
  return hyperbeamDeviceBase(HYPERBEAM_DEVICE.livestream);
}

function base64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function unwrapHyperbeamNodeJson(json) {
  if (json?.error) {
    throw new Error(json.error.message || json.error);
  }

  return Object.prototype.hasOwnProperty.call(json, 'result') ? json.result : json;
}

Livestream.call = (resource, action, params = {}, method = 'post') => {
  if (!Livestream.enabled) {
    return Promise.reject(new Error(__('Odysee internal API is disabled')));
  }

  if (!(method === 'get' || method === 'post')) {
    return Promise.reject(new Error(__('Invalid method')));
  }

  const node = hyperbeamNodeBase();
  if (node) {
    const payload = {
      resource,
      action,
      params,
      method,
    };
    const url = hyperbeamDeviceUrl(HYPERBEAM_DEVICE.livestream, 'livestream', {
      params64: base64Url(JSON.stringify(payload)),
    });
    return fetch(url, { method: 'GET', headers: { accept: 'application/json' } })
      .then((res) => {
        if (!res.ok) throw new Error(`livestream device ${res.status}`);
        return res.json();
      })
      .then(unwrapHyperbeamNodeJson);
  }

  Object.keys(params).forEach((key) => {
    const value = params[key];

    if (typeof value === 'object') {
      params[key] = JSON.stringify(value);
    }
  });
  const qs = new URLSearchParams(params).toString();
  let url = `${Livestream.url}/${resource}/${action}?${qs}`;
  let options: RequestInit = {
    method: 'GET',
  };

  if (method === 'post') {
    options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: qs,
    };
    url = `${Livestream.url}/${resource}/${action}`;
  }

  return makeRequest(url, options)
    .then((response) => response.data)
    .catch((error) => {
      throw error;
    });
};

export default Livestream;
