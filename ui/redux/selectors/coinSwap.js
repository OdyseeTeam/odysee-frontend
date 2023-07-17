// @flow

const selectState = (state: State) => state.coinSwap || {};
export const selectCoinSwaps = (state: State) => selectState(state).coinSwaps;
