/**
 * Analytics types.
 */

type LogOptions = {
  level?: string;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  fingerprint?: Array<string>;
};

type LogId = string;

type SentryEventOptions = {
  level?: string;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  fingerprint?: Array<string>;
  [key: string]: any;
};

type Recsys = {
  entries: Record<string, RecsysEntry>;
  [key: string]: any;
};

type RecsysEntry = {
  claimId: string;
  pageLoadedAt: number;
  events: Array<any>;
  uuid?: string;
  parentUuid?: string;
  uid?: number | string;
  [key: string]: any;
};
