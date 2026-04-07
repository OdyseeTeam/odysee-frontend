import React, { useState, useEffect } from 'react';
// core-js polyfills are loaded by Vite automatically via browserslist
import { setGlobalDevModeChecks } from 'reselect';

// Reselect 5 logs a warning every time an input selector returns a new reference
// for the same arguments. This is useful for finding perf bugs, but fires 250+
// times on page load due to legacy selectors. Set to 'once' so each unique site
// logs only a single warning instead of flooding the console.
setGlobalDevModeChecks({
  inputStabilityCheck: 'once',
  identityFunctionCheck: 'once',
});

import ErrorBoundary from 'component/errorBoundary';
import App from 'component/app';
import SnackBar from 'component/snackBar';
import * as MODALS from 'constants/modal_types';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { doDaemonReady, doOpenModal, doHideModal, doToggle3PAnalytics, doMinVersionSubscribe } from 'redux/actions/app';
import Lbry, { apiCall } from 'lbry';
import { setSearchApi } from 'redux/actions/search';
import { doResolveSubscriptions } from 'redux/actions/subscriptions';
import {
  doFetchLanguage,
  doFetchDevStrings,
  doFetchHomepages,
  doUpdateIsNightAsync,
  doLoadBuiltInHomepageData,
} from 'redux/actions/settings';
import { doFetchUserLocale } from 'redux/actions/user';
import { Lbryio, doBlackListedDataSubscribe, doFilteredDataSubscribe } from 'lbryinc';
import { store, persistor } from 'store';
import app from './app';
import { BrowserRouter, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';
import analytics from 'analytics';
import { getAuthToken, setAuthToken, doAuthTokenRefresh } from 'util/saved-passwords';
import { X_LBRY_AUTH_TOKEN } from 'constants/token';
import { PROXY_URL, DEFAULT_LANGUAGE, LBRY_API_URL } from 'config';
import {
  navigateTo,
  setRouterNavigator,
  clearRouterNavigator,
  setRouterSnapshot,
  syncRouterLocation,
} from 'redux/router';
import { useAppDispatch } from 'redux/hooks';
import { doSendPastRecsysEntries } from 'redux/actions/content';
import { reloadOnceForDynamicImportError } from 'util/importFailure';
// Import 3rd-party styles before ours for the current way we are code-splitting.
import 'scss/third-party.scss';
import 'react-datepicker/dist/react-datepicker.css';
// Import our app styles
// If a style is not necessary for the initial page load, it should be removed from `all.scss`
// and loaded dynamically in the component that consumes it
import 'scss/all.scss';

type CancelScheduledWork = () => void;

function scheduleAfterPaint(callback: () => void): CancelScheduledWork {
  let animationFrameId = 0;
  let timeoutId: number | undefined;

  animationFrameId = window.requestAnimationFrame(() => {
    animationFrameId = 0;
    timeoutId = window.setTimeout(callback, 0);
  });

  return () => {
    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId);
    }

    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
  };
}

function scheduleWhenIdle(callback: () => void, timeout = 1500): CancelScheduledWork {
  const requestIdleCallback = (window as any).requestIdleCallback;

  if (typeof requestIdleCallback === 'function') {
    const idleId = requestIdleCallback(callback, { timeout });
    return () => {
      const cancelIdleCallback = (window as any).cancelIdleCallback;

      if (typeof cancelIdleCallback === 'function') {
        cancelIdleCallback(idleId);
      }
    };
  }

  const timeoutId = window.setTimeout(callback, 200);
  return () => window.clearTimeout(timeoutId);
}

function setupRewardCallbacks() {
  void import('rewards').then(({ default: rewards }) => {
    rewards.setCallback('claimFirstRewardSuccess', () => {
      app.store.dispatch(doOpenModal(MODALS.FIRST_REWARD));
    });
    rewards.setCallback('claimRewardSuccess', (reward) => {
      if (reward && reward.type === rewards.TYPE_REWARD_CODE) {
        app.store.dispatch(doHideModal());
      }
    });
  });
}

analytics.init();
// Handle IndexedDB errors gracefully (e.g., "Connection to Indexed Database server lost")
// These can happen due to browser storage issues, too many tabs, or private browsing restrictions.
// The site continues to work normally - state just won't persist across refreshes.
// We silently handle this since it's not actionable and doesn't affect video playback.
window.addEventListener('unhandledrejection', (event) => {
  const errorMessage = event.reason?.message || event.reason?.toString() || '';

  if (
    errorMessage.includes('IndexedDB') ||
    errorMessage.includes('Indexed Database') ||
    errorMessage.includes('IDBDatabase')
  ) {
    event.preventDefault(); // Prevent the error from being reported to Sentry

    console.warn('IndexedDB error (handled):', errorMessage);
  }
});
window.addEventListener('vite:preloadError', (event) => {
  const preloadEvent = event as Event & { payload?: unknown };

  if (reloadOnceForDynamicImportError(preloadEvent.payload)) {
    event.preventDefault();
  }
});
Lbry.setDaemonConnectionString(PROXY_URL);
Lbry.setOverride(
  'publish',
  (params) =>
    new Promise((resolve, reject) => {
      void import('web/setup/publish')
        .then(({ default: apiPublishCallViaWeb }) =>
          apiPublishCallViaWeb(
            apiCall,
            Lbry.getApiRequestHeaders() && Object.keys(Lbry.getApiRequestHeaders()).includes(X_LBRY_AUTH_TOKEN)
              ? Lbry.getApiRequestHeaders()[X_LBRY_AUTH_TOKEN]
              : '',
            'publish',
            params,
            resolve,
            reject
          )
        )
        .catch(reject);
    })
);
analytics.event.initAppStartTime(Date.now());
if (LBRY_API_URL) {
  Lbryio.setLocalApi(LBRY_API_URL);
}

if (process.env.SEARCH_API_URL) {
  setSearchApi(process.env.SEARCH_API_URL);
}

doAuthTokenRefresh();
// We need to override Lbryio for getting/setting the authToken
// Keep a local variable for authToken to avoid repeating storage lookups.
let authToken;
Lbryio.setOverride('setAuthToken', (token) => {
  authToken = token;
  setAuthToken(token);
  return token;
});
Lbryio.setOverride(
  'getAuthToken',
  () =>
    new Promise((resolve) => {
      const authTokenToReturn = authToken || getAuthToken();
      resolve(authTokenToReturn);
    })
);
scheduleAfterPaint(setupRewardCallbacks);
document.addEventListener('dragover', (event) => {
  event.preventDefault();
});
document.addEventListener('drop', (event) => {
  event.preventDefault();
});

function RouterSyncBridge() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();

  setRouterSnapshot(location, navigationType);

  useEffect(() => {
    setRouterNavigator(navigate);
    return () => clearRouterNavigator();
  }, [navigate]);

  useEffect(() => {
    dispatch(syncRouterLocation(location, navigationType));
  }, [dispatch, location, navigationType]);

  return null;
}

function AppWrapper() {
  const [persistDone, setPersistDone] = useState(false);
  useEffect(() => {
    if (persistDone) {
      const cancelIdle = scheduleWhenIdle(() => {
        app.store.dispatch(doToggle3PAnalytics(null, true));
        app.store.dispatch(doSendPastRecsysEntries());
      });

      return cancelIdle;
    }
  }, [persistDone]);
  useEffect(() => {
    if (persistDone) {
      app.store.dispatch(doDaemonReady());
      app.store.dispatch(doLoadBuiltInHomepageData());
      app.store.dispatch(doFetchHomepages());

      const cancelAfterPaint = scheduleAfterPaint(() => {
        if (DEFAULT_LANGUAGE) {
          app.store.dispatch(doFetchLanguage(DEFAULT_LANGUAGE));
        }

        app.store.dispatch(doUpdateIsNightAsync());
        app.store.dispatch(doBlackListedDataSubscribe());
        app.store.dispatch(doFilteredDataSubscribe());
        app.store.dispatch(doFetchUserLocale());
        app.store.dispatch(doResolveSubscriptions());
        analytics.event.startup(Date.now());
      });
      const cancelIdle = scheduleWhenIdle(() => {
        app.store.dispatch(doMinVersionSubscribe());
        app.store.dispatch(doFetchDevStrings());
      }, 5000);

      return () => {
        cancelAfterPaint();
        cancelIdle();
      };
    }
  }, [persistDone]);
  return (
    <Provider store={store}>
      <PersistGate
        persistor={persistor}
        onBeforeLift={() => setPersistDone(true)}
        loading={<div className="main--launching" />}
      >
        <div className="app-gate-root">
          <BrowserRouter>
            <RouterSyncBridge />
            <ErrorBoundary>
              <App />
              <SnackBar />
            </ErrorBoundary>
          </BrowserRouter>
        </div>
      </PersistGate>
    </Provider>
  );
}

const appMount = document.getElementById('app');
if (!appMount) {
  throw new Error('#app mount node not found');
}
if (!(window as any).__REACT_ROOT__) {
  const internalKey = Object.keys(appMount).find((k) => k.startsWith('__reactContainer'));
  if (internalKey) delete appMount[internalKey];
  (window as any).__REACT_ROOT__ = createRoot(appMount);
}
(window as any).__REACT_ROOT__.render(<AppWrapper />);
