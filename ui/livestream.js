// @flow
import { LIVESTREAM_SERVER_API } from 'config';
import querystring from 'querystring';

// prettier-ignore
const Livestream = {
  url: LIVESTREAM_SERVER_API,
  enabled: Boolean(LIVESTREAM_SERVER_API),
};

Livestream.call = (resource, action, params = {}, method = 'post') => {
  if (!Livestream.enabled) {
    return Promise.reject(new Error(__('LBRY internal API is disabled')));
  }

  if (!(method === 'get' || method === 'post')) {
    return Promise.reject(new Error(__('Invalid method')));
  }

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

  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (typeof value === 'object') {
      params[key] = JSON.stringify(value);
    }
  });

  const qs = querystring.stringify(params);
  let url = `${Livestream.url}/${resource}/${action}?${qs}`;

  let options = {
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
