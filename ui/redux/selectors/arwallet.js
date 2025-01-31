// @flow

const selectState = (state: State) => state.arwallet || {};

export const selectArNagged = (state: State) => selectState(state).nagged;
export const selectArweaveConnected = (state: State) => Boolean(selectState(state).address);
export const selectArweaveConnecting = (state: State) => selectState(state).connecting;
export const selectArweaveAddress = (state: State) => selectState(state).address;
