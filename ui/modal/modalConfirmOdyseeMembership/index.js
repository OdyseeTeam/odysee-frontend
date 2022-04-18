import { connect } from 'react-redux';
import { doHideModal } from 'redux/actions/app';
import { doToast } from 'redux/actions/notifications';
import { doMembershipBuy } from 'redux/actions/memberships';
import ModalConfirmOdyseeMembership from './view';

const perform = (dispatch) => ({
  closeModal: () => dispatch(doHideModal()),
  doToast: (params) => dispatch(doToast(params)),
  doMembershipBuy: (params, callback) => dispatch(doMembershipBuy(params, callback)),
});

export default connect(null, perform)(ModalConfirmOdyseeMembership);
