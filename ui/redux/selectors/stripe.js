// @flow
import { selectChannelIdForUri } from 'redux/selectors/claims';

type State = { stripe: StripeState };

const selectState = (state: State) => state.stripe || {};

export const selectById = (state: State) => selectState(state).canReceiveFiatTipsById || {};
export const selectBankAccountConfirmed = (state: State) => selectState(state).bankAccountConfirmed;
export const selectHasSavedCard = (state: State) => selectState(state).hasSavedCard;
export const selectAccountTotals = (state: State) => selectState(state).accountTotals;
export const selectAccountStatus = (state: State) => selectState(state).accountStatus;
export const selectAccountNotConfirmedButReceivedTips = (state: State) =>
  selectState(state).accountNotConfirmedButReceivedTips;
export const selectStripeConnectionUrl = (state: State) => selectState(state).stripeConnectionUrl;
export const selectPendingConfirmation = (state: State) => selectState(state).accountPendingConfirmation;
export const selectPaymentHistory = (state: State) => selectState(state).accountPaymentHistory;
export const selectAccountTransactions = (state: State) => selectState(state).accountTransactions;
export const selectLastFour = (state: State) => selectState(state).lastFour;

export const selectCanReceiveFiatTipsForUri = (state: State, uri: string) => {
  const channelId = selectChannelIdForUri(state, uri);
  const byId = selectById(state);
  return byId[channelId];
};
