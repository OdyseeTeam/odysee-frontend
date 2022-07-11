import { connect } from 'react-redux';
import { doHideModal } from 'redux/actions/app';
import ModalClaimCollectionAdd from './view';

const perform = {
  doHideModal,
};

export default connect(null, perform)(ModalClaimCollectionAdd);
