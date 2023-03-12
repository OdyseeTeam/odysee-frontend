import { connect } from 'react-redux';
import { doCustomerListPaymentHistory, doGetCustomerStatus } from 'redux/actions/stripe';
import { selectLastFour, selectPaymentHistory } from 'redux/selectors/stripe';
import WalletFiatPaymentHistory from './view';
import { selectLanguage } from 'redux/selectors/settings';

const select = (state) => ({
  lastFour: selectLastFour(state),
  appLanguage: selectLanguage(state),
  paymentHistory: selectPaymentHistory(state),
});

const perform = {
  doCustomerListPaymentHistory,
  doGetCustomerStatus,
};

export default connect(select, perform)(WalletFiatPaymentHistory);
