import ModalArweaveConnect from './view';
import { connect } from 'react-redux';
import { doHideModal } from 'redux/actions/app';
import { doArConnect } from 'redux/actions/arwallet';

const select = (state) => ({
  connecting: state.arwallet.connecting,
  error: state.arwallet.error,
  wallet: state.arwallet.address,
});

const perform = {
  doHideModal,
  doArConnect,
};

export default connect(select, perform)(ModalArweaveConnect);
