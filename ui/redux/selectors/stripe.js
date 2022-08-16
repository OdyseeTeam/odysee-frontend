// @flow
import { selectChannelClaimIdForUri } from 'redux/selectors/claims';

type State = { stripe: StripeState };

const selectState = (state: State) => state.stripe || {};

export const selectById = (state: State) => selectState(state).canReceiveFiatTipsById || {};
export const selectBankAccountConfirmed = (state: State) => selectState(state).bankAccountConfirmed;
export const selectAccountTotals = (state: State) => selectState(state).accountTotals;
export const selectAccountStatus = (state: State) => selectState(state).accountStatus;
export const selectAccountNotConfirmedButReceivedTips = (state: State) =>
  selectState(state).accountNotConfirmedButReceivedTips;
export const selectStripeConnectionUrl = (state: State) => selectState(state).stripeConnectionUrl;
export const selectPendingConfirmation = (state: State) => selectState(state).accountPendingConfirmation;
export const selectPaymentHistory = (state: State) => selectState(state).accountPaymentHistory;
export const selectAccountTransactions = (state: State) => selectState(state).accountTransactions;
export const selectCustomerStatus = (state: State) => selectState(state).customerStatus;
export const selectCustomerStatusFetching = (state: State) => selectState(state).customerStatusFetching;

export const selectPaymentMethods = (state: State) => {
  const customerStatus = selectCustomerStatus(state);
  const { PaymentMethods: paymentMethods } = customerStatus || {};

  return Number.isInteger(paymentMethods?.length) && paymentMethods;
};

export const selectLastFour = (state: State) => {
  const paymentMethods = selectPaymentMethods(state);
  const lastFour = paymentMethods && paymentMethods[0].card.last4;
  return lastFour;
};

export const selectHasSavedCard = (state: State) => {
  const customerStatus = selectCustomerStatus(state);
  const defaultPaymentMethod = customerStatus?.Customer?.invoice_settings?.default_payment_method;
  return [null, undefined].includes(defaultPaymentMethod) ? defaultPaymentMethod : Boolean(defaultPaymentMethod);
};

export const selectCardDetails = (state: State) => {
  const hasSavedCard = selectHasSavedCard(state);

  if (!hasSavedCard) return hasSavedCard;

  const customerStatus = selectCustomerStatus(state);
  const card = customerStatus.PaymentMethods[0].card;
  const customer = customerStatus.Customer;
  const email = customer.email;

  const cardDetails: StripeCardDetails = {
    paymentMethodId: customerStatus.PaymentMethods[0].id,
    cardName: customerStatus.PaymentMethods[0].billing_details.name,
    brand: card.brand,
    expiryYear: card.exp_year,
    expiryMonth: card.exp_month,
    lastFour: card.last4,
    email,
  };

  return cardDetails;
};

export const selectCanReceiveFiatTipsForUri = (state: State, uri: string) => {
  const byId = selectById(state);
  const channelId = selectChannelClaimIdForUri(state, uri);
  return byId[channelId];
};
