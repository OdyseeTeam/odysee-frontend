import { connect } from 'react-redux';
import { doDismissError } from 'redux/actions/notifications';
import { doHideModal } from 'redux/actions/app';
import { selectAssignedLbrynetServer } from 'redux/selectors/app';
import ModalError from './view';

const select = (state) => ({
  assignedLbrynetServer: selectAssignedLbrynetServer(state),
});

const perform = (dispatch) => ({
  closeModal: () => {
    dispatch(doDismissError());
    dispatch(doHideModal());
  },
});

export default connect(select, perform)(ModalError);
