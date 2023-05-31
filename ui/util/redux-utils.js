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
 * Returns a Proxy-wrapped object that internally tracks if any properties were
 * changed. It is intended to be used in Reducers to make the immutability code
 * a bit more readable.
 *
 * When finalizing, call `.resolve()` to strip away the Proxy. If there were no
 * changes, the original state reference is returned, so we avoid invalidating
 * the state.
 *
 * @param originalStateObj
 * @returns
 */
export function makeTrackedObj(originalStateObj: any) {
  const handler = {
    set(target, prop, value, receiver) {
      target.__changed = true;
      return Reflect.set(target, prop, value, receiver);
    },
  };

  const resolve = function () {
    if (this.__changed) {
      const { resolve, __changed, __original, ...rest } = this;
      return { ...rest };
    } else {
      return this.__original;
    }
  };

  assert(!originalStateObj.resolve, 'The original object already has a "resolve" field', originalStateObj);

  return new Proxy({ ...originalStateObj, resolve: resolve, __changed: false, __original: originalStateObj }, handler);
}

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
