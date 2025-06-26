// @flow
import * as ACTIONS from 'constants/action_types';

const reducers = {};

export type WalletBalance = {
  ar: string,
  u: string,
  usdc: number,
};

export type ExchangeRates = {
  ar: number,
};

export type ArWalletState = {
  wallet: ?{},
  auth: ?any,
  address: ?string,
  error: ?string,
  connecting: boolean,
  balance: WalletBalance,
  exchangeRates: ExchangeRates,
  fetching: boolean,
  tippingStatusById: { [string]: string }, // started, errored, complete/deleted
};

const defaultState: ArWalletState = {
  wallet: undefined,
  auth: undefined,
  address: undefined,
  error: undefined,
  connecting: false,
  balance: { ar: 0, u: 0, usdc: 0 },
  exchangeRates: { ar: 0 },
  fetching: false,
  tippingStatusById: {},
};

reducers[ACTIONS.ARCONNECT_DISCONNECT] = (state, action) => ({
  ...state,
  wallet: undefined,
  address: undefined,
  connecting: false,
  balance: { ar: 0, u: 0, usdc: 0 },
  error: null,
});

reducers[ACTIONS.ARCONNECT_STARTED] = (state, action) => ({ ...state, connecting: true });

reducers[ACTIONS.ARCONNECT_SUCCESS] = (state, action) => ({
  ...state,
  wallet: action.data.wallet,
  address: action.data.address,
  balance: { ...state.balance, usdc: action.data.usdc, ar: action.data.ar },
  exchangeRates: { ...state.exchangeRates, ar: action.data.usdPerAr },
  fetching: false,
  connecting: false,
  error: null,
});

reducers[ACTIONS.ARCONNECT_FAILURE] = (state, action) => ({
  ...state,
  error: action.data,
  connecting: false,
  wallet: null,
  address: null,
  balance: { ar: 0, u: 0, usdc: 0 },
});

reducers[ACTIONS.ARCONNECT_FETCHBALANCE] = (state, action) => ({
  ...state,
  fetching: true,
});

reducers[ACTIONS.AR_TIP_STATUS_STARTED] = (state, action) => {
  const { tippingStatusById } = state;
  const { claimId } = action.data;
  const a = { ...tippingStatusById };
  a[claimId] = 'started';
  return { ...state, tippingStatusById: a };
};

reducers[ACTIONS.AR_TIP_STATUS_ERROR] = (state, action) => {
  const { tippingStatusById } = state;
  const { claimId, error } = action.data;
  const a = { ...tippingStatusById };
  a[claimId] = error; // can retry
  return { ...state, tippingStatusById: a };
};

reducers[ACTIONS.AR_TIP_STATUS_SUCCESS] = (state, action) => {
  const { tippingStatusById } = state;
  const { claimId } = action.data;
  const a = { ...tippingStatusById };
  delete a[claimId];
  return { ...state, tippingStatusById: a };
};

reducers[ACTIONS.WANDER_AUTH] = (state, action) => {
  if (!action.data) return state;
  return { ...state, auth: action.data };
};

reducers[ACTIONS.ARSETEXCHANGERATE] = (state, action) => {
  return { ...state, exchangeRates: { ar: action.data }};
};

reducers[ACTIONS.AR_SEND_STARTED] = (state) => ({
  ...state,
  sending: true,
  error: null,
});

reducers[ACTIONS.AR_SEND_SUCCESS] = (state, action) => ({
  ...state,
  sending: false,
  error: null,
  lastSentTxId: action.data.txId,
});

reducers[ACTIONS.AR_SEND_ERROR] = (state, action) => ({
  ...state,
  sending: false,
  error: action.data.error,
});

export default function arwalletReducer(state: ArWalletState = defaultState, action: any) {
  const handler = reducers[action.type];
  if (handler) return handler(state, action);
  return state;
}
