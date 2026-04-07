import { createSelector } from 'reselect';
import { selectChannelClaimIdForUri } from 'redux/selectors/claims';
import { EMPTY_ARRAY, EMPTY_OBJECT } from 'redux/selectors/empty';

const selectState = (state: State) => state.payments || state.stripe || EMPTY_OBJECT;

export const selectCanReceiveFiatTipsById = (state: State) => selectState(state).canReceiveFiatTipsById || EMPTY_OBJECT;
export const selectAccountCheckFetchingIds = (state: State) => selectState(state).accountCheckFetchingIds;
export const selectPaymentHistory = (state: State) => selectState(state).accountPaymentHistory;
export const selectAccountTransactions = (state: State) => selectState(state).accountTransactions;
export const selectCustomerStatus = (state: State) => selectState(state).customerStatus;
export const selectCustomerStatusFetching = (state: State) => selectState(state).customerStatusFetching;
export const selectAccountStatus = (state: State) => selectState(state).accountStatus;
export const selectArAccountUpdating = (state: State) => selectState(state).arAccountUpdatingId;
export const selectArAccountRegistering = (state: State) => selectState(state).arAccountRegisteringId;
export const selectArAccountRegisteringError = (state: State) => selectState(state).arAccountRegisteringError;
export const selectFullAPIArweaveStatus = (state: State) => selectState(state).arweaveStatus || EMPTY_ARRAY;
export const selectFullAPIArweaveAccounts = selectFullAPIArweaveStatus;
// find in arweaveStatus[] where active = true
export const selectAPIArweaveActiveAccounts = createSelector(selectFullAPIArweaveStatus, (arweaveStatus) =>
  arweaveStatus.length ? arweaveStatus.filter((entry) => entry.status === 'active') : EMPTY_ARRAY
);
export const selectAPIArweaveDefaultAccount = createSelector(
  selectFullAPIArweaveStatus,
  (arweaveStatus) => arweaveStatus.find((entry) => entry.default) || null
);
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
  return arweaveStatus.find((entry) => entry.address === address) || null;
};
export const selectArweaveTipDataForId = (state: State, id: string) => {
  const byId = selectState(state).canReceiveArweaveTipsById;
  return byId[id];
};
export const selectAccountStatusFetching = (state: State) => selectState(state).accountStatusFetching;
export const selectAccountChargesEnabled = (state: State) => {
  const accountStatus = selectAccountStatus(state);
  return accountStatus && accountStatus.charges_enabled;
};
export const selectAccountCheckIsFetchingForId = (state: State, id: string) =>
  selectAccountCheckFetchingIds(state).includes(id);
export const selectHasSavedCard = (state: State) => {
  const customerStatus = selectCustomerStatus(state);
  const defaultPaymentMethod = customerStatus && customerStatus.PaymentMethods && customerStatus.PaymentMethods[0].id;
  return [null, undefined].includes(defaultPaymentMethod) ? defaultPaymentMethod : Boolean(defaultPaymentMethod);
};
export const selectCanReceiveFiatTipsForUri = (state: State, uri: string) => {
  const byId = selectCanReceiveFiatTipsById(state);
  const channelId = selectChannelClaimIdForUri(state, uri);
  return channelId && byId[channelId];
};
