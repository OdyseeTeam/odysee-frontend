import { Lbryio } from 'lbryinc';
import * as ACTIONS from 'constants/action_types';

const CHECK_FILTERED_CONTENT_INTERVAL = 60 * 60 * 1000;

export function doFetchFilteredData() {
  return (dispatch) => {
    dispatch({
      type: ACTIONS.FETCH_FILTERED_CONTENT_STARTED,
    });

    const success = (data) => {
      let filteredDataMap = {};
      if (data) {
        data.map((entry) => {
          filteredDataMap[entry.claim_id] = { tag_name: entry.tag_name };
        });
      }

      dispatch({
        type: ACTIONS.FETCH_FILTERED_CONTENT_COMPLETED,
        data: {
          filteredData: filteredDataMap,
        },
      });
    };

    const failure = ({ error }) => {
      dispatch({
        type: ACTIONS.FETCH_FILTERED_CONTENT_FAILED,
        data: {
          error,
        },
      });
    };

    Lbryio.call('file', 'list_filtered', { auth_token: '', with_claim_id: 1 }, 'get').then(success, failure);
  };
}

export function doFilteredDataSubscribe() {
  return (dispatch) => {
    dispatch(doFetchFilteredData());
    setInterval(() => dispatch(doFetchFilteredData()), CHECK_FILTERED_CONTENT_INTERVAL);
  };
}
