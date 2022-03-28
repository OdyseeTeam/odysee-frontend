import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import MembershipsPage from './view';
import { selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
import { selectMyChannelClaims, selectClaimsByUri } from 'redux/selectors/claims';
import { doFetchUserMemberships, doCheckUserOdyseeMemberships } from 'redux/actions/user';
import { selectUser, selectUserLocale } from 'redux/selectors/user';
import { doToast } from 'redux/actions/notifications';

const select = (state) => {
  const activeChannelClaim = selectActiveChannelClaim(state);

  return {
    activeChannelClaim,
    channels: selectMyChannelClaims(state),
    claimsByUri: selectClaimsByUri(state),
    incognito: selectIncognito(state),
    user: selectUser(state),
    locale: selectUserLocale(state),
  };
};

const perform = (dispatch) => ({
  doToast: (options) => dispatch(doToast(options)),
  openModal: (modal, props) => dispatch(doOpenModal(modal, props)),
  fetchUserMemberships: (claimIds) => dispatch(doFetchUserMemberships(claimIds)),
  updateUserOdyseeMembershipStatus: (user) => dispatch(doCheckUserOdyseeMemberships(user)),
});

export default connect(select, perform)(MembershipsPage);
