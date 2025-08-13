import { Lbryio } from 'lbryinc';
import * as ACTIONS from 'constants/action_types';

const CHECK_BLACK_LISTED_CONTENT_INTERVAL = 60 * 60 * 1000;

export function doFetchBlackListedData() {
  return (dispatch) => {
    dispatch({
      type: ACTIONS.FETCH_BLACK_LISTED_CONTENT_STARTED,
    });

    const success = (data) => {
      let blackListedDataMap = {};
      if (data) {
        data.map((entry) => {
          blackListedDataMap[entry.claim_id] = { tag_name: entry.tag_name };
        });
      }

      dispatch({
        type: ACTIONS.FETCH_BLACK_LISTED_CONTENT_COMPLETED,
        data: {
          blackListedData: blackListedDataMap,
          success: true,
        },
      });
    };

    const failure = ({ message: error }) => {
      dispatch({
        type: ACTIONS.FETCH_BLACK_LISTED_CONTENT_FAILED,
        data: {
          error,
          success: false,
        },
      });
    };

    Lbryio.call('file', 'list_blocked', { auth_token: '', with_claim_id: 1 }, 'get').then(success, failure);
  };
}

export function doBlackListedDataSubscribe() {
  return (dispatch) => {
    dispatch(doFetchBlackListedData());
    setInterval(() => dispatch(doFetchBlackListedData()), CHECK_BLACK_LISTED_CONTENT_INTERVAL);
  };
}
