import { connect } from 'react-redux';
import { selectMyChannelClaims, selectClaimsByUri } from 'redux/selectors/claims';
import { selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
import { doSetActiveChannel, doSetIncognito } from 'redux/actions/app';
import { selectOdyseeMembershipByUri } from 'redux/selectors/user';
import { doFetchUserMemberships } from 'redux/actions/user';
import ChannelSelector from './view';

const select = (state, props) => {
  const activeChannelClaim = selectActiveChannelClaim(state);

  return {
    channels: selectMyChannelClaims(state),
    activeChannelClaim,
    incognito: selectIncognito(state),
    odyseeMembershipByUri: (uri) => selectOdyseeMembershipByUri(state, uri),
    claimsByUri: selectClaimsByUri(state),
  };
};

export default connect(select, {
  doSetActiveChannel,
  doSetIncognito,
  doFetchUserMemberships,
})(ChannelSelector);
