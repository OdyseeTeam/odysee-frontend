import { connect } from 'react-redux';
import { doHideModal } from 'redux/actions/app';
import { doSpendEverything, doSendCreditsToOdysee } from 'redux/actions/wallet';
import { doUserFetch, doUserDeleteAccount, doClearUserDeletionSuccess } from 'redux/actions/user';
import { selectTotalBalance } from 'redux/selectors/wallet';
import { selectMyActiveMembershipsById } from 'redux/selectors/memberships';
import { doMembershipCancelForMembershipId } from 'redux/actions/memberships';
import { selectUser, selectUserDeletionSuccess } from 'redux/selectors/user';
import ModalRemoveAccount from './view';

const select = (state) => {
  const activeMemberships = selectMyActiveMembershipsById(state);
  const activeMembershipChannelIds = Object.keys(activeMemberships);

  const activeMembershipIds = [];
  activeMembershipChannelIds.map((creatorChannelId) => {
     activeMemberships[creatorChannelId].forEach((membership) => {
      activeMembershipIds.push(membership.Membership.membership_id);
    });
  });

  return {
    user: selectUser(state),
    totalBalance: selectTotalBalance(state),
    userDeletionSuccess: selectUserDeletionSuccess(state),
    activeMembershipIds: activeMembershipIds,
  };
};

const perform = {
  doHideModal,
  doUserFetch,
  doSpendEverything,
  doUserDeleteAccount,
  doSendCreditsToOdysee,
  doClearUserDeletionSuccess,
  doMembershipCancelForMembershipId,
};

export default connect(select, perform)(ModalRemoveAccount);
