// @flow
import * as ACTIONS from 'constants/action_types';

const reducers = {};

type MembershipsState = {
  membershipMineByKey: ?MembershipMineDataByKey,
  membershipListById: { [channelId: string]: MembershipTiers },
  channelMembershipsByCreatorId: ChannelMembershipsByCreatorId,
  fetchingIdsByCreatorId: { [creatorId: string]: ClaimIds },
  pendingBuyIds: ClaimIds,
  pendingCancelIds: ClaimIds,
  myMembershipTiers: ?MembershipTiers,
  pendingDeleteIds: Array<string>,
  protectedContentClaimsByCreatorId: { [channelId: string]: any },
  mySupportersList: ?SupportersList,
  membershipPerks: Array<MembershipPerk>,
  listingAllMyTiers: ?boolean,
};

const defaultState: MembershipsState = {
  membershipMineByKey: undefined,
  membershipListById: {},
  channelMembershipsByCreatorId: {},
  fetchingIdsByCreatorId: {},
  pendingBuyIds: [],
  pendingCancelIds: [],
  myMembershipTiers: undefined,
  pendingDeleteIds: [],
  protectedContentClaimsByCreatorId: {},
  mySupportersList: undefined,
  membershipPerks: [],
  listingAllMyTiers: undefined,
};

reducers[ACTIONS.CHANNEL_MEMBERSHIP_CHECK_STARTED] = (state, action) => {
  const { channel, ids } = action.data;
  const { fetchingIdsByCreatorId: currentFetching } = state;

  return { ...state, fetchingIdsByCreatorId: { ...currentFetching, [channel]: ids } };
};
reducers[ACTIONS.CHANNEL_MEMBERSHIP_CHECK_COMPLETED] = (state, action) => {
  const { channelId, membershipsById } = action.data;

  const currentFetched = Object.assign({}, state.channelMembershipsByCreatorId);
  const newFetched = currentFetched[channelId] ? { ...currentFetched[channelId], ...membershipsById } : membershipsById;
  const newFetchingIdsByCreatorId = Object.assign({}, state.fetchingIdsByCreatorId);
  delete newFetchingIdsByCreatorId[channelId];

  return {
    ...state,
    fetchingIdsByCreatorId: newFetchingIdsByCreatorId,
    channelMembershipsByCreatorId: { ...currentFetched, [channelId]: newFetched },
  };
};
reducers[ACTIONS.CHANNEL_MEMBERSHIP_CHECK_FAILED] = (state, action) => {
  const { channelId } = action.data;

  const currentFetched = Object.assign({}, state.channelMembershipsByCreatorId);
  const newFetchingIdsByCreatorId = Object.assign({}, state.fetchingIdsByCreatorId);
  delete newFetchingIdsByCreatorId[channelId];

  return {
    ...state,
    fetchingIdsByCreatorId: newFetchingIdsByCreatorId,
    channelMembershipsByCreatorId: { ...currentFetched, [channelId]: null },
  };
};

reducers[ACTIONS.SET_MEMBERSHIP_BUY_STARTED] = (state, action) => {
  const newPendingBuyIds = new Set(state.pendingBuyIds);
  newPendingBuyIds.add(action.data);
  return { ...state, pendingBuyIds: Array.from(newPendingBuyIds) };
};
reducers[ACTIONS.SET_MEMBERSHIP_BUY_SUCCESFUL] = (state, action) => {
  const newPendingBuyIds = new Set(state.pendingBuyIds);
  newPendingBuyIds.delete(action.data);
  return { ...state, pendingBuyIds: Array.from(newPendingBuyIds) };
};
reducers[ACTIONS.SET_MEMBERSHIP_BUY_FAILED] = (state, action) => {
  const newPendingBuyIds = new Set(state.pendingBuyIds);
  newPendingBuyIds.delete(action.data);
  return { ...state, pendingBuyIds: Array.from(newPendingBuyIds) };
};

reducers[ACTIONS.SET_MEMBERSHIP_CANCEL_STARTED] = (state, action) => {
  const newPendingCancelIds = new Set(state.pendingCancelIds);
  newPendingCancelIds.add(action.data);
  return { ...state, pendingCancelIds: Array.from(newPendingCancelIds) };
};
reducers[ACTIONS.SET_MEMBERSHIP_CANCEL_SUCCESFUL] = (state, action) => {
  const newPendingCancelIds = new Set(state.pendingCancelIds);
  newPendingCancelIds.delete(action.data);
  return { ...state, pendingCancelIds: Array.from(newPendingCancelIds) };
};
reducers[ACTIONS.SET_MEMBERSHIP_CANCEL_FAILED] = (state, action) => {
  const newPendingCancelIds = new Set(state.pendingCancelIds);
  newPendingCancelIds.delete(action.data);
  return { ...state, pendingCancelIds: Array.from(newPendingCancelIds) };
};

reducers[ACTIONS.DELETE_MEMBERSHIP_STARTED] = (state, action) => {
  const newPendingDeleteIds = new Set(state.pendingDeleteIds);
  newPendingDeleteIds.add(action.data);
  return { ...state, pendingDeleteIds: Array.from(newPendingDeleteIds) };
};
reducers[ACTIONS.DELETE_MEMBERSHIP_SUCCESFUL] = (state, action) => {
  const newPendingDeleteIds = new Set(state.pendingDeleteIds);
  newPendingDeleteIds.delete(action.data);
  return { ...state, pendingDeleteIds: Array.from(newPendingDeleteIds) };
};
reducers[ACTIONS.DELETE_MEMBERSHIP_FAILED] = (state, action) => {
  const newPendingDeleteIds = new Set(state.pendingDeleteIds);
  newPendingDeleteIds.delete(action.data);
  return { ...state, pendingDeleteIds: Array.from(newPendingDeleteIds) };
};

reducers[ACTIONS.SET_MEMBERSHIP_MINE_DATA] = (state, action) => ({ ...state, membershipMineByKey: action.data });

reducers[ACTIONS.LIST_MEMBERSHIP_DATA] = (state, action) => {
  const { channelId, list } = action.data;
  const newMembershipListById = Object.assign({}, state.membershipListById);
  newMembershipListById[channelId] = list;

  return { ...state, membershipListById: newMembershipListById };
};

reducers[ACTIONS.MEMBERSHIP_PERK_LIST_COMPLETE] = (state, action) => ({ ...state, membershipPerks: action.data });

reducers[ACTIONS.GET_MEMBERSHIP_TIERS_FOR_CONTENT_STARTED] = (state, action) => {
  return { ...state };
};

reducers[ACTIONS.GET_MEMBERSHIP_TIERS_FOR_CONTENT_SUCCESS] = (state, action) => {
  const newProtectedContentClaims = Object.assign({}, state.protectedContentClaimsByCreatorId);

  if (action.data && action.data.length) {
    const channelId = action.data[0].channel_id;
    const claimId = action.data[0].claim_id;

    if (!newProtectedContentClaims[channelId]) newProtectedContentClaims[channelId] = {};
    const thisContentChannel = newProtectedContentClaims[channelId];
    if (!thisContentChannel[claimId]) thisContentChannel[claimId] = {};

    let membershipIds = [];
    for (const content of action.data) {
      membershipIds.push(content.membership_id);
    }
    thisContentChannel[claimId]['memberships'] = membershipIds;
  }

  return { ...state, protectedContentClaimsByCreatorId: newProtectedContentClaims };
};

reducers[ACTIONS.GET_MEMBERSHIP_TIERS_FOR_CONTENT_FAILED] = (state, action) => {
  return { ...state };
};

reducers[ACTIONS.GET_MEMBERSHIP_TIERS_FOR_CHANNEL_SUCCESS] = (state, action) => {
  const newProtectedContentClaims = Object.assign({}, state.protectedContentClaimsByCreatorId);

  let wholeObject = {};
  let channelId;

  if (action.data && action.data.length) {
    channelId = action.data[0].channel_id;

    for (const memberContent of action.data) {
      // doing this conditional because sometimes the backend data is not right
      if (memberContent.claim_id && memberContent.channel_id) {
        if (!wholeObject[memberContent.claim_id]) {
          wholeObject[memberContent.claim_id] = {
            memberships: [],
          };
        }

        const membershipIds = wholeObject[memberContent.claim_id].memberships;

        if (!membershipIds.includes(memberContent.membership_id)) {
          membershipIds.push(memberContent.membership_id);
        }
      }
    }
  }

  if (channelId) {
    newProtectedContentClaims[channelId] = wholeObject;
  }

  return { ...state, protectedContentClaimsByCreatorId: newProtectedContentClaims };
};

reducers[ACTIONS.GET_MEMBERSHIP_SUPPORTERS_LIST_COMPLETE] = (state, action) => {
  const mySupportersList = action.data;
  return { ...state, mySupportersList };
};

reducers[ACTIONS.LIST_ALL_MY_MEMBERSHIPS_START] = (state, action) => ({ ...state, listingAllMyTiers: true });
reducers[ACTIONS.LIST_ALL_MY_MEMBERSHIPS_COMPLETE] = (state, action) => ({ ...state, listingAllMyTiers: false });

// -----------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------

export default function membershipsReducer(state: MembershipsState = defaultState, action: any) {
  const handler = reducers[action.type];
  if (handler) return handler(state, action);
  return state;
}
