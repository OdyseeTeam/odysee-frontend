import { connect } from 'react-redux';
import { doArInit, doArConnect, doArSetAuth } from 'redux/actions/arwallet';
import { selectArweaveWanderAuth, selectArweaveAddress, selectArweaveConnecting } from 'redux/selectors/arwallet';
import { selectTheme } from 'redux/selectors/settings';
import { doArUpdateBalance, doCleanTips } from 'redux/actions/arwallet';
import { selectUser } from 'redux/selectors/user';
import Wander from './view';

const select = (state) => ({
  arweaveAddress: selectArweaveAddress(state),
  connecting: selectArweaveConnecting(state),
  theme: selectTheme(state),
  auth: selectArweaveWanderAuth(state),
  isUser: selectUser(state).is_odysee_user,
});


const perform = (dispatch) => ({
  doArInit: () => dispatch(doArInit()),
  connectArWallet: () => dispatch(doArConnect()),
  doArSetAuth: (status) => dispatch(doArSetAuth(status)),
  doArUpdateBalance: () => dispatch(doArUpdateBalance()),
  doCleanTips: () => dispatch(doCleanTips()),
});

export default connect(select, perform)(Wander);
