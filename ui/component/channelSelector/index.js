import { connect } from 'react-redux';
import { selectMyChannelClaims, selectClaimsByUri, selectOdyseeMembershipForUri } from 'redux/selectors/claims';
import { selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
import { doSetActiveChannel, doSetIncognito } from 'redux/actions/app';
import { doFetchUserMemberships } from 'redux/actions/user';
import { doSetClientSetting } from 'redux/actions/settings';
import ChannelSelector from './view';

const select = (state, props) => {
  const activeChannelClaim = selectActiveChannelClaim(state);

  return {
    channels: selectMyChannelClaims(state),
    activeChannelClaim,
    incognito: selectIncognito(state),
    odyseeMembershipByUri: (uri) => selectOdyseeMembershipForUri(state, uri),
    claimsByUri: selectClaimsByUri(state),
  };
};

const perform = {
  doSetActiveChannel,
  doSetIncognito,
  doFetchUserMemberships,
  doSetClientSetting,
};

export default connect(select, perform)(ChannelSelector);
