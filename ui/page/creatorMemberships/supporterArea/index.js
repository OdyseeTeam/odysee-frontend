import { connect } from 'react-redux';
import SupporterArea from './view';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectMyChannelClaimIds, selectMyChannelClaims } from 'redux/selectors/claims';
import { doListAllMyMembershipTiers } from 'redux/actions/memberships';

const select = (state, props) => ({
  activeChannelClaim: selectActiveChannelClaim(state),
  myChannelClaims: selectMyChannelClaims(state),
  myChannelIds: selectMyChannelClaimIds(state),
});

const perform = {
  doListAllMyMembershipTiers,
};

export default connect(select, perform)(SupporterArea);
