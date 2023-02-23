import { connect } from 'react-redux';
import { doGetCustomerStatus } from 'redux/actions/stripe';
import { selectLastFour } from 'redux/selectors/stripe';
import WalletFiatPaymentHistory from './view';
import { selectLanguage } from 'redux/selectors/settings';

const select = (state) => ({
  lastFour: selectLastFour(state),
  appLanguage: selectLanguage(state),
});

const perform = {
  doGetCustomerStatus,
};

export default connect(select, perform)(WalletFiatPaymentHistory);
