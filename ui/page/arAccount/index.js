import { connect } from 'react-redux';
import {
  selectArweaveConnected,
  selectArweaveBalance,
  selectArweaveFetching,
  selectArweaveExchangeRates,
} from 'redux/selectors/arwallet';
import { selectFullAPIArweaveAccounts } from 'redux/selectors/stripe';
import { doArDisconnect, doArUpdateBalance } from 'redux/actions/arwallet';
// import { selectThemePath } from 'redux/selectors/settings';
import ArAccountPage from './view';

const select = (state) => ({
  arweaveWallets: selectFullAPIArweaveAccounts(state),
  arWalletStatus: selectArweaveConnected(state),
  balance: selectArweaveBalance(state) || { ar: 0 },
  fetching: selectArweaveFetching(state),
  exchangeRate: selectArweaveExchangeRates(state),
  // theme: selectThemePath(state),
});

export default connect(select, {
  doArDisconnect,
  doArUpdateBalance,
})(ArAccountPage);
