// @flow
import { selectChannelClaimIdForUri } from 'redux/selectors/claims';

const selectState = (state: State) => state.stripe || {};

export const selectCanReceiveFiatTipsById = (state: State) => selectState(state).canReceiveFiatTipsById || {};
export const selectAccountCheckFetchingIds = (state: State) => selectState(state).accountCheckFetchingIds;
export const selectAccountLinkResponse = (state: State) => selectState(state).accountLinkResponse;
export const selectPaymentHistory = (state: State) => selectState(state).accountPaymentHistory;
export const selectAccountTransactions = (state: State) => selectState(state).accountTransactions;
export const selectCustomerStatus = (state: State) => selectState(state).customerStatus;
export const selectCustomerStatusFetching = (state: State) => selectState(state).customerStatusFetching;
export const selectCustomerSetupResponse = (state: State) => selectState(state).customerSetupResponse;

export const selectAccountStatus = (state: State) => selectState(state).accountStatus;

export const selectArAccountUpdating = (state: State) => selectState(state).arAccountUpdatingId;
export const selectArAccountRegistering = (state: State) => selectState(state).arAccountRegisteringId;
export const selectArAccountRegisteringError = (state: State) => selectState(state).arAccountRegisteringError;

export const selectFullAPIArweaveStatus = (state: State) => selectState(state).arweaveStatus;
export const selectFullAPIArweaveAccounts = (state: State) => selectState(state).arweaveStatus;
// find in arweaveStatus[] where active = true
export const selectAPIArweaveActiveAccounts = (state: State) => {
  const arweaveStatus = selectFullAPIArweaveStatus(state);
  return arweaveStatus ? arweaveStatus.filter((entry) => entry.status === 'active') : [];
};

export const selectAPIArweaveDefaultAccount = (state: State) => {
  const arweaveStatus = selectFullAPIArweaveStatus(state);
  // find and return each match
  return arweaveStatus ? arweaveStatus.find((entry) => entry.default) : null;
};

export const selectArweaveDefaultAccountMonetizationEnabled = (state: State) => {
  const account = selectAPIArweaveDefaultAccount(state);
  if (account) return account.status === 'active';
};

export const selectAPIArweaveDefaultAddress = (state: State) => {
  const defaultAccount = selectAPIArweaveDefaultAccount(state);
  return defaultAccount ? defaultAccount.address : null;
};

export const selectArweaveAccountForAddress = (state: State, address: string) => {
  const arweaveStatus = selectFullAPIArweaveStatus(state);
  // find and return each match
  return arweaveStatus ? arweaveStatus.find((entry) => entry.address === address) : null;
};

export const selectArweaveTipDataForId = (state: State, id: string) => {
  const byId = selectState(state).canReceiveArweaveTipsById;
  return byId[id];
};

export const selectAccountStatusFetching = (state: State) => selectState(state).accountStatusFetching;

export const selectAccountInfo = (state: State) => {
  const accountStatus = selectAccountStatus(state);
  return accountStatus && accountStatus.account_info;
};

export const selectAccountDefaultCurrency = (state: State) => {
  const accountInfo = selectAccountInfo(state);
  return accountInfo && accountInfo.default_currency;
};

export const selectAccountPaidBalance = (state: State) => selectAccountStatus(state)?.total_paid || 0;

export const selectAccountChargesEnabled = (state: State) => {
  const accountStatus = selectAccountStatus(state);
  return accountStatus && accountStatus.charges_enabled;
};

export const selectAccountCheckIsFetchingForId = (state: State, id: string) =>
  selectAccountCheckFetchingIds(state).includes(id);

export const selectAccountRequiresVerification = (state: State) => {
  const chargesEnabled = selectAccountChargesEnabled(state);

  if (!chargesEnabled) return chargesEnabled;

  const accountStatus = selectAccountStatus(state);
  // const eventuallyDueInformation = accountStatus?.account_info.requirements.eventually_due;
  const currentlyDueInformation = accountStatus?.account_info.requirements.currently_due;

  if (
    // (eventuallyDueInformation && eventuallyDueInformation.length > 0) ||
    currentlyDueInformation &&
    currentlyDueInformation.length > 0
  ) {
    return true;
  }

  return false;
};

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

  // const defaultPaymentMethod =
  //   customerStatus &&
  //   customerStatus.Customer &&
  //   customerStatus.Customer.invoice_settings &&
  //   customerStatus.Customer.invoice_settings.default_payment_method;

  // Currently it is not possible to have multiple cards, so should be safe to use the first index
  // of PaymentMethods as default. This is a fix for the above default_payment_method not returning
  // correctly in some cases right after a new card setup (maybe timing issue)
  const defaultPaymentMethod = customerStatus && customerStatus.PaymentMethods && customerStatus.PaymentMethods[0].id;

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
  const byId = selectCanReceiveFiatTipsById(state);
  // $FlowFixMe
  const channelId = selectChannelClaimIdForUri(state, uri);
  return channelId && byId[channelId];
};
