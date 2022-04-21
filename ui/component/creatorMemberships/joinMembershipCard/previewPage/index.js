import { connect } from 'react-redux';
import { selectChannelCanReceiveFiatTipsByUri, selectHasSavedCard } from 'redux/selectors/stripe';
import { selectCreatorHasMembershipsByUri } from 'redux/selectors/memberships';
import { doTipAccountCheckForUri, doGetCustomerStatus } from 'redux/actions/stripe';
import { selectMyChannelClaimIds, makeSelectClaimForUri } from 'redux/selectors/claims';
import PreviewPage from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    claim: makeSelectClaimForUri(uri)(state),
    canReceiveFiatTips: selectChannelCanReceiveFiatTipsByUri(state, uri),
    hasSavedCard: selectHasSavedCard(state),
    creatorHasMemberships: selectCreatorHasMembershipsByUri(state, uri),
    myChannelClaimIds: selectMyChannelClaimIds(state),
  };
};

const perform = {
  doTipAccountCheckForUri,
  doGetCustomerStatus,
};

export default connect(select, perform)(PreviewPage);
