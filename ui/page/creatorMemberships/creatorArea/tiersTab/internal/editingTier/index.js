import { connect } from 'react-redux';
import { selectMembershipPerks } from 'redux/selectors/memberships';
import { doMembershipAddTier } from 'redux/actions/memberships';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import TiersTab from './view';

const select = (state, props) => ({
  membershipPerks: selectMembershipPerks(state),
  activeChannelClaim: selectActiveChannelClaim(state),
});

const perform = {
  doMembershipAddTier,
};

export default connect(select, perform)(TiersTab);
