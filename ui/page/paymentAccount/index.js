import { connect } from 'react-redux';
import { selectArweaveConnected, selectArweaveBalance, selectArweaveFetching } from 'redux/selectors/arwallet';
import { doArDisconnect, doArUpdateBalance } from 'redux/actions/arwallet';
import { selectAPIArweaveActiveAccount } from 'redux/selectors/stripe';
import { selectThemePath } from 'redux/selectors/settings';
import PaymentAccountPage from './view';

const select = (state) => ({
  arWalletStatus: selectArweaveConnected(state),
  balance: selectArweaveBalance(state).usdc,
  fetching: selectArweaveFetching(state),
  theme: selectThemePath(state),
  activeArweaveWallet: selectAPIArweaveActiveAccount(state),
});

export default connect(select, {
  doArDisconnect,
  doArUpdateBalance,
})(PaymentAccountPage);
