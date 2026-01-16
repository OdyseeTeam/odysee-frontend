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
  type: ACTIONS.SET_SHORTS_VIEW_MODE,
  data: mode,
});

export const doToggleShortsAutoplay = () => ({
  type: ACTIONS.TOGGLE_SHORTS_AUTOPLAY,
});

export const doSetShortsAutoplay = (enabled: boolean) => ({
  type: ACTIONS.SET_SHORTS_AUTOPLAY,
  data: enabled,
});
