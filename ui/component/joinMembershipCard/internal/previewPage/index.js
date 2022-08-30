import { connect } from 'react-redux';
import { selectCanReceiveFiatTipsForUri } from 'redux/selectors/stripe';
import { selectMembershipTiersForChannelUri, selectMembershipTiersForChannelId } from 'redux/selectors/memberships';
import { doTipAccountCheckForUri } from 'redux/actions/stripe';
import { selectIsChannelMineForClaimId, selectClaimForUri } from 'redux/selectors/claims';

import PreviewPage from './view';

const select = (state, props) => {
  const { uri } = props;
  const { claim_id: claimId } = selectClaimForUri(state, props.uri) || {};

  return {
    canReceiveFiatTips: selectCanReceiveFiatTipsForUri(state, uri),
    creatorMemberships: selectMembershipTiersForChannelUri(state, uri),
    membershipTiers: selectMembershipTiersForChannelId(state, claimId),
    channelIsMine: selectIsChannelMineForClaimId(state, claimId),
  };
};

const perform = {
  doTipAccountCheckForUri,
};

export default connect(select, perform)(PreviewPage);
