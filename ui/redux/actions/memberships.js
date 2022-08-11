// @flow
import * as ACTIONS from 'constants/action_types';
import { Lbryio } from 'lbryinc';
import { doToast } from 'redux/actions/notifications';
import { selectFetchingIdsForMembershipChannelId } from 'redux/selectors/memberships';
import { ODYSEE_CHANNEL } from 'constants/channels';

import { getStripeEnvironment } from 'util/stripe';
const stripeEnvironment = getStripeEnvironment();

export const doFetchChannelMembershipsForChannelIds = (channelId: string, channelIds: ClaimIds) => async (
  dispatch: Dispatch,
  getState: GetState
) => {
  if (!channelIds || channelIds.length === 0) return;

  // remove dupes and falsey values
  const dedupedChannelIds = [...new Set(channelIds)].filter(Boolean);

  // check if channel id is fetching
  const state = getState();
  const fetchingForChannel = selectFetchingIdsForMembershipChannelId(state, channelId);

  const channelsToFetch = dedupedChannelIds.filter((dedupedChannelId) => {
    const notFetching = !fetchingForChannel || (fetchingForChannel && !fetchingForChannel.includes(dedupedChannelId));
    return notFetching;
  });

  if (channelsToFetch.length === 0) return;

  // create 'comma separated values' string for backend
  const channelIdsToFetch = channelsToFetch.join(',');

  dispatch({ type: ACTIONS.CHANNEL_MEMBERSHIP_CHECK_STARTED, data: { channel: channelId, ids: channelsToFetch } });

  return await Lbryio.call('membership', 'check', {
    channel_id: channelId,
    claim_ids: channelIdsToFetch,
    environment: stripeEnvironment,
  })
    .then((response) => {
      const membershipsById = {};

      for (const channelId in response) {
        const memberships = response[channelId];

        // if array was returned for a user (indicating a membership exists), otherwise is null
        if (Number.isInteger(memberships?.length)) {
          for (const membership of memberships) {
            if (membership.activated) {
              membershipsById[channelId] = membership.name;
            }
          }
        }

        if (!membershipsById[channelId]) membershipsById[channelId] = null;
      }

      return dispatch({ type: ACTIONS.CHANNEL_MEMBERSHIP_CHECK_COMPLETED, data: { channelId, membershipsById } });
    })
    .catch((e) => dispatch({ type: ACTIONS.CHANNEL_MEMBERSHIP_CHECK_FAILED, data: { channelId, error: e } }));
};

export const doFetchOdyseeMembershipForChannelIds = (channelIds: ClaimIds) => async (dispatch: Dispatch) =>
  dispatch(doFetchChannelMembershipsForChannelIds(ODYSEE_CHANNEL.ID, channelIds));

export const doMembershipList = (params: MembershipListParams) => async (dispatch: Dispatch) =>
  await Lbryio.call('membership', 'list', { environment: stripeEnvironment, ...params }, 'post')
    .then((response: MembershipData) =>
      dispatch({ type: ACTIONS.LIST_MEMBERSHIP_DATA, data: { channelId: params.channel_id, list: response } })
    )
    .catch((e) => dispatch({ type: ACTIONS.LIST_MEMBERSHIP_DATA_ERROR, data: e }));

export const doMembershipMine = () => async (dispatch: Dispatch) =>
  await Lbryio.call('membership', 'mine', { environment: stripeEnvironment }, 'post')
    .then((response) => {
      const activeMemberships = {};
      const canceledMemberships = {};
      const purchasedMemberships = {};
      let activeOdyseeMembership;

      for (const membership of response) {
        const creatorClaimId = membership.MembershipDetails.channel_id;

        // if it's autorenewing it's considered 'active'
        const isActive = membership.Membership.auto_renew;

        if (isActive) {
          activeMemberships[creatorClaimId] = membership;
        } else {
          canceledMemberships[creatorClaimId] = membership;
        }
        purchasedMemberships[creatorClaimId] = membership;

        const membershipChannel = membership.channel_name;
        if (membershipChannel === ODYSEE_CHANNEL.NAME) {
          activeOdyseeMembership = true;
        }
      }

      dispatch({
        type: ACTIONS.SET_MEMBERSHIP_DATA,
        data: { activeMemberships, canceledMemberships, purchasedMemberships, activeOdyseeMembership },
      });
    })
    .catch((err) => dispatch({ type: ACTIONS.SET_MEMBERSHIP_DATA_ERROR, data: err }));

export const doMembershipBuy = (membershipParams: MembershipBuyParams) => async (dispatch: Dispatch) => {
  const { membership_id: membershipId } = membershipParams;

  if (!membershipId) return;

  dispatch({ type: ACTIONS.SET_MEMBERSHIP_BUY_STARTED, data: membershipId });

  // show the memberships the user is subscribed to
  return await Lbryio.call('membership', 'buy', { environment: stripeEnvironment, ...membershipParams }, 'post')
    .then((response) => {
      dispatch({ type: ACTIONS.SET_MEMBERSHIP_BUY_SUCCESFUL, data: membershipId });
      dispatch(doMembershipMine());

      return response;
    })
    .catch((e) => {
      const errorMessage = e.message;
      const subscriptionFailedBackendError = 'failed to create subscription with default card';

      // wait a bit to show the message so it's not jarring for the user
      let errorMessageTimeout = 1150;

      // don't do an error delay if there's already a network error
      if (errorMessage === subscriptionFailedBackendError) {
        errorMessageTimeout = 0;
      }

      setTimeout(() => {
        const genericErrorMessage = __(
          "Sorry, your purchase wasn't able to completed. Please contact support for possible next steps"
        );

        dispatch(doToast({ message: genericErrorMessage, isError: true }));
      }, errorMessageTimeout);

      return e;
    });
};

export const doMembershipAddTier = (params: MembershipAddTierParams) => async (dispatch: Dispatch) =>
  await Lbryio.call('membership', 'add', { ...params, environment: stripeEnvironment }, 'post');

export const doGetMembershipPerks = (params: MembershipListParams) => async (dispatch: Dispatch) =>
  await Lbryio.call(
    'membership_perk',
    'list',
    { ...params, environment: stripeEnvironment },
    'post'
  ).then((response: MembershipDetails) => dispatch({ type: ACTIONS.MEMBERSHIP_PERK_LIST_COMPLETE, data: response }));
