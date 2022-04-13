// @flow
import { createSelector } from 'reselect';
import { selectChannelClaimIdForUri } from 'redux/selectors/claims';

const selectState = (state) => state.stripe || {};

export const selectById = (state) => selectState(state).canReceiveFiatTipsById || {};
export const selectBankAccountConfirmed = (state) => selectState(state).bankAccountConfirmed;
export const selectHasSavedCard = (state) => selectState(state).hasSavedCard;
export const selectAccountTotals = (state) => selectState(state).accountTotals;
export const selectAccountStatus = (state) => selectState(state).accountStatus;
export const selectAccountNotConfirmedButReceivedTips = (state) =>
  selectState(state).accountNotConfirmedButReceivedTips;
export const selectStripeConnectionUrl = (state) => selectState(state).stripeConnectionUrl;
export const selectPendingConfirmation = (state) => selectState(state).accountPendingConfirmation;
export const selectPaymentHistory = (state) => selectState(state).accountPaymentHistory;
export const selectAccountTransactions = (state) => selectState(state).accountTransactions;
export const selectLastFour = (state) => selectState(state).lastFour;

export const selectChannelCanReceiveFiatTipsByUri = createSelector(
  selectChannelClaimIdForUri,
  selectById,
  (channelId, byId) => byId[channelId]
);
