import { connect } from 'react-redux';
import { selectMembershipMineFetching, selectMyPurchasedMembershipsFromCreators } from 'redux/selectors/memberships';
import { doMembershipMine } from 'redux/actions/memberships';

import PledgesTab from './view';

const select = (state) => ({
  myPurchasedCreatorMemberships: selectMyPurchasedMembershipsFromCreators(state),
  isFetchingMemberships: selectMembershipMineFetching(state),
});

const perform = {
  doMembershipMine,
};

export default connect(select, perform)(PledgesTab);
