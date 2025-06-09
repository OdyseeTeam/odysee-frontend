import { connect } from 'react-redux';

import { selectChannelNameForUri } from 'redux/selectors/claims';
import { selectPreferredCurrency } from 'redux/selectors/settings';
import { selectIncognito } from 'redux/selectors/app';
import { selectPurchaseIsPendingForMembershipId } from 'redux/selectors/memberships';

import ConfirmationPage from './view';
import { selectArweaveBalance, selectArweaveExchangeRates } from 'redux/selectors/arwallet';
import { doArConnect } from 'redux/actions/arwallet';

const select = (state, props) => {
  const { uri, selectedCreatorMembership } = props;

  return {
    channelName: selectChannelNameForUri(state, uri),
    purchasePending: selectPurchaseIsPendingForMembershipId(state, selectedCreatorMembership?.membership_id),
    preferredCurrency: selectPreferredCurrency(state),
    incognito: selectIncognito(state),
    balance: selectArweaveBalance(state) || { ar: 0 },
    exchangeRate: selectArweaveExchangeRates(state),
  };
};

const perform = {
  doArConnect,
};
export default connect(select, perform)(ConfirmationPage);
