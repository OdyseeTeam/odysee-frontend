import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import { doMembershipMine } from 'redux/actions/memberships';
import { selectMembershipNameForChannelUri } from 'redux/selectors/memberships';
import ShareButton from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    membershipName: selectMembershipNameForChannelUri(state, uri),
  };
};

const perform = {
  doOpenModal,
  doMembershipMine,
};

export default connect(select, perform)(ShareButton);
