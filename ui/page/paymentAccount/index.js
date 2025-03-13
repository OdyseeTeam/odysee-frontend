import { connect } from 'react-redux';
import {
  selectArweaveStatus,
  selectArweaveConnected,
  selectArweaveBalance,
  selectArweaveFetching,
} from 'redux/selectors/arwallet';
import { selectAPIArweaveActiveAccounts } from 'redux/selectors/stripe';
import { doArDisconnect, doArUpdateBalance } from 'redux/actions/arwallet';
import { selectThemePath } from 'redux/selectors/settings';
import PaymentAccountPage from './view';

const select = (state) => ({
  arweaveWallets: selectAPIArweaveActiveAccounts(state),
  arWalletStatus: selectArweaveConnected(state),
  balance: selectArweaveBalance(state).usdc || 0,
  fetching: selectArweaveFetching(state),
  theme: selectThemePath(state),
});

export default connect(select, {
  doArDisconnect,
  doArUpdateBalance,
})(PaymentAccountPage);
