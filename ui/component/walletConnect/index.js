import { connect } from 'react-redux';
import { doConnectArConnect, doDisconnectArConnect } from '../../redux/actions/arConnect';
import WalletConnect from './view';

const select = (state) => ({});

const perform = (dispatch) => ({
  connectArConnect: () => dispatch(doConnectArConnect()),
  disconnectArConnect: (state) => dispatch(doDisconnectArConnect(state)),
});

export default connect(select, perform)(WalletConnect);
