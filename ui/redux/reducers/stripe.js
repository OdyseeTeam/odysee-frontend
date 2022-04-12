// @flow
import * as ACTIONS from 'constants/action_types';

const reducers = {};

const defaultState: StripeState = {
  canReceiveFiatTipsById: {},
  bankAccountConfirmed: undefined,
  hasSavedCard: undefined,
  accountTotals: { total_received_unpaid: undefined, total_paid_out: undefined },
  accountStatus: { accountConfirmed: undefined, stillRequiringVerification: undefined },
  accountNotConfirmedButReceivedTips: undefined,
  stripeConnectionUrl: undefined,
  accountPendingConfirmation: undefined,
  accountTransactions: undefined,
  accountPaymentHistory: undefined,
  lastFour: undefined,
};

reducers[ACTIONS.SET_CAN_RECEIVE_FIAT_TIPS] = (state, action) => {
  const claimId = action.data;
  const canReceiveFiatTipsById = Object.assign({}, state.canReceiveFiatTipsById);
  canReceiveFiatTipsById[claimId] = true;

  return Object.assign({}, state, {
    canReceiveFiatTipsById,
  });
};

reducers[ACTIONS.SET_BANK_ACCOUNT_CONFIRMED] = (state, action) =>
  Object.assign({}, state, {
    bankAccountConfirmed: true,
  });

reducers[ACTIONS.SET_STRIPE_ACCOUNT_TOTALS] = (state, action) =>
  Object.assign({}, state, {
    accountTotals: action.data,
  });

reducers[ACTIONS.SET_HAS_SAVED_CARD] = (state, action) =>
  Object.assign({}, state, {
    hasSavedCard: true,
  });

reducers[ACTIONS.SET_ACCOUNT_STATUS_FINISHED] = (state, action) =>
  Object.assign({}, state, {
    accountStatus: action.data,
  });

reducers[ACTIONS.SET_ACCOUNT_NOT_CONFIRMED_BUT_RECEIVED_TIPS] = (state, action) =>
  Object.assign({}, state, {
    accountNotConfirmedButReceivedTips: true,
  });

reducers[ACTIONS.SET_STRIPE_CONNECTION_URL] = (state, action) =>
  Object.assign({}, state, {
    stripeConnectionUrl: action.data,
  });

reducers[ACTIONS.SET_ACCOUNT_PENDING_CONFIRMATION] = (state, action) =>
  Object.assign({}, state, {
    accountPendingConfirmation: true,
  });

reducers[ACTIONS.SET_ACCOUNT_TRANSACTIONS] = (state, action) =>
  Object.assign({}, state, {
    accountTransactions: action.data,
  });

reducers[ACTIONS.SET_ACCOUNT_PAYMENT_HISTORY] = (state, action) =>
  Object.assign({}, state, {
    accountPaymentHistory: action.data,
  });

reducers[ACTIONS.SET_PAYMENT_LAST_FOUR] = (state, action) =>
  Object.assign({}, state, {
    lastFour: action.data,
  });

export default function stripeReducer(state: UserState = defaultState, action: any) {
  const handler = reducers[action.type];
  if (handler) return handler(state, action);
  return state;
}
