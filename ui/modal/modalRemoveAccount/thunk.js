// @flow
import analytics from 'analytics';
import { doUpdateBalance, doSpendEverything, doSendCreditsToOdysee } from 'redux/actions/wallet';
import { doUserFetch, doUserDeleteAccount } from 'redux/actions/user';
import { selectTotalBalance } from 'redux/selectors/wallet';
import { selectMembershipMineFetched, selectMyActiveMembershipsById } from 'redux/selectors/memberships';
import { doMembershipCancelForMembershipId } from 'redux/actions/memberships';
import { selectCustomerStatus, selectAccountStatus } from 'redux/selectors/stripe';
import { doTipAccountStatus, doGetCustomerStatus, doTipAccountRemove, doCustomerRemove } from 'redux/actions/stripe';

type Status = 'success' | 'error_occurred';

export function doRemoveAccountSequence() {
  return async (dispatch: Dispatch, getState: GetState): Promise<Status> => {
    await dispatch(doGetCustomerStatus());
    await dispatch(doTipAccountStatus());
    const state = getState();

    const isMembershipsMineFetched = selectMembershipMineFetched(state);
    if (!isMembershipsMineFetched) {
      analytics.error(`doRemoveAccountSequence: Memberships not fetched`);
      return 'error_occurred';
    }

    const activeMemberships = selectMyActiveMembershipsById(state);
    const activeMembershipChannelIds = Object.keys(activeMemberships);
    const activeMembershipIds = [];

    activeMembershipChannelIds.map((creatorChannelId) => {
      activeMemberships[creatorChannelId].forEach((membership) => {
        activeMembershipIds.push(membership.Membership.membership_id);
      });
    });

    if (activeMembershipIds.length > 0) {
      // Note: await (and maybe catch/finally too?) doesn't work in forEach
      for (let i = 0; i < activeMembershipIds.length; ++i) {
        const id = activeMembershipIds[i];
        try {
          await dispatch(doMembershipCancelForMembershipId(id));
        } catch (err) {
          analytics.error(`doRemoveAccountSequence: ${err.message || err}`);
          return 'error_occurred';
        }
      }
    }

    try {
      // Remove stripe customer/card
      const customerStatus = selectCustomerStatus(state);
      if (customerStatus) {
        await dispatch(doCustomerRemove());
      } else if (customerStatus === undefined) {
        // Not expecting this part to be ever reached, but would end up here if customerStatus hasn't been fetched, so adding just in case
        throw new Error('`customer` is undefined');
      }

      // Remove stripe account
      const accountStatus = selectAccountStatus(state);
      if (accountStatus) {
        await dispatch(doTipAccountRemove());
      } else if (accountStatus === undefined) {
        // Not expecting this part to be ever reached, but would end up here if accountStatus hasn't been fetched, so adding just in case
        throw new Error('`accountStatus` is undefined');
      }

      // Wipe content/credits
      const totalBalance = selectTotalBalance(state);
      const isWalletEmpty = totalBalance <= 0.005; // Allows avoiding some possible issues with txo_spend and sending credits
      if (!isWalletEmpty) {
        await dispatch(doSpendEverything());
        await new Promise((res) => setTimeout(res, 5000)); // Hoping the timeout helps to avoid using outputs already spend in txo_spend
        await dispatch(doUpdateBalance());
        await dispatch(doSendCreditsToOdysee());
      }

      // Send deletion request
      if (!state.user.user?.pending_deletion) {
        await dispatch(doUserDeleteAccount());
        setTimeout(() => {
          dispatch(doUserFetch());
        }, 1000); // Note: this will be parallel
      }
      return 'success';
    } catch (err) {
      analytics.error(`doRemoveAccountSequence: ${err.message || err}`);
      return 'error_occurred';
    }
  };
}
