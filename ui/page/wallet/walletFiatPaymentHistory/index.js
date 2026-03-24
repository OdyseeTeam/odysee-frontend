import { connect } from 'react-redux';
import { doCustomerListPaymentHistory, doGetCustomerStatus } from 'redux/actions/stripe';
import { selectPaymentHistory } from 'redux/selectors/stripe';
import WalletFiatPaymentHistory from './view';

const select = (state) => ({
  paymentHistory: selectPaymentHistory(state),
});

const perform = {
  doCustomerListPaymentHistory,
  doGetCustomerStatus,
};

export default connect(select, perform)(WalletFiatPaymentHistory);
