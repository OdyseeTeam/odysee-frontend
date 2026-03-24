import * as ACTIONS from 'constants/action_types';
import { handleActions } from 'util/redux-utils';

const defaultState = {
  loading: false,
  filteredData: {},
};

export const filteredReducer = handleActions(
  {
    [ACTIONS.FETCH_FILTERED_CONTENT_STARTED]: (state) => ({
      ...state,
      loading: true,
    }),
    [ACTIONS.FETCH_FILTERED_CONTENT_COMPLETED]: (state, action) => {
      const { filteredData } = action.data;
      return {
        ...state,
        loading: false,
        filteredData,
      };
    },
    [ACTIONS.FETCH_FILTERED_CONTENT_FAILED]: (state, action) => {
      const { error } = action.data;

      return {
        ...state,
        loading: false,
        fetchingFilteredDataError: error,
      };
    },
  },
  defaultState
);
