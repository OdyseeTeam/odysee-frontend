import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import {
  selectOdyseeMembershipForChannelUri,
  selectActiveOdyseeMembershipNameForChannelId,
} from 'redux/selectors/memberships';
import PremiumBadge from './view';

const select = (state, props) => ({
  activeOdyseeMembershipName:
    selectOdyseeMembershipForChannelUri(state, props.uri) ||
    selectActiveOdyseeMembershipNameForChannelId(state, props.uri),
});

const perform = (dispatch) => ({
  openModal: (modal, props) => dispatch(doOpenModal(modal, props)),
});

export default connect(select, perform)(PremiumBadge);
