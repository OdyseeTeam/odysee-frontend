// @flow
import * as ACTIONS from 'constants/action_types';
import { handleActions } from 'util/redux-utils';

const defaultState = {
  sidePanelOpen: false,
  viewMode: 'related',
  autoplayNextShort: false,
  playlist: [],
};

export default handleActions(
  {
    [ACTIONS.TOGGLE_SHORTS_SIDE_PANEL]: (state) => {
      return {
        ...state,
        sidePanelOpen: !state.sidePanelOpen,
      };
    },
    [ACTIONS.SET_SHORTS_SIDE_PANEL]: (state, action) => {
      return {
        ...state,
        sidePanelOpen: action.data.isOpen,
      };
    },
    [ACTIONS.SET_SHORTS_PLAYLIST]: (state, action) => {
      return {
        ...state,
        playlist: action.data.uris,
      };
    },
    [ACTIONS.CLEAR_SHORTS_PLAYLIST]: (state) => {
      return {
        ...state,
        playlist: [],
      };
    },
    [ACTIONS.SET_SHORTS_VIEW_MODE]: (state, action) => {
      return {
        ...state,
        viewMode: action.data,
      };
    },
    [ACTIONS.TOGGLE_SHORTS_AUTOPLAY]: (state) => {
      return {
        ...state,
        autoplayNextShort: !state.autoplayNextShort,
      };
    },
    [ACTIONS.SET_SHORTS_AUTOPLAY]: (state, action) => {
      return {
        ...state,
        autoplayNextShort: action.data,
      };
    },
  },
  defaultState
);
