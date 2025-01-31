// @flow
import * as ACTIONS from 'constants/action_types';

const reducers = {};

const defaultState: ArConnectState = {
  status: 'loading',
  address: undefined,
  balance: 0,
};

reducers[ACTIONS.CONNECT_AR_CONNECT] = (state, action) => {
  return {
    ...state,
    status: action.data.status,
    address: action.data.address,
    balance: action.data.balance,
  };
};

reducers[ACTIONS.DISCONNECT_AR_CONNECT] = (state, action) => {
  return {
    ...state,
    status: action.data.status,
    address: action.data.address,
    balance: 0,
  };
};

reducers[ACTIONS.CHECK_AR_CONNECT_STATUS] = (state, action) => {
  return {
    ...state,
    status: action.data.status,
    address: action.data.address,
    balance: action.data.balance,
  };
};

export default function arConnectReducer(state: ArConnectState = defaultState, action: any) {
  const handler = reducers[action.type];

  if (handler) return handler(state, action);
  return state;
}
