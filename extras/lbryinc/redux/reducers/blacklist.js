import * as ACTIONS from 'constants/action_types';
import { handleActions } from 'util/redux-utils';

const defaultState = {
  fetchingBlackListedData: false,
  fetchingBlackListedDataSucceed: undefined,
  blackListedData: {},
};

export const blacklistReducer = handleActions(
  {
    [ACTIONS.FETCH_BLACK_LISTED_CONTENT_STARTED]: (state) => ({
      ...state,
      fetchingBlackListedData: true,
    }),
    [ACTIONS.FETCH_BLACK_LISTED_CONTENT_COMPLETED]: (state, action) => {
      const { blackListedData, success } = action.data;
      return {
        ...state,
        fetchingBlackListedData: false,
        fetchingBlackListedDataSucceed: success,
        blackListedData,
      };
    },
    [ACTIONS.FETCH_BLACK_LISTED_CONTENT_FAILED]: (state, action) => {
      const { error, success } = action.data;

      return {
        ...state,
        fetchingBlackListedData: false,
        fetchingBlackListedDataSucceed: success,
        fetchingBlackListedDataError: error,
      };
    },
  },
  defaultState
);
