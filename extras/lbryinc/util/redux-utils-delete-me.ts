// util for creating reducers
// based off of redux-actions
// https://redux-actions.js.org/docs/api/handleAction.html#handleactions
// eslint-disable-next-line import/prefer-default-export
export const handleActions =
  (actionMap, defaultState) =>
  (state = defaultState, action) => {
    const handler = actionMap[action.type];

    if (handler) {
      return handler(state, action);
    }

    // just return the original state if no handler
    // returning a copy here breaks redux-persist
    return state;
  };
