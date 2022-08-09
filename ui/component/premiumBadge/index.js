import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import { selectActiveMembershipNameForChannelUri } from 'redux/selectors/memberships';

import PremiumBadge from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    activeChannelMembershipName: selectActiveMembershipNameForChannelUri(state, uri),
  };
};

const perform = {
  doOpenModal,
};

export default connect(select, perform)(PremiumBadge);
