import ModalArweaveConnect from './view';
import { connect } from 'react-redux';
import { doHideModal, doOpenModal } from 'redux/actions/app';
import { doArConnect, doArDisconnect } from 'redux/actions/arwallet';
import {
  selectAPIArweaveDefaultAddress,
  selectArAccountRegistering,
  selectArAccountRegisteringError,
  selectFullAPIArweaveStatus,
} from 'redux/selectors/stripe';
import {
  doRegisterArweaveAddress,
  doRegisterArweaveAddressClear,
  doUpdateArweaveAddressDefault,
} from 'redux/actions/stripe';
import { selectArweaveConnecting } from 'redux/selectors/arwallet';

const select = (state) => ({
  connecting: state.arwallet.connecting,
  error: state.arwallet.error,
  defaultApiAddress: selectAPIArweaveDefaultAddress(state),
  fullAPIArweaveStatus: selectFullAPIArweaveStatus(state),
  walletAddress: state.arwallet.address,
  walletBalance: state.arwallet.balance,
  isArAccountRegistering: selectArAccountRegistering(state),
  arAccountRegisteringError: selectArAccountRegisteringError(state),
  isConnecting: selectArweaveConnecting(state),
  fullArweaveStatusArray: selectFullAPIArweaveStatus(state),
});

const perform = {
  doHideModal,
  doOpenModal,
  doArConnect,
  doArDisconnect,
  doRegisterArweaveAddress,
  doUpdateArweaveAddressDefault,
  doRegisterArweaveAddressClear,
};

export default connect(select, perform)(ModalArweaveConnect);
