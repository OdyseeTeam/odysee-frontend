import { createSelector } from 'reselect';
import { selectChannelClaimIdForUri } from 'redux/selectors/claims';

const selectState = (state) => state.stripe || {};

export const selectById = (state) => selectState(state).canReceiveFiatTipsById || {};
export const selectBankAccountConfirmed = (state) => selectState(state).bankAccountConfirmed;
export const selectAccountTotals = (state) => selectState(state).accountTotals;
export const selectAccountStatus = (state) => selectState(state).accountStatus;
export const selectAccountNotConfirmedButReceivedTips = (state) =>
  selectState(state).accountNotConfirmedButReceivedTips;
export const selectStripeConnectionUrl = (state) => selectState(state).stripeConnectionUrl;
export const selectPendingConfirmation = (state) => selectState(state).accountPendingConfirmation;
export const selectPaymentHistory = (state) => selectState(state).accountPaymentHistory;
export const selectAccountTransactions = (state) => selectState(state).accountTransactions;
export const selectCustomerStatus = (state) => selectState(state).customerStatus;

export const selectPaymentMethods = (state) => {
  const customerStatus = selectCustomerStatus(state);
  const { PaymentMethods: paymentMethods } = customerStatus || {};

  return Number.isInteger(paymentMethods?.length) && paymentMethods;
};

export const selectLastFour = (state) => {
  const paymentMethods = selectPaymentMethods(state);
  const lastFour = paymentMethods && paymentMethods[0].card.last4;
  return lastFour;
};

export const selectHasSavedCard = (state) => {
  const customerStatus = selectCustomerStatus(state);
  const defaultPaymentMethodId = customerStatus?.Customer?.invoice_settings?.default_payment_method?.id;
  return Boolean(defaultPaymentMethodId);
};

export const selectChannelCanReceiveFiatTipsByUri = createSelector(
  selectChannelClaimIdForUri,
  selectById,
  (channelId, byId) => byId[channelId]
);
