import { connect } from 'react-redux';
import { selectMyMembershipTiers } from 'redux/selectors/memberships';
import { doMembershipAddTier, doMembershipList } from 'redux/actions/memberships';
import TiersTab from './view';

const select = (state, props) => ({
  membershipPerks: selectMyMembershipTiers(state),
});

const perform = {
  doMembershipAddTier,
  doMembershipList,
};

export default connect(select, perform)(TiersTab);