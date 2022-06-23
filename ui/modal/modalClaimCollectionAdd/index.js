import { connect } from 'react-redux';
import { doHideModal } from 'redux/actions/app';
import { doToast } from 'redux/actions/notifications';
import ModalClaimCollectionAdd from './view';

const perform = {
  doHideModal,
  doToast,
};

export default connect(null, perform)(ModalClaimCollectionAdd);
