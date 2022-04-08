import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import OdyseeMembership from './view';
import { selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
import { selectMyChannelClaims, selectClaimsByUri } from 'redux/selectors/claims';
import { doFetchUserMemberships, doCheckUserOdyseeMemberships, doMembershipMine } from 'redux/actions/memberships';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectUser, selectUserLocale } from 'redux/selectors/user';
import { selectMembershipMineData } from 'redux/selectors/memberships';
import * as SETTINGS from 'constants/settings';

const select = (state) => {
  const activeChannelClaim = selectActiveChannelClaim(state);

  return {
    activeChannelClaim,
    channels: selectMyChannelClaims(state),
    claimsByUri: selectClaimsByUri(state),
    incognito: selectIncognito(state),
    user: selectUser(state),
    locale: selectUserLocale(state),
    preferredCurrency: selectClientSetting(state, SETTINGS.PREFERRED_CURRENCY),
    membershipMine: selectMembershipMineData(state),
  };
};

const perform = {
  openModal: doOpenModal,
  fetchUserMemberships: doFetchUserMemberships,
  updateUserOdyseeMembershipStatus: doCheckUserOdyseeMemberships,
  doMembershipMine,
};

export default connect(select, perform)(OdyseeMembership);
