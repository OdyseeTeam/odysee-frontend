
declare type LogId = string;

declare type LogOptions = {|
  level?: 'info' | 'warning' | 'error' | 'fatal',
  tags?: { [tagName: string]: string },
  extra?: { [extraName: string]: any },
  fingerprint?: Array<string>,
|};

// ****************************************************************************
// Sentry
// ****************************************************************************

declare type SentryEventOptions = {
  level?: 'info' | 'warning' | 'error' | 'fatal',
  tags?: { [tagName: string]: string },
  extra?: { [extraName: string]: any },
  fingerprint?: Array<string>, // https://docs.sentry.io/product/data-management-settings/event-grouping/
  logger?: string,
};

declare type CaptureContext = any;
declare type Severity = any;

declare type Sentry = {
  captureException: (exception: any, captureContext?: CaptureContext) => string,
  captureMessage: (message: string, captureContext?: CaptureContext | Severity) => string,
  withScope: ((scope: SentryScope) => void) => void,
  BrowserTracing: any,
};

declare type SentryScope = {
  setTransactionName: (name: ?string) => void,
};
