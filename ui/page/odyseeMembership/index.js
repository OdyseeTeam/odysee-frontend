import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import OdyseeMembership from './view';
import {
  selectOdyseeMembershipName,
} from 'redux/selectors/user';

const select = (state) => ({
  // osNotificationsEnabled: selectosNotificationsEnabled(state),
  // isAuthenticated: Boolean(selectUserVerifiedEmail(state)),
  odyseeMembership: selectOdyseeMembershipName(state),
});

const perform = (dispatch) => ({
  doOpenModal,
  openModal: (modal, props) => dispatch(doOpenModal(modal, props)),
});

export default connect(select, perform)(OdyseeMembership);
