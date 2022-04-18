import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import MembershipsPage from './view';
import { doToast } from 'redux/actions/notifications';

const perform = {
  openModal: doOpenModal,
  doToast,
};

export default connect(null, perform)(MembershipsPage);
