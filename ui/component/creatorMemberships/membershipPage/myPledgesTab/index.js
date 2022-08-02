import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import MembershipsPage from './view';
import { selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
import { selectClaimsById, selectMyChannelClaims, selectClaimsByUri } from 'redux/selectors/claims';
import { selectUser, selectUserLocale } from 'redux/selectors/user';
import { selectMyActiveMemberships } from 'redux/selectors/memberships';
import { doMembershipMine } from 'redux/actions/memberships';
import { doToast } from 'redux/actions/notifications';
import { doResolveClaimIds } from 'redux/actions/claims';

const select = (state) => {
  const activeChannelClaim = selectActiveChannelClaim(state);

  return {
    activeChannelClaim,
    channels: selectMyChannelClaims(state),
    claimsByUri: selectClaimsByUri(state),
    incognito: selectIncognito(state),
    user: selectUser(state),
    locale: selectUserLocale(state),
    claimsById: selectClaimsById(state),
    myActiveMemberships: selectMyActiveMemberships(state),
  };
};

const perform = {
  openModal: doOpenModal,
  doResolveClaimIds,
  doMembershipMine,
};

export default connect(select, perform)(MembershipsPage);
