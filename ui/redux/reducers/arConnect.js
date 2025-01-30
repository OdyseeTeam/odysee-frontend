// @flow
import * as ACTIONS from 'constants/action_types';
// import { handleActions } from 'util/redux-utils';
const reducers = {};

const defaultState: ArConnectState = {
  connected: false,
  address: undefined,
  // type: undefined,
  // wallet: null,
};

reducers[ACTIONS.CONNECT_AR_CONNECT] = (state, action) => {
  return {
    ...state,
    connected: action.data.connected,
    address: action.data.address,
  };
};

reducers[ACTIONS.DISCONNECT_AR_CONNECT] = (state, action) => {
  return {
    ...state,
    connected: action.data.connected,
    address: action.data.address,
  };
};

export default function arConnectReducer(state: ArConnectState = defaultState, action: any) {
  const handler = reducers[action.type];
  if (handler) return handler(state, action);
  return state;
}
