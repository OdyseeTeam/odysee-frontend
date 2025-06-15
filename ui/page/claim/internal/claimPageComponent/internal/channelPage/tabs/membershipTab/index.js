import { connect } from 'react-redux';
import {
  selectMyPurchasedMembershipTierForCreatorUri,
  selectMyPurchasedMembershipsForChannelClaimId,
} from 'redux/selectors/memberships';
import { selectChannelClaimIdForUri } from 'redux/selectors/claims';
import { push } from 'connected-react-router';
import MembershipTab from './view';

const select = (state, props) => {
  const { uri } = props;

  const channelClaimId = selectChannelClaimIdForUri(state, uri);
  const myMembershipSubscriptions = selectMyPurchasedMembershipsForChannelClaimId(state, channelClaimId);
  const purchasedChannelMembership = selectMyPurchasedMembershipTierForCreatorUri(state, channelClaimId);

  return {
    myMembershipSubscriptions,
    purchasedChannelMembership,
  };
};

const perform = (dispatch) => ({
  navigate: (path) => dispatch(push(path)),
});

export default connect(select, perform)(MembershipTab);
