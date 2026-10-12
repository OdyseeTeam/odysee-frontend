/**
 * Content, a.k.a. "player" states.
 */
import { createSlice } from '@reduxjs/toolkit';
import * as ACTIONS from 'constants/action_types';

const defaultState: ContentState = {
  primaryUri: null,
  playingUri: {
    uri: undefined,
    collection: {},
  },
  uriAccessKeys: {},
  collectionLastPlayedUris: {},
  positions: {},
  history: [],
  fetchingRemoteHistory: false,
  remoteHistoryLastFetched: null,
  lastViewedAnnouncement: [],
  recsysEntries: {},
  autoplayCountdownUri: null,
};

const contentSlice = createSlice({
  name: 'content',
  initialState: defaultState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(ACTIONS.SET_PRIMARY_URI, (state, action: any) => {
        state.primaryUri = action.data.uri;
      })
      .addCase(ACTIONS.SET_PLAYING_URI, (state, action: any) => {
        state.playingUri = { ...action.data, primaryUri: state.primaryUri };
      })
      .addCase(ACTIONS.SAVE_URI_ACCESS_KEY, (state, action: any) => {
        const { uri, accessKey: newKey } = action.data;
        const cachedKey = state.uriAccessKeys[uri];
        if (cachedKey && cachedKey.signature === newKey.signature && cachedKey.signature_ts === newKey.signature_ts) {
          return;
        }
        state.uriAccessKeys[uri] = { ...newKey };
      })
      .addCase(ACTIONS.SET_COLLECTION_LAST_PLAYED_URI, (state, action: any) => {
        const { collectionId, uri } = action.data;
        if (!collectionId || !uri) return;
        state.collectionLastPlayedUris[collectionId] = uri;
      })
      .addCase(ACTIONS.SET_CONTENT_POSITION, (state, action: any) => {
        const { claimId, outpoint, position } = action.data;
        if (!state.positions[claimId]) state.positions[claimId] = {};
        state.positions[claimId][outpoint] = position;
      })
      .addCase(ACTIONS.CLEAR_CONTENT_POSITION, (state, action: any) => {
        const { claimId, outpoint } = action.data;
        if (state.positions[claimId]) {
          const numOutpoints = Object.keys(state.positions[claimId]).length;
          if (numOutpoints <= 1) {
            delete state.positions[claimId];
          } else {
            delete state.positions[claimId][outpoint];
          }
        }
      })
      .addCase(ACTIONS.SET_CONTENT_LAST_VIEWED, (state, action: any) => {
        const { uri, lastViewed } = action.data;
        const historyObj = { uri, lastViewed };
        const index = state.history.findIndex((i: any) => i.uri === uri);
        if (index !== -1) {
          state.history.splice(index, 1);
        }
        state.history.unshift(historyObj);
      })
      .addCase(ACTIONS.CLEAR_CONTENT_HISTORY_URI, (state, action: any) => {
        const { uri } = action.data;
        const index = state.history.findIndex((i: any) => i.uri === uri);
        if (index !== -1) {
          state.history.splice(index, 1);
        }
      })
      .addCase(ACTIONS.CLEAR_CONTENT_HISTORY_ALL, (state) => {
        state.history = [];
      })
      .addCase(ACTIONS.FETCH_VIEW_HISTORY_STARTED, (state) => {
        state.fetchingRemoteHistory = true;
      })
      .addCase(ACTIONS.FETCH_VIEW_HISTORY_COMPLETED, (state, action: any) => {
        const { remoteHistory, remotePositions, fetchedAt } = action.data;

        // Keep the newest entry per uri in case the remote list repeats one
        const remoteByUri = new Map();
        for (const entry of remoteHistory) {
          const existing = remoteByUri.get(entry.uri);
          if (!existing || entry.lastViewed > existing.lastViewed) {
            remoteByUri.set(entry.uri, entry);
          }
        }

        // Local entries win, but take the remote lastViewed when it is more recent
        for (const localEntry of state.history) {
          const remoteEntry = remoteByUri.get(localEntry.uri);
          if (remoteEntry) {
            if (remoteEntry.lastViewed > localEntry.lastViewed) {
              localEntry.lastViewed = remoteEntry.lastViewed;
            }
            remoteByUri.delete(localEntry.uri);
          }
        }

        state.history.push(...remoteByUri.values());
        state.history.sort((a: any, b: any) => b.lastViewed - a.lastViewed);

        // The remote has no outpoint, so it is stored under 'remote'. Refresh entries that only hold a remote
        // position, but never touch local ones: a leftover 'remote' key would outlive a locally cleared position.
        if (remotePositions) {
          for (const claimId of Object.keys(remotePositions)) {
            const remotePos = remotePositions[claimId];
            const existing = state.positions[claimId];
            const isRemoteOnly = existing && Object.keys(existing).length === 1 && 'remote' in existing;
            if (remotePos > 0 && (!existing || isRemoteOnly)) {
              state.positions[claimId] = { remote: remotePos };
            }
          }
        }

        state.fetchingRemoteHistory = false;
        state.remoteHistoryLastFetched = fetchedAt;
      })
      .addCase(ACTIONS.FETCH_VIEW_HISTORY_FAILED, (state) => {
        state.fetchingRemoteHistory = false;
      })
      .addCase(ACTIONS.SET_LAST_VIEWED_ANNOUNCEMENT, (state, action: any) => {
        const N_ENTRIES_TO_KEEP = 25;
        const hash = action.data;
        if (hash === 'clear') {
          state.lastViewedAnnouncement = [];
        } else {
          state.lastViewedAnnouncement.unshift(hash);
          if (state.lastViewedAnnouncement.length > N_ENTRIES_TO_KEEP) {
            state.lastViewedAnnouncement.length = N_ENTRIES_TO_KEEP;
          }
        }
      })
      .addCase(ACTIONS.SET_RECSYS_ENTRIES, (state, action: any) => {
        // action.data is already deep-cloned in recsys.saveEntries() to prevent
        // Immer from freezing the live recsys.entries object.
        state.recsysEntries = action.data;
      })
      .addCase(ACTIONS.SHOW_AUTOPLAY_COUNTDOWN, (state, action: any) => {
        const { uri, show } = action.data;
        state.autoplayCountdownUri = show ? uri : null;
      })
      .addCase(ACTIONS.USER_STATE_POPULATE, (state, action: any) => {
        const { lastViewedAnnouncement } = action.data;
        state.lastViewedAnnouncement =
          typeof lastViewedAnnouncement === 'string' ? [lastViewedAnnouncement] : lastViewedAnnouncement || [];
      });
  },
});

export default contentSlice.reducer;
