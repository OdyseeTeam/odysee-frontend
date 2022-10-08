import { connect } from 'react-redux';
import { selectChannelNameForUri } from 'redux/selectors/claims';
import { selectPreferredCurrency } from 'redux/selectors/settings';
import { selectPurchaseIsPendingForMembershipId } from 'redux/selectors/memberships';

import ConfirmationPage from './view';

const select = (state, props) => {
  const { uri, selectedTier } = props;

  return {
    channelName: selectChannelNameForUri(state, uri),
    purchasePending: selectPurchaseIsPendingForMembershipId(state, selectedTier.Membership.id),
    preferredCurrency: selectPreferredCurrency(state),
  };
};

export default connect(select)(ConfirmationPage);
