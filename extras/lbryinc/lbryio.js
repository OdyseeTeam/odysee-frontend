import Lbry from 'lbry';
import querystring from 'querystring';
import analytics from 'analytics';

const Lbryio = {
  enabled: true,
  authenticationPromise: null,
  exchangePromise: null,
  exchangeLastFetched: null,
  CONNECTION_STRING: 'https://api.lbry.com/',
};

const EXCHANGE_RATE_TIMEOUT = 20 * 60 * 1000;
const INTERNAL_APIS_DOWN = 'internal_apis_down';

Lbryio.fetchingUser = false;

// We can't use env's because they aren't passed into node_modules
Lbryio.setLocalApi = (endpoint) => {
  Lbryio.CONNECTION_STRING = endpoint.replace(/\/*$/, '/'); // exactly one slash at the end;
};

Lbryio.call = (resource, action, params = {}, method = 'get') => {
  if (!Lbryio.enabled) {
    return Promise.reject(new Error(__('LBRY internal API is disabled')));
  }

  if (!(method === 'get' || method === 'post')) {
    return Promise.reject(new Error(__('Invalid method')));
  }

  function checkAndParse(response) {
    if (response.status >= 200 && response.status < 300) {
      return response.json();
    }

    if (response.status === 500) {
      return Promise.reject(INTERNAL_APIS_DOWN);
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

  return Lbryio.getTokens().then((tokens) => {
    const fullParams = { ...params };
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    // -------------------
    // TODO refactor this
    // -------------------
    // Send both tokens to userMe; delete auth token after success.
    if (action === 'me') {
      if (tokens && tokens.access_token) {
        headers.Authorization = `Bearer ${tokens.access_token}`;
      }
      if (tokens && tokens.auth_token) {
        fullParams.auth_token = tokens.auth_token;
      }
    } else if (tokens && tokens.access_token) {
      headers.Authorization = `Bearer ${tokens.access_token}`;
    } else {
      fullParams.auth_token = tokens.auth_token;
    }

    Object.keys(fullParams).forEach((key) => {
      const value = fullParams[key];
      if (typeof value === 'object') {
        fullParams[key] = JSON.stringify(value);
      }
    });

    const qs = querystring.stringify(fullParams);
    let url = `${Lbryio.CONNECTION_STRING}${resource}/${action}?${qs}`;

    let options = {
      method: 'GET',
      headers,
    };

    if (method === 'post') {
      options = {
        method: 'POST',
        headers,
        body: qs,
      };
      url = `${Lbryio.CONNECTION_STRING}${resource}/${action}`;
    }

    return makeRequest(url, options).then((response) => {
      sendCallAnalytics(resource, action, params);
      return response.data;
    });
  });
};

Lbryio.getAuthToken = () =>
  new Promise((resolve) => {
    Lbryio.overrides.getAuthToken().then((token) => {
      resolve(token);
    });
  });

Lbryio.getTokens = () =>
  new Promise((resolve) => {
    Lbryio.overrides.getTokens().then((tokens) => {
      resolve(tokens);
    });
  });

Lbryio.deleteAuthToken = () =>
  new Promise((resolve) => {
    Lbryio.overrides.deleteAuthToken().then(() => {
      resolve(true);
    });
  });

Lbryio.fetchCurrentUser = () => Lbryio.call('user', 'me');

Lbryio.fetchNewUser = async (domain, language) => {
  try {
    const status = await Lbry.status();
    const appId =
      domain && domain !== 'lbry.tv'
        ? (domain.replace(/[.]/gi, '') + status.installation_id).slice(0, 66)
        : status.installation_id;
    const userResponse = await Lbryio.call(
      'user',
      'new',
      {
        auth_token: '',
        language: language || 'en',
        app_id: appId,
      },
      'post'
    );
    if (!userResponse.auth_token) {
      throw new Error('auth_token was not set in the response');
    } else {
      await Lbryio.overrides.setAuthToken(userResponse.auth_token);
    }
    return userResponse;
  } catch (e) {
    return { error: { message: e.message } };
  }
};

Lbryio.fetchUser = async (domain, language) => {
  if (!Lbryio.fetchingUser) {
    let user;
    Lbryio.fetchingUser = true;
    const tokens = await Lbryio.getTokens(domain, language);
    if (!tokens.auth_token && !tokens.access_token) {
      user = await Lbryio.fetchNewUser(domain, language);
    } else {
      user = await Lbryio.fetchCurrentUser();
      if (tokens.access_token && tokens.auth_token) {
        await Lbryio.deleteAuthToken();
      }
    }
    return user;
  }
};

Lbryio.getStripeToken = () =>
  Lbryio.CONNECTION_STRING.startsWith('http://localhost:')
    ? 'pk_test_NoL1JWL7i1ipfhVId5KfDZgo'
    : 'pk_live_e8M4dRNnCCbmpZzduEUZBgJO';

Lbryio.getExchangeRates = () => {
  if (!Lbryio.exchangeLastFetched || Date.now() - Lbryio.exchangeLastFetched > EXCHANGE_RATE_TIMEOUT) {
    Lbryio.exchangePromise = new Promise((resolve, reject) => {
      Lbryio.call('lbc', 'exchange_rate', {}, 'get', true)
        .then(({ lbc_usd: LBC_USD, lbc_btc: LBC_BTC, btc_usd: BTC_USD }) => {
          const rates = { LBC_USD, LBC_BTC, BTC_USD };
          resolve(rates);
        })
        .catch(reject);
    });
    Lbryio.exchangeLastFetched = Date.now();
  }
  return Lbryio.exchangePromise;
};

// Allow overriding lbryio methods
// The desktop app will need to use it for getAuthToken because we use electron's ipcRenderer
Lbryio.overrides = {};
Lbryio.setOverride = (methodName, newMethod) => {
  Lbryio.overrides[methodName] = newMethod;
};

function sendCallAnalytics(resource, action, params) {
  switch (resource) {
    case 'customer':
      if (action === 'tip') {
        analytics.reportEvent('spend_virtual_currency', {
          // https://developers.google.com/analytics/devguides/collection/ga4/reference/events#spend_virtual_currency
          value: params.amount,
          virtual_currency_name: params.currency.toLowerCase(),
          item_name: 'tip',
        });
      }
      break;

    default:
      // Do nothing
      break;
  }
}

export default Lbryio;
