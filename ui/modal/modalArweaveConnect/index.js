import ModalArweaveConnect from './view';
import { connect } from 'react-redux';
import { doHideModal } from 'redux/actions/app';
import { doArConnect } from 'redux/actions/arwallet';
import { selectAPIArweaveActiveAddress, selectFullAPIArweaveStatus } from 'redux/selectors/stripe';
import { doRegisterArweaveAddress } from 'redux/actions/stripe';

const select = (state) => ({
  connecting: state.arwallet.connecting,
  error: state.arwallet.error,
  activeApiAddress: selectAPIArweaveActiveAddress(state),
  fullAPIArweaveStatus: selectFullAPIArweaveStatus(state),
  walletAddress: state.arwallet.address,
  walletBalance: state.arwallet.balance,
});

const perform = {
  doHideModal,
  doArConnect,
  doRegisterArweaveAddress,
};

export default connect(select, perform)(ModalArweaveConnect);
