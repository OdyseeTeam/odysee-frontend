// @flow
import { createSelector } from 'reselect';
import { selectClaimForUri } from 'redux/selectors/claims';
import { getChannelIdFromClaim } from 'util/claim';

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

export const selectChannelCanReceiveFiatTipsByUri = createSelector(selectClaimForUri, selectById, (claim, byId) => {
  const channelId = getChannelIdFromClaim(claim);
  return channelId && byId[channelId];
});
