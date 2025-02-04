import { connect } from 'react-redux';
import { selectBalance } from 'redux/selectors/wallet';
import { selectArweaveBalance } from 'redux/selectors/arwallet';
import WalletSpendableBalanceHelp from './view';

const select = (state) => ({
  LBCBalance: selectBalance(state),
  USDCBalance: selectArweaveBalance(state).usdc,
});

export default connect(select)(WalletSpendableBalanceHelp);
