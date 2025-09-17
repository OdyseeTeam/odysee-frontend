// @flow
import * as ACTIONS from 'constants/action_types';
import { handleActions } from 'util/redux-utils';

const defaultState: ShortsState = {
  sidePanelOpen: false,
};

export default handleActions(
  {
    [ACTIONS.TOGGLE_SHORTS_SIDE_PANEL]: (state: ShortsState): ShortsState => {
      return {
        ...state,
        sidePanelOpen: !state.sidePanelOpen,
      };
    },
    [ACTIONS.SET_SHORTS_SIDE_PANEL]: (state: ShortsState, action: { data: { isOpen: boolean } }): ShortsState => {
      return {
        ...state,
        sidePanelOpen: action.data.isOpen,
      };
    },
  },
  defaultState
);
