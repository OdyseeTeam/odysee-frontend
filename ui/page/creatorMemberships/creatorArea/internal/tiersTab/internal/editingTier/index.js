import { connect } from 'react-redux';
<<<<<<< Updated upstream
import { selectMembershipOdyseePerks } from 'redux/selectors/memberships';
import { doMembershipAddTier, doMembershipList } from 'redux/actions/memberships';
=======
import { selectMembershipPerks } from 'redux/selectors/memberships';
import { doMembershipAddTier, doMembershipList, doSaveMembershipRestrictionsForContent } from 'redux/actions/memberships';
>>>>>>> Stashed changes
import { selectActiveChannelClaim } from 'redux/selectors/app';
import TiersTab from './view';

const select = (state, props) => ({
  membershipOdyseePerks: selectMembershipOdyseePerks(state),
  activeChannelClaim: selectActiveChannelClaim(state),
});

const perform = {
  doMembershipAddTier,
  doMembershipList,
  doSaveMembershipRestrictionsForContent,
};

export default connect(select, perform)(TiersTab);
