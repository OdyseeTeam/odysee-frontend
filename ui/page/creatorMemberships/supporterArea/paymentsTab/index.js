import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import PaymentsTab from './view';
import { doMembershipFetchOutgoingPayments } from 'redux/actions/memberships';
import {
  selectMembershipTxOutgoing,
  selectMembershipTxOutgoingFetching,
  selectMembershipTxOutgoingError,
} from 'redux/selectors/memberships';

const select = (state) => ({
  transactions: selectMembershipTxOutgoing(state),
  txsFetching: selectMembershipTxOutgoingFetching(state),
  txsError: selectMembershipTxOutgoingError(state),
});

const perform = {
  doMembershipFetchOutgoingPayments,
};

export default withRouter(connect(select, perform)(PaymentsTab));
