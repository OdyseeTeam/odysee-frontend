// @flow
import * as ACTIONS from 'constants/action_types';

const reducers = {};

const defaultState: MembershipsState = {
  fetchStarted: undefined,
  fetchSuccess: undefined,
  membershipMine: undefined,
  membershipListById: {},
  membershipById: {},
  fetchedById: {},
};

reducers[ACTIONS.MEMBERSHIP_CHECK_STARTED] = (state, action) => ({ ...state, fetchStarted: true });
reducers[ACTIONS.MEMBERSHIP_CHECK_FAILED] = (state, action) => ({ ...state, fetchStarted: false });
reducers[ACTIONS.MEMBERSHIP_CHECK_COMPLETED] = (state, action) => {
  const { channelId, membershipsById } = action.data;

  const currentFetched = state.fetchedById[channelId];
  if (currentFetched) {
    return { ...state, fetchedById: { [channelId]: { ...currentFetched, ...membershipsById } } };
  } else {
    return { ...state, fetchedById: { [channelId]: membershipsById } };
  }
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

// reducers[ACTIONS.ADD_CLAIMIDS_MEMBERSHIP_DATA] = (state, action) => {
//   let latestData = {};

//   // add additional user membership value
//   if (state.membershipsPerClaimIds) {
//     latestData = Object.assign({}, state.membershipsPerClaimIds, action.data.response);
//   } else {
//     // otherwise just send the current data because nothing is saved yet
//     latestData = action.data.response;
//   }

//   const didFetchMembershipsDataById = Object.assign({}, state.didFetchMembershipsDataById);
//   didFetchMembershipsDataById[action.data.channelId] = true;

//   return Object.assign({}, state, {
//     membershipsPerClaimIds: latestData,
//     didFetchMembershipsDataById,
//   });
// };

// reducers[ACTIONS.ADD_ODYSEE_MEMBERSHIP_DATA] = (state, action) => {
//   return Object.assign({}, state, {
//     odyseeMembershipName: action.data.odyseeMembershipName,
//   });
// };

// reducers[ACTIONS.ADD_CLAIMIDS_MEMBERSHIP_DATA] = (state, action) => {
//   let latestData = {};

//   // add additional user membership value
//   if (state.odyseeMembershipsPerClaimIds) {
//     latestData = Object.assign({}, state.odyseeMembershipsPerClaimIds, action.data.response);
//   } else {
//     // otherwise just send the current data because nothing is saved yet
//     latestData = action.data.response;
//   }

//   return Object.assign({}, state, {
//     odyseeMembershipsPerClaimIds: latestData,
//   });
// };

export default function membershipsReducer(state: UserState = defaultState, action: any) {
  const handler = reducers[action.type];
  if (handler) return handler(state, action);
  return state;
}
