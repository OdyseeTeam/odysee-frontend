// @flow

const selectState = (state: State) => state.arwallet || {};

export const selectArweaveStatus = (state: State) => selectState(state);
export const selectArweaveConnected = (state: State) => Boolean(selectState(state).address);
export const selectArweaveConnecting = (state: State) => selectState(state).connecting;
export const selectArweaveAddress = (state: State) => selectState(state).address;
export const selectArweaveBalance = (state: State) => selectState(state).balance;
export const selectArweaveExchangeRates = (state: State) => selectState(state).exchangeRates;
export const selectArweaveFetching = (state: State) => selectState(state).fetching;
export const selectArweaveTippingForId = (state: State, tippingId: string) =>
  selectState(state).tippingStatusById[tippingId];
export const selectArweaveWanderAuth = (state: State) => selectState(state).auth;
