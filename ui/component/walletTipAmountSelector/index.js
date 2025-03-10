import { connect } from 'react-redux';
import { selectBalance } from 'redux/selectors/wallet';
import { selectArweaveBalance } from '../../redux/selectors/arwallet';
import { selectClaimForUri } from 'redux/selectors/claims';
import WalletTipAmountSelector from './view';
import { selectPreferredCurrency } from 'redux/selectors/settings';
import { selectArweaveTipDataForId, selectCanReceiveFiatTipsForUri } from 'redux/selectors/stripe';
import { doTipAccountCheckForUri } from 'redux/actions/stripe';
import { doArConnect } from 'redux/actions/arwallet';

const select = (state, props) => {
  const { uri } = props;
  const claim = selectClaimForUri(state, uri, false);
  const { claim_id: claimId } = claim || {};
  return {
    LBCBalance: selectBalance(state),
    USDCBalance: selectArweaveBalance(state).usdc,
    claim: selectClaimForUri(state, uri),
    preferredCurrency: selectPreferredCurrency(state),
    canReceiveFiatTips: selectCanReceiveFiatTipsForUri(state, uri),
    arweaveTipData: selectArweaveTipDataForId(state, claimId),
  };
};

const perform = {
  doTipAccountCheckForUri,
  doArConnect,
};

export default connect(select, perform)(WalletTipAmountSelector);
