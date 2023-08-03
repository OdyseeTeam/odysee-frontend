// @flow

// util for creating reducers
// based off of redux-actions
// https://redux-actions.js.org/docs/api/handleAction.html#handleactions
export const handleActions =
  (actionMap: any, defaultState: any) =>
  (state: any = defaultState, action: any) => {
    const handler = actionMap[action.type];

    if (handler) {
      const newState = handler(state, action);
      return Object.assign({}, state, newState);
    }

    // just return the original state if no handler
    // returning a copy here breaks redux-persist
    return state;
  };

/**
 * A createSelector() optimizer that checks if the new result (object) has the
 * same values as the previous results.
 *
 * Assumptions:
 * (1) The keys are not compared. We assume that if the 'value' is pointing to
 * the same reference as the previous result, the 'key' is most likely the same
 * too.
 *
 * @param prev
 * @param curr
 * @returns {boolean|*}
 */
export function objSelectorEqualityCheck(prev: any, curr: any) {
  if (!Array.isArray(prev) && !Array.isArray(curr) && typeof prev === 'object' && typeof curr === 'object') {
    const prevValues = Object.values(prev);
    const currValues = Object.values(curr);

    if (prevValues.length === currValues.length) {
      return prevValues.every((p, index) => p === currValues[index]);
    }
  }

  return prev === curr;
}

/**
 * A createSelector() optimizer that checks if the new array has the same values
 * as the previous array.
 *
 * @param prev
 * @param curr
 * @returns {boolean|*}
 */
export function arrSelectorEqualityCheck(prev: any, curr: any) {
  if (Array.isArray(prev) && Array.isArray(curr)) {
    if (prev.length === curr.length) {
      return prev.every((p, index) => p === curr[index]);
    }
  }

  return prev === curr;
}
