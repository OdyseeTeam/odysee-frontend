import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import OdyseeMembership from './view';
import { selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
import { selectMyChannelClaims, selectClaimsByUri } from 'redux/selectors/claims';
import { doFetchOdyseeMembershipForChannelIds, doMembershipMine } from 'redux/actions/memberships';
import { selectPreferredCurrency } from 'redux/selectors/settings';
import { selectUser, selectUserLocale } from 'redux/selectors/user';

const select = (state) => {
  const activeChannelClaim = selectActiveChannelClaim(state);

  return {
    activeChannelClaim,
    channels: selectMyChannelClaims(state),
    claimsByUri: selectClaimsByUri(state),
    incognito: selectIncognito(state),
    user: selectUser(state),
    locale: selectUserLocale(state),
    preferredCurrency: selectPreferredCurrency(state),
  };
};

const perform = {
  doOpenModal,
  doFetchOdyseeMembershipForChannelIds,
  doMembershipMine,
};

export default connect(select, perform)(OdyseeMembership);
