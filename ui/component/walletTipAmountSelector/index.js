import { connect } from 'react-redux';
import { selectBalance } from 'redux/selectors/wallet';
import { selectClaimForUri } from 'redux/selectors/claims';
import WalletTipAmountSelector from './view';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectChannelCanReceiveFiatTipsByUri, selectHasSavedCard } from 'redux/selectors/stripe';
import { doTipAccountCheckForUri, doGetCustomerStatus } from 'redux/actions/stripe';
import * as SETTINGS from 'constants/settings';

const select = (state, props) => {
  const { uri } = props;

  return {
    balance: selectBalance(state),
    claim: selectClaimForUri(state, uri),
    preferredCurrency: selectClientSetting(state, SETTINGS.PREFERRED_CURRENCY),
    canReceiveFiatTips: selectChannelCanReceiveFiatTipsByUri(state, uri),
    hasSavedCard: selectHasSavedCard(state),
  };
};

const perform = {
  doTipAccountCheckForUri,
  doGetCustomerStatus,
};

export default connect(select, perform)(WalletTipAmountSelector);
