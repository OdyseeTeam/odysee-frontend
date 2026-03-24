// @flow

const selectState = (state: State) => state.arwallet || {};

export const selectArweaveStatus = (state: State) => selectState(state);
export const selectArweaveConnected = (state: State) => Boolean(selectState(state).address);
export const selectArweaveConnecting = (state: State) => selectState(state).connecting;
export const selectArweaveAddress = (state: State) => selectState(state).address;
export const selectArweaveBalance = (state: State) => selectState(state).balance;
export const selectArweaveExchangeRates = (state: State) => selectState(state).exchangeRates || { ar: null };
export const selectArweaveFetching = (state: State) => selectState(state).fetching;
export const selectArweaveTippingStartedForId = (state: State, tippingId: string) =>
  selectState(state).tippingStatusById[tippingId] === 'started';
export const selectArweaveTippingErrorForId = (state: State, tippingId: string) =>
  selectState(state).tippingStatusById[tippingId] && selectState(state).tippingStatusById[tippingId] !== 'started'
    ? selectState(state).tippingStatusById[tippingId]
    : '';
export const selectArweaveError = (state: State) => selectState(state).error;

export const selectArweaveWanderAuth = (state: State) => selectState(state).auth;
