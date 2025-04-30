import { connect } from 'react-redux';
import {
  selectArweaveConnected,
  selectArweaveBalance,
  selectArweaveFetching,
} from 'redux/selectors/arwallet';
import { selectAPIArweaveActiveAccounts } from 'redux/selectors/stripe';
import { doArDisconnect, doArUpdateBalance } from 'redux/actions/arwallet';
import { selectThemePath } from 'redux/selectors/settings';
import ArAccountPage from './view';

const select = (state) => ({
  arweaveWallets: selectAPIArweaveActiveAccounts(state),
  arWalletStatus: selectArweaveConnected(state),
  balance: selectArweaveBalance(state) || 0,
  fetching: selectArweaveFetching(state),
  theme: selectThemePath(state),
});

export default connect(select, {
  doArDisconnect,
  doArUpdateBalance,
})(ArAccountPage);
