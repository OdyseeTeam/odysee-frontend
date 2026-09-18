// Taxonomy for the "Report an issue or request a feature" form (`/$/report`).
//
// Strings are stored untranslated and passed through `__()` at render time so
// that the raw English value is what gets sent to support, regardless of the
// reporter's UI language.

export const KIND_PROBLEM = 'problem';
export const KIND_FEATURE = 'feature';
export const KIND_EMAIL_CHANGE = 'email_change';

export const LINK_HIDDEN = 'hidden';
export const LINK_OPTIONAL = 'optional';
export const LINK_REQUIRED = 'required';

export type LinkMode = typeof LINK_HIDDEN | typeof LINK_OPTIONAL | typeof LINK_REQUIRED;

export type IssueArea = {
  id: string;
  label: string;
  linkMode: LinkMode;
  linkLabel?: string;
  linkPlaceholder?: string;
  allowTimestamp?: boolean;
  symptoms: Array<string>;
};

export const AREA_PLAYBACK = 'playback';
export const AREA_LIVESTREAM = 'livestream';
export const AREA_UPLOAD = 'upload';
export const AREA_COMMENTS = 'comments';
export const AREA_ACCOUNT = 'account';
export const AREA_MEMBERSHIP = 'membership';
export const AREA_WALLET = 'wallet';
export const AREA_DISCOVERY = 'discovery';
export const AREA_DISPLAY = 'display';
export const AREA_OTHER = 'other';

export const AREAS: Array<IssueArea> = [
  {
    id: AREA_PLAYBACK,
    label: 'Watching a video',
    linkMode: LINK_REQUIRED,
    linkLabel: 'Link to the video',
    linkPlaceholder: 'https://odysee.com/@channel/video',
    allowTimestamp: true,
    symptoms: [
      'Video never loads or starts',
      'Buffering or stuttering',
      'No sound',
      'Audio and video out of sync',
      'Quality is stuck or looks wrong',
      'Subtitles or captions',
      'Fullscreen or picture-in-picture',
      'Autoplay plays the wrong thing',
      'Seeking or playback speed',
      'Shorts / vertical video',
      'Playback stops partway through',
    ],
  },
  {
    id: AREA_LIVESTREAM,
    label: 'Livestreaming',
    linkMode: LINK_OPTIONAL,
    linkLabel: 'Link to the livestream or channel',
    linkPlaceholder: 'https://odysee.com/@channel',
    symptoms: [
      'Stream will not go live',
      'Stream keeps dropping',
      'Long delay or high latency',
      'Live chat is not working',
      'Stream key or encoder setup',
      'Replay did not save',
      'Viewer count looks wrong',
    ],
  },
  {
    id: AREA_UPLOAD,
    label: 'Uploading or publishing',
    linkMode: LINK_OPTIONAL,
    linkLabel: 'Link to the upload or channel (if it published)',
    linkPlaceholder: 'https://odysee.com/@channel/video',
    symptoms: [
      'Upload fails or never finishes',
      'Stuck processing after upload',
      'Thumbnail will not save',
      'Wrong details after publishing',
      'Cannot edit or delete an upload',
      'Scheduling a publish',
      'YouTube sync',
      'Upload is missing from my channel',
    ],
  },
  {
    id: AREA_COMMENTS,
    label: 'Comments and chat',
    linkMode: LINK_OPTIONAL,
    linkLabel: 'Link to the comment or video',
    linkPlaceholder: 'https://odysee.com/@channel/video?lc=commentid',
    symptoms: [
      'Cannot post a comment',
      'Comment disappeared',
      'Cannot reply to a comment',
      'Pinned comment behaves incorrectly',
      'Blocking or moderation tools',
      'Comment notifications',
      'Spam or abuse I cannot moderate',
    ],
  },
  {
    id: AREA_ACCOUNT,
    label: 'Account and sign in',
    linkMode: LINK_OPTIONAL,
    linkLabel: 'Link to your channel',
    linkPlaceholder: 'https://odysee.com/@channel',
    symptoms: [
      'Cannot sign in',
      'Not receiving sign-in emails',
      'Email address change',
      'Two-factor authentication',
      'A channel is missing or locked',
      'My account was restricted',
      'Deleting my account or data',
    ],
  },
  {
    id: AREA_MEMBERSHIP,
    label: 'Memberships',
    linkMode: LINK_OPTIONAL,
    linkLabel: 'Link to the channel or membership',
    linkPlaceholder: 'https://odysee.com/@channel',
    symptoms: [
      'Cannot subscribe to a membership',
      'Cannot cancel a membership',
      'Charged the wrong amount',
      'Perks are not applied',
      'Members-only content is still locked',
      'Creator payouts',
      'Creating or editing a tier',
    ],
  },
  {
    id: AREA_WALLET,
    label: 'Wallet, tips and purchases',
    linkMode: LINK_OPTIONAL,
    linkLabel: 'Link to the content or channel involved',
    linkPlaceholder: 'https://odysee.com/@channel/video',
    symptoms: [
      'Balance is wrong or missing',
      'Tip failed to send',
      'Tip never arrived',
      'Withdrawal or transfer failed',
      'Arweave address issue',
      'Purchase did not unlock the content',
      'Transaction is stuck pending',
    ],
  },
  {
    id: AREA_DISCOVERY,
    label: 'Search, feeds and notifications',
    linkMode: LINK_OPTIONAL,
    linkLabel: 'Link to the channel or content involved',
    linkPlaceholder: 'https://odysee.com/@channel',
    symptoms: [
      'Cannot find a channel or video',
      'Search results are irrelevant',
      'Content missing from a category',
      'Following feed is wrong',
      'Notifications are missing or wrong',
      'Recommendations are off',
    ],
  },
  {
    id: AREA_DISPLAY,
    label: 'Site layout or display',
    linkMode: LINK_OPTIONAL,
    linkLabel: 'Link to the page',
    linkPlaceholder: 'https://odysee.com/$/settings',
    symptoms: [
      'Layout is broken or overlapping',
      'Something is unreadable',
      'Dark or light theme problem',
      'Broken on mobile',
      'A button or link does nothing',
      'Page is blank or errors out',
      'Translation is wrong or missing',
    ],
  },
  {
    id: AREA_OTHER,
    label: 'Something else',
    linkMode: LINK_OPTIONAL,
    linkLabel: 'Related link (optional)',
    linkPlaceholder: 'https://odysee.com/@channel/video',
    symptoms: [],
  },
];

export const FREQUENCY_ONCE = 'It happened once';
export const FREQUENCY_SOMETIMES = 'It happens sometimes';
export const FREQUENCY_ALWAYS = 'It happens every time';

export const FREQUENCIES = [FREQUENCY_ONCE, FREQUENCY_SOMETIMES, FREQUENCY_ALWAYS];

export const SCOPE_SINGLE = 'Only on this video or channel';
export const SCOPE_SEVERAL = 'On several videos or channels';
export const SCOPE_EVERYWHERE = 'Everywhere on Odysee';

export const SCOPES = [SCOPE_SINGLE, SCOPE_SEVERAL, SCOPE_EVERYWHERE];

export const STARTED_UNKNOWN = '';

export const STARTED_OPTIONS = [
  'Just now',
  'Earlier today',
  'In the last few days',
  'More than a week ago',
  'It has always been like this',
];

export const ALREADY_TRIED_OPTIONS = [
  'Reloaded the page',
  'Cleared cache or did a hard refresh',
  'Tried another browser',
  'Tried another device',
  'Signed out and back in',
  'Disabled extensions or ad blocker',
  'Tried a private window',
  'Tried another network or turned off a VPN',
];

export const MAX_LINK_LENGTH = 500;
export const MAX_EMAIL_LENGTH = 254;
export const MIN_DESCRIPTION_LENGTH = 10;
export const SCREENSHOT_ACCEPT = 'image/png,image/jpeg,image/gif,image/webp';

export function getArea(id: string): IssueArea | undefined {
  return AREAS.find((area) => area.id === id);
}
