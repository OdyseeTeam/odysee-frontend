// @flow
import { createSelector } from 'reselect';

const selectState = (state: { shorts: ShortsState }) => state.shorts || {};

export const selectShortsSidePanelOpen = createSelector(selectState, (state: ShortsState) => state.sidePanelOpen);

export const selectShortsPlaylist = createSelector(selectState, (state: ShortsState) => state.playlist || []);

export const selectShortsViewMode = createSelector(selectState, (state: ShortsState) => state.viewMode || 'related');
