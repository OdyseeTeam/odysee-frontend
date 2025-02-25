import { doArConnect } from 'redux/actions/arwallet';
import { selectAPIArweaveActiveAddress } from 'redux/selectors/stripe';
import { doRegisterArweaveAddress } from 'redux/actions/stripe';
import { connect } from 'react-redux';
import Accounts from '../view';
import { doHideModal } from 'redux/actions/app';

const select = (state) => ({
  connecting: state.arwallet.connecting,
  error: state.arwallet.error,
  activeApiAddress: selectAPIArweaveActiveAddress(state),
});

const perform = {
  doHideModal,
  doArConnect,
  doRegisterArweaveAddress,
};

export default connect(select, perform)(Accounts);
