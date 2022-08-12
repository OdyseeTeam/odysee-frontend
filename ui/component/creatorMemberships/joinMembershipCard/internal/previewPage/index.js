import { connect } from 'react-redux';
import { selectCanReceiveFiatTipsForUri, selectHasSavedCard } from 'redux/selectors/stripe';
import {
  selectMembershipTiersForChannelUri,
  selectCreatorHasMembershipsByUri,
  selectMembershipTiersForChannelId,
} from 'redux/selectors/memberships';
import { doTipAccountCheckForUri, doGetCustomerStatus } from 'redux/actions/stripe';
import { selectMyChannelClaimIds, selectClaimForUri, selectClaimIsMine } from 'redux/selectors/claims';

import PreviewPage from './view';

const select = (state, props) => {
  const { uri } = props;
  const claim = selectClaimForUri(state, props.uri);

  return {
    canReceiveFiatTips: selectCanReceiveFiatTipsForUri(state, uri),
    channelIsMine: selectClaimIsMine(state, claim),
    hasSavedCard: selectHasSavedCard(state),
    creatorHasMemberships: selectCreatorHasMembershipsByUri(state, uri),
    creatorMemberships: selectMembershipTiersForChannelUri(state, uri),
    myChannelClaimIds: selectMyChannelClaimIds(state),
    membershipTiers: selectMembershipTiersForChannelId(state, claim?.claim_id),
  };
};

const perform = {
  doTipAccountCheckForUri,
  doGetCustomerStatus,
};

export default connect(select, perform)(PreviewPage);
