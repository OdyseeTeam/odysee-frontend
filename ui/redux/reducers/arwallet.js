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
  tippingStatusById: { [string]: string }, // started, errored, complete/deleted
};

const defaultState: ArWalletState = {
  wallet: undefined,
  address: undefined,
  error: undefined,
  connecting: false,
  balance: {},
  nagged: false,
  tippingStatusById: {},
};

reducers[ACTIONS.ARCONNECT_DISCONNECT] = (state, action) => ({
  ...state,
  wallet: undefined,
  address: undefined,
  connecting: false,
  balance: {},
  error: null,
});
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

reducers[ACTIONS.AR_TIP_STATUS_STARTED] = (state, action) => {
  const { tippingStatusById } = state;
  const { claimId } = action.data;
  const a = { ...tippingStatusById };
  a[claimId] = 'started';
  return { ...state, tippingStatusById: a };
};

reducers[ACTIONS.AR_TIP_STATUS_ERROR] = (state, action) => {
  const { tippingStatusById } = state;
  const { claimId } = action.data;
  const a = { ...tippingStatusById };
  a[claimId] = 'error'; // can retry
  return { ...state, tippingStatusById: a };
};

reducers[ACTIONS.AR_TIP_STATUS_SUCCESS] = (state, action) => {
  const { tippingStatusById } = state;
  const { claimId } = action.data;
  const a = { ...tippingStatusById };
  delete a[claimId];
  return { ...state, tippingStatusById: a };
};

export default function arwalletReducer(state: ArWalletState = defaultState, action: any) {
  const handler = reducers[action.type];
  if (handler) return handler(state, action);
  return state;
}
