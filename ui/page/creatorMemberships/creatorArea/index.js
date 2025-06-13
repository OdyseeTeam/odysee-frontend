import { connect } from 'react-redux';

import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectMyChannelClaimIds, selectMyChannelClaims } from 'redux/selectors/claims';
import { selectMySupportersList } from 'redux/selectors/memberships';

import { doListAllMyMembershipTiers, doGetMembershipSupportersList } from 'redux/actions/memberships';

import CreatorArea from './view';
import { selectArweaveDefaultAccountMonetizationEnabled } from 'redux/selectors/stripe';

const select = (state, props) => ({
  activeChannelClaim: selectActiveChannelClaim(state),
  myChannelIds: selectMyChannelClaimIds(state),
  myChannelClaims: selectMyChannelClaims(state),
  supportersList: selectMySupportersList(state),
  monetizationEnabled: selectArweaveDefaultAccountMonetizationEnabled(state),
});

const perform = {
  doListAllMyMembershipTiers,
  doGetMembershipSupportersList,
};

export default connect(select, perform)(CreatorArea);
