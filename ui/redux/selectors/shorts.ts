import { createSelector } from 'reselect';
import { EMPTY_ARRAY, EMPTY_OBJECT } from 'redux/selectors/empty';

const selectState = (state) => state.shorts || EMPTY_OBJECT;

export const selectShortsSidePanelOpen = createSelector(selectState, (state) => state.sidePanelOpen);
export const selectShortsPlaylist = createSelector(selectState, (state) => state.playlist || EMPTY_ARRAY);
export const selectShortsViewMode = createSelector(selectState, (state) => state.viewMode || 'related');
export const selectShortsAutoplay = createSelector(selectState, (state) => state.autoplayNextShort);
