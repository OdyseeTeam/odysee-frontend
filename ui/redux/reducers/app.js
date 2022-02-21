// @flow
import * as ACTIONS from 'constants/action_types';

const reducers = {};

export type SnackBar = {
  message: string,
  linkText: string,
  linkTarget: string,
  isError: boolean,
};

export type AppState = {
  isLoaded: boolean,
  modal: ?string,
  modalProps: mixed,
  platform: string,
  daemonVersionMatched: ?boolean,
  hasSignature: boolean,
  badgeNumber: number,
  volume: number,
  autoUpdateDeclined: boolean,
  modalsAllowed: boolean,
  upgradeDownloading: ?boolean,
  upgradeDownloadComplete: ?boolean,
  checkUpgradeTimer: ?number,
  isUpgradeAvailable: ?boolean,
  isReloadRequired: ?boolean,
  hasClickedComment: boolean,
  enhancedLayout: boolean,
  splashAnimationEnabled: boolean,
  searchOptionsExpanded: boolean,
  isPasswordSaved: boolean,
  welcomeVersion: number,
  allowAnalytics: boolean,
  hasNavigated: boolean,
  interestedInYoutubeSync: boolean,
  activeChannel: ?string,
  incognito: boolean,
  mobilePlayerDimensions?: { height: number, width: number },
};

const defaultState: AppState = {
  isLoaded: false,
  modal: null,
  modalProps: {},
  platform: process.platform,
  daemonVersionMatched: null,
  hasSignature: false,
  badgeNumber: 0,
  volume: 1,
  muted: false,
  autoUpdateDeclined: false,
  modalsAllowed: true,
  hasClickedComment: false,
  upgradeDownloading: undefined,
  upgradeDownloadComplete: undefined,
  checkUpgradeTimer: undefined,
  isUpgradeAvailable: undefined,
  isReloadRequired: undefined,
  enhancedLayout: false,
  splashAnimationEnabled: true,
  searchOptionsExpanded: false,
  currentScroll: 0,
  scrollHistory: [0],
  isPasswordSaved: false,
  welcomeVersion: 0.0,
  allowAnalytics: false,
  hasNavigated: false,
  interestedInYoutubeSync: false,
  activeChannel: undefined,
  incognito: false,
  mobilePlayerDimensions: undefined,
};

// @@router comes from react-router
// This action is dispatched any time a user navigates forward or back
try {
  defaultState.volume = Number(sessionStorage.getItem('volume') || 1);
} catch (e) {}

reducers['@@router/LOCATION_CHANGE'] = (state, action) => {
  const { currentScroll } = state;
  const scrollHistory = (state.scrollHistory && state.scrollHistory.slice()) || [];
  const { action: name } = action.payload;
  let newCurrentScroll = currentScroll;
  if (name === 'PUSH') {
    scrollHistory.push(window.scrollY);
    newCurrentScroll = 0;
  } else if (name === 'POP') {
    newCurrentScroll = scrollHistory[scrollHistory.length - 1];
    scrollHistory.pop();
  }

  return {
    ...state,
    scrollHistory,
    currentScroll: newCurrentScroll,
  };
};

reducers[ACTIONS.PASSWORD_SAVED] = (state, action) =>
  Object.assign({}, state, {
    isPasswordSaved: action.data,
  });

reducers[ACTIONS.CHANGE_MODALS_ALLOWED] = (state, action) =>
  Object.assign({}, state, {
    modalsAllowed: action.data.modalsAllowed,
  });

reducers[ACTIONS.MEDIA_PLAY] = (state) =>
  Object.assign({}, state, {
    modalsAllowed: false,
  });

reducers[ACTIONS.MEDIA_PAUSE] = (state) =>
  Object.assign({}, state, {
    modalsAllowed: true,
  });

reducers[ACTIONS.SET_PLAYING_URI] = (state, action) => {
  if (action.data.uri === null) {
    return Object.assign({}, state, {
      modalsAllowed: true,
    });
  }
  return state;
};

reducers[ACTIONS.RELOAD_REQUIRED] = (state, action) =>
  Object.assign({}, state, {
    isReloadRequired: true,
  });

reducers[ACTIONS.DOWNLOADING_COMPLETED] = (state) => {
  const { badgeNumber } = state;

  return Object.assign({}, state, {
    badgeNumber: badgeNumber + 1,
  });
};

reducers[ACTIONS.VOLUME_CHANGED] = (state, action) =>
  Object.assign({}, state, {
    volume: action.data.volume,
  });

reducers[ACTIONS.VOLUME_MUTED] = (state, action) =>
  Object.assign({}, state, {
    muted: action.data.muted,
  });

reducers[ACTIONS.HISTORY_NAVIGATE] = (state) =>
  Object.assign({}, state, {
    modal: undefined,
    modalProps: {},
  });

reducers[ACTIONS.ADD_COMMENT] = (state) =>
  Object.assign({}, state, {
    hasClickedComment: true,
  });

reducers[ACTIONS.SHOW_MODAL] = (state, action) =>
  Object.assign({}, state, {
    modal: action.data.id,
    modalProps: action.data.modalProps,
  });

reducers[ACTIONS.SET_WELCOME_VERSION] = (state, action) =>
  Object.assign({}, state, {
    welcomeVersion: action.data,
  });

reducers[ACTIONS.SET_ALLOW_ANALYTICS] = (state, action) =>
  Object.assign({}, state, {
    allowAnalytics: action.data,
  });

reducers[ACTIONS.SET_HAS_NAVIGATED] = (state, action) =>
  Object.assign({}, state, {
    hasNavigated: action.data,
  });

reducers[ACTIONS.HIDE_MODAL] = (state) =>
  Object.assign({}, state, {
    modal: null,
    modalProps: null,
  });

reducers[ACTIONS.TOGGLE_SEARCH_EXPANDED] = (state) =>
  Object.assign({}, state, {
    searchOptionsExpanded: !state.searchOptionsExpanded,
  });

reducers[ACTIONS.TOGGLE_YOUTUBE_SYNC_INTEREST] = (state, action) => {
  return {
    ...state,
    interestedInYoutubeSync: !state.interestedInYoutubeSync,
  };
};

reducers[ACTIONS.TOGGLE_SPLASH_ANIMATION] = (state, action) => {
  return {
    ...state,
    splashAnimationEnabled: !state.splashAnimationEnabled,
  };
};

reducers[ACTIONS.SET_ACTIVE_CHANNEL] = (state, action) => {
  return {
    ...state,
    activeChannel: action.data.claimId,
  };
};

reducers[ACTIONS.SET_INCOGNITO] = (state, action) => {
  return {
    ...state,
    incognito: action.data.enabled,
  };
};

reducers[ACTIONS.SET_MOBILE_PLAYER_DIMENSIONS] = (state, action) => {
  return {
    ...state,
    mobilePlayerDimensions: action.data.heightWidth,
  };
};

reducers[ACTIONS.USER_STATE_POPULATE] = (state, action) => {
  const { welcomeVersion, allowAnalytics } = action.data;
  return {
    ...state,
    ...(welcomeVersion !== undefined ? { welcomeVersion } : {}),
    ...(allowAnalytics !== undefined ? { allowAnalytics } : {}),
  };
};

reducers[ACTIONS.PURCHASE_URI_FAILED] = (state, action) => {
  return {
    ...state,
    modal: null,
    modalProps: null,
  };
};

export default function reducer(state: AppState = defaultState, action: any) {
  const handler = reducers[action.type];
  if (handler) return handler(state, action);
  return state;
}
