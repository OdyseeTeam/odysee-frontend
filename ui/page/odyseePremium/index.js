import { connect } from 'react-redux';
import { doMembershipList } from 'redux/actions/memberships';
import { selectMembershipMineData, selectOdyseeMembershipTiers } from 'redux/selectors/memberships';
import { doGetCustomerStatus } from 'redux/actions/stripe';

import OdyseeMembership from './view';

const select = (state) => ({
  membershipMine: selectMembershipMineData(state),
  membershipOptions: selectOdyseeMembershipTiers(state),
});

const perform = {
  doGetCustomerStatus,
  doMembershipList,
};

export default connect(select, perform)(OdyseeMembership);
