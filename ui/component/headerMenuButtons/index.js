import { connect } from 'react-redux';
import { selectUserVerifiedEmail, selectUser } from 'redux/selectors/user';
import { doClearPublish } from 'redux/actions/publish';
import { doOpenModal } from 'redux/actions/app';
import HeaderMenuButtons from './view';

const select = (state) => ({
  authenticated: selectUserVerifiedEmail(state),
  user: selectUser(state),
});

const perform = (dispatch) => ({
  clearPublish: () => dispatch(doClearPublish()),
  doOpenModal: (modal) => dispatch(doOpenModal(modal)),
});

export default connect(select, perform)(HeaderMenuButtons);
