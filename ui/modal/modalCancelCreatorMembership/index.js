import { connect } from 'react-redux';
import { doHideModal } from 'redux/actions/app';
import { doToast } from 'redux/actions/notifications';
import { doMembershipMine } from 'redux/actions/memberships';
import ModalConfirmOdyseeMembership from './view';

const perform = (dispatch) => ({
  closeModal: () => dispatch(doHideModal()),
  doToast: (params) => dispatch(doToast(params)),
  doMembershipMine: () => dispatch(doMembershipMine()),
});

export default connect(null, perform)(ModalConfirmOdyseeMembership);
