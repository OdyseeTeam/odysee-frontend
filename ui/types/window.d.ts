/**
 * Window interface extensions.
 *
 * Declares custom properties attached to window throughout the app.
 */

interface Window {
  // -- Redux / App --
  store: any;
  persistor: any;
  app: any;

  // -- Player --
  player: any;
  pendingSeekTime?: number;
  videoFps?: number;
  __playerFullscreenTarget?: Element | null;

  // -- i18n --
  i18n_messages: Record<string, string>;
  new_strings: Record<string, boolean>;
  app_strings: Record<string, string>;

  // -- Homepages --
  homepages: any;

  // -- Analytics --
  gtag?: (...args: any[]) => void;

  // -- Chromecast --
  __onGCastApiAvailable?: (available: boolean) => void;
  cast?: any;
  chrome?: any;

  // -- Wander (Arweave wallet) --
  wanderInstance?: any;

  // -- Cookie consent --
  Optanon?: any;

  // -- Inline attachment (image upload in textareas) --
  inlineAttachment?: any;

  // -- Pending navigation / UI state --
  pendingActiveChannel?: string;
  pendingLinkedCommentScroll?: boolean;
  pendingMembership?: any;
  CATEGORY_PAGE_TITLE?: Record<string, string> | null;
  clearLastViewedAnnouncement?: () => void;
  beforeUnloadMap?: Record<string, any>;
  __shortsAutoPlayNext?: boolean;

  // -- Service Worker --
  registration?: ServiceWorkerRegistration;
  skipWaiting?: () => void;
  clients?: any;

  // -- Browser compat --
  MSStream?: any;
  operamini?: any;
}
