// @flow
import * as ACTIONS from 'constants/action_types';
// import { handleActions } from 'util/redux-utils';
const reducers = {};

type ArConnectState = {
  status: 'loading' | 'connected' | 'disconnected',
  address?: string,
};

const defaultState: ArConnectState = {
  status: 'loading',
  address: undefined,
  // type: undefined,
  // wallet: null,
};

reducers[ACTIONS.CONNECT_AR_CONNECT] = (state, action) => {
  return {
    ...state,
    status: action.data.status,
    address: action.data.address,
  };
};

reducers[ACTIONS.DISCONNECT_AR_CONNECT] = (state, action) => {
  return {
    ...state,
    status: action.data.status,
    address: action.data.address,
  };
};

reducers[ACTIONS.CHECK_AR_CONNECT_STATUS] = (state, action) => {
  return {
    ...state,
    status: action.data.status,
    address: action.data.address,
  };
};

export default function arConnectReducer(state: ArConnectState = defaultState, action: any) {
  const handler = reducers[action.type];

  if (handler) return handler(state, action);
  return state;
}
