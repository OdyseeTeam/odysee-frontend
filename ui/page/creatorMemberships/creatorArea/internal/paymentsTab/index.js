import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import PaymentsTab from './view';
import { doMembershipFetchIncomingPayments } from 'redux/actions/memberships';
import { selectMembershipTxIncoming, selectMembershipTxIncomingFetching, selectMembershipTxIncomingError } from 'redux/selectors/memberships';

const select = (state) => ({
  transactions: selectMembershipTxIncoming(state),
  txsFetching: selectMembershipTxIncomingFetching(state),
  txsError: selectMembershipTxIncomingError(state),
});

// fetch incoming
const perform = {
  doMembershipFetchIncomingPayments,
};

export default withRouter(connect(select, perform)(PaymentsTab));
