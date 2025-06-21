import { connect } from 'react-redux';
import MembershipTier from './view';
import {
  selectHasCanceledMembershipForMembershipId,
  selectHasMembershipForMembershipId,
  selectHasPendingMembershipForMembershipId,
  selectMembershipMineForCreatorIdForMembershipId,
  selectTierIndexForCreatorIdAndMembershipId,
} from 'redux/selectors/memberships';
import { doOpenCancelationModalForMembership } from 'redux/actions/memberships';
import { selectArweaveExchangeRates } from 'redux/selectors/arwallet';

const select = (state, props) => {
  const creatorId = props.membership.channel_claim_id;
  return {
    tierIndex: selectTierIndexForCreatorIdAndMembershipId(
      state,
      props.membership.channel_claim_id,
      props.membership.membership_id
    ),
    isActive: selectHasMembershipForMembershipId(
      state,
      props.membership.channel_claim_id,
      props.membership.membership_id
    ), // using props.membership
    isPending: selectHasPendingMembershipForMembershipId(
      state,
      props.membership.channel_claim_id,
      props.membership.membership_id
    ),
    isCanceled: selectHasCanceledMembershipForMembershipId(
      state,
      props.membership.channel_claim_id,
      props.membership.membership_id
    ),
    thisMembership: selectMembershipMineForCreatorIdForMembershipId(state, creatorId, props.membership.membership_id),
    exchangeRate: selectArweaveExchangeRates(state),
  };
};

const perform = {
  doOpenCancelationModalForMembership,
};

export default connect(select, perform)(MembershipTier);
