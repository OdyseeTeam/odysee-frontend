import { connect } from 'react-redux';
import { selectBalance } from 'redux/selectors/wallet';
import { selectArweaveBalance, selectArweaveExchangeRates } from 'redux/selectors/arwallet';
import { selectClaimForUri } from 'redux/selectors/claims';
import { selectArweaveTipDataForId, selectCanReceiveFiatTipsForUri } from 'redux/selectors/stripe';
import { doTipAccountCheckForUri } from 'redux/actions/stripe';
import { getChannelIdFromClaim } from 'util/claim';
import WalletTipAmountSelector from './view';

const select = (state, props) => {
  const { uri } = props;
  const claim = selectClaimForUri(state, uri, false);
  const channelClaimId = getChannelIdFromClaim(claim);
  return {
    LBCBalance: selectBalance(state),
    USDCBalance: selectArweaveBalance(state).usdc,
    arBalance: selectArweaveBalance(state).ar,
    claim: selectClaimForUri(state, uri),
    canReceiveFiatTips: selectCanReceiveFiatTipsForUri(state, uri),
    arweaveTipData: selectArweaveTipDataForId(state, channelClaimId),
    arExchangeRate: selectArweaveExchangeRates(state),
  };
};

const perform = {
  doTipAccountCheckForUri,
};

export default connect(select, perform)(WalletTipAmountSelector);
