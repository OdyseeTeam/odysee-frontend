// @flow

type DeviceType = 'mobile' | 'web' | 'desktop';

declare type User = {
  country: ?string,
  created_at: string,
  family_name: ?string,
  given_name: ?string,
  groups: Array<string>,
  has_verified_email: boolean,
  id: number,
  invite_reward_claimed: boolean,
  invited_at: ?number,
  invited_by_id: number,
  invites_remaining: number,
  is_email_enabled: boolean,
  is_identity_verified: boolean,
  is_reward_approved: boolean,
  password_set: boolean,
  language: string,
  manual_approval_user_id: ?number,
  primary_email: ?string,
  latest_claimed_email: ?string,
  reward_status_change_trigger: string,
  updated_at: string,
  youtube_channels: ?Array<string>,
  device_types: Array<DeviceType>,
  lbry_first_approved: boolean,
  experimental_ui: boolean,
  fiat_enabled: boolean,
  odysee_live_enabled: boolean,
  odysee_live_disabled: boolean,
  global_mod: boolean,
  publish_id: ?number,
  is_odysee_user: boolean,
  location: ?string,
};

declare type UserState ={
  authenticationIsPending: boolean,
  userIsPending: boolean,
  emailNewIsPending: boolean,
  emailNewErrorMessage: string,
  emailToVerify: string,
  emailAlreadyExists: boolean,
  emailDoesNotExist: boolean,
  resendingVerificationEmail: boolean,
  passwordResetPending: boolean,
  passwordResetSuccess: boolean,
  passwordResetError: ?string,
  passwordSetPending: boolean,
  passwordSetSuccess: boolean,
  passwordSetError: ?string,
  inviteNewErrorMessage: string,
  inviteNewIsPending: boolean,
  inviteStatusIsPending: boolean,
  invitesRemaining: ?number,
  invitees: ?Array<string>,
  referralLink: ?string,
  referralCode: ?string,
  user: ?User,
  youtubeChannelImportPending: boolean,
  youtubeChannelImportErrorMessage: string,
  referrerSetIsPending: boolean,
  referrerSetError: string,
  locale: ?LocaleInfo,
};

declare type LocaleInfo = {
  continent: string,
  country: string,
  gdpr_required: boolean,
  is_eu_member: boolean,
};
