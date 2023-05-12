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
