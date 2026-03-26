/**
 * UI / component shared types.
 *
 * Types used across multiple UI components and pages.
 */

type PlayingUri = {
  uri?: string;
  source?: string;
  primaryUri?: string;
  pathname?: string;
  commentId?: string;
  collection?: {
    collectionId?: string;
    loop?: boolean;
    shuffle?: any;
  };
  [key: string]: any;
};

type Tag = {
  name: string;
};

type KnownTags = Record<string, Tag>;

type RowDataItem = {
  title?: string;
  link?: string;
  help?: any;
  icon?: string;
  extra?: any;
  options?: any;
  route?: string;
  hideByDefault?: boolean;
  pinnedUrls?: Array<string>;
  pinnedClaimIds?: Array<string>;
  [key: string]: any;
};

type ListInjectedItem = {
  node: any;
  index?: number;
  replace?: boolean;
};

type Toast = {
  id: string;
  message: string;
  subMessage?: string;
  duration?: 'default' | 'long';
  isError?: boolean;
  linkText?: string;
  linkTarget?: string;
  actionText?: string;
  action?: () => void;
};

type ToastParams = {
  message: string;
  subMessage?: string;
  duration?: 'default' | 'long';
  isError?: boolean;
  linkText?: string;
  linkTarget?: string;
  actionText?: string;
  action?: () => void;
  secondaryActionText?: string;
  secondaryAction?: () => void;
  title?: string;
};

type WebNotification = {
  id: number;
  notification_rule: string;
  notification_parameters: {
    device: { target: string; title: string; text: string };
    dynamic: { claim_id?: string; channel_url?: string; comment_id?: string; hash?: string; [key: string]: any };
  };
  is_read: boolean;
  is_seen: boolean;
  created_at: string;
  active_at: string;
  type?: string;
  group_count?: number;
};

type LocaleInfo = {
  country?: string;
  language?: string;
  [key: string]: any;
};

type Duration = {
  hours?: number;
  minutes?: number;
  seconds?: number;
};

type GeoRestriction = {
  id?: string;
  trigger?: string;
  reason?: string;
  [key: string]: any;
};

type GeoConfig = {
  [key: string]: any;
};

type UriAccessKey = {
  signature: string;
  signature_ts: string;
  [key: string]: any;
};

type HomepagesDb = {
  [key: string]: any;
};

type FeaturedChannelsSection = {
  id: string;
  value_type: string;
  value: {
    title: string;
    uris: Array<string>;
  };
};

type ErrorNotification = {
  title?: string;
  text?: string;
  [key: string]: any;
};

type ReloadRequired = boolean | string;
type IsFullscreen = boolean;
type MiniPlayerPlayButton = any;
type MentionedChannel = { uri: string; name: string; claimId: string; channel_name?: string };

type SupportersList = {
  [key: string]: any;
};

type LastViewedAnnouncement = string | null;
type Visibility = string;

type FilterInfo = {
  label: string;
  key?: string;
  [key: string]: any;
};

type FunctionalComponentParam = any;
type NotTagInput = any;
type TimeoutID = ReturnType<typeof setTimeout>;
type CurrencyOption = string;
type AccountStatus = string;

type Following = {
  uri: string;
  notificationsDisabled?: boolean;
};

type WatchHistory = Record<string, ViewHistoryItem>;
type ViewHistoryItem = {
  uri: string;
  lastViewed: number;
  progress?: number;
  [key: string]: any;
};
