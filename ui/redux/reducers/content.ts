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
  positions: {},
  history: [],
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
        // Shallow copy: the recsys module mutates its entries object directly
        // outside of Redux, so we must not let Immer freeze the original reference.
        state.recsysEntries = { ...action.data };
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
