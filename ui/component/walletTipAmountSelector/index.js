import { connect } from 'react-redux';
import { selectBalance } from 'redux/selectors/wallet';
import { selectClaimForUri } from 'redux/selectors/claims';
import WalletTipAmountSelector from './view';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectCanReceiveFiatTipsById, selectHasSavedCard } from 'redux/selectors/stripe';
import { doTipAccountCheck, doAccountTipStatus } from 'redux/actions/stripe';
import { getChannelFromClaim } from 'util/claim';
import * as SETTINGS from 'constants/settings';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri);
  const { claim_id: channelClaimId } = getChannelFromClaim(claim) || {};

  return {
    balance: selectBalance(state),
    claim: selectClaimForUri(state, uri),
    preferredCurrency: selectClientSetting(state, SETTINGS.PREFERRED_CURRENCY),
    canReceiveFiatTips: selectCanReceiveFiatTipsById(state, channelClaimId),
    hasSavedCard: selectHasSavedCard(state),
  };
};

const perform = {
  doTipAccountCheck,
  doAccountTipStatus,
};

export default connect(select, perform)(WalletTipAmountSelector);
