import { connect } from 'react-redux';
import { selectMembershipTiersForChannelUri } from 'redux/selectors/memberships';
import { selectChannelNameForUri, selectChannelClaimIdForUri } from 'redux/selectors/claims';
import { selectHasSavedCard } from 'redux/selectors/stripe';
import { doMembershipList, doMembershipBuy } from 'redux/actions/memberships';
import { doGetCustomerStatus } from 'redux/actions/stripe';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { doToast } from 'redux/actions/notifications';

import PreviewPage from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    activeChannelClaim: selectActiveChannelClaim(state),
    creatorMemberships: selectMembershipTiersForChannelUri(state, uri),
    channelName: selectChannelNameForUri(state, uri),
    channelClaimId: selectChannelClaimIdForUri(state, uri),
    hasSavedCard: selectHasSavedCard(state),
  };
};

const perform = {
  doMembershipList,
  doGetCustomerStatus,
  doMembershipBuy,
  doToast,
};

export default connect(select, perform)(PreviewPage);
