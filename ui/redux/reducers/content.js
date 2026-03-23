/**
 * Content, a.k.a. "player" states.
 */

// @flow
import * as ACTIONS from 'constants/action_types';

const reducers = {};

const defaultState: ContentState = {
  primaryUri: null, // Top level content uri triggered from the file page
  playingUri: { uri: undefined, collection: {} },
  uriAccessKeys: {},
  positions: {},
  history: [],
  fetchingRemoteHistory: false,
  remoteHistoryLastFetched: null,
  lastViewedAnnouncement: [],
  recsysEntries: {},
  autoplayCountdownUri: null,
};

reducers[ACTIONS.SET_PRIMARY_URI] = (state, action) =>
  Object.assign({}, state, {
    primaryUri: action.data.uri,
  });

reducers[ACTIONS.SET_PLAYING_URI] = (state, action) =>
  Object.assign({}, state, { playingUri: { ...action.data, primaryUri: state.primaryUri } });

reducers[ACTIONS.SAVE_URI_ACCESS_KEY] = (state: ContentState, action: SaveUriAccessKeyAction) => {
  const { uri, accessKey: newKey } = action.data;

  const cachedKey = state.uriAccessKeys[uri];
  if (cachedKey && cachedKey.signature === newKey.signature && cachedKey.signature_ts === newKey.signature_ts) {
    return state;
  }

  return {
    ...state,
    uriAccessKeys: {
      ...state.uriAccessKeys,
      [uri]: { ...newKey },
    },
  };
};

reducers[ACTIONS.SET_CONTENT_POSITION] = (state, action) => {
  const { claimId, outpoint, position } = action.data;
  return {
    ...state,
    positions: {
      ...state.positions,
      [claimId]: {
        ...state.positions[claimId],
        [outpoint]: position,
      },
    },
  };
};

reducers[ACTIONS.CLEAR_CONTENT_POSITION] = (state, action) => {
  const { claimId, outpoint } = action.data;

  if (state.positions[claimId]) {
    const numOutpoints = Object.keys(state.positions[claimId]).length;
    if (numOutpoints <= 1) {
      let positions = { ...state.positions };
      delete positions[claimId];

      return {
        ...state,
        positions: positions,
      };
    } else {
      let outpoints = { ...state.positions[claimId] };
      delete outpoints[outpoint];

      return {
        ...state,
        positions: {
          ...state.positions,
          [claimId]: outpoints,
        },
      };
    }
  } else {
    return state;
  }
};

reducers[ACTIONS.SET_CONTENT_LAST_VIEWED] = (state, action) => {
  const { uri, lastViewed } = action.data;
  const { history } = state;
  const historyObj = { uri, lastViewed };
  const index = history.findIndex((i) => i.uri === uri);
  const newHistory =
    index === -1
      ? [historyObj].concat(history)
      : [historyObj].concat(history.slice(0, index), history.slice(index + 1));
  return { ...state, history: [...newHistory] };
};

reducers[ACTIONS.CLEAR_CONTENT_HISTORY_URI] = (state, action) => {
  const { uri } = action.data;
  const { history } = state;
  const index = history.findIndex((i) => i.uri === uri);
  return index === -1
    ? state
    : {
        ...state,
        history: history.slice(0, index).concat(history.slice(index + 1)),
      };
};

reducers[ACTIONS.CLEAR_CONTENT_HISTORY_ALL] = (state) => ({ ...state, history: [] });

reducers[ACTIONS.FETCH_VIEW_HISTORY_STARTED] = (state) => ({
  ...state,
  fetchingRemoteHistory: true,
});

reducers[ACTIONS.FETCH_VIEW_HISTORY_COMPLETED] = (state, action) => {
  const { remoteHistory, remotePositions } = action.data;
  const { history, positions } = state;

  // Build a map of existing local history URIs for dedup
  const localUriSet = new Set(history.map((h) => h.uri));

  // Merge: remote entries not already in local get appended after local entries
  const newEntries = [];
  for (const entry of remoteHistory) {
    if (!localUriSet.has(entry.uri)) {
      newEntries.push(entry);
    }
  }

  // For entries that exist in both, update lastViewed if remote is more recent
  const updatedHistory = history.map((localEntry) => {
    const remoteEntry = remoteHistory.find((r) => r.uri === localEntry.uri);
    if (remoteEntry && remoteEntry.lastViewed > localEntry.lastViewed) {
      return { ...localEntry, lastViewed: remoteEntry.lastViewed };
    }
    return localEntry;
  });

  // Combine: local (possibly updated) + new remote entries, sorted by lastViewed desc
  const mergedHistory = updatedHistory.concat(newEntries);
  mergedHistory.sort((a, b) => b.lastViewed - a.lastViewed);

  // Merge remote positions: only fill in where local has no position
  const mergedPositions = { ...positions };
  if (remotePositions) {
    for (const claimId of Object.keys(remotePositions)) {
      const remotePos = remotePositions[claimId];
      if (remotePos > 0 && !mergedPositions[claimId]) {
        // Store under a 'remote' key since we don't have the outpoint
        mergedPositions[claimId] = { ...(mergedPositions[claimId] || {}), remote: remotePos };
      }
    }
  }

  return {
    ...state,
    history: mergedHistory,
    positions: mergedPositions,
    fetchingRemoteHistory: false,
    remoteHistoryLastFetched: Date.now(),
  };
};

reducers[ACTIONS.FETCH_VIEW_HISTORY_FAILED] = (state) => ({
  ...state,
  fetchingRemoteHistory: false,
});

reducers[ACTIONS.SET_LAST_VIEWED_ANNOUNCEMENT] = (state, action) => {
  // Since homepages fall back to English if undefined, use an array instead of
  // an object to simplify the logic and overall code-changes.
  // The only flaw is when a particular homepage keeps producing new
  // announcements, the history of other homepages will be pushed out. This
  // scenario is unlikely, so just keep a reasonably large history size to
  // account for this scenario.
  const N_ENTRIES_TO_KEEP = 25;
  const hash = action.data;

  if (hash === 'clear') {
    return { ...state, lastViewedAnnouncement: [] };
  }

  return { ...state, lastViewedAnnouncement: [hash].concat(state.lastViewedAnnouncement).slice(0, N_ENTRIES_TO_KEEP) };
};

reducers[ACTIONS.SET_RECSYS_ENTRIES] = (state, action) => ({ ...state, recsysEntries: action.data });

reducers[ACTIONS.SHOW_AUTOPLAY_COUNTDOWN] = (state, action) => {
  const { uri, show } = action.data;
  return { ...state, autoplayCountdownUri: show ? uri : null };
};

reducers[ACTIONS.USER_STATE_POPULATE] = (state, action) => {
  const { lastViewedAnnouncement } = action.data;
  // Convert legacy string format to an array:
  const newValue = typeof lastViewedAnnouncement === 'string' ? [lastViewedAnnouncement] : lastViewedAnnouncement || [];
  return { ...state, lastViewedAnnouncement: newValue };
};

export default function reducer(state: ContentState = defaultState, action: any) {
  const handler = reducers[action.type];
  if (handler) return handler(state, action);
  return state;
}
