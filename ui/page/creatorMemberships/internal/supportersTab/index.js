import { connect } from 'react-redux';
// import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectMySupportersList } from 'redux/selectors/memberships';
import { doGetMembershipSupportersList } from 'redux/actions/memberships';
import SupportersTab from './view';

const select = (state) => {
  return {
    // activeChannelClaim: selectActiveChannelClaim(state),
    supportersList: selectMySupportersList(state),
  };
};

const perform = {
  doGetMembershipSupportersList,
};

export default connect(select, perform)(SupportersTab);
