// @flow
import * as ACTIONS from 'constants/action_types';
import { Lbryio } from 'lbryinc';
import { doToast } from 'redux/actions/notifications';
import { selectMembershipsFetchedById } from 'redux/selectors/memberships';
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

  // check if channel id has already been fetched
  const state = getState();
  const fetchedById = selectMembershipsFetchedById(state);
  const channelsToFetch = dedupedChannelIds.filter((channelClaimId) => !fetchedById[channelId][channelClaimId]);

  // create csv string for backend
  const channelIdsToFetch = channelsToFetch.join(',');

  dispatch({ type: ACTIONS.MEMBERSHIP_CHECK_STARTED });

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
            if (membership.activated && membership.is_live && membership.channel_name) {
              membershipsById[channelId] = membership.name;
            }
          }
        }

        if (!membershipsById[channelId]) membershipsById[channelId] = null;
      }

      return dispatch({ type: ACTIONS.MEMBERSHIP_CHECK_COMPLETED, data: { channelId, membershipsById } });
    })
    .catch((e) => dispatch({ type: ACTIONS.MEMBERSHIP_CHECK_FAILED, data: e }));
};

export const doFetchOdyseeMembershipForChannelIds = (channelIds: ClaimIds) => async (dispatch: Dispatch) =>
  dispatch(doFetchChannelMembershipsForChannelIds(ODYSEE_CHANNEL.ID, channelIds));

export const doMembershipList = (params: MembershipListParams) => async (dispatch: Dispatch) =>
  await Lbryio.call('membership', 'list', { environment: stripeEnvironment, ...params }, 'post')
    .then((response) =>
      dispatch({ type: ACTIONS.LIST_MEMBERSHIP_DATA, data: { channelId: params.channel_id, list: response } })
    )
    .catch((e) => dispatch({ type: ACTIONS.LIST_MEMBERSHIP_DATA_ERROR, data: e }));

export const doMembershipMine = () => async (dispatch: Dispatch) =>
  await Lbryio.call('membership', 'mine', { environment: stripeEnvironment }, 'post')
    .then((response) => {
      const activeMemberships = [];
      const canceledMemberships = [];
      const purchasedMemberships = [];
      let activeOdyseeMembership;

      for (const membership of response) {
        // if it's autorenewing it's considered 'active'
        const isActive = membership.Membership.auto_renew;
        if (isActive) {
          activeMemberships.push(membership);
        } else {
          canceledMemberships.push(membership);
        }
        purchasedMemberships.push(membership);

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
  const { membership_id: membershipId, channel_name: userChannelName } = membershipParams;

  if (!membershipId) return;

  dispatch({ type: ACTIONS.SET_MEMBERSHIP_BUY_STARTED });

  // show the memberships the user is subscribed to
  return await Lbryio.call('membership', 'buy', { environment: stripeEnvironment, ...membershipParams }, 'post')
    .then((response) => {
      dispatch(
        doToast({
          message: __('You are now a %membership_tier_name% member, enjoy the perks and special features!', {
            membership_tier_name: response.MembershipDetails.name,
            creator_channel_name: userChannelName,
          }),
        })
      );

      dispatch({ type: ACTIONS.SET_MEMBERSHIP_BUY_SUCCESFUL });
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
    });
};

export const doMembershipAddTier = (params: MembershipAddTierParams) => async (dispatch: Dispatch) =>
  await Lbryio.call('membership', 'add', { ...params, environment: stripeEnvironment }, 'post');

export const doGetMembershipPerks = (params: MembershipListParams) => async (dispatch: Dispatch) =>
  await Lbryio.call('membership_perk', 'list', { ...params, environment: stripeEnvironment }, 'post').then((response) =>
    dispatch({ type: ACTIONS.MEMBERSHIP_PERK_LIST_COMPLETE, data: { response } })
  );
