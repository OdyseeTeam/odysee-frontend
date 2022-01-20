import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import OdyseeMembership from './view';

const select = (state) => ({
  // osNotificationsEnabled: selectosNotificationsEnabled(state),
  // isAuthenticated: Boolean(selectUserVerifiedEmail(state)),
  // email: selectUserEmail(state),
});

const perform = (dispatch) => ({
  doOpenModal,
  openModal: (modal, props) => dispatch(doOpenModal(modal, props)),
});

export default connect(select, perform)(OdyseeMembership);
