import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import { selectOdyseeMembershipForChannelId } from 'redux/selectors/memberships';
import PremiumBadge from './view';

const select = (state, props) => ({
  activeOdyseeMembershipName: selectOdyseeMembershipForChannelId(state, props.uri),
});

const perform = {
  doOpenModal,
};

export default connect(select, perform)(PremiumBadge);
