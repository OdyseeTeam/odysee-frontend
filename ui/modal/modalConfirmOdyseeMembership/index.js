import { connect } from 'react-redux';
import { doHideModal } from 'redux/actions/app';
import { doToast } from 'redux/actions/notifications';
import { doMembershipBuy } from 'redux/actions/memberships';
import ModalConfirmOdyseeMembership from './view';
import { doFetchOdyseeMembershipsById } from '../../redux/actions/memberships';

const perform = (dispatch) => ({
  closeModal: () => dispatch(doHideModal()),
  doToast: (params) => dispatch(doToast(params)),
  doMembershipBuy: (params, callback) => dispatch(doMembershipBuy(params, callback)),
  doFetchOdyseeMembershipsById: (claimIdCsv) => dispatch(doFetchOdyseeMembershipsById(claimIdCsv)),
});

export default connect(null, perform)(ModalConfirmOdyseeMembership);
