// @flow
import { createSelector } from 'reselect';

const selectState = (state: { shorts: ShortsState }) => state.shorts || {};

export const selectShortsSidePanelOpen = createSelector(selectState, (state: ShortsState) => state.sidePanelOpen);
