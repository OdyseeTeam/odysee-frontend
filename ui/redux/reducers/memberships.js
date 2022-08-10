// @flow
import * as ACTIONS from 'constants/action_types';

const reducers = {};

const defaultState: MembershipsState = {
  membershipMine: undefined,
  membershipListById: {},
  membershipById: {},
  fetchedById: {},
  membershipsPerClaimIds: undefined,
  fetchingIds: {},
};

// type fetchingIds: {[string]: Array<string>}

reducers[ACTIONS.CHANNEL_MEMBERSHIP_CHECK_STARTED] = (state, action) => {
  const { channel, ids } = action.data;
  const { fetchingIds: currentFetching } = state;

  return { ...state, fetchingIds: { ...currentFetching, [channel]: ids } };
};
reducers[ACTIONS.CHANNEL_MEMBERSHIP_CHECK_COMPLETED] = (state, action) => {
  const { channelId, membershipsById } = action.data;

  const currentFetched = Object.assign({}, state.fetchedById);
  const newFetched = currentFetched[channelId] ? { ...currentFetched[channelId], ...membershipsById } : membershipsById;
  delete state.fetchingIds[channelId];

  return { ...state, fetchedById: { ...currentFetched, [channelId]: newFetched } };
};
reducers[ACTIONS.CHANNEL_MEMBERSHIP_CHECK_FAILED] = (state, action) => {
  const { channelId } = action.data;
  delete state.fetchingIds[channelId];
  const currentFetched = Object.assign({}, state.fetchedById);

  return { ...state, fetchedById: { ...currentFetched, [channelId]: null } };
};

reducers[ACTIONS.SET_MEMBERSHIP_BUY_STARTED] = (state, action) => Object.assign({}, state, {});

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

reducers[ACTIONS.MEMBERSHIP_PERK_LIST_COMPLETE] = (state, action) =>
  Object.assign({}, state, {
    membershipMine: action.data,
  });

export default function membershipsReducer(state: UserState = defaultState, action: any) {
  const handler = reducers[action.type];
  if (handler) return handler(state, action);
  return state;
}
