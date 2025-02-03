import { connect } from 'react-redux';
import { selectArweaveConnected } from '../../redux/selectors/arwallet';
import { doArDisconnect } from '../../redux/actions/arwallet';
import PaymentAccountPage from './view';

const select = (state) => ({
  arWalletStatus: selectArweaveConnected(state),
});

export default connect(select, {
  doArDisconnect,
})(PaymentAccountPage);
