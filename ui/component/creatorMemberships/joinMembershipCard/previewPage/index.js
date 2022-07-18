import { connect } from 'react-redux';
import { selectChannelCanReceiveFiatTipsByUri, selectHasSavedCard } from 'redux/selectors/stripe';
import { selectCreatorHasMembershipsByUri } from 'redux/selectors/memberships';
import { doTipAccountCheckForUri, doGetCustomerStatus } from 'redux/actions/stripe';
import { selectMyChannelClaimIds, selectClaimForUri, selectClaimIsMine, selectChannelNameForUri, selectChannelIdForUri } from 'redux/selectors/claims';

import PreviewPage from './view';

const select = (state, props) => {
  const { uri } = props;
  const claim = selectClaimForUri(state, props.uri);

  return {
    canReceiveFiatTips: selectChannelCanReceiveFiatTipsByUri(state, uri),
    channelIsMine: selectClaimIsMine(state, claim),
    hasSavedCard: selectHasSavedCard(state),
    creatorHasMemberships: selectCreatorHasMembershipsByUri(state, uri),
    myChannelClaimIds: selectMyChannelClaimIds(state),
    channelName: selectChannelNameForUri(state, uri),
    channelId: selectChannelIdForUri(state, uri),
  };
};

const perform = {
  doTipAccountCheckForUri,
  doGetCustomerStatus,
};

export default connect(select, perform)(PreviewPage);
