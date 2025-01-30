const selectState = (state: State) => state.arConnect || {};
export const selectArConnectStatus = (state: State) => selectState(state);
