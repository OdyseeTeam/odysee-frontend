import { connect } from 'react-redux';
import { selectBalance } from 'redux/selectors/wallet';
import { selectArweaveBalance, selectArweaveConnecting, selectArweaveExchangeRates } from 'redux/selectors/arwallet';
import WalletSpendableBalanceHelp from './view';

const select = (state) => ({
  LBCBalance: selectBalance(state),
  USDCBalance: selectArweaveBalance(state).usdc,
  ARBalance: selectArweaveBalance(state).ar,
  dollarsPerAr: selectArweaveExchangeRates(state).ar,
  arConnecting: selectArweaveConnecting(state),
});

export default connect(select)(WalletSpendableBalanceHelp);
