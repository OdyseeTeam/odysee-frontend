// @flow
import { doSpendEverything, doSendCreditsToOdysee } from 'redux/actions/wallet';
import { doUserFetch, doUserDeleteAccount } from 'redux/actions/user';
import { selectTotalBalance } from 'redux/selectors/wallet';
import { selectMyActiveMembershipsById } from 'redux/selectors/memberships';
import { doMembershipCancelForMembershipId } from 'redux/actions/memberships';

type Status = 'success' | 'error_occurred';

export function doRemoveAccountSequence() {
  return async (dispatch: Dispatch, getState: GetState): Promise<Status> => {
    const state = getState();

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
          return 'error_occurred';
        }
      }
    }

    try {
      const totalBalance = selectTotalBalance(state);
      const isWalletEmpty = totalBalance <= 0.005; // Allows avoiding some possible issues with txo_spend and sending credits
      if (!isWalletEmpty) {
        await dispatch(doSpendEverything());
        await new Promise((res) => setTimeout(res, 5000)); // Hoping the timeout helps to avoid using outputs already spend in txo_spend
        await dispatch(doSendCreditsToOdysee());
      }
      if (!state.user.user?.pending_deletion) {
        await dispatch(doUserDeleteAccount());
        setTimeout(() => {
          dispatch(doUserFetch());
        }, 1000); // Note: this will be parallel
      }
      return 'success';
    } catch (err) {
      return 'error_occurred';
    }
  };
}
