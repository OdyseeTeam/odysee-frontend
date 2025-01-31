// @flow
import * as ACTIONS from 'constants/action_types';

const reducers = {};

export type WalletBalance = {
  ar?: string,
  u?: string,
};
export type ArWalletState = {
  wallet: ?{},
  address: ?string,
  error: ?string,
  connecting: boolean,
  balance: WalletBalance,
  nagged: boolean,
};

const defaultState: ArWalletState = {
  wallet: undefined,
  address: undefined,
  error: undefined,
  connecting: false,
  balance: {},
  nagged: false,
};

reducers[ACTIONS.ARCONNECT_STARTED] = (state, action) => ({ ...state, connecting: true });
reducers[ACTIONS.ARCONNECT_SUCCESS] = (state, action) => ({
  ...state,
  wallet: action.data.wallet,
  address: action.data.address,
  connecting: false,
  error: null,
});
reducers[ACTIONS.ARCONNECT_FAILURE] = (state, action) => ({
  ...state,
  error: action.data,
  connecting: false,
  wallet: null,
  address: null,
  balance: {},
});

reducers[ACTIONS.ARCONNECT_NAGGED] = (state, action) => ({ ...state, nagged: true });

export default function arwalletReducer(state: ArWalletState = defaultState, action: any) {
  const handler = reducers[action.type];
  if (handler) return handler(state, action);
  return state;
}
