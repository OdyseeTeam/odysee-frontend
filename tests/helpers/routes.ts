/**
 * routes.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralised URL constants and builder helpers for Playwright tests.
 * Mirrors ui/constants/pages.ts but produces full paths ready for page.goto().
 *
 * Usage:
 *   import { ROUTES, url } from '../helpers/routes';
 *   await page.goto(ROUTES.home);
 *   await page.goto(ROUTES.search('cats'));
 *   await page.goto(ROUTES.channel('@Odysee'));
 */

// ---------------------------------------------------------------------------
// Base
// ---------------------------------------------------------------------------

export const BASE_URL: string = process.env.BASE_URL ?? 'http://localhost:1337';

/**
 * Prepend BASE_URL to any root-relative path.
 * Accepts paths with or without a leading slash.
 */
export function url(path: string): string {
  const normalised = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${normalised}`;
}

// ---------------------------------------------------------------------------
// Static routes (strings)
// ---------------------------------------------------------------------------

export const ROUTES = {
  // ── Home / Discovery ────────────────────────────────────────────────────
  home: '/',
  discover: '/$/discover',
  following: '/$/following',
  followingDiscover: '/$/following/discover',
  followingManage: '/$/following/manage',
  top: '/$/top',
  livenow: '/$/livenow',
  fyp: '/$/fyp',

  // ── Content categories ──────────────────────────────────────────────────
  gaming: '/$/gaming',
  music: '/$/music',
  news: '/$/news',
  movies: '/$/movies',
  technology: '/$/tech',
  finance: '/$/finance',
  education: '/$/education',
  science: '/$/science',
  sports: '/$/sports',
  wildwest: '/$/wildwest',

  // ── Shorts ──────────────────────────────────────────────────────────────
  shorts: '/$/shorts',

  // ── Auth ────────────────────────────────────────────────────────────────
  signIn: '/$/signin',
  signUp: '/$/signup',
  verify: '/$/verify',
  passwordReset: '/$/resetpassword',
  walletPassword: '/$/walletpassword',

  // ── Settings ────────────────────────────────────────────────────────────
  settings: '/$/settings',
  settingsNotifications: '/$/settings/notifications',
  settingsCreator: '/$/settings/creator',
  settingsBlockMute: '/$/settings/block_and_mute',
  settingsStripeCard: '/$/settings/card',
  settingsStripeAccount: '/$/settings/tip_account',
  settingsOwnComments: '/$/settings/ownComments',
  settingsUpdatePassword: '/$/settings/update_password',

  // ── Publishing ──────────────────────────────────────────────────────────
  upload: '/$/upload',
  post: '/$/post',
  livestream: '/$/livestream',
  livestreamCreate: '/$/livestream/create',
  repost: '/$/repost',

  // ── Library / Playlists ─────────────────────────────────────────────────
  library: '/$/library',
  playlists: '/$/playlists',
  watchHistory: '/$/watchhistory',
  lists: '/$/lists',

  // ── Channels ────────────────────────────────────────────────────────────
  channels: '/$/channels',
  channelNew: '/$/channel/new',
  featuredChannels: '/$/featured_channels',

  // ── Tags ────────────────────────────────────────────────────────────────
  tags: '/$/tags',
  tagsManage: '/$/tags/manage',

  // ── Wallet ──────────────────────────────────────────────────────────────
  wallet: '/$/wallet',
  send: '/$/send',
  receive: '/$/receive',
  swap: '/$/swap',
  buy: '/$/buy',
  paymentAccount: '/$/paymentaccount',
  arAccount: '/$/araccount',
  rewards: '/$/rewards',
  rewardsVerify: '/$/rewards/verify',

  // ── Membership ──────────────────────────────────────────────────────────
  premium: '/$/premium',
  memberships: '/$/memberships',
  creatorMemberships: '/$/memberships/creator',
  membershipSupporter: '/$/memberships/supporter',

  // ── Creator tools ───────────────────────────────────────────────────────
  creatorDashboard: '/$/dashboard',
  youtubeSync: '/$/youtube',

  // ── Misc ────────────────────────────────────────────────────────────────
  notifications: '/$/notifications',
  invite: '/$/invite',
  help: '/$/help',
  report: '/$/report',
  portals: '/$/portals',
  hiddenContent: '/$/hidden',

  // ── Legal ───────────────────────────────────────────────────────────────
  privacyPolicy: '/$/privacypolicy',
  tos: '/$/tos',

  // ──────────────────────────────────────────────────────────────────────────
  // Dynamic route builders
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Full-text search results page.
   * @example ROUTES.search('bitcoin news')
   */
  search: (query: string, extra?: Record<string, string>): string => {
    const params = new URLSearchParams({ q: query, ...extra });
    return `/$/search?${params.toString()}`;
  },

  /**
   * Channel page. Pass the name with or without the leading `@`.
   * @example ROUTES.channel('@Odysee')  →  '/@Odysee'
   */
  channel: (name: string): string => {
    const normalised = name.startsWith('@') ? name : `@${name}`;
    return `/${normalised}`;
  },

  /**
   * A specific tab on a channel page.
   * @example ROUTES.channelTab('@Odysee', 'content')
   */
  channelTab: (name: string, tab: 'content' | 'playlists' | 'about' | 'membership' | 'discussion'): string => {
    const normalised = name.startsWith('@') ? name : `@${name}`;
    return `/${normalised}?tab=${tab}`;
  },

  /**
   * A specific content claim (video, post, etc).
   * @example ROUTES.watch('@Odysee', 'some-video-title')
   */
  watch: (channelName: string, claimName: string): string => {
    const ch = channelName.startsWith('@') ? channelName : `@${channelName}`;
    return `/${ch}/${claimName}`;
  },

  /**
   * A content embed page.
   * @example ROUTES.embed('@Odysee', 'some-video')
   */
  embed: (channelName: string, claimName: string): string => {
    const ch = channelName.startsWith('@') ? channelName : `@${channelName}`;
    return `/$/embed/${ch}/${claimName}`;
  },

  /**
   * Playlist / collection page.
   * @example ROUTES.playlist('abc123')
   */
  playlist: (claimId: string): string => `/$/playlist/${claimId}`,

  /**
   * Portal page.
   * @example ROUTES.portal('some-portal')
   */
  portal: (name: string): string => `/$/portal/${name}`,

  /**
   * Latest content from a channel.
   * @example ROUTES.latest('@Odysee')
   */
  latest: (channelName: string): string => {
    const ch = channelName.startsWith('@') ? channelName : `@${channelName}`;
    return `/${ch}/$/latest`;
  },

  /**
   * Live stream URL for a channel.
   * @example ROUTES.live('@Odysee')
   */
  live: (channelName: string): string => {
    const ch = channelName.startsWith('@') ? channelName : `@${channelName}`;
    return `/${ch}/$/live`;
  },
} as const;

// ---------------------------------------------------------------------------
// Type helpers
// ---------------------------------------------------------------------------

/** All static string routes (excludes the function builders) */
export type StaticRoute = {
  [K in keyof typeof ROUTES]: (typeof ROUTES)[K] extends string ? (typeof ROUTES)[K] : never;
}[keyof typeof ROUTES];
