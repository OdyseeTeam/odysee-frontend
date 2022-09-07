// @flow
import * as ACTIONS from 'constants/action_types';
import * as MODALS from 'constants/modal_types';

import { Lbryio } from 'lbryinc';
import { doToast } from 'redux/actions/notifications';
import { selectFetchingIdsForMembershipChannelId } from 'redux/selectors/memberships';
import { selectChannelTitleForUri } from 'redux/selectors/claims';
import { doOpenModal } from 'redux/actions/app';
import { ODYSEE_CHANNEL } from 'constants/channels';
import { formatDateToMonthDayAndYear } from 'util/time';
import { buildURI } from 'util/lbryURI';

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

// TODO: some bug was introduced here where kept calling itself over and over
export const doFetchOdyseeMembershipForChannelIds = (channelIds: ClaimIds) => async (dispatch: Dispatch) => {}
  // dispatch(doFetchChannelMembershipsForChannelIds(ODYSEE_CHANNEL.ID, channelIds));

export const doMembershipList = (params: MembershipListParams) => async (dispatch: Dispatch) =>
  await Lbryio.call('membership', 'list', { environment: stripeEnvironment, ...params }, 'post')
    .then((response: MembershipTiers) =>
      dispatch({ type: ACTIONS.LIST_MEMBERSHIP_DATA, data: { channelId: params.channel_id, list: response } })
    )
    .catch((e) => dispatch({ type: ACTIONS.LIST_MEMBERSHIP_DATA_ERROR, data: e }));

export const doMembershipMine = () => async (dispatch: Dispatch) =>
  await Lbryio.call('membership', 'mine', { environment: stripeEnvironment }, 'post')
    .then((response) => {
      const membershipMine: MembershipMineDataByKey = { activeById: {}, canceledById: {}, purchasedById: {} };

      for (const membership of response) {
        const creatorClaimId = membership.MembershipDetails.channel_id;

        const isActive = membership.Membership.auto_renew;
        const { activeById, canceledById, purchasedById } = membershipMine;

        if (isActive) {
          const currentActive = activeById[creatorClaimId];
          activeById[creatorClaimId] = currentActive ? [...currentActive, membership] : [membership];
        } else {
          const currentCanceled = canceledById[creatorClaimId];
          canceledById[creatorClaimId] = currentCanceled ? [...currentCanceled, membership] : [membership];
        }

        const currentPurchased = purchasedById[creatorClaimId];
        purchasedById[creatorClaimId] = currentPurchased ? [...currentPurchased, membership] : [membership];
      }

      dispatch({ type: ACTIONS.SET_MEMBERSHIP_MINE_DATA, data: membershipMine });
    })
    .catch((err) => dispatch({ type: ACTIONS.SET_MEMBERSHIP_MINE_DATA_ERROR, data: err }));

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
      dispatch({ type: ACTIONS.SET_MEMBERSHIP_BUY_FAILED, data: membershipId });

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

      throw new Error(e);
    });
};

export const doMembershipCancelForMembershipId = (membershipId: number) => async (dispatch: Dispatch) => {
  dispatch({ type: ACTIONS.SET_MEMBERSHIP_CANCEL_STARTED, data: membershipId });

  return await Lbryio.call(
    'membership',
    'cancel',
    { environment: stripeEnvironment, membership_id: membershipId },
    'post'
  )
    .then((response) => {
      dispatch({ type: ACTIONS.SET_MEMBERSHIP_CANCEL_SUCCESFUL, data: membershipId });
      dispatch(doMembershipMine());

      return response;
    })
    .catch((e) => {
      dispatch({ type: ACTIONS.SET_MEMBERSHIP_CANCEL_FAILED, data: membershipId });
      throw new Error(e);
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

export const doOpenCancelationModalForMembership = (membership: MembershipTier) => (
  dispatch: Dispatch,
  getState: GetState
) => {
  const { MembershipDetails, Subscription } = membership;

  const state = getState();
  const formattedEndOfMembershipDate = formatDateToMonthDayAndYear(Subscription.current_period_end * 1000);
  const creatorUri = buildURI({
    channelName: MembershipDetails.channel_name,
    channelClaimId: MembershipDetails.channel_id,
  });
  const creatorTitleName = selectChannelTitleForUri(state, creatorUri);

  return dispatch(
    doOpenModal(MODALS.CONFIRM, {
      title: __('Confirm %membership_name% Cancelation', { membership_name: MembershipDetails.name }),
      subtitle: __(
        'Are you sure you want to cancel your %creator_name%\'s "%membership_name%" membership? ' +
          'You will still have all your features until %end_date% at which point your purchase will not renewed ' +
          'and you will lose access to your membership features and perks',
        {
          creator_name: creatorTitleName,
          membership_name: MembershipDetails.name,
          end_date: formattedEndOfMembershipDate,
        }
      ),
      busyMsg: __('Canceling your membership...'),
      onConfirm: (closeModal, setIsBusy) => {
        setIsBusy(true);
        dispatch(doMembershipCancelForMembershipId(MembershipDetails.id)).then(() => {
          setIsBusy(false);
          dispatch(
            doToast({ message: __('Your membership was succesfully cancelled and will no longer be renewed.') })
          );
          closeModal();
        });
      },
    })
  );
};

export const doDeactivateMembershipForId = (membershipId: number) => async (dispatch: Dispatch) => {
  dispatch({ type: ACTIONS.DELETE_MEMBERSHIP_STARTED, data: membershipId });

  await Lbryio.call('membership', 'deactivate', { environment: stripeEnvironment, membership_id: membershipId }, 'post')
    .then((response) => {
      dispatch({ type: ACTIONS.SET_MEMBERSHIP_CANCEL_SUCCESFUL, data: membershipId });
      return response;
    })
    .catch((e) => {
      dispatch({ type: ACTIONS.SET_MEMBERSHIP_CANCEL_FAILED, data: membershipId });
      return e;
    });
};

export const doSetMembershipTiersForClaimId = (membershipIds: string, claimId: string) => async (dispatch: Dispatch) => {
  dispatch({
    type: ACTIONS.SET_MEMBERSHIP_TIERS_FOR_CONTENT_STARTED,
    data: {
      membershipIds,
      claimId,
    },
  });

  await Lbryio.call('membership_content', 'modify', {
    environment: stripeEnvironment,
    membership_ids: membershipIds,
    add_claim_id: claimId, // TODO: this is changed in the updated API
  }, 'post')
    .then((response) => {
      dispatch({
        type: ACTIONS.SET_MEMBERSHIP_TIERS_FOR_CONTENT_SUCCESS,
        data: {
          membershipIds,
          claimId,
        },
      });
      return response;
    })
    .catch((e) => {
      dispatch({
        type: ACTIONS.SET_MEMBERSHIP_TIERS_FOR_CONTENT_FAILED,
        data: {
          membershipIds,
          claimId,
        },
      });
      return e;
    });
};

export const doGetMembershipTiersForChannelClaimId = (channelClaimId: string) => async (dispatch: Dispatch) => {
  dispatch({ type: ACTIONS.GET_MEMBERSHIP_TIERS_FOR_CHANNEL_STARTED, data: channelClaimId });

  await Lbryio.call('membership', 'content', {
    environment: stripeEnvironment,
    for_channel: channelClaimId,
  }, 'post')
    .then((response) => {
      dispatch({ type: ACTIONS.GET_MEMBERSHIP_TIERS_FOR_CHANNEL_SUCCESS, data: response });
      return response;
    })
    .catch((e) => {
      console.log(e);
      dispatch({ type: ACTIONS.GET_MEMBERSHIP_TIERS_FOR_CHANNEL_FAILED, data: channelClaimId });
      return e;
    });
};

export const doGetMembershipTiersForContentClaimId = (contentClaimId: string) => async (dispatch: Dispatch) => {
  dispatch({ type: ACTIONS.GET_MEMBERSHIP_TIERS_FOR_CONTENT_STARTED, data: contentClaimId });

  await Lbryio.call('membership', 'content', {
    environment: stripeEnvironment,
    claim_id: contentClaimId,
  }, 'post')
    .then((response) => {
      console.log('response');
      console.log(response);
      dispatch({ type: ACTIONS.GET_MEMBERSHIP_TIERS_FOR_CONTENT_SUCCESS, data: response });
      return response;
    })
    .catch((e) => {
      console.log(e);
      dispatch({ type: ACTIONS.GET_MEMBERSHIP_TIERS_FOR_CONTENT_FAILED, data: contentClaimId });
      return e;
    });
};

export const doSaveMembershipRestrictionsForContent = (channelClaimId: string, contentClaimId: string, commaSeperatedMembershipIds: string) => async (dispatch: Dispatch) => {
  dispatch({ type: ACTIONS.SET_MEMBERSHIP_TIERS_FOR_CONTENT_STARTED,
    data: {
      commaSeperatedMembershipIds,
      contentClaimId,
    },
  });

  await Lbryio.call('membership_content', 'modify', {
    environment: stripeEnvironment,
    claim_id: contentClaimId,
    membership_ids: commaSeperatedMembershipIds,
    channel_id: channelClaimId,
  }, 'post')
    .then((response) => {
      console.log('response');
      console.log(response);
      // dispatch({ type: ACTIONS.SET_MEMBERSHIP_TIERS_FOR_CONTENT_SUCCESS, data: response });
      return response;
    })
    .catch((e) => {
      console.log(e);
      // dispatch({ type: ACTIONS.SET_MEMBERSHIP_TIERS_FOR_CONTENT_FAILED, data: contentClaimId });
      return e;
    });
};

export const doMembershipClearData = () => async (dispatch: Dispatch) =>
  await Lbryio.call('membership', 'clear', { environment: 'test' }, 'post').then(() => dispatch(doMembershipMine()));