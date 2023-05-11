// @flow
import * as ACTIONS from 'constants/action_types';
import { handleActions } from 'util/redux-utils';
import { getOldFormatForLbryUri } from 'util/lbryURI';

const defaultState: BlocklistState = {
  blockedChannels: [],
  geoBlockedList: undefined,
  gblFetchFailed: false,
};

export default handleActions(
  {
    [ACTIONS.TOGGLE_BLOCK_CHANNEL]: (state: BlocklistState, action: BlocklistAction): BlocklistState => {
      const { blockedChannels } = state;
      const { uri } = action.data;
      let newBlockedChannels = blockedChannels.slice();

      if (newBlockedChannels.includes(uri)) {
        newBlockedChannels = newBlockedChannels.filter((id) => id !== uri);
      } else {
        newBlockedChannels.unshift(uri);
      }

      return {
        ...state,
        blockedChannels: newBlockedChannels,
      };
    },
    [ACTIONS.FETCH_GBL_DONE]: (state: BlocklistState, action: any): BlocklistState => {
      return {
        ...state,
        gblFetchFailed: false,
        geoBlockedList: action.data,
      };
    },
    [ACTIONS.FETCH_GBL_FAILED]: (state: BlocklistState, action: any): BlocklistState => {
      return { ...state, gblFetchFailed: true };
    },
    [ACTIONS.USER_STATE_POPULATE]: (state: BlocklistState, action: { data: { blocked: ?Array<string> } }) => {
      const { blocked } = action.data;
      const sanitizedBlocked = blocked && blocked.filter((e) => typeof e === 'string');
      const parsedBlocked =
        sanitizedBlocked && Array.from(new Set(sanitizedBlocked.map((uri) => getOldFormatForLbryUri(uri))));
      return {
        ...state,
        blockedChannels: parsedBlocked || state.blockedChannels,
      };
    },
  },
  defaultState
);
