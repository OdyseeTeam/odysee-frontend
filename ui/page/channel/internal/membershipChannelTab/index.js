import { connect } from 'react-redux';
import { selectMyPurchasedMembershipTierForCreatorUri } from 'redux/selectors/memberships';
import { selectChannelClaimIdForUri } from 'redux/selectors/claims';
import { doOpenCancelationModalForMembership } from 'redux/actions/memberships';

import MembershipChannelTab from './view';

const select = (state, props) => {
  const { uri } = props;
  const channelClaimId = selectChannelClaimIdForUri(state, uri);
  const purchasedChannelMembership = selectMyPurchasedMembershipTierForCreatorUri(state, channelClaimId);

  return {
    purchasedChannelMembership,
  };
};

const perform = {
  doOpenCancelationModalForMembership,
};

export default connect(select, perform)(MembershipChannelTab);
