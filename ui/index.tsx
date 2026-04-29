if (typeof Object.hasOwn !== 'function') {
  (Object as any).hasOwn = (obj: any, key: PropertyKey) => Object.prototype.hasOwnProperty.call(obj, key);
}

// Dev-only: ?legacy=1 simulates a browser without the Popover API.
if (typeof window !== 'undefined' && window.location.search.indexOf('legacy=1') !== -1) {
  for (const m of ['showPopover', 'hidePopover', 'togglePopover']) {
    try {
      Object.defineProperty(HTMLElement.prototype, m, {
        value: undefined,
        configurable: true,
        writable: true,
      });
    } catch {}
  }
  (window as any).__forceLegacyPopover = true;
}

if (typeof AbortSignal.any !== 'function') {
  AbortSignal.any = (signals: AbortSignal[]) => {
    const controller = new AbortController();
    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort(signal.reason);
        return controller.signal;
      }
      signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
    }
    return controller.signal;
  };
}

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

// React 18.3.1 doesn't recognize the `fetchPriority` prop, but @videojs/react passes it.
// The warning is harmless; suppress it to reduce dev console noise.
{
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('fetchPriority')) return;
    originalConsoleError.apply(console, args);
  };
}

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
  void import('rewards')
    .catch(() => null)
    .then((mod) => {
      if (!mod) return;
      const rewards = mod.default;
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

const _origOnUnhandledRejection = window.onunhandledrejection;
window.onunhandledrejection = function (event) {
  const errorMessage = event.reason?.message || event.reason?.toString() || '';
  if (
    errorMessage.includes('IndexedDB') ||
    errorMessage.includes('Indexed Database') ||
    errorMessage.includes('IDBDatabase') ||
    errorMessage.includes('NO_TARGET') ||
    errorMessage.includes('no supported sources') ||
    errorMessage.includes('operation is not supported') ||
    errorMessage.includes('NetworkError when attempting to fetch') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('cross-origin frame')
  ) {
    event.preventDefault();
    return true;
  }
  return _origOnUnhandledRejection ? _origOnUnhandledRejection.call(window, event) : false;
};
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
