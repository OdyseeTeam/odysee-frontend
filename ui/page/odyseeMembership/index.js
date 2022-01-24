import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import OdyseeMembership from './view';
import {
  selectOdyseeMembershipName,
} from 'redux/selectors/user';
import { selectActiveChannelClaim } from 'redux/selectors/app';

const select = (state) => ({
  // osNotificationsEnabled: selectosNotificationsEnabled(state),
  // isAuthenticated: Boolean(selectUserVerifiedEmail(state)),
  odyseeMembership: selectOdyseeMembershipName(state),
  activeChannelClaim: selectActiveChannelClaim(state),
});

const perform = (dispatch) => ({
  doOpenModal,
  openModal: (modal, props) => dispatch(doOpenModal(modal, props)),
});

export default connect(select, perform)(OdyseeMembership);
