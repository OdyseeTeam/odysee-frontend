import ModalCryptoDisclaimers from './view';
import { connect } from 'react-redux';
import { doHideModal, doOpenModal } from 'redux/actions/app';
import { doArConnect, doArDisconnect } from 'redux/actions/arwallet';

const select = (state) => ({});

const perform = {
  doHideModal,
  doArConnect,
};

export default connect(select, perform)(ModalCryptoDisclaimers);
