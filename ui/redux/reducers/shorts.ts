import { createSlice } from '@reduxjs/toolkit';
import * as ACTIONS from 'constants/action_types';

const initialState = {
  sidePanelOpen: false,
  viewMode: 'related',
  autoplayNextShort: false,
  playlist: [] as string[],
};

const shortsSlice = createSlice({
  name: 'shorts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(ACTIONS.TOGGLE_SHORTS_SIDE_PANEL, (state) => {
        state.sidePanelOpen = !state.sidePanelOpen;
      })
      .addCase(ACTIONS.SET_SHORTS_SIDE_PANEL, (state, action: any) => {
        state.sidePanelOpen = action.data.isOpen;
      })
      .addCase(ACTIONS.SET_SHORTS_PLAYLIST, (state, action: any) => {
        state.playlist = action.data.uris;
      })
      .addCase(ACTIONS.CLEAR_SHORTS_PLAYLIST, (state) => {
        state.playlist = [];
      })
      .addCase(ACTIONS.SET_SHORTS_VIEW_MODE, (state, action: any) => {
        state.viewMode = action.data;
      })
      .addCase(ACTIONS.TOGGLE_SHORTS_AUTOPLAY, (state) => {
        state.autoplayNextShort = !state.autoplayNextShort;
      })
      .addCase(ACTIONS.SET_SHORTS_AUTOPLAY, (state, action: any) => {
        state.autoplayNextShort = action.data;
      });
  },
});

export default shortsSlice.reducer;
