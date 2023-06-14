// @flow
import { produce } from 'immer';
import { handleActions } from 'util/redux-utils';
import * as ACTIONS from 'constants/action_types';
import * as REACTION_TYPES from 'constants/reactions';

const defaultState = {
  fetchingReactions: false,
  reactionsError: undefined,
  reactionsById: {},
};

export default handleActions(
  {
    [ACTIONS.REACTIONS_LIST_STARTED]: state => ({ ...state, fetchingReactions: true }),
    [ACTIONS.REACTIONS_LIST_FAILED]: (state, action) => ({
      ...state,
      reactionsError: action.data,
    }),
    [ACTIONS.REACTIONS_LIST_COMPLETED]: (state, action) => {
      const { claimId, reactions } = action.data;

      return produce(state, (draft) => {
        draft.reactionsById[claimId] = reactions;
        draft.fetchingReactions = false;
      });
    },
    [ACTIONS.REACTIONS_LIKE_COMPLETED]: (state, action) => {
      const { claimId, shouldRemove } = action.data;

      return produce(state, (draft) => {
        draft.reactionsById[claimId].my_reactions[claimId][REACTION_TYPES.LIKE] = shouldRemove ? 0 : 1;
        draft.reactionsById[claimId].my_reactions[claimId][REACTION_TYPES.DISLIKE] = 0;
        draft.fetchingReactions = false;
      });
    },
    [ACTIONS.REACTIONS_DISLIKE_COMPLETED]: (state, action) => {
      const { claimId, shouldRemove } = action.data;

      return produce(state, (draft) => {
        draft.reactionsById[claimId].my_reactions[claimId][REACTION_TYPES.DISLIKE] = shouldRemove ? 0 : 1;
        draft.reactionsById[claimId].my_reactions[claimId][REACTION_TYPES.LIKE] = 0;
        draft.fetchingReactions = false;
      });
    },
  },
  defaultState
);
