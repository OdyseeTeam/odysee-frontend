// @flow
import { createSelector } from 'reselect';

const selectState = (state) => state.shorts || {};

export const selectShortsSidePanelOpen = createSelector(selectState, (state) => state.sidePanelOpen);

export const selectShortsPlaylist = createSelector(selectState, (state) => state.playlist || []);

export const selectShortsViewMode = createSelector(selectState, (state) => state.viewMode || 'related');

export const selectShortsAutoplay = createSelector(selectState, (state) => state.autoplayNextShort);
