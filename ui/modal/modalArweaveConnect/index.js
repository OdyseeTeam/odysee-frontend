import ModalArweaveConnect from './view';
import { connect } from 'react-redux';
import { doHideModal } from 'redux/actions/app';
import { doArConnect, doArDisconnect } from 'redux/actions/arwallet';
import {
  selectAPIArweaveActiveAddresses,
  selectAPIArweaveDefaultAddress,
  selectArAccountUpdating,
  selectFullAPIArweaveStatus,
} from 'redux/selectors/stripe';
import { doRegisterArweaveAddress, doUpdateArweaveAddressDefault } from 'redux/actions/stripe';

const select = (state) => ({
  connecting: state.arwallet.connecting,
  error: state.arwallet.error,
  activeApiAddresses: selectAPIArweaveActiveAddresses(state),
  defaultApiAddress: selectAPIArweaveDefaultAddress(state),
  fullAPIArweaveStatus: selectFullAPIArweaveStatus(state),
  walletAddress: state.arwallet.address,
  walletBalance: state.arwallet.balance,
  isArAccountUpdating: selectArAccountUpdating(state),
});

const perform = {
  doHideModal,
  doArConnect,
  doArDisconnect,
  doRegisterArweaveAddress,
  doUpdateArweaveAddressDefault,
};

export default connect(select, perform)(ModalArweaveConnect);
