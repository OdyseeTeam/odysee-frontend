import { connect } from 'react-redux';
import { selectMyChannelClaims } from 'redux/selectors/claims';
import { selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
import { doSetActiveChannel, doSetIncognito } from 'redux/actions/app';
import { selectOdyseeMembershipByClaimId } from 'redux/selectors/user';
import ChannelSelector from './view';

const select = (state, props) => {
  const activeChannelClaim = selectActiveChannelClaim(state);
  const uri = activeChannelClaim && activeChannelClaim.permanent_url;

  return {
    channels: selectMyChannelClaims(state),
    activeChannelClaim,
    incognito: selectIncognito(state),
    selectOdyseeMembershipByClaimId: selectOdyseeMembershipByClaimId(state, uri),
  };
};

export default connect(select, {
  doSetActiveChannel,
  doSetIncognito,
})(ChannelSelector);
