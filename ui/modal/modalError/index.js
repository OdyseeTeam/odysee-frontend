import { connect } from 'react-redux';
import { doDismissError } from 'redux/actions/notifications';
import { selectAssignedLbryNetServer } from 'redux/selectors/app';
import ModalError from './view';

const select = (state) => ({
  assignedLbryNetServer: selectAssignedLbryNetServer(state),
});

const perform = (dispatch) => ({
  closeModal: () => dispatch(doDismissError()),
});

export default connect(select, perform)(ModalError);
