export const FYP_ID = 'fypId';

export const CHANNEL_PAGE = Object.freeze({
  QUERIES: { VIEW: 'view' },
  VIEWS: {
    HOME: 'home',
    CONTENT: 'content',
    PLAYLISTS: 'playlists',
    CHANNELS: 'channels',
    MEMBERSHIP: 'membership',
    DISCUSSION: 'discussion',
    ABOUT: 'about',
    SETTINGS: 'settings',
    EDIT: 'edit',
  },
});

export const COLLECTION_PAGE = Object.freeze({
  QUERIES: { VIEW: 'view' },
  VIEWS: {
    // edit === private/local edits
    EDIT: 'edit',
    // public === public edits/publish playlist
    PUBLISH: 'publish',
    PUBLIC: 'public',
  },
});

export const CHANNEL_SECTIONS_QUERIES = Object.freeze({
  CLAIM_ID: 'claimId',
  SECTION_ID: 'sectionId',
});

export const MODAL = 'modal';
export const MODAL_PARAMS = 'modal_params';
