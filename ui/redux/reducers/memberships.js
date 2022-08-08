// @flow
import * as ACTIONS from 'constants/action_types';

const reducers = {};

const defaultState: MembershipsState = {
  fetchStarted: undefined,
  fetchSuccess: undefined,
  membershipMine: undefined,
  membershipListById: {},
};

reducers[ACTIONS.SET_MEMBERSHIP_BUY_STARTED] = (state, action) =>
  Object.assign({}, state, {
    fetchStarted: true,
  });

reducers[ACTIONS.SET_MEMBERSHIP_BUY_SUCCESFUL] = (state, action) =>
  Object.assign({}, state, {
    fetchStarted: false,
    fetchSuccess: true,
  });

reducers[ACTIONS.SET_MEMBERSHIP_DATA] = (state, action) =>
  Object.assign({}, state, {
    membershipMine: action.data,
  });

reducers[ACTIONS.LIST_MEMBERSHIP_DATA] = (state, action) => {
  const membershipListById = Object.assign({}, state.membershipListById);
  membershipListById[action.data.channelId] = action.data.list;

  return Object.assign({}, state, {
    membershipListById,
  });
};

export default function membershipsReducer(state: UserState = defaultState, action: any) {
  const handler = reducers[action.type];
  if (handler) return handler(state, action);
  return state;
}
