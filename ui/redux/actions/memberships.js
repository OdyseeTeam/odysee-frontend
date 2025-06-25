// @flow
import * as ACTIONS from 'constants/action_types';
import * as MODALS from 'constants/modal_types';
// $FlowIgnore
import { message, createDataItemSigner } from '@permaweb/aoconnect';
import { Lbryio } from 'lbryinc';
import { doToast } from 'redux/actions/notifications';
import {
  selectMembershipMineFetching,
  selectIsMembershipListFetchingForId,
  selectFetchingIdsForMembershipChannelId,
  selectIsListingAllMyTiers,
  selectIsClaimMembershipTierFetchingForId,
  selectMembershipTiersForCreatorId,
  selectChannelMembershipsForCreatorId,
} from 'redux/selectors/memberships';
import { selectChannelTitleForUri, selectClaimForId, selectMyChannelClaims } from 'redux/selectors/claims';
import { doOpenModal } from 'redux/actions/app';
import { ODYSEE_CHANNEL } from 'constants/channels';
import { formatDateToMonthDayAndYear } from 'util/time';
import { buildURI } from 'util/lbryURI';

import { getStripeEnvironment } from 'util/stripe';
import { selectAPIArweaveDefaultAddress } from '../selectors/stripe';
import { doArSign, sendWinstons } from './arwallet';
import { doResolveClaimIds } from './claims';
const stripeEnvironment = getStripeEnvironment();
const USD_TO_USDC = 1000000;
const CONVERT_DOLLARS_TO_PENNIES = 100;

export const doFetchChannelMembershipsForChannelIds =
  (channelId: string, channelIds: ClaimIds) => async (dispatch: Dispatch, getState: GetState) => {
    if (!channelIds || channelIds.length === 0) return;

    // remove dupes and falsey values
    const dedupedChannelIds = [...new Set(channelIds)].filter(Boolean);

    // check if channel id is fetching
    const state = getState();
    const fetchingForChannel = selectFetchingIdsForMembershipChannelId(state, channelId);
    const fetchingSet = new Set(fetchingForChannel);
    const creatorMemberships = selectChannelMembershipsForCreatorId(state, channelId);

    const channelsToFetch = dedupedChannelIds.filter((dedupedChannelId) => {
      const isFetching = fetchingSet.has(dedupedChannelId);
      const alreadyFetched =
        creatorMemberships && (creatorMemberships[dedupedChannelId] || creatorMemberships[dedupedChannelId] === null);
      return !isFetching && !alreadyFetched;
    });

    if (channelsToFetch.length === 0) return;

    // create 'comma separated values' string for backend
    const channelIdsToFetch = channelsToFetch.join(',');

    dispatch({ type: ACTIONS.CHANNEL_MEMBERSHIP_CHECK_STARTED, data: { channel: channelId, ids: channelsToFetch } });

    return await Lbryio.call('membership_v2', 'check', {
      channel_id: channelId,
      claim_ids: channelIdsToFetch,
    })
      .then((response) => {
        const membershipsById = {};

        for (const channelId in response) {
          const memberships = response[channelId];

          // if array was returned for a user (indicating a membership exists), otherwise is null
          if (Number.isInteger(memberships?.length)) {
            for (const membership of memberships) {
              if (membership.activated || membership.name === "Premium+" || membership.name === "Premium") {
                // activated?
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

// list available memberships for a channel id
export const doMembershipList =
  (params: MembershipListParams, forceUpdate: ?boolean) => async (dispatch: Dispatch, getState: GetState) => {
    const { channel_claim_id: channelId } = params;
    const state = getState();
    const isFetching = selectIsMembershipListFetchingForId(state, channelId);
    const alreadyFetched = selectMembershipTiersForCreatorId(state, channelId);

    if ((isFetching || alreadyFetched) && !forceUpdate) {
      return Promise.resolve();
    }

    dispatch({ type: ACTIONS.MEMBERSHIP_LIST_START, data: channelId });

    return await Lbryio.call('membership_v2', 'list', { ...params }, 'post')
      .then((response: MembershipSubs) =>
        dispatch({ type: ACTIONS.MEMBERSHIP_LIST_COMPLETE, data: { channelId, list: response } })
      )
      .catch(() => dispatch({ type: ACTIONS.MEMBERSHIP_LIST_COMPLETE, data: { channelId, list: null } }));
  };

export const doMembershipMine = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState();
  const isFetching = selectMembershipMineFetching(state);

  if (isFetching) return Promise.resolve();

  dispatch({ type: ACTIONS.GET_MEMBERSHIP_MINE_START });

  return await Lbryio.call('membership_v2/subscription', 'list', {}, 'post') // { membership,subscription, perks, payments, current_price }
    .then((response: MembershipSubs) => dispatch({ type: ACTIONS.GET_MEMBERSHIP_MINE_DATA_SUCCESS, data: response }))
    .catch((err) => {
      console.log('err', err);
      dispatch({ type: ACTIONS.GET_MEMBERSHIP_MINE_DATA_FAIL, data: err });
    });
};
/*
3 Steps: membership_v2/subscribe, arweave.message() to send payment, membership_v2/subscription/transaction_notify
await dispatch(doMembershipMine()); returns memberships[] which are put into state as a {creatorId: [subscriptions...] map
after step 1: subscription.status will be pending if new, payments[] will have an item reflecting the placeholder payment
`{completed_at: null, transaction_id: "", etc}`
after step 3: subscription.status may still be pending if api has not yet verified the payment on ao

 */
export const doMembershipBuy =
  (membershipParams: MembershipBuyParams) => async (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    console.log('dmb', membershipParams);

    const {
      tippedChannelId,
      subscriberChannelId, // current url channel id
      priceId, // memberships.membershipList~.<channelid>[0].prices[n].id
      membershipId,
    } = membershipParams;

    const source_payment_address = selectAPIArweaveDefaultAddress(state);
    const subscribeApiParams: MembershipSubscribeParams = {
      subscriber_channel_claim_id: subscriberChannelId,
      price_id: String(priceId),
      source_payment_address: source_payment_address || '',
    };

    if (!priceId) return;

    dispatch({ type: ACTIONS.SET_MEMBERSHIP_BUY_STARTED, data: membershipId });
    let subscribeToken = '';
    let payeeAddress = '';
    let responseAmount;
    let cryptoAmount = '';
    let currencyType = '';

    let transactionId;

    try {
      const walletUnlocked = await doArSign('hello');
      if (!walletUnlocked) {
        throw new Error('wallet not unlocked');
      }
      await Lbryio.call('membership_v2', 'subscribe', { ...subscribeApiParams }, 'post').then(
        (response: MembershipSubscribeResponse) => {
          const { token, payee_address, price } = response;
          const { transaction_amount, amount, transaction_currency } = price;
          responseAmount = (amount / CONVERT_DOLLARS_TO_PENNIES) * USD_TO_USDC;
          cryptoAmount = String(transaction_amount);
          subscribeToken = token;
          payeeAddress = payee_address;
          currencyType = transaction_currency;
        }
      );

      if (currencyType === 'AR') {
        const tags = [{ name: 'X-O-Ref', value: subscribeToken }]; // here
        const { transactionId: txid, error, status } = await sendWinstons(payeeAddress, cryptoAmount, tags);
        if (error) { // TODO pass error to redux
          throw new Error(error?.message || error);
        }
        transactionId = txid;
      } else if (currencyType === 'USD') {
        transactionId = await message({
          process: '7zH9dlMNoxprab9loshv3Y7WG45DOny_Vrq9KrXObdQ',
          data: '',
          tags: [
            { name: 'Action', value: 'Transfer' },
            { name: 'Quantity', value: String(responseAmount) }, // test/fix
            { name: 'Recipient', value: payeeAddress }, // get address
            { name: 'Tip_Type', value: 'tip' },
            { name: 'Claim_ID', value: tippedChannelId },
            { name: 'X-O-Ref', value: subscribeToken },
          ],
          Owner: source_payment_address, // test/fix
          signer: createDataItemSigner(window.arweaveWallet),
        });
      }

      const notifyParams = {
        token: subscribeToken,
        tx_id: transactionId,
      };

      await dispatch(doMembershipMine());

      await Lbryio.call('membership_v2/subscription', 'transaction_notify', notifyParams, 'post');
      await dispatch(doMembershipMine());
      dispatch({ type: ACTIONS.SET_MEMBERSHIP_BUY_SUCCESFUL, data: membershipId });
    } catch (error) {
      dispatch({ type: ACTIONS.SET_MEMBERSHIP_BUY_FAILED, data: { id: membershipId, error: error?.message || error } });
      console.error(error?.message || error);
      return Promise.reject(error);
    }
  };

export const doMembershipBuyClear = () => (dispatch) => {
  dispatch({ type: ACTIONS.SET_MEMBERSHIP_BUY_CLEAR });
};

export const doMembershipCancelForMembershipId =
  (membershipId: number, revert: boolean) => async (dispatch: Dispatch) => {
    dispatch({ type: ACTIONS.SET_MEMBERSHIP_CANCEL_STARTED, data: membershipId });

    return await Lbryio.call('membership_v2/subscription', 'cancel', { membership_id: membershipId, revert }, 'post')
      .then((response) => {
        dispatch({ type: ACTIONS.SET_MEMBERSHIP_CANCEL_SUCCESFUL, data: membershipId });
        dispatch(doMembershipMine());

        return response;
      })
      .catch((e) => {
        if (e.message === 'this subscription is no longer active') {
          dispatch({ type: ACTIONS.SET_MEMBERSHIP_CANCEL_SUCCESFUL, data: membershipId });
        } else {
          dispatch({ type: ACTIONS.SET_MEMBERSHIP_CANCEL_FAILED, data: membershipId });
          throw new Error(e);
        }
      });
  };

export const doMembershipFetchIncomingPayments = () => async (dispatch: Dispatch) => {
  // start
  dispatch({ type: ACTIONS.MEMBERSHIP_TX_INCOMING_STARTED });
  try {
    const inboundTransactions = await Lbryio.call('membership_v2/transactions', 'inbound', {}, 'post');
    const channelsToResolve = new Set([]);
    inboundTransactions.forEach(t => {
      channelsToResolve.add(t.creator_channel_claim_id);
      channelsToResolve.add(t.subscriber_channel_claim_id);
    });
    dispatch(doResolveClaimIds(Array.from(channelsToResolve)));
    dispatch({ type: ACTIONS.MEMBERSHIP_TX_INCOMING_SUCCESSFUL, data: inboundTransactions });
  } catch (error) {
    dispatch({ type: ACTIONS.MEMBERSHIP_TX_INCOMING_FAILED, data: error.message || error });
    console.log('error', error.message || error);
  }
};

export const doMembershipFetchOutgoingPayments = () => async (dispatch: Dispatch) => {
  // start
  dispatch({ type: ACTIONS.MEMBERSHIP_TX_OUTGOING_STARTED });
  try {
    const outboundTransactions = await Lbryio.call('membership_v2/transactions', 'outbound', {}, 'post');
    const channelsToResolve = new Set([]);
    outboundTransactions.forEach(t => {
      channelsToResolve.add(t.creator_channel_claim_id);
      channelsToResolve.add(t.subscriber_channel_claim_id);
    });
    dispatch(doResolveClaimIds(Array.from(channelsToResolve)));
    // TODO also resolve memberships?
    dispatch({ type: ACTIONS.MEMBERSHIP_TX_OUTGOING_SUCCESSFUL, data: outboundTransactions });
  } catch (error) {
    dispatch({ type: ACTIONS.MEMBERSHIP_TX_OUTGOING_FAILED, data: error.message || error });
    console.log('error', error.message || error);
  }
};

export const doMembershipAddTier = (params: MembershipAddTierParams) => async (dispatch: Dispatch) =>
  await Lbryio.call('membership_v2', 'create', { ...params }, 'post')
    .then((response: MembershipCreateResponse) => ({ response: response }))
    .catch((e) => {
      return { error: e?.message || e };
    });

export const doMembershipUpdateTier = (params: MembershipUpdateTierParams) => async (dispatch: Dispatch) =>
  await Lbryio.call('membership_v2', 'update', { ...params }, 'post')
    .then((response: MembershipCreateResponse) => ({ response: response }))
    .catch((e) => {
      return { error: e?.message || e };
    });

export const doGetMembershipPerks = (params: MembershipListParams) => async (dispatch: Dispatch) =>
  await Lbryio.call('membership_perk', 'list', { ...params, environment: stripeEnvironment }, 'post')
    .then((response: MembershipDetails) => dispatch({ type: ACTIONS.MEMBERSHIP_PERK_LIST_COMPLETE, data: response }))
    .catch((e) => e);

export const doOpenCancelationModalForMembership =
  (membershipSub: MembershipSub) => (dispatch: Dispatch, getState: GetState) => {
    const { membership, subscription } = membershipSub;
    // const isActive = subscription.status === 'active';
    const isCanceled = subscription.status === 'canceled';

    const state = getState();
    const { name: channelName } = selectClaimForId(state, membership.channel_claim_id);
    const formattedEndOfMembershipDate = formatDateToMonthDayAndYear(new Date(subscription.ends_at));
    const creatorUri = buildURI({
      channelName: channelName,
      channelClaimId: membership.channel_claim_id,
    });
    const creatorTitleName = selectChannelTitleForUri(state, creatorUri);

    if (isCanceled) {
      return dispatch(
        doOpenModal(MODALS.CONFIRM, {
          title: __('Confirm Restoring %membership_name% Membership', { membership_name: membership.name }),
          subtitle: __('Are you sure you want to restore your %creator_name%\'s "%membership_name%" membership? ', {
            membership_name: membership.name,
          }),
          busyMsg: __('Restoring your membership...'),
          onConfirm: (closeModal, setIsBusy) => {
            setIsBusy(true);
            dispatch(doMembershipCancelForMembershipId(membership.id, true)).then(() => {
              setIsBusy(false);
              dispatch(doToast({ message: __('Your membership was successfully restored.') }));
              closeModal();
            });
          },
        })
      );
    }
    return dispatch(
      doOpenModal(MODALS.CONFIRM, {
        title: __('Confirm %membership_name% Cancellation', { membership_name: membership.name }),
        subtitle: __(
          'Are you sure you want to cancel your %creator_name%\'s "%membership_name%" membership? ' +
            'You will still have all your features until %end_date% at which point your purchase will not be renewed ' +
            'and you will lose access to your membership features and perks.',
          {
            creator_name: creatorTitleName,
            membership_name: membership.name,
            end_date: formattedEndOfMembershipDate,
          }
        ),
        busyMsg: __('Canceling your membership...'),
        onConfirm: (closeModal, setIsBusy) => {
          setIsBusy(true);
          dispatch(doMembershipCancelForMembershipId(membership.id)).then(() => {
            setIsBusy(false);
            dispatch(
              doToast({ message: __('Your membership was successfully cancelled and will no longer be renewed.') })
            );
            closeModal();
          });
        },
      })
    );
  };

export const doDeactivateMembershipForId = (membershipId: number) => async (dispatch: Dispatch) => {
  dispatch({ type: ACTIONS.DELETE_MEMBERSHIP_STARTED, data: membershipId });

  await Lbryio.call('membership_v2', 'deactivate', { membership_id: membershipId }, 'post')
    .then((response) => {
      dispatch({ type: ACTIONS.SET_MEMBERSHIP_CANCEL_SUCCESFUL, data: membershipId });
      return response;
    })
    .catch((e) => {
      dispatch({ type: ACTIONS.SET_MEMBERSHIP_CANCEL_FAILED, data: membershipId });
      return e;
    });
};

export const doSetMembershipTiersForClaimId =
  (membershipIds: string, claimId: string) => async (dispatch: Dispatch) => {
    dispatch({
      type: ACTIONS.SET_MEMBERSHIP_TIERS_FOR_CONTENT_STARTED,
      data: {
        membershipIds,
        claimId,
      },
    });

    await Lbryio.call(
      'membership_content',
      'modify',
      {
        environment: stripeEnvironment,
        membership_ids: membershipIds,
        add_claim_id: claimId, // TODO: this is changed in the updated API
      },
      'post'
    )
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
  // get membership tiers for channel
  await Lbryio.call(
    'membership',
    'content',
    {
      environment: stripeEnvironment,
      for_channel: channelClaimId,
    },
    'post'
  )
    .then((response) => {
      dispatch({ type: ACTIONS.GET_MEMBERSHIP_TIERS_FOR_CHANNEL_SUCCESS, data: response });
      return response;
    })
    .catch((e) => {
      dispatch({ type: ACTIONS.GET_MEMBERSHIP_TIERS_FOR_CHANNEL_FAILED, data: channelClaimId });
      return e;
    });
};

export const doMembershipContentForStreamClaimIds =
  (contentClaimIds: ClaimIds) => async (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const idsToFetch = contentClaimIds.filter((claimId) => {
      const isFetching = selectIsClaimMembershipTierFetchingForId(state, claimId);
      return !isFetching;
    });

    if (idsToFetch.length === 0) return Promise.resolve();

    const claimIdsCsv = idsToFetch.toString();

    dispatch({ type: ACTIONS.GET_CLAIM_MEMBERSHIP_TIERS_START, data: idsToFetch });

    await Lbryio.call('membership_v2/member_content', 'resolve', { claim_ids: claimIdsCsv }, 'post')
      .then((response: MembershipContentResponse) => {
        dispatch({ type: ACTIONS.GET_CLAIM_MEMBERSHIP_TIERS_SUCCESS, data: response });
        return response;
      })
      .catch((e) => {
        dispatch({ type: ACTIONS.GET_CLAIM_MEMBERSHIP_TIERS_FAIL, data: idsToFetch });
        return e;
      });
  };

export const doMembershipContentforStreamClaimId =
  (contentClaimId: string) => async (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const isFetching = selectIsClaimMembershipTierFetchingForId(state, contentClaimId);

    if (isFetching) return Promise.resolve();

    return dispatch(doMembershipContentForStreamClaimIds([contentClaimId]));
  };

export const doSaveMembershipRestrictionsForContent =
  (
    channelClaimId: string,
    contentClaimId: string,
    contentClaimName: string,
    memberRestrictionTierIds: Array<number>,
    pendingClaim: ?boolean
  ) =>
  async (dispatch: Dispatch) => {
    dispatch({
      type: ACTIONS.SET_MEMBERSHIP_TIERS_FOR_CONTENT_STARTED,
      data: {
        memberRestrictionTierIds,
        contentClaimId,
      },
    });

    await Lbryio.call(
      'membership_v2/member_content',
      'modify',
      {
        claim_id: contentClaimId,
        membership_ids: memberRestrictionTierIds
          .slice()
          .sort((a, b) => a - b)
          .join(','),
        channel_id: channelClaimId,
        claim_name: contentClaimName,
        // pending_claim: pendingClaim,
      },
      'post'
    )
      .then((response) => {
        // dispatch({ type: ACTIONS.SET_MEMBERSHIP_TIERS_FOR_CONTENT_SUCCESS, data: response });
        return response;
      })
      .catch((e) => {
        // dispatch({ type: ACTIONS.SET_MEMBERSHIP_TIERS_FOR_CONTENT_FAILED, data: contentClaimId });
        return e;
      });
  };

export const doMembershipClearData = () => async (dispatch: Dispatch) =>
  await Lbryio.call('membership', 'clear', { environment: 'test' }, 'post').then(() => dispatch(doMembershipMine()));

// TODO get (paginate?) historical only_active = false
export const doGetMembershipSupportersList = () => async (dispatch: Dispatch) =>
  Lbryio.call('membership_v2', 'subscribers', { only_active: true }, 'post')
    .then((response: SupportersList) => {
      dispatch({ type: ACTIONS.GET_MEMBERSHIP_SUPPORTERS_LIST_COMPLETE, data: response });
    })
    .catch(() => dispatch({ type: ACTIONS.GET_MEMBERSHIP_SUPPORTERS_LIST_COMPLETE, data: null }));

export const doListAllMyMembershipTiers = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState();
  const isListingAllMyTiers = selectIsListingAllMyTiers(state);

  if (isListingAllMyTiers !== undefined) return Promise.resolve();

  dispatch({ type: ACTIONS.LIST_ALL_MY_MEMBERSHIPS_START });

  const myChannelClaims = selectMyChannelClaims(state);

  if (!myChannelClaims) return Promise.resolve();

  const pendingPromises = [];
  myChannelClaims.map((channelClaim, index) => {
    pendingPromises[index] = dispatch(doMembershipList({ channel_claim_id: channelClaim.claim_id }));
  });

  return await Promise.all(pendingPromises)
    .then((responseList) => {
      dispatch({ type: ACTIONS.LIST_ALL_MY_MEMBERSHIPS_COMPLETE });
      return responseList;
    })
    .catch((e) => {
      dispatch({ type: ACTIONS.LIST_ALL_MY_MEMBERSHIPS_COMPLETE });
      return e;
    });
};
