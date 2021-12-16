import 'babel-polyfill';
import * as Sentry from '@sentry/browser';
import ErrorBoundary from 'component/errorBoundary';
import App from 'component/app';
import SnackBar from 'component/snackBar';
import * as MODALS from 'constants/modal_types';
import React, { Fragment, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { doDaemonReady, doOpenModal, doHideModal, doToggle3PAnalytics } from 'redux/actions/app';
import Lbry, { apiCall } from 'lbry';
import { setSearchApi } from 'redux/actions/search';
import { doFetchLanguage, doUpdateIsNightAsync } from 'redux/actions/settings';
import { Lbryio, doBlackListedOutpointsSubscribe, doFilteredOutpointsSubscribe } from 'lbryinc';
import rewards from 'rewards';
import { store, persistor, history } from 'store';
import app from './app';
import { ConnectedRouter } from 'connected-react-router';
import { PersistGate } from 'redux-persist/integration/react';
import analytics from 'analytics';
import { getAuthToken, setAuthToken, doAuthTokenRefresh } from 'util/saved-passwords';
import { X_LBRY_AUTH_TOKEN } from 'constants/token';
import { PROXY_URL, DEFAULT_LANGUAGE, LBRY_API_URL } from 'config';

// Import 3rd-party styles before ours for the current way we are code-splitting.
import 'scss/third-party.scss';

// Import our app styles
// If a style is not necessary for the initial page load, it should be removed from `all.scss`
// and loaded dynamically in the component that consumes it
import 'scss/all.scss';

// These overrides can't live in web/ because they need to use the same instance of `Lbry`
import apiPublishCallViaWeb from 'web/setup/publish';

// Sentry error logging setup
// Will only work if you have a SENTRY_AUTH_TOKEN env
// We still add code in analytics.js to send the error to sentry manually
// If it's caught by componentDidCatch in component/errorBoundary, it will not bubble up to this error reporter
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: 'https://1f3c88e2e4b341328a638e138a60fb73@sentry.lbry.tech/2',
    whitelistUrls: [/\/public\/ui.js/],
  });
}

if (process.env.SDK_API_URL) {
  console.warn('SDK_API_URL env var is deprecated. Use SDK_API_HOST instead'); // eslint-disable-line
}

Lbry.setDaemonConnectionString(PROXY_URL);

Lbry.setOverride(
  'publish',
  (params) =>
    new Promise((resolve, reject) => {
      apiPublishCallViaWeb(
        apiCall,
        Lbry.getApiRequestHeaders() && Object.keys(Lbry.getApiRequestHeaders()).includes(X_LBRY_AUTH_TOKEN)
          ? Lbry.getApiRequestHeaders()[X_LBRY_AUTH_TOKEN]
          : '',
        'publish',
        params,
        resolve,
        reject
      );
    })
);

analytics.initAppStartTime(Date.now());

if (LBRY_API_URL) {
  Lbryio.setLocalApi(LBRY_API_URL);
}

if (process.env.SEARCH_API_URL) {
  setSearchApi(process.env.SEARCH_API_URL);
}

doAuthTokenRefresh();

// We need to override Lbryio for getting/setting the authToken
// We interact with ipcRenderer to get the auth key from a users keyring
// We keep a local variable for authToken because `ipcRenderer.send` does not
// contain a response, so there is no way to know when it's been set
let authToken;
Lbryio.setOverride('setAuthToken', (authToken) => {
  setAuthToken(authToken);
  return authToken;
});

Lbryio.setOverride(
  'getAuthToken',
  () =>
    new Promise((resolve) => {
      const authTokenToReturn = authToken || getAuthToken();
      resolve(authTokenToReturn);
    })
);

rewards.setCallback('claimFirstRewardSuccess', () => {
  app.store.dispatch(doOpenModal(MODALS.FIRST_REWARD));
});

rewards.setCallback('claimRewardSuccess', (reward) => {
  if (reward && reward.type === rewards.TYPE_REWARD_CODE) {
    app.store.dispatch(doHideModal());
  }
});

document.addEventListener('dragover', (event) => {
  event.preventDefault();
});
document.addEventListener('drop', (event) => {
  event.preventDefault();
});

function AppWrapper() {
  // Splash screen and sdk setup not needed on web
  const [persistDone, setPersistDone] = useState(false);

  useEffect(() => {
    if (!persistDone) return;

    app.store.dispatch(doToggle3PAnalytics(null, true));
    app.store.dispatch(doDaemonReady());

    setTimeout(() => {
      if (DEFAULT_LANGUAGE) {
        app.store.dispatch(doFetchLanguage(DEFAULT_LANGUAGE));
      }
      app.store.dispatch(doUpdateIsNightAsync());
      app.store.dispatch(doBlackListedOutpointsSubscribe());
      app.store.dispatch(doFilteredOutpointsSubscribe());
    }, 25);

    analytics.startupEvent(Date.now());
  }, [persistDone]);

  return (
    <Provider store={store}>
      <PersistGate
        persistor={persistor}
        onBeforeLift={() => setPersistDone(true)}
        loading={<div className="main--launching" />}
      >
        <Fragment>
          <ConnectedRouter history={history}>
            <ErrorBoundary>
              <App />
              <SnackBar />
            </ErrorBoundary>
          </ConnectedRouter>
        </Fragment>
      </PersistGate>
    </Provider>
  );
}

ReactDOM.render(<AppWrapper />, document.getElementById('app'));
