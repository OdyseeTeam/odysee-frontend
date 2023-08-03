// @flow
import * as Sentry from '@sentry/react';
import { apiLog } from 'analytics/apiLog';
import { events } from 'analytics/events';
import { sentryWrapper } from 'analytics/sentryWrapper';
import { watchman } from 'analytics/watchman';
import type { ApiLog } from 'analytics/apiLog';
import type { Events } from 'analytics/events';
import type { Watchman } from 'analytics/watchman';

const isProduction = process.env.NODE_ENV === 'production';
let gAnalyticsEnabled = false;

// ****************************************************************************
// ****************************************************************************

export type Analytics = {
  init: () => void,
  setState: (enable: boolean) => void, // Enables/disables logging.
  setUser: (Object) => void,
  apiLog: ApiLog, // Legacy logging interface that uses internal-apis.
  event: Events, // General event-logging. Currently inactive.
  video: Watchman, // AV-playback logging through Watchman.
  error: (string) => Promise<any>, // Logging using internal-apis.
  sentryError: ({} | string, {}) => Promise<any>, // Deprecated, only used for React ErrorBoundary. Use log() instead.

  /**
   * The primary logging interface.
   *
   * @param error The string-form does not include the stacktrace; Error-form does.
   * @param options Additional information and logging options.
   * @param label Specific label to use for the event (easier to find in dashboard).
   */
  log: (error: Error | string, options?: LogOptions, label?: string) => Promise<?LogId>,
};

// ****************************************************************************
// ****************************************************************************

const analytics: Analytics = {
  init: () => {
    sentryWrapper.init();
  },
  setState: (enable: boolean) => {
    gAnalyticsEnabled = enable;
    analytics.apiLog.setState(gAnalyticsEnabled);
    analytics.event.setState(gAnalyticsEnabled);
    analytics.video.setState(gAnalyticsEnabled);
    sentryWrapper.setState(gAnalyticsEnabled);
  },
  apiLog: apiLog,
  event: events,
  video: watchman,
  error: (message) => {
    return analytics.apiLog.desktopError(message);
  },
  log: (error: Error | string, options?: LogOptions, label?: string) => {
    return sentryWrapper.log(error, { ...options }, label);
  },
  sentryError: (error, errorInfo) => {
    return new Promise((resolve) => {
      if (gAnalyticsEnabled && isProduction) {
        Sentry.withScope((scope) => {
          scope.setExtras(errorInfo);
          scope.setTag('_origin', 'react-error-boundary');
          scope.setLevel('fatal');
          const eventId = Sentry.captureException(error);
          resolve(eventId);
        });
      } else {
        resolve(null);
      }
    });
  },
  setUser: (userId) => {
    analytics.event.setUser(userId);
    // Pass on to other submodules if needed...
  },
  toggleThirdParty: (enabled: boolean): void => {
    // Retained to keep things compiling. We don't do third-party analytics,
    // so this can be removed, but together with the redux state.
  },
};

analytics.setState(IS_WEB);
export default analytics;
