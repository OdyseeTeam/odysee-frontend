import { connect } from 'react-redux';
import { doAbandonTxo, doAbandonClaim } from 'redux/actions/claims';
import { doHideModal } from 'redux/actions/app';
import ModalRevokeClaim from './view';

const perform = {
  doAbandonTxo,
  doAbandonClaim,
  doHideModal,
};

export default connect(null, perform)(ModalRevokeClaim);
