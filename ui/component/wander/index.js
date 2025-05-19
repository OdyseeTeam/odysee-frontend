import { connect } from 'react-redux';
import { doArConnect, doArSetAuth } from 'redux/actions/arwallet';
import { selectArweaveWanderAuth, selectArweaveAddress, selectArweaveConnecting } from 'redux/selectors/arwallet';
import { selectTheme } from 'redux/selectors/settings';
import Wander from './view';

const select = (state) => ({
  arweaveAddress: selectArweaveAddress(state),
  connecting: selectArweaveConnecting(state),
  theme: selectTheme(state),
  auth: selectArweaveWanderAuth(state),
});


const perform = (dispatch) => ({
  connectArWallet: () => dispatch(doArConnect()),
  doArSetAuth: (status) => dispatch(doArSetAuth(status)),
});

export default connect(select, perform)(Wander);
