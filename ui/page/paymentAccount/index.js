import { connect } from 'react-redux';
import { selectArweaveConnected, selectArweaveBalance } from 'redux/selectors/arwallet';
import { doArDisconnect } from 'redux/actions/arwallet';
import { selectThemePath } from 'redux/selectors/settings';
import PaymentAccountPage from './view';

const select = (state) => ({
  arWalletStatus: selectArweaveConnected(state),
  balance: selectArweaveBalance(state).usdc,
  theme: selectThemePath(state),
});

export default connect(select, {
  doArDisconnect,
})(PaymentAccountPage);
