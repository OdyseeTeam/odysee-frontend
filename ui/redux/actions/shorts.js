// @flow
import * as ACTIONS from 'constants/action_types';

export function doToggleShortsSidePanel() {
  return {
    type: ACTIONS.TOGGLE_SHORTS_SIDE_PANEL,
  };
}

export function doSetShortsSidePanel(isOpen: boolean) {
  return {
    type: ACTIONS.SET_SHORTS_SIDE_PANEL,
    data: {
      isOpen,
    },
  };
}

export function doCloseShortsSidePanelOnEscape() {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const { sidePanelOpen } = state.shorts;

    if (sidePanelOpen) {
      dispatch(doSetShortsSidePanel(false));
    }
  };
}

export function doSetShortsPlaylist(uris: Array<string>) {
  return {
    type: ACTIONS.SET_SHORTS_PLAYLIST,
    data: {
      uris,
    },
  };
}

export function doClearShortsPlaylist() {
  return {
    type: ACTIONS.CLEAR_SHORTS_PLAYLIST,
  };
}

export const doSetShortsViewMode = (mode: string) => ({
  type: 'SET_SHORTS_VIEW_MODE',
  data: mode,
});
