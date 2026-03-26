/**
 * Subscription types.
 */

type Subscription = {
  uri: string;
  channelName: string;
  notificationsDisabled?: boolean;
  latest?: string;
};

type PerChannelSettings = {
  [channelId: string]: {
    [key: string]: any;
  };
};

type User = {
  country?: string;
  created_at?: string;
  family_name?: string;
  given_name?: string;
  groups?: Array<string>;
  has_verified_email?: boolean;
  id: number;
  invite_reward_claimed?: boolean;
  invited_at?: string;
  invites_remaining?: number;
  is_email_enabled?: boolean;
  is_identity_verified?: boolean;
  is_reward_approved?: boolean;
  language?: string;
  manual_approval_user_id?: number;
  primary_email?: string;
  [key: string]: any;
};

type SearchOptions = {
  [key: string]: any;
};

type SearchResults = {
  [key: string]: any;
};

type SearchSuccess = {
  type: string;
  data: {
    uris: Array<string>;
    query: string;
    from: number;
    size: number;
    [key: string]: any;
  };
};

type UpdateSearchOptions = Partial<SearchOptions>;
