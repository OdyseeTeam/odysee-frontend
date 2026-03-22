import { EMPTY_OBJECT } from 'redux/selectors/empty';

const selectState = (state: State) => state.coinSwap || EMPTY_OBJECT;

export const selectCoinSwaps = (state: State) => selectState(state).coinSwaps;
