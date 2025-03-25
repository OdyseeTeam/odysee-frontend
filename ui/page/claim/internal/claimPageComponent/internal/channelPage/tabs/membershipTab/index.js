import { connect } from 'react-redux';
import {
  selectMyPurchasedMembershipTierForCreatorUri,
  selectMembershipTiersForCreatorId,
} from 'redux/selectors/memberships';
import { selectChannelClaimIdForUri } from 'redux/selectors/claims';
import { doOpenCancelationModalForMembership } from 'redux/actions/memberships';
import { push } from 'connected-react-router';
import MembershipTab from './view';

const select = (state, props) => {
  const { uri } = props;
  const channelClaimId = selectChannelClaimIdForUri(state, uri);
  const purchasedChannelMembership = selectMyPurchasedMembershipTierForCreatorUri(state, channelClaimId);
  const creatorMemberships = selectMembershipTiersForCreatorId(state, channelClaimId); //
  // TODO AR MEMBERSHIP check these against api 'membership_id' field
  const membershipIndex =
    (creatorMemberships &&
      creatorMemberships.findIndex(
        (membership) =>
          membership &&
          membership.membership_id &&
          purchasedChannelMembership &&
          purchasedChannelMembership.id &&
          membership.membership_id === purchasedChannelMembership.id
      )) + 1;

  return {
    purchasedChannelMembership,
    membershipIndex,
  };
};

const perform = (dispatch) => ({
  doOpenCancelationModalForMembership: (membership) => dispatch(doOpenCancelationModalForMembership(membership)),
  navigate: (path) => dispatch(push(path)),
});

export default connect(select, perform)(MembershipTab);
