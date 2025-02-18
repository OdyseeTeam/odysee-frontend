// @flow

const selectState = (state: State) => state.arwallet || {};

export const selectArweaveConnected = (state: State) => Boolean(selectState(state).address);
export const selectArweaveConnecting = (state: State) => selectState(state).connecting;
export const selectArweaveAddress = (state: State) => selectState(state).address;
export const selectArweaveBalance = (state: State) => selectState(state).balance;
export const selectArweaveFetching = (state: State) => selectState(state).fetching;
