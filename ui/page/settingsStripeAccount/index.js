import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { doTipAccountStatus } from 'redux/actions/stripe';
import {
  selectAccountPaidBalance,
  selectAccountChargesEnabled,
  selectAccountRequiresVerification,
  selectAccountInfo,
} from 'redux/selectors/stripe';

import StripeAccountConnection from './view';

const select = (state) => ({
  paidBalance: selectAccountPaidBalance(state),
  chargesEnabled: selectAccountChargesEnabled(state),
  accountRequiresVerification: selectAccountRequiresVerification(state),
  accountInfo: selectAccountInfo(state),
});

const perform = {
  doTipAccountStatus,
};

export default withRouter(connect(select, perform)(StripeAccountConnection));
